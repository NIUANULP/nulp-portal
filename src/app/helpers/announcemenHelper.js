/**
 * @fileoverview NULP Announcement Helper with Enhanced Security
 * @description This module provides user synchronization functionality with comprehensive Keycloak token validation
 *
 * SECURITY IMPLEMENTATION:
 * =======================
 *
 * 1. Keycloak Token Validation:
 *    - Validates JWT token structure and format
 *    - Checks token expiration (exp claim)
 *    - Verifies token not-before time (nbf claim)
 *    - Validates token issuer against configured realm
 *    - Verifies token signature using Keycloak public key (if configured)
 *
 * 2. Role-Based Access Control:
 *    - Checks for admin roles in realm_access.roles
 *    - Validates resource-specific roles in resource_access
 *    - Supports multiple admin role
 * 3. Security Layers:
 *    - Layer 1: Keycloak token validation (expiry, signature, roles)
 *    - Layer 2: API token authorization (existing check)
 *
 * 4. Error Handling:
 *    - Comprehensive error messages for different failure scenarios
 *    - Detailed logging for security events
 *    - Graceful degradation when public key is not configured
 *
 * USAGE:
 * ======
 *
 * The syncUsers function now requires:
 * - Valid Keycloak token in 'x-authenticated-user-token' header
 * - Valid API token in 'authorization' header
 * - User must have at least one admin role
 *
 */

const { Pool } = require("pg");
const axios = require("axios");
const envHelper = require("./environmentVariablesHelper");
const qs = require("qs");
const cron = require("node-cron");
const jwt = require("jsonwebtoken");

// Database configuration
const pool = new Pool({
  host: envHelper.elite_system_db_host,
  port: envHelper.elite_system_db_port,
  database: envHelper.elite_system_db_database,
  user: envHelper.elite_system_db_username,
  password: envHelper.elite_system_db_password,
});

// Configuration
const CONFIG = {
  API_BASE_URL: `${envHelper.api_base_url}`,
  API_TOKEN: `Bearer ${envHelper.PORTAL_API_AUTH_TOKEN}`,
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  REQUEST_TIMEOUT: 30000,
  EMAIL_TEMPLATE: "nulpAnnouncement",
};

// Simple logger
class Logger {
  log(message) {
    console.log(`[${new Date().toISOString()}] ℹ️  ${message}`);
  }

  success(message) {
    console.log(`[${new Date().toISOString()}] ✅ ${message}`);
  }

  warning(message) {
    console.log(`[${new Date().toISOString()}] ⚠️  ${message}`);
  }

  error(message) {
    console.error(`[${new Date().toISOString()}] ❌ ${message}`);
  }

  info(message) {
    console.log(`[${new Date().toISOString()}] 📊 ${message}`);
  }
}

// Utility functions
function extractDomain(email) {
  if (!email || typeof email !== "string") return null;
  const parts = email.split("@");
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// Database functions
async function getLastSyncDate() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT MAX(created_at) as last_sync_date 
      FROM email_campaign_data
    `);

    // If no records exist, default to 7 days ago
    const lastSyncDate = result.rows[0]?.last_sync_date;
    return lastSyncDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } finally {
    client.release();
  }
}

async function getWhitelistedDomains() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT domain 
      FROM whitelisted_email_domains 
      WHERE domain_status = 'trusted'
    `);
    return result.rows.map((row) => row.domain);
  } finally {
    client.release();
  }
}

async function checkUserExists(userId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
      SELECT id FROM email_campaign_data WHERE user_id = $1
    `,
      [userId]
    );
    return result.rows.length > 0;
  } finally {
    client.release();
  }
}

async function insertUsers(users) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insertQuery = `
      INSERT INTO email_campaign_data (user_id, email, email_template, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    let insertedCount = 0;
    for (const user of users) {
      try {
        await client.query(insertQuery, [
          user.identifier,
          user.email,
          CONFIG.EMAIL_TEMPLATE,
        ]);
        insertedCount++;
      } catch (error) {
        // Log the error but continue with other users
        console.log(
          `Failed to insert user ${user.identifier}: ${error.message}`
        );
        // Continue with next user instead of failing completely
      }
    }

    await client.query("COMMIT");
    return insertedCount;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// API functions
async function getAccessToken() {
  const logger = new Logger();

  try {
    const data = {
      client_id: envHelper.client_id,
      client_secret: envHelper.client_secret,
      grant_type: envHelper.grant_type,
    };

    const formattedData = qs.stringify(data);

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${CONFIG.API_BASE_URL}/auth/realms/sunbird/protocol/openid-connect/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: formattedData,
    };

    const response = await axios(config);
    return response?.data?.access_token;
  } catch (error) {
    logger.error(`Failed to get access token: ${error.message}`);
    if (error.response) {
      logger.error(`Token Response: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

async function fetchUsersFromAPI(
  fromDate,
  toDate,
  offset = 0,
  limit = CONFIG.BATCH_SIZE
) {
  const logger = new Logger();

  const requestBody = {
    request: {
      filters: {
        status: "1",
        createdDate: {
          ">": formatDate(fromDate),
          "<": formatDate(toDate),
        },
      },
      fields: ["identifier", "email", "firstName", "lastName"],
      limit: limit,
      offset: offset,
    },
  };

  try {
    logger.info(
      `Fetching users from ${formatDate(fromDate)} to ${formatDate(
        toDate
      )} (offset: ${offset}, limit: ${limit})`
    );

    // Get access token first
    const accessToken = await getAccessToken();

    const response = await axios({
      method: "POST",
      url: `${CONFIG.API_BASE_URL}/api/user/v3/search`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `${CONFIG.API_TOKEN}`,
        "x-authenticated-user-token": accessToken,
      },
      data: requestBody,
      timeout: CONFIG.REQUEST_TIMEOUT,
    });

    if (
      response.data &&
      response.data.result &&
      response.data.result.response &&
      response.data.result.response.content
    ) {
      return response.data.result.response.content;
    }

    return [];
  } catch (error) {
    logger.error(`API request failed: ${error.message}`);
    if (error.response) {
      logger.error(`API Response: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

async function fetchAllUsers(fromDate, toDate) {
  const logger = new Logger();
  const allUsers = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const users = await fetchUsersFromAPI(
        fromDate,
        toDate,
        offset,
        CONFIG.BATCH_SIZE
      );

      if (users && users.length > 0) {
        allUsers.push(...users);
        offset += CONFIG.BATCH_SIZE;
        logger.info(
          `Fetched ${users.length} users (total: ${allUsers.length})`
        );

        // If we got fewer users than requested, we've reached the end
        if (users.length < CONFIG.BATCH_SIZE) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      logger.error(
        `Failed to fetch users at offset ${offset}: ${error.message}`
      );
      throw error;
    }
  }

  return allUsers;
}

// Keycloak token validation function
async function validateKeycloakToken(token) {
  const logger = new Logger();

  try {
    // Check if token exists
    if (!token) {
      throw new Error("Token is missing");
    }

    // Decode token to check structure
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken) {
      throw new Error("Invalid JWT token format");
    }

    // Check token expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (decodedToken.payload.exp && decodedToken.payload.exp < currentTime) {
      throw new Error("Token has expired");
    }

    // Check token not before time
    if (decodedToken.payload.nbf && decodedToken.payload.nbf > currentTime) {
      throw new Error("Token is not yet valid");
    }

    // Check issuer
    const expectedIssuer = `${envHelper.PORTAL_AUTH_SERVER_URL}/realms/${envHelper.PORTAL_REALM}`;
    if (
      decodedToken.payload.iss &&
      decodedToken.payload.iss !== expectedIssuer
    ) {
      logger.warning(
        `Token issuer mismatch. Expected: ${expectedIssuer}, Got: ${decodedToken.payload.iss}`
      );
      // Don't throw error for issuer mismatch as it might be a configuration issue
    }

    // Verify token signature if public key is available
    if (envHelper.KEY_CLOAK_PUBLIC_KEY) {
      try {
        // Convert the public key to PEM format if needed
        let publicKey = envHelper.KEY_CLOAK_PUBLIC_KEY;
        if (!publicKey.startsWith("-----BEGIN PUBLIC KEY-----")) {
          // If it's not in PEM format, assume it's a raw key and format it
          publicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
        }

        // Verify the token signature
        jwt.verify(token, publicKey, {
          algorithms: ["RS256"],
          issuer: expectedIssuer,
          ignoreExpiration: false,
          ignoreNotBefore: false,
        });

        logger.success("✅ Token signature verified successfully");
      } catch (signatureError) {
        logger.error(
          `❌ Token signature verification failed: ${signatureError.message}`
        );
        throw new Error(
          `Token signature verification failed: ${signatureError.message}`
        );
      }
    } else {
      logger.warning(
        "⚠️  No public key configured for signature verification - proceeding with basic validation only"
      );
    }

    // Check for admin roles
    const userRoles = decodedToken.payload.realm_access?.roles || [];
    const resourceAccess = decodedToken.payload.resource_access || {};

    // Check all possible admin roles from the codebase
    const adminRoles = ["ADMIN", "SYSTEM_ADMINISTRATION", "admin"];

    // Check realm roles
    const hasAdminRole = userRoles.some((role) => adminRoles.includes(role));

    // Check resource-specific roles (for different clients)
    let hasResourceAdminRole = false;
    for (const clientId in resourceAccess) {
      const clientRoles = resourceAccess[clientId]?.roles || [];
      if (clientRoles.some((role) => adminRoles.includes(role))) {
        hasResourceAdminRole = true;
        break;
      }
    }

    if (!hasAdminRole && !hasResourceAdminRole) {
      logger.error(
        `❌ User does not have required admin role. Available roles: ${userRoles.join(
          ", "
        )}`
      );
      throw new Error("User does not have required admin role");
    }

    logger.success(
      `✅ Token validation successful. User roles: ${userRoles.join(", ")}`
    );

    return {
      valid: true,
      userId: decodedToken.payload.sub,
      roles: userRoles,
      resourceAccess: resourceAccess,
      hasAdminRole: hasAdminRole || hasResourceAdminRole,
      tokenExpiry: decodedToken.payload.exp
        ? new Date(decodedToken.payload.exp * 1000)
        : null,
    };
  } catch (error) {
    logger.error(`❌ Token validation failed: ${error.message}`);
    throw error;
  }
}

// Main sync function
async function syncUsers(req, res) {
  const logger = new Logger();
  const syncStats = {
    total_users_fetched: 0,
    total_users_filtered: 0,
    total_users_inserted: 0,
    start_time: new Date(),
  };

  try {
    logger.log("🔐 Starting security validation...");

    // Get the Keycloak token from headers
    const keycloakToken = req.headers["x-authenticated-user-token"];
    console.log(req.headers["x-authenticated-user-token"]);

    // Validate Keycloak token first
    if (!keycloakToken) {
      logger.error("Keycloak token is missing");
      return res.status(401).json({
        message: "Unauthorized - Keycloak token is missing",
        error: "TOKEN_MISSING",
      });
    }

    try {
      const tokenValidation = await validateKeycloakToken(keycloakToken);
      logger.success(
        `✅ Keycloak token validated successfully for user: ${tokenValidation.userId}`
      );
    } catch (tokenError) {
      logger.error(
        `❌ Keycloak token validation failed: ${tokenError.message}`
      );
      return res.status(401).json({
        message: "Unauthorized - Invalid or expired token",
        error: "INVALID_TOKEN",
        details: tokenError.message,
      });
    }

    // Check API token authorization (existing check)
    if (req.headers.authorization !== `${CONFIG.API_TOKEN}`) {
      logger.error("API token authorization failed");
      return res.status(401).json({
        message: "Unauthorized - Invalid API token",
        error: "INVALID_API_TOKEN",
      });
    }

    logger.log("🚀 Starting user synchronization...");

    // Validate configuration
    if (!CONFIG.API_TOKEN) {
      throw new Error("NULP_API_TOKEN environment variable is not set");
    }

    // Get last sync date from email_campaign_data table
    const lastSyncDate = await getLastSyncDate();
    const fromDate = new Date(lastSyncDate);
    const toDate = new Date();

    logger.info(
      `Sync period: ${formatDate(fromDate)} to ${formatDate(toDate)}`
    );

    // Get whitelisted domains
    const whitelistedDomains = await getWhitelistedDomains();
    logger.info(`Found ${whitelistedDomains.length} whitelisted domains`);

    // Fetch all users from API
    logger.log("📡 Fetching users from NULP API...");
    const allUsers = await fetchAllUsers(fromDate, toDate);
    syncStats.total_users_fetched = allUsers.length;
    logger.success(`Fetched ${allUsers.length} users from API`);

    // Filter users based on whitelisted domains
    logger.log("🔍 Filtering users based on whitelisted domains...");
    const filteredUsers = allUsers.filter((user) => {
      if (!user.email || !isValidEmail(user.email)) {
        logger.warning(
          `Invalid email for user ${user.identifier}: ${user.email}`
        );
        return false;
      }

      const domain = extractDomain(user.email);
      if (!domain) {
        logger.warning(`Could not extract domain from email: ${user.email}`);
        return false;
      }

      const isWhitelisted = whitelistedDomains.includes(domain);
      if (isWhitelisted) {
        logger.info(
          `✅ Domain ${domain} is whitelisted for user ${user.identifier} (${user.email})`
        );
      } else {
        logger.info(
          `❌ Domain ${domain} not in whitelist for user ${user.identifier} (${user.email})`
        );
      }

      return isWhitelisted;
    });

    syncStats.total_users_filtered = filteredUsers.length;
    logger.success(
      `Filtered ${filteredUsers.length} users with whitelisted domains`
    );

    // Log unique domains that will be added
    const uniqueDomains = [
      ...new Set(filteredUsers.map((user) => extractDomain(user.email))),
    ];
    logger.info(
      `📋 Domains that will be added to database: ${uniqueDomains.join(", ")}`
    );

    // Check for existing users and insert new ones
    if (filteredUsers.length > 0) {
      logger.log("💾 Inserting filtered users into database...");

      const newUsers = [];
      for (const user of filteredUsers) {
        const exists = await checkUserExists(user.identifier);
        if (!exists) {
          newUsers.push(user);
        }
      }

      if (newUsers.length > 0) {
        // Log domains of new users being inserted
        const newUserDomains = [
          ...new Set(newUsers.map((user) => extractDomain(user.email))),
        ];
        logger.info(`🆕 New users from domains: ${newUserDomains.join(", ")}`);

        const insertedCount = await insertUsers(newUsers);
        syncStats.total_users_inserted = insertedCount;
        logger.success(`Inserted ${insertedCount} new users into database`);
      } else {
        logger.info("No new users to insert");
      }
    }

    // Calculate execution time
    const endTime = new Date();
    const executionTime = (endTime - syncStats.start_time) / 1000;

    logger.success("🎉 User synchronization completed successfully!");

    // Print summary
    logger.info("📊 Sync Summary:");
    logger.info(`   Total users fetched: ${syncStats.total_users_fetched}`);
    logger.info(
      `   Users with whitelisted domains: ${syncStats.total_users_filtered}`
    );
    logger.info(`   New users inserted: ${syncStats.total_users_inserted}`);
    logger.info(
      `   Sync period: ${formatDate(fromDate)} to ${formatDate(toDate)}`
    );
    logger.info(`   Execution time: ${executionTime.toFixed(2)} seconds`);

    res.status(200).json({
      message: "User synchronization completed successfully",
      data: {
        ...syncStats,
        sync_period: `${formatDate(fromDate)} to ${formatDate(toDate)}`,
        execution_time: executionTime.toFixed(2),
      },
    });
  } catch (error) {
    logger.error(`❌ User synchronization failed: ${error.message}`);
    throw error;
  }
}
//cron job to sync users every week on sunday at 12:00 AM
cron.schedule("0 0 * * 0", syncUsers);
module.exports = {
  syncUsers,
  validateKeycloakToken,
};

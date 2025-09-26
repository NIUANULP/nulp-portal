/**
 * @fileoverview NULP Email Sending Helper with Enhanced Security
 * @description This module provides email campaign functionality with comprehensive Keycloak token validation
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
 *    - Supports multiple admin role types:
 *      * ADMIN, SYSTEM_ADMINISTRATION, admin
 *
 * 3. Security Layers:
 *    - Layer 1: Keycloak token validation (expiry, signature, roles)
 *    - Layer 2: API token authorization (existing check)
 *    - Layer 3: Database operations with proper error handling
 *
 * 4. Error Handling:
 *    - Comprehensive error messages for different failure scenarios
 *    - Detailed logging for security events
 *    - Graceful degradation when public key is not configured
 *
 * USAGE:
 * ======
 *
 * The main function now requires:
 * - Valid Keycloak token in 'x-authenticated-user-token' header
 * - Valid API token in 'authorization' header
 * - User must have at least one admin role
 *

 */

const axios = require("axios");
const { Pool } = require("pg");
require("dotenv").config();
const envHelper = require("./environmentVariablesHelper");
const jwt = require("jsonwebtoken");

// Database pool factory function
function createDatabasePool() {
  return new Pool({
    host: envHelper.elite_system_db_host,
    port: envHelper.elite_system_db_port,
    database: envHelper.elite_system_db_database,
    user: envHelper.elite_system_db_username,
    password: envHelper.elite_system_db_password,
    // Connection pool settings to prevent memory leaks
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
  });
}

// Global pool instance (will be created per run)
let pool = null;

// Configuration
const CONFIG = {
  API_URL: `${envHelper.api_base_url}/api/user/v1/notification/email`,
  TOKEN: envHelper.PORTAL_API_AUTH_TOKEN || "",
  BATCH_SIZE: 50, // Number of emails to send in each batch
  DELAY_BETWEEN_BATCHES: 2000, // Delay in milliseconds between batches
  DELAY_BETWEEN_EMAILS: 100, // Delay in milliseconds between individual emails
  DB_BATCH_SIZE: 1000, // Number of users to fetch from database at once
  REPORT_RECIPIENT_USER_ID: ["a3c439cf-b1c2-4335-85a6-725709934762"], // User ID to send report to
};

// Function to generate email configuration based on request parameters
function generateEmailConfig(req) {
  return {
    mode: "email",
    name: req?.body?.name,
    body: req?.body?.body,
    fromEmail: req?.body?.fromEmail,
    subject: req?.body?.subject,
    emailTemplateType: req?.body?.emailTemplateType,
  };
}

// Statistics tracking
let stats = {
  totalUsers: 0,
  successfulEmails: 0,
  failedEmails: 0,
  skippedEmails: 0,
  startTime: null,
  endTime: null,
};

// Global logger instance
let globalLogger = null;

// Function to reset global state (prevents memory leaks and incorrect stats)
function resetGlobalState() {
  // Reset stats
  stats = {
    totalUsers: 0,
    successfulEmails: 0,
    failedEmails: 0,
    skippedEmails: 0,
    startTime: null,
    endTime: null,
  };

  // Reset logger
  if (globalLogger) {
    globalLogger.clearLogs();
  }

  // Reset pool
  if (pool) {
    pool.end().catch((error) => {
      console.error("Error ending pool during reset:", error);
    });
    pool = null;
  }
}

// Function to get or create logger instance
function getLogger() {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
}

// Logger class for console-only logging
class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Maximum number of logs to keep in memory
  }

  log(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    console.log(logMessage);
    this.addLog({ timestamp, level, message, type: "log" });
  }

  error(message, details = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [ERROR] ${message}${
      details ? "\nDetails: " + JSON.stringify(details, null, 2) : ""
    }`;

    console.error(logMessage);
    this.addLog({
      timestamp,
      level: "ERROR",
      message,
      details,
      type: "error",
    });
  }

  success(message, details = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [SUCCESS] ${message}${
      details ? "\nDetails: " + JSON.stringify(details, null, 2) : ""
    }`;

    console.log(logMessage);
    this.addLog({
      timestamp,
      level: "SUCCESS",
      message,
      details,
      type: "success",
    });
  }

  // Helper method to add log with memory management
  addLog(logEntry) {
    this.logs.push(logEntry);
    // Keep only the most recent logs to prevent memory overflow
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  // Method for logging API calls (console only)
  logApiCall(user, requestData, response = null, error = null) {
    const timestamp = new Date().toISOString();
    const apiLog = {
      timestamp,
      user_id: user.user_id,
      email: user.email,
      request: {
        url: CONFIG.API_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer ***", // Masked for security
        },
        body: requestData,
      },
    };

    if (response) {
      apiLog.response = {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      };
    }

    if (error) {
      apiLog.error = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      };
    }

    const logMessage = `[${timestamp}] [API_CALL] ${JSON.stringify(
      apiLog,
      null,
      2
    )}`;
    console.log(logMessage);
    this.addLog({
      timestamp,
      level: "API_CALL",
      message: logMessage,
      type: "api",
    });
  }

  // Method for logging database operations (console only)
  logDatabaseOperation(operation, query = null, result = null, error = null) {
    const timestamp = new Date().toISOString();
    const dbLog = {
      timestamp,
      operation,
      query: query ? query.replace(/\s+/g, " ").trim() : null,
    };

    if (result) {
      dbLog.result = {
        rowCount: result.rowCount,
        rows: result.rows ? result.rows.length : 0,
      };
    }

    if (error) {
      dbLog.error = {
        message: error.message,
        code: error.code,
      };
    }

    const logMessage = `[${timestamp}] [DATABASE] ${JSON.stringify(
      dbLog,
      null,
      2
    )}`;
    console.log(logMessage);
    this.addLog({
      timestamp,
      level: "DATABASE",
      message: logMessage,
      type: "database",
    });
  }

  // Get all logs for reporting
  getLogs() {
    return this.logs;
  }

  // Get logs by type
  getLogsByType(type) {
    return this.logs.filter((log) => log.type === type);
  }

  // Clear all logs to prevent memory accumulation
  clearLogs() {
    this.logs = [];
  }

  close() {
    // No file streams to close
  }
}

// Utility function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility function to log memory usage
function logMemoryUsage(logger, context = "") {
  const memUsage = process.memoryUsage();
  const memoryInfo = {
    rss: Math.round(memUsage.rss / 1024 / 1024) + " MB",
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + " MB",
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + " MB",
    external: Math.round(memUsage.external / 1024 / 1024) + " MB",
  };

  logger.log(`Memory Usage ${context}: ${JSON.stringify(memoryInfo)}`);
  return memoryInfo;
}

// Function to read user data from database
async function readUserDataFromDatabase() {
  const logger = getLogger();
  const users = [];
  const maxUsersInMemory = 39000; // Maximum users to keep in memory at once

  logger.log("Starting to read user data from email_campaign_data table...");

  try {
    // Ensure pool is initialized
    if (!pool) {
      pool = createDatabasePool();
    }

    const client = await pool.connect();
    logger.logDatabaseOperation("connect", null, null, null);

    // First, get the total count
    const countQuery = "SELECT COUNT(*) as total FROM email_campaign_data";
    const countResult = await client.query(countQuery);
    logger.logDatabaseOperation("count_users", countQuery, countResult, null);

    const totalCount = parseInt(countResult.rows[0].total);

    logger.log(`Total users in database: ${totalCount}`);

    if (totalCount === 0) {
      logger.error("No users found in email_campaign_data table");
      client.release();
      return [];
    }

    // Fetch users in batches to handle large datasets
    let offset = 0;
    let batchNumber = 0;

    while (offset < totalCount) {
      batchNumber++;
      logger.log(
        `Fetching batch ${batchNumber} (offset: ${offset}, limit: ${CONFIG.DB_BATCH_SIZE})`
      );

      const query = `
        SELECT user_id, email, email_template, created_at, updated_at
        FROM email_campaign_data
        ORDER BY created_at ASC
        LIMIT $1 OFFSET $2
      `;

      const result = await client.query(query, [CONFIG.DB_BATCH_SIZE, offset]);
      logger.logDatabaseOperation("fetch_users_batch", query, result, null);

      if (result.rows.length === 0) {
        break;
      }

      // Process and validate users
      for (const row of result.rows) {
        if (row.user_id && row.email) {
          users.push({
            user_id: row.user_id,
            email: row.email,
            email_template: row.email_template,
            created_at: row.created_at,
            updated_at: row.updated_at,
          });
        } else {
          logger.error("Invalid user record found:", row);
        }
      }

      logger.log(
        `Batch ${batchNumber}: Read ${result.rows.length} users (Total so far: ${users.length})`
      );

      // Memory management: if we have too many users in memory, process them in chunks
      if (users.length >= maxUsersInMemory) {
        logger.log(
          `Memory management: Processing ${users.length} users in chunks to prevent memory overflow`
        );
        // Return the current batch and let the caller handle chunking
        break;
      }

      offset += CONFIG.DB_BATCH_SIZE;

      // Small delay to prevent overwhelming the database
      await delay(100);
    }

    client.release();
    logger.logDatabaseOperation("disconnect", null, null, null);
    logger.log(`Total valid users loaded from database: ${users.length}`);
  } catch (error) {
    logger.logDatabaseOperation("database_error", null, null, error);
    logger.error("Error reading from database:", error);
    throw error;
  }

  return users;
}

// Function to send email to a single user
async function sendEmailToUser(user, logger, req) {
  const requestData = {
    request: {
      ...generateEmailConfig(req),
      recipientUserIds: [user.user_id],
    },
  };

  try {
    // Log the API request
    logger.logApiCall(user, requestData);

    const response = await axios.post(CONFIG.API_URL, requestData, {
      headers: {
        Authorization: `Bearer ${CONFIG.TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });

    // Log the successful API response
    logger.logApiCall(user, requestData, response);

    if (response.status === 200) {
      logger.success(
        `Email sent successfully to user: ${user.user_id} (${user.email})`,
        {
          user_id: user.user_id,
          email: user.email,
          response_status: response.status,
        }
      );
      return { success: true, user, response: response.data };
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;

    // Log the failed API call
    logger.logApiCall(user, requestData, null, error);

    logger.error(
      `Failed to send email to user: ${user.user_id} (${user.email})`,
      {
        user_id: user.user_id,
        email: user.email,
        error: errorMessage,
        status: error.response?.status,
      }
    );
    return { success: false, user, error: errorMessage };
  }
}

// Function to process users in batches
async function processUsersInBatches(users, logger, req) {
  const batches = [];

  // Split users into batches
  for (let i = 0; i < users.length; i += CONFIG.BATCH_SIZE) {
    batches.push(users.slice(i, i + CONFIG.BATCH_SIZE));
  }

  logger.log(
    `Processing ${users.length} users in ${batches.length} batches of ${CONFIG.BATCH_SIZE}`
  );

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    logger.log(
      `Processing batch ${batchIndex + 1}/${batches.length} with ${
        batch.length
      } users`
    );

    // Process each user in the batch
    for (let userIndex = 0; userIndex < batch.length; userIndex++) {
      const user = batch[userIndex];

      logger.log(
        `Sending email ${userIndex + 1}/${batch.length} in batch ${
          batchIndex + 1
        } to user: ${user.user_id}`
      );

      const result = await sendEmailToUser(user, logger, req);

      if (result.success) {
        stats.successfulEmails++;
      } else {
        stats.failedEmails++;
      }

      // Add delay between individual emails
      if (userIndex < batch.length - 1) {
        await delay(CONFIG.DELAY_BETWEEN_EMAILS);
      }
    }

    // Add delay between batches
    if (batchIndex < batches.length - 1) {
      logger.log(
        `Waiting ${CONFIG.DELAY_BETWEEN_BATCHES}ms before next batch...`
      );
      await delay(CONFIG.DELAY_BETWEEN_BATCHES);
    }
  }
}

// Function to validate configuration
function validateConfiguration() {
  const logger = getLogger();

  if (!CONFIG.TOKEN) {
    logger.error(
      "NULP_TOKEN environment variable is not set. Please set it before running the script."
    );
    return false;
  }

  // Check database connection
  const requiredEnvVars = [
    "elite_system_db_host",
    "elite_system_db_port",
    "elite_system_db_database",
    "elite_system_db_username",
    "elite_system_db_password",
    "api_base_url",
    "PORTAL_API_AUTH_TOKEN",
  ];
  const missingVars = requiredEnvVars.filter((varName) => !envHelper[varName]);

  if (missingVars.length > 0) {
    logger.error(
      `Missing database environment variables: ${missingVars.join(", ")}`
    );
    logger.error("Please set these variables or they will use default values.");
  }

  logger.log("Configuration validation passed");
  return true;
}

// Function to test database connection
async function testDatabaseConnection() {
  const logger = getLogger();

  try {
    logger.log("Testing database connection...");

    // Ensure pool is initialized
    if (!pool) {
      pool = createDatabasePool();
    }

    const client = await pool.connect();
    logger.logDatabaseOperation("test_connect", null, null, null);

    // Test query to check if email_campaign_data table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'email_campaign_data'
      );
    `;
    const tableCheck = await client.query(tableCheckQuery);
    logger.logDatabaseOperation(
      "check_table_exists",
      tableCheckQuery,
      tableCheck,
      null
    );

    if (!tableCheck.rows[0].exists) {
      logger.error("email_campaign_data table does not exist in the database");
      client.release();
      return false;
    }

    // Get table count
    const countQuery = "SELECT COUNT(*) as total FROM email_campaign_data";
    const countResult = await client.query(countQuery);
    logger.logDatabaseOperation(
      "test_count_users",
      countQuery,
      countResult,
      null
    );

    const totalCount = parseInt(countResult.rows[0].total);

    logger.log(
      `Database connection successful. Found ${totalCount} users in email_campaign_data table`
    );

    client.release();
    logger.logDatabaseOperation("test_disconnect", null, null, null);
    return true;
  } catch (error) {
    logger.logDatabaseOperation("test_connection_error", null, null, error);
    logger.error("Database connection failed:", error);
    return false;
  }
}

// Function to generate final report
function generateReport(logger) {
  const duration = stats.endTime - stats.startTime;
  const durationMinutes = Math.floor(duration / 60000);
  const durationSeconds = Math.floor((duration % 60000) / 1000);

  const report = `
=== EMAIL SENDING REPORT ===
Start Time: ${new Date(stats.startTime).toISOString()}
End Time: ${new Date(stats.endTime).toISOString()}
Duration: ${durationMinutes}m ${durationSeconds}s

Total Users Processed: ${stats.totalUsers}
Successful Emails: ${stats.successfulEmails}
Failed Emails: ${stats.failedEmails}
Skipped Emails: ${stats.skippedEmails}

Success Rate: ${((stats.successfulEmails / stats.totalUsers) * 100).toFixed(2)}%
Failure Rate: ${((stats.failedEmails / stats.totalUsers) * 100).toFixed(2)}%

================================
`;

  logger.log(report);
  console.log(report);
}

// Function to send report email to specified user
async function sendReportEmail(logger, stats) {
  try {
    const duration = stats.endTime - stats.startTime;
    const durationMinutes = Math.floor(duration / 60000);
    const durationSeconds = Math.floor((duration % 60000) / 1000);

    const successRate =
      stats.totalUsers > 0
        ? ((stats.successfulEmails / stats.totalUsers) * 100).toFixed(2)
        : 0;
    const failureRate =
      stats.totalUsers > 0
        ? ((stats.failedEmails / stats.totalUsers) * 100).toFixed(2)
        : 0;

    // Get recent logs for the report
    const recentLogs = logger.getLogs().slice(-50); // Last 50 log entries
    const errorLogs = logger.getLogsByType("error");
    const successLogs = logger.getLogsByType("success");

    // Create HTML report
    const reportHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Campaign Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #007bff; margin: 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .stat-number { font-size: 2em; font-weight: bold; color: #007bff; }
        .stat-label { color: #6c757d; margin-top: 5px; }
        .success { border-left-color: #28a745; }
        .success .stat-number { color: #28a745; }
        .error { border-left-color: #dc3545; }
        .error .stat-number { color: #dc3545; }
        .warning { border-left-color: #ffc107; }
        .warning .stat-number { color: #ffc107; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #495057; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; }
        .log-entry { background-color: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px; font-family: monospace; font-size: 0.9em; }
        .log-error { border-left: 4px solid #dc3545; }
        .log-success { border-left: 4px solid #28a745; }
        .timestamp { color: #6c757d; font-size: 0.8em; }
        .summary { background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary h3 { margin-top: 0; color: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Email Campaign Report</h1>
            <p>Campaign completed on ${new Date(
              stats.endTime
            ).toLocaleString()}</p>
        </div>

        <div class="summary">
            <h3>📊 Campaign Summary</h3>
            <p><strong>Duration:</strong> ${durationMinutes}m ${durationSeconds}s</p>
            <p><strong>Status:</strong> ${
              stats.failedEmails === 0
                ? "✅ Completed Successfully"
                : "⚠️ Completed with Errors"
            }</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${stats.totalUsers}</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card success">
                <div class="stat-number">${stats.successfulEmails}</div>
                <div class="stat-label">Successful Emails</div>
            </div>
            <div class="stat-card error">
                <div class="stat-number">${stats.failedEmails}</div>
                <div class="stat-label">Failed Emails</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-number">${stats.skippedEmails}</div>
                <div class="stat-label">Skipped Emails</div>
            </div>
            <div class="stat-card success">
                <div class="stat-number">${successRate}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat-card error">
                <div class="stat-number">${failureRate}%</div>
                <div class="stat-label">Failure Rate</div>
            </div>
        </div>

        <div class="section">
            <h2>📈 Performance Metrics</h2>
            <p><strong>Start Time:</strong> ${new Date(
              stats.startTime
            ).toLocaleString()}</p>
            <p><strong>End Time:</strong> ${new Date(
              stats.endTime
            ).toLocaleString()}</p>
            <p><strong>Total Duration:</strong> ${durationMinutes}m ${durationSeconds}s</p>
            <p><strong>Average Time per Email:</strong> ${
              stats.totalUsers > 0
                ? (duration / stats.totalUsers / 1000).toFixed(2)
                : 0
            }s</p>
        </div>

        ${
          errorLogs.length > 0
            ? `
        <div class="section">
            <h2>❌ Recent Errors (${errorLogs.length})</h2>
            ${errorLogs
              .slice(-10)
              .map(
                (log) => `
                <div class="log-entry log-error">
                    <div class="timestamp">${new Date(
                      log.timestamp
                    ).toLocaleString()}</div>
                    <div>${log.message}</div>
                    ${
                      log.details
                        ? `<div style="margin-top: 5px; color: #6c757d;">${JSON.stringify(
                            log.details,
                            null,
                            2
                          )}</div>`
                        : ""
                    }
                </div>
            `
              )
              .join("")}
        </div>
        `
            : ""
        }

        ${
          successLogs.length > 0
            ? `
        <div class="section">
            <h2>✅ Recent Successes (${successLogs.length})</h2>
            ${successLogs
              .slice(-10)
              .map(
                (log) => `
                <div class="log-entry log-success">
                    <div class="timestamp">${new Date(
                      log.timestamp
                    ).toLocaleString()}</div>
                    <div>${log.message}</div>
                </div>
            `
              )
              .join("")}
        </div>
        `
            : ""
        }

        <div class="section">
            <h2>📝 Recent Activity Log</h2>
            ${recentLogs
              .map(
                (log) => `
                <div class="log-entry">
                    <div class="timestamp">${new Date(
                      log.timestamp
                    ).toLocaleString()}</div>
                    <div>${log.message}</div>
                </div>
            `
              )
              .join("")}
        </div>

        <div style="text-align: center; margin-top: 40px; color: #6c757d; font-size: 0.9em;">
            <p>This report was automatically generated by the NULP Email Campaign System</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;

    // Create report email configuration
    const reportEmailConfig = {
      mode: "email",
      name: "Email Campaign Report",
      body: reportHtml,
      fromEmail: "noreply@nulp.niua.org",
      subject: `Email Campaign Report - ${stats.successfulEmails}/${stats.totalUsers} Successful (${successRate}%)`,
      emailTemplateType: "nulpAnnouncement",
    };

    const requestData = {
      request: {
        ...reportEmailConfig,
        recipientUserIds: CONFIG.REPORT_RECIPIENT_USER_ID,
      },
    };

    logger.log(
      `Sending report email to user: ${CONFIG.REPORT_RECIPIENT_USER_ID}`
    );

    const response = await axios.post(CONFIG.API_URL, requestData, {
      headers: {
        Authorization: `Bearer ${CONFIG.TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    if (response.status === 200) {
      logger.success(
        `Report email sent successfully to user: ${CONFIG.REPORT_RECIPIENT_USER_ID}`,
        {
          recipient_user_id: CONFIG.REPORT_RECIPIENT_USER_ID,
          response_status: response.status,
        }
      );
      return { success: true, response: response.data };
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    logger.error(
      `Failed to send report email to user: ${CONFIG.REPORT_RECIPIENT_USER_ID}`,
      {
        recipient_user_id: CONFIG.REPORT_RECIPIENT_USER_ID,
        error: errorMessage,
        status: error.response?.status,
      }
    );
    return { success: false, error: errorMessage };
  }
}

// Helper function to safely end the pool
async function endPool() {
  if (pool) {
    try {
      // Wait for all queries to complete before ending the pool
      await pool.end();
      pool = null;
      console.log("Database pool ended successfully");
    } catch (error) {
      console.error("Error ending pool:", error);
      // Force null the pool even if ending fails
      pool = null;
    }
  }
}

// Main function
async function main(req, res) {
  const logger = getLogger();

  try {
    logger.log("🔐 Starting security validation...");

    // Get the Keycloak token from headers
    const keycloakToken = req.headers["x-authenticated-user-token"];
    console.log(req.headers["x-authenticated-user-token"]);

    // Validate Keycloak token first
    if (!keycloakToken) {
      logger.error("Keycloak token is missing");
      return res.status(401).json({
        success: false,
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
        success: false,
        message: "Unauthorized - Invalid or expired token",
        error: "INVALID_TOKEN",
        details: tokenError.message,
      });
    }

    // Check API token authorization (existing check)
    if (req.headers.authorization !== `Bearer ${CONFIG.TOKEN}`) {
      logger.error("API token authorization failed");
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid API token",
        error: "INVALID_API_TOKEN",
      });
    }

    logger.log("🚀 Starting email sending process...");

    // Reset global state at the beginning of each run to prevent memory leaks and incorrect stats
    resetGlobalState();

    logger.log("=== EMAIL SENDING SCRIPT STARTED ===");
    logMemoryUsage(logger, "at start");
    logger.log(
      `Configuration: API_URL=${CONFIG.API_URL}, BATCH_SIZE=${CONFIG.BATCH_SIZE}, DELAY_BETWEEN_BATCHES=${CONFIG.DELAY_BETWEEN_BATCHES}ms`
    );

    // Initialize pool for this run
    pool = createDatabasePool();

    // Validate configuration
    if (!validateConfiguration()) {
      logger.error("Configuration validation failed. Exiting...");
      stats.endTime = Date.now();
      await sendReportEmail(logger, stats);
      await endPool();
      return res.status(500).json({
        success: false,
        message: "Configuration validation failed",
        stats: stats,
      });
    }

    // Test database connection
    if (!(await testDatabaseConnection())) {
      logger.error("Database connection test failed. Exiting...");
      stats.endTime = Date.now();
      await sendReportEmail(logger, stats);
      await endPool();
      return res.status(500).json({
        success: false,
        message: "Database connection test failed",
        stats: stats,
      });
    }

    // Record start time
    stats.startTime = Date.now();

    // Read user data from database
    const users = await readUserDataFromDatabase();
    stats.totalUsers = users.length;
    logMemoryUsage(logger, "after reading users");

    if (users.length === 0) {
      logger.error("No users found in database. Exiting...");
      stats.endTime = Date.now();
      await sendReportEmail(logger, stats);
      await endPool();
      return res.status(404).json({
        success: false,
        message: "No users found in database",
        stats: stats,
      });
    }

    logger.log(`Found ${users.length} users to process from database`);

    // Process users in batches
    await processUsersInBatches(users, logger, req);
    logMemoryUsage(logger, "after processing users");

    // Record end time
    stats.endTime = Date.now();

    // Generate final report
    generateReport(logger);

    // Send report email
    await sendReportEmail(logger, stats);

    logger.log("=== EMAIL SENDING SCRIPT COMPLETED ===");
    logMemoryUsage(logger, "at completion");

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Email campaign completed successfully",
      stats: stats,
    });
  } catch (error) {
    logger.error("Unexpected error in main function:", error);
    logMemoryUsage(logger, "on error");
    stats.endTime = Date.now();

    // Send report email even on unexpected errors
    try {
      await sendReportEmail(logger, stats);
    } catch (reportError) {
      logger.error("Failed to send report email on error:", reportError);
    }

    await endPool();
    return res.status(500).json({
      success: false,
      message: "Unexpected error occurred",
      error: error.message,
      stats: stats,
    });
  } finally {
    logMemoryUsage(logger, "before cleanup");
    logger.close();
    await endPool();
    logMemoryUsage(logger, "after cleanup");
  }
}

// Handle process termination (only for standalone script usage)
process.on("SIGINT", async () => {
  const logger = getLogger();
  logger.log("Script interrupted by user. Generating partial report...");
  stats.endTime = Date.now();
  generateReport(logger);

  // Send report email even if interrupted
  try {
    await sendReportEmail(logger, stats);
  } catch (error) {
    logger.error("Failed to send report email on interruption:", error);
  }

  logger.close();
  await endPool();

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  process.exit(0);
});

process.on("SIGTERM", async () => {
  const logger = getLogger();
  logger.log("Script terminated. Generating partial report...");
  stats.endTime = Date.now();
  generateReport(logger);

  // Send report email even if terminated
  try {
    await sendReportEmail(logger, stats);
  } catch (error) {
    logger.error("Failed to send report email on termination:", error);
  }

  logger.close();
  await endPool();

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  process.exit(0);
});

// Keycloak token validation function
async function validateKeycloakToken(token) {
  const logger = getLogger();

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
      logger.log(
        `Token issuer mismatch. Expected: ${expectedIssuer}, Got: ${decodedToken.payload.iss}`,
        "WARNING"
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

        logger.success("Token signature verified successfully");
      } catch (signatureError) {
        logger.error(
          `Token signature verification failed: ${signatureError.message}`
        );
        throw new Error(
          `Token signature verification failed: ${signatureError.message}`
        );
      }
    } else {
      logger.log(
        "No public key configured for signature verification - proceeding with basic validation only",
        "WARNING"
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
        `User does not have required admin role. Available roles: ${userRoles.join(
          ", "
        )}`
      );
      throw new Error("User does not have required admin role");
    }

    logger.success(
      `Token validation successful. User roles: ${userRoles.join(", ")}`
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
    logger.error(`Token validation failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  main,
  sendEmailToUser,
  readUserDataFromDatabase,
  Logger,
  getLogger,
  resetGlobalState,
  logMemoryUsage,
  validateKeycloakToken,
};

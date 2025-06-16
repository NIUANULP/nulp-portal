const { body, param, validationResult, query } = require("express-validator");
const { pool } = require("../helpers/postgresqlConfig");
const uuidv1 = require("uuid/v1");
const express = require("express");
const app = express();
const envHelper = require("../helpers/environmentVariablesHelper.js");
const axios = require("axios");
const crypto = require("crypto");

// Validation middleware for user_id, designation, bio, and created_by fields
const validateUserFields = [
  body("user_id").isString().notEmpty(),
  body("designation").isString().notEmpty(),
  body("bio").optional().isString(),
  body("created_by").isString().notEmpty(),
  body("user_type").optional().isString(),
  body("organisation").optional().isString(),
  body("state").isString().notEmpty(),
  body("district").isString().notEmpty(),
  body("state_id").isString().notEmpty(),
  body("district_id").isString().notEmpty(),
];

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
};
app.use(errorHandler);

async function saveUserInfo(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: 400,
        status: "unsuccessful",
        err: null,
        errmsg: null,
      },
      errors: errors.array(),
    });
  }

  const {
    user_id,
    designation,
    bio,
    created_by,
    user_type,
    organisation,
    state,
    district,
    state_id,
    district_id,
  } = req.body;

  const query =
    "INSERT INTO users (user_id, designation, bio, created_by,user_type,organisation,state,district,state_id,district_id) VALUES ($1, $2, $3, $4,$5,$6,$7,$8,$9,$10) RETURNING *";
  const values = [
    user_id,
    designation,
    bio,
    created_by,
    user_type,
    organisation,
    state,
    district,
    state_id,
    district_id,
  ];

  try {
    const { rows } = await pool.query(query, values);
    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "User info saved successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: rows,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}
async function updateUserInfo(req, res) {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      const errorMessage = `Missing user_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }

    const {
      designation,
      bio,
      updated_by,
      user_type,
      organisation,
      country,
      state,
      district,
      state_id,
      district_id,
    } = req.body;

    // Query to check if the user exists
    const getQuery = "SELECT * FROM users WHERE user_id = $1";
    const getValues = [user_id];
    const getData = await pool.query(getQuery, getValues);

    if (getData.rows?.length > 0) {
      // If user exists, perform an update
      const query = `
        UPDATE users 
        SET 
          designation = COALESCE($1, designation), 
          bio = COALESCE($2, bio), 
          user_type = COALESCE($3, user_type), 
          organisation = COALESCE($4, organisation), 
          updated_by = COALESCE($5, updated_by),
          country = COALESCE($6, country),
          state = COALESCE($7, state),
          district = COALESCE($8, district),
          state_id = COALESCE($9, state_id),
          district_id = COALESCE($10, district_id),
          updated_at = NOW() 
        WHERE user_id = $11
        RETURNING *`;

      const values = [
        designation || null,
        bio || null,
        user_type || null,
        organisation || null,
        updated_by || null,
        country || null,
        state || null,
        district || null,
        state_id || null,
        district_id || null,
        user_id,
      ];

      const { rows } = await pool.query(query, values);
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "User info updated successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: rows,
      });
    } else {
      // If user does not exist, perform an insert
      const query = `
        INSERT INTO users (user_id, designation, bio, created_by, user_type, organisation, country, state, district, state_id, district_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`;

      const values = [
        user_id,
        designation || null,
        bio || null,
        updated_by,
        user_type || null,
        organisation || null,
        country || null,
        state || null,
        district || null,
        state_id || null,
        district_id || null,
      ];

      const { rows } = await pool.query(query, values);
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "User info created successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: rows,
      });
    }
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}

async function readUserInfo(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { user_ids, designations } = req.body;
    let queries = [];

    if (user_ids) {
      queries.push(
        pool.query("SELECT * FROM users WHERE user_id = ANY($1)", [user_ids])
      );
    }

    if (designations?.length > 0) {
      queries.push(
        pool.query("SELECT * FROM users WHERE designation = ANY($1)", [
          designations,
        ])
      );
    }

    const results = await Promise.all(queries);
    const rows = results.flatMap((result) => result.rows);

    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "User fetched successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: rows,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}

async function emailNotification(req, res) {
  try {
    const data = req.body;

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${envHelper.api_base_url}/api/user/v1/notification/email`,
      headers: {
        Authorization: `Bearer ${req.session.apiBearerToken} `,
        "Content-Type": "application/json",
      },
      data: data,
    };
    const response = await axios(config);
    return res.send(response.data);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}

async function locationData(req, res) {
  try {
    const data = req.body;

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${envHelper.api_base_url}/api/data/v1/location/search`,
      headers: {
        Authorization: `Bearer ${envHelper.PORTAL_API_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: data,
    };
    const response = await axios(config);
    return res.send(response.data);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}
async function getToken(req, res) {
  try {
    const data = {
      access_token: req.kauth.grant.access_token.token,
      token_type: req.kauth.grant.token_type,
      expires_in: req.kauth.grant.expires_in,
    };
    const token = req.kauth.grant.access_token.token;

    return res.send(data);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}

async function emailServiceForDiscussionForum(req, res) {
  try {
    const data = req.body;

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${envHelper.api_base_url}/api/user/v1/notification/email`,
      headers: {
        Authorization: `Bearer ${envHelper.PORTAL_API_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: data,
    };
    //Debugging logs
    console.log("config", config);
    console.log("data", data);

    const response = await axios(config);
    return res.send(response.data);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}

function verifyHMAC(req, res, next) {
  const unauthorizedResponse = (message) => {
    res.status(401).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: 401,
        status: "unsuccessful",
        message,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  };

  try {
    // Check if the request body is empty
    const secretKey = envHelper.discussion_forum_key;
    const authHeader = req.headers["authorization"];
    const receivedHMAC = authHeader?.split(" ")[1];

    if (!receivedHMAC) {
      return unauthorizedResponse("Unauthorized: No HMAC provided");
    }

    const dataToVerify = JSON.stringify(req.body);
    const computedHMAC = crypto
      .createHmac("sha256", secretKey)
      .update(dataToVerify)
      .digest("hex");

    if (computedHMAC !== receivedHMAC) {
      return unauthorizedResponse("Unauthorized: Invalid HMAC");
    }

    next(); // HMAC is valid, proceed
  } catch (err) {
    console.error("HMAC verification error:", err);
    res.status(500).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: 500,
        status: "unsuccessful",
        message: "Internal Server Error",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}

async function getUserPosts(req, res) {
  const { username } = req.params;
  const discussionForumUrl = `${envHelper.api_base_url}/discussion-forum/api/user/${username}/posts`;
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${envHelper.discussion_forum_key}`,
    },
  };

  try {
    const response = await axios(discussionForumUrl, options);
    const data = response?.data;

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching user posts:", error);

    return res.status(500).json({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "unsuccessful",
        err: "INTERNAL_SERVER_ERROR",
        errmsg: error.message,
      },
      responseCode: "INTERNAL_SERVER_ERROR",
      result: {},
    });
  }
}

async function getSearchResults(req, res) {
  const {
    in: searchIn,
    term,
    matchWords,
    by,
    categories,
    searchChildren,
    hasTags,
    replies,
    repliesFilter,
    timeFilter,
    timeRange,
    sortBy,
    sortDirection,
    showAs,
  } = req.query;

  // Build the search URL with all parameters
  const searchParams = new URLSearchParams({
    in: searchIn,
    term: term,
    matchWords: matchWords,
    by: by,
    categories: categories,
    searchChildren: searchChildren,
    hasTags: hasTags,
    replies: replies,
    repliesFilter: repliesFilter,
    timeFilter: timeFilter,
    timeRange: timeRange,
    sortBy: sortBy,
    sortDirection: sortDirection,
    showAs: showAs,
  });

  const discussionForumUrl = `${
    envHelper.api_base_url
  }/discussion-forum/api/search?${searchParams.toString()}`;

  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${envHelper.discussion_forum_key}`,
    },
  };

  try {
    const response = await axios(discussionForumUrl, options);
    const data = response?.data;

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching search results:", error);

    return res.status(500).json({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "unsuccessful",
        err: "INTERNAL_SERVER_ERROR",
        errmsg: error.message,
      },
      responseCode: "INTERNAL_SERVER_ERROR",
      result: {},
    });
  }
}

module.exports = {
  saveUserInfo,
  updateUserInfo,
  readUserInfo,
  validateUserFields,
  emailNotification,
  locationData,
  getToken,
  emailServiceForDiscussionForum,
  verifyHMAC,
  getUserPosts,
  getSearchResults,
};

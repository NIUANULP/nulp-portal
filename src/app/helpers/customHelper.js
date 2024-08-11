const { body, param, validationResult } = require("express-validator");
const { pool } = require("../helpers/postgresqlConfig");
const uuidv1 = require("uuid/v1");
const express = require("express");
const app = express();

// Validation middleware for user_id, designation, bio, and created_by fields
const validateUserFields = [
  body("user_id").isString().notEmpty(),
  body("designation").isString().notEmpty(),
  body("bio").optional().isString(),
  body("created_by").isString().notEmpty(),
  body("user_type").optional().isString(), 
  body("organisation").optional().isString(),
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

  const { user_id, designation, bio, created_by,user_type,organisation } = req.body;

  const query =
    "INSERT INTO users (user_id, designation, bio, created_by,user_type,organisation) VALUES ($1, $2, $3, $4,$5,$6) RETURNING *";
  const values = [user_id, designation, bio, created_by,user_type,organisation];

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

    const { designation, bio, updated_by, user_type, organisation } = req.body;

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
          updated_at = NOW() 
        WHERE user_id = $6 
        RETURNING *`;
        
      const values = [
        designation || null,
        bio || null,
        user_type || null,
        organisation || null,
        updated_by || null,
        user_id
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
        INSERT INTO users (user_id, designation, bio, created_by, user_type, organisation) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`;
        
      const values = [
        user_id,
        designation || null,
        bio || null,
        updated_by,
        user_type || null,
        organisation || null
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

module.exports = {
  saveUserInfo,
  updateUserInfo,
  readUserInfo,
  validateUserFields,
};

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

  const { user_id, designation, bio, created_by } = req.body;

  const query =
    "INSERT INTO users (user_id, designation, bio, created_by) VALUES ($1, $2, $3, $4) RETURNING *";
  const values = [user_id, designation, bio, created_by];

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
    const { designation, bio, updated_by } = req.body;
    const getQuery = "Select * FROM users WHERE user_id = $1";
    const getValues = [user_id];

    const getData = await pool.query(getQuery, getValues);

    if (getData.rows?.length > 0) {
      const query =
        "UPDATE users SET designation = $1, bio = $2, updated_by = $3, updated_at = NOW() WHERE user_id = $4 RETURNING *";
      const values = [designation, bio, updated_by, user_id];

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
      const query =
        "INSERT INTO users (user_id, designation, bio, created_by) VALUES ($1, $2, $3, $4) RETURNING *";
      const values = [user_id, designation, bio, updated_by];

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
    const { user_ids } = req.body;
    if (!user_ids) {
      const errorMessage = `Missing user_ids`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }
    const query = "SELECT * FROM users WHERE user_id = ANY($1)";
    const values = [user_ids];

    const { rows } = await pool.query(query, values);
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

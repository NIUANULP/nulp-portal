const envHelper = require("./environmentVariablesHelper.js");
const CONSTANTS = require("./constants.js");
const _ = require("lodash");
const httpSatusCode = require("http-status-codes");
const { logger } = require("@project-sunbird/logger");
const { sendRequest } = require("./httpRequestHandler.js");
const { parseJson } = require("./utilityService.js");
const uuidv1 = require("uuid/v1");
const { getBearerToken } = require("./kongTokenHelper.js");
const axios = require("axios");
const { pool } = require("./postgresqlConfig.js");

const getVotingConfiguration = async (req, res) => {
  const configType = req.query.type;
  const status = req.query.status;
  const query =
    "SELECT * FROM public.voting_configuration WHERE type = $1 AND status = $2";
  const values = [configType, status];

  pool.query(query, values).then(
    (results) => {
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {
          data: { ...results.rows },
          count: results.rowCount,
        },
      });
    },
    (err) => {
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "error",
          err: err,
          errmsg: "SOMETHING WENT WRONG",
        },
        responseCode: "OK",
        result: {
          data: "SOMETHING WENT WRONG",
        },
      });
    }
  );
};

const CreateVotingConfiguration = async (req, res) => {
  const body = req.body;
  const allowedColumns = [
    "learnathon_start",
    "learnathon_end",
    "voting_start",
    "voting_end",
    "type",
    "status",
  ];
  // Check if allowedColumns is provided and is an array
  if (!Array.isArray(allowedColumns)) {
    throw new Error("Invalid allowedColumns parameter.");
  }

  // Filter out extra columns that are not allowed
  const validData = {};
  for (const key of allowedColumns) {
    if (body.hasOwnProperty(key)) {
      validData[key] = body[key];
    }
  }

  const columns = Object.keys(validData).join(", ");
  const values = Object.values(validData);
  console.log(columns, values);
  const paramPlaceholders = Object.keys(validData)
    .map((_, i) => `$${i + 1}`)
    .join(", "); //It Generate placeholders $1,$2...

  const query = `INSERT INTO voting_configuration (${columns}) VALUES (${paramPlaceholders}) RETURNING *`;
  const response = await pool.query(query, values);
  if (response?.rows) {
    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        data: { ...response?.rows },
      },
    });
  }
};

// This will just change the status of configuration
const deleteVotingConfiguration = async (req, res) => {
  const data = req.body;
  const type = req.query.type;
  const status = req.query.status;
  const allowedColumns = ["status"];
  // Check if allowedColumns is provided and is an array
  if (!Array.isArray(allowedColumns)) {
    throw new Error("Invalid allowedColumns parameter.");
  }

  // Filter out extra columns that are not allowed
  const validData = {};
  for (const key of allowedColumns) {
    if (data?.hasOwnProperty(key)) {
      validData[key] = data[key];
    }
  }

  const values = Object.values(validData);
  const paramPlaceholders = Object.keys(validData)
    .map((key, i) => `${key} = $${i + 1}`)
    .join(", ");
  // Update data
  const query = `UPDATE public.voting_configuration SET ${paramPlaceholders} WHERE type = '${type}'
     AND status='${status}'`;
  //   values.push(type, status);
  console.log(query, values);
  const response = await pool.query(query, values);

  //   return response.rowCount;
  if (response?.rows) {
    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        data: response?.rowCount,
      },
    });
  }
};

const updateVotingConfiguration = async (req, res) => {
  const data = req.body;
  const type = req.query.type;
  const status = req.query.status;
  const allowedColumns = [
    "learnathon_start",
    "learnathon_end",
    "voting_start",
    "voting_end",
    "type",
    "status",
  ];
  // Check if allowedColumns is provided and is an array
  if (!Array.isArray(allowedColumns)) {
    throw new Error("Invalid allowedColumns parameter.");
  }

  // Filter out extra columns that are not allowed
  const validData = {};
  for (const key of allowedColumns) {
    if (data.hasOwnProperty(key)) {
      validData[key] = data[key];
    }
  }

  const values = Object.values(validData);
  const paramPlaceholders = Object.keys(validData)
    .map((key, i) => `${key} = $${i + 1}`)
    .join(", ");
  // Update data
  const query = `UPDATE public.voting_configuration SET ${paramPlaceholders} WHERE type = '${type}'
   AND status='${status}'`;
  //   values.push(type, status);
  console.log(query, values);
  const response = await pool.query(query, values);

  //   return response.rowCount;
  if (response?.rows) {
    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        data: response?.rowCount,
      },
    });
  }
};

module.exports = {
  getVotingConfiguration,
  CreateVotingConfiguration,
  deleteVotingConfiguration,
  updateVotingConfiguration,
};

const {
  createRecord,
  updateRecord,
  getRecord,
  deleteRecord,
  getRecords,
} = require("./dbOperationHelper.js");
const uuidv1 = require("uuid/v1");
const cron = require("node-cron");
const { pool } = require("./postgresqlConfig.js");
const envHelper = require("./environmentVariablesHelper.js");
const axios = require("axios");
const crypto = require("crypto");
const qs = require('qs');

const getUserCount = async (req, res) => {
  try {
    const data = {
      client_id: envHelper.client_id,
      client_secret: envHelper.client_secret,
      grant_type: envHelper.grant_type
    };

    const formattedData = qs.stringify(data);

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${envHelper.api_base_url}/auth/realms/sunbird/protocol/openid-connect/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: formattedData,
    };

    const response = await axios(config);
    let apiresponse;
    if (response?.data?.access_token) {
      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${envHelper.api_base_url}/api/user/v3/search`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            envHelper.PORTAL_API_AUTH_TOKEN ||
            envHelper.sunbird_logged_default_token
          }`,
          "x-authenticated-user-token": response.data.access_token
        },
        data: req.body,
      };

      apiresponse = await axios(config);
    }

    // Extract and return only the count from the response
    const userCount = apiresponse?.data?.result?.response?.count || 0;

    return res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "Fetched successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        count: userCount,  // Return only the count
      },
    });
  } catch (error) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "Failed",
      result: {},
    });
  }
};

module.exports = {
  getUserCount
};

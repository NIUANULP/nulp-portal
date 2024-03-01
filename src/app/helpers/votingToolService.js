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

const newRegistrationsCount = async (req, res) => {
  const votingDate = req.query.voting_date;
  let data = JSON.stringify({
    request: {
      filters: {
        status: "1",
        createdDate: {
          ">=": votingDate, //"2024-02-13 00:00"
        },
      },
      query: "",
    },
  });
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${envHelper.api_base_url}/learner/user/v3/search`,
    headers: {
      "Content-Type": "application/json",
      Cookie: `${req.headers.cookie}`,
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
      res.send(response.data);
    })
    .catch((error) => {
      res.status(error?.response?.status).send(error?.response?.data);
    });
};

const learnVote = async (req, res) => {
  let date_time = new Date();
  let voting_date = date_time.toISOString().split("T")[0];
  let voting_time = date_time.toTimeString().split(" ")[0];
  const votingAvailable = await checkVotingStatus();

  if (votingAvailable === "Voting is active") {
    const {
      user_id,
      content_id,
      vote,
      user_name,
      user_mobile,
      user_email,
      user_city,
      reason_of_vote,
    } = req.body;
    let body = req.body;
    body = { ...body, voting_date: voting_date, voting_time: voting_time };

    // If verify user exist or not
    let data = JSON.stringify({
      request: {
        filters: {
          status: "1",
          userId: user_id,
        },
        query: "",
      },
    });
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${envHelper.api_base_url}/learner/user/v3/search`,
      headers: {
        "Content-Type": "application/json",
        Cookie: `connect.sid=${req.headers.cookie}`,
      },
      data: data,
    };
    await axios
      .request(config)
      .then((response) => {
        if (response?.data?.result?.response.count == 1) {
          // Check whether vote is already present or not
          pool
            .query(
              "SELECT * FROM public.learnathon_voting WHERE content_id = $1 AND user_id = $2",
              [content_id, user_id]
            )
            .then(async (results) => {
              if (results?.rows?.length != 0) {
                res.send({
                  ts: new Date().toISOString(),
                  params: {
                    resmsgid: uuidv1(),
                    msgid: uuidv1(),
                    status: "error",
                    err: null,
                    errmsg: "Vote already present",
                  },
                  responseCode: "OK",
                  result: {
                    data: "You have already voted this content",
                  },
                });
              } else {
                const allowedColumns = [
                  "user_id",
                  "content_id",
                  "vote",
                  "user_name",
                  "user_mobile",
                  "user_email",
                  "user_city",
                  "reason_of_vote",
                  "voting_date",
                  "voting_time",
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

                const query = `INSERT INTO learnathon_voting (${columns}) VALUES (${paramPlaceholders}) RETURNING *`;
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
              }
            });
        } else {
          res.send({
            ts: new Date().toISOString(),
            params: {
              resmsgid: uuidv1(),
              msgid: uuidv1(),
              status: "error",
              err: null,
              errmsg: "User not found",
            },
            responseCode: "OK",
            result: {
              data: "User not found",
            },
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.send({
          ts: new Date().toISOString(),
          params: {
            resmsgid: uuidv1(),
            msgid: uuidv1(),
            status: "error",
            err: null,
            errmsg: "User authentication failed",
          },
          responseCode: "OK",
          result: {
            data: "User authentication failed",
          },
        });
      });
  } else {
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
        data: `${votingAvailable}`,
      },
    });
  }
};

const deleteVote = async (req, res) => {
  const contentId = req.query.content_id;
  const userId = req.query.user_id;
  let query;

  // If verify user exist or not
  let data = JSON.stringify({
    request: {
      filters: {
        status: "1",
        userId: userId,
      },
      query: "",
    },
  });
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${envHelper.api_base_url}/learner/user/v3/search`,
    headers: {
      "Content-Type": "application/json",
      Cookie: `connect.sid=${req.headers.cookie}`,
    },
    data: data,
  };

  await axios.request(config).then((response) => {
    if (response?.data?.result?.response.count == 1) {
      // Check whether vote is already present or not

      let query = "DELETE FROM public.learnathon_voting WHERE 1=1";
      const values = [];

      if (contentId && userId) {
        query += " AND content_id = $1 AND user_id = $2";
        values.push(contentId, userId);
      }

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
    } else {
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "error",
          err: null,
          errmsg: "User not found",
        },
        responseCode: "OK",
        result: {
          data: "User not found",
        },
      });
    }
  });
};

const voteCount = async (req, res) => {
  const contentId = req.query.content_id;
  let query = "SELECT * FROM public.learnathon_voting WHERE 1=1";
  const values = [];

  if (contentId) {
    query += " AND content_id = $1";
    values.push(contentId);
  }

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
          count: results.rowCount,
        },
      });
    },
    (err) => {
      console.log("errr-----------", err);
    }
  );
};
// Function to check the voting status
async function checkVotingStatus() {
  try {
    const client = await pool.connect(); // Assuming pool is a valid connection pool
    const result = await client.query(
      `
      SELECT 
        CASE 
          WHEN now()::timestamp < voting_start::timestamp THEN 'Voting has not started yet'
          WHEN now()::timestamp > voting_end::timestamp THEN 'Voting is closed'
          ELSE 'Voting is active'
        END AS voting_status
      FROM voting_configuration
      WHERE status = $1; 
    `,
      ["1"]
    );
    client.release(); // Release the client back to the pool

    return result?.rows[0]?.voting_status;
  } catch (err) {
    console.error("Error executing query", err); // Log the error
    throw err; // Rethrow the error to propagate it up
  }
}

module.exports = {
  newRegistrationsCount,
  learnVote,
  deleteVote,
  voteCount,
};

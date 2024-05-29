const express = require("express");
const sanitizeHtml = require("sanitize-html");
const { pool } = require("../helpers/postgresqlConfig");
let app = express();
let server = require("http").Server(app);
let io = require("socket.io")(server);
const Filter = require("bad-words");
const crypto = require("crypto");
const cron = require("node-cron");
const uuidv1 = require("uuid/v1");
const envHelper = require("./environmentVariablesHelper.js");
const filter = new Filter();
const nodemailer = require("nodemailer");
const axios = require("axios");

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  // Handle new chat messages
  socket.on("message", async (data) => {
    try {
      const { sender_id, receiver_id, message } = data;

      // Check if a chat request exists
      const existingRequest = await pool.query(
        "SELECT * FROM chat_request WHERE sender_id = $1 AND receiver_id = $2 AND is_accepted = true",
        [sender_id, receiver_id]
      );

      if (existingRequest?.rows?.length > 0) {
        // Send message to receiver
        await pool.query(
          "INSERT INTO chat (sender_id, receiver_id, message) VALUES ($1, $2, $3)",
          [sender_id, receiver_id, message]
        );

        // Broadcast the message to all connected clients
        io.emit("message", { sender_id, message });
      } else {
        // Insert message into chat_request table
        await pool.query(
          "INSERT INTO chat_request (sender_id, receiver_id, message, is_accepted) VALUES ($1, $2, $3, false)",
          [sender_id, receiver_id, message]
        );
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });
});

async function startChat(req, res) {
  try {
    const { sender_id, receiver_id, message } = req.body;
    const sanitizedMessage = sanitizeHtml(message);

    if (!sender_id) {
      const errorMessage = `Missing sender_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }

    if (!receiver_id) {
      const errorMessage = `Missing receiver_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }
    if (sender_id === receiver_id) {
      const errorMessage = `You cannot send message yourself !`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }

    if (!sanitizedMessage) {
      const errorMessage = `Missing or empty message`;
      const error = new Error(errorMessage);
      error.statusCode = 400; //Bad Request
      throw error;
    }
    // Check if the receiver is blocked
    const isBlocked = await pool.query(
      "SELECT * FROM blocked_chat_users WHERE sender_id = $1 AND receiver_id = $2",
      [sender_id, receiver_id]
    );

    if (isBlocked?.rows?.length > 0) {
      const errorMessage = `You are blocked by user. You cannot send messages.`;
      const error = new Error(errorMessage);
      error.statusCode = 403; // Forbidden
      throw error;
    }
    if (filter.isProfane(sanitizedMessage)) {
      const errorMessage = `Message contains bad words`;
      const error = new Error(errorMessage);
      error.statusCode = 403;
      throw error;
    }
    const encryptedChat = await encryptMessage(sanitizedMessage);

    // Check if a chat request exists
    const existingRequest = await pool.query(
      "SELECT * FROM chat_request WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) AND is_accepted = true",
      [receiver_id, sender_id]
    );

    if (existingRequest?.rows?.length > 0) {
      // Send message to receiver

      await pool.query(
        "INSERT INTO chat (sender_id, receiver_id, message) VALUES ($1, $2, $3)",
        [sender_id, receiver_id, encryptedChat]
      );
      // Emit the message to the receiver's socket
      io.sockets
        .to(receiver_id)
        .emit("message", { sender_id, message: sanitizedMessage });
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "Message sent successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {},
      });
    } else {
      // Check if a chat request is pending
      const pendingRequest = await pool.query(
        "SELECT * FROM chat_request WHERE sender_id = $1 AND receiver_id = $2 AND is_accepted = false",
        [sender_id, receiver_id]
      );

      if (pendingRequest?.rows?.length > 0) {
        sendEmail(
          "You have received a new chat request. Please log in to your account to view it..",
          "New Chat Request",
          receiver_id
        );
        res.send({
          ts: new Date().toISOString(),
          params: {
            resmsgid: uuidv1(),
            msgid: uuidv1(),
            status: "successful",
            message: "Chat request is pending acceptance",
            err: null,
            errmsg: null,
          },
          responseCode: "OK",
          result: {},
        });
      } else {
        // Send chat request
        await pool.query(
          "INSERT INTO chat_request (sender_id, receiver_id, message, is_accepted) VALUES ($1, $2, $3, false)",
          [sender_id, receiver_id, encryptedChat]
        );
        sendEmail(
          "You have received a new chat request. Please log in to your account to view it..",
          "New Chat Request",
          receiver_id
        );
        res.send({
          ts: new Date().toISOString(),
          params: {
            resmsgid: uuidv1(),
            msgid: uuidv1(),
            status: "successful",
            message: "Chat request sent!",
            err: null,
            errmsg: null,
          },
          responseCode: "OK",
          result: {},
        });
      }
    }
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
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

async function acceptInvitation(req, res) {
  try {
    const { sender_id, receiver_id } = req.body;

    if (!sender_id) {
      const errorMessage = `Missing sender_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }
    if (!receiver_id) {
      const errorMessage = `Missing receiver_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }
    // Check if a chat request is pending
    const pendingRequest = await pool.query(
      "SELECT * FROM chat_request WHERE sender_id = $1 AND receiver_id = $2 AND is_accepted = false",
      [sender_id, receiver_id]
    );
    const data = await pool.query(
      "UPDATE chat_request SET is_accepted = true WHERE sender_id = $1 AND receiver_id = $2",
      [sender_id, receiver_id]
    );
    if (pendingRequest?.rows?.length > 0) {
      sendEmail(
        "Your request has been accepted. Please log in to your account to view it.",
        "Chat Request Accepted",
        pendingRequest?.rows[0]?.sender_id
      );
    }
    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "Chat request accepted !",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
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

async function getChats(req, res) {
  try {
    const { sender_id, receiver_id, is_accepted, is_connection } = req.query;
    const is_read = req.query.is_read || true;
    let chatRequests;
    if (is_read == "false") {
      chatRequests = await pool.query(
        "SELECT * FROM chat_request WHERE sender_id = $1 AND receiver_id = $2 AND is_accepted = $3 AND is_read = $4 ORDER BY timestamp ASC;",
        [receiver_id, sender_id, is_accepted, is_read]
      );
    } else {
      chatRequests = await pool.query(
        "SELECT * FROM chat_request WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)  AND is_accepted = $3 AND is_read = $4 ORDER BY timestamp ASC;",
        [sender_id, receiver_id, is_accepted, is_read]
      );
    }
    const is_boolean = convertToBoolean(is_connection);
    let chats;
    // Return connection of sender
    if (is_boolean === true) {
      const chatRequests = await pool.query(
        "SELECT * FROM chat_request WHERE sender_id = $1 OR receiver_id = $2 ORDER BY timestamp ASC; ",
        [sender_id, receiver_id]
      );
      const chatList = chatRequests?.rows;
      for (const item of chatList) {
        item.message = await decryptMessage(item?.message);
      }
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "Connections fetched successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: chatList,
      });
    } else {
      // Return chat request and chats
      if (chatRequests) {
        if (is_read === "false") {
          chats = await pool.query(
            "SELECT * FROM chat WHERE sender_id = $1 AND receiver_id = $2 AND is_read=$3 ORDER BY timestamp ASC;",
            [receiver_id, sender_id, is_read]
          );
        } else {
          chats = await pool.query(
            "SELECT * FROM chat WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) ORDER BY timestamp ASC;",
            [sender_id, receiver_id]
          );
        }
        const chatList = [...chatRequests?.rows, ...chats?.rows];
        for (const item of chatList) {
          item.message = await decryptMessage(item?.message);
        }
        res.send({
          ts: new Date().toISOString(),
          params: {
            resmsgid: uuidv1(),
            msgid: uuidv1(),
            status: "successful",
            message: "Messages fetched successfully",
            err: null,
            errmsg: null,
          },
          responseCode: "OK",
          result: chatList,
        });
      } else {
        const errorMessage = `Chat not found.`;
        const error = new Error(errorMessage);
        error.statusCode = 200;
        throw error;
      }
    }
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
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
      result: [],
    });
  }
}

async function blockUserChat(req, res) {
  try {
    const { sender_id, receiver_id, reason } = req.body;

    if (!sender_id) {
      const errorMessage = `Missing sender_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }
    if (!receiver_id) {
      const errorMessage = `Missing receiver_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }
    if (!reason) {
      const errorMessage = `Missing reason`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }

    await pool.query(
      "INSERT INTO blocked_chat_users (sender_id, receiver_id, reason, is_blocked) VALUES ($1, $2, $3, true)",
      [sender_id, receiver_id, reason]
    );
    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "User blocked!",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: "",
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
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

async function getBlockUser(req, res) {
  try {
    const { sender_id, receiver_id } = req.query;

    if (!sender_id) {
      const errorMessage = `Missing sender_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }
    if (!receiver_id) {
      const errorMessage = `Missing receiver_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }

    const blockedUser = await pool.query(
      "SELECT * FROM blocked_chat_users WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)",
      [sender_id, receiver_id]
    );
    if (blockedUser?.rows?.length > 0) {
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "User blocked. You cannot send messages.",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: blockedUser?.rows,
      });
    } else {
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "User not blocked",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: [],
      });
    }
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
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

async function getBlockUser(req, res) {
  try {
    const { sender_id, receiver_id } = req.query;

    if (!sender_id) {
      const errorMessage = `Missing sender_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }
    if (!receiver_id) {
      const errorMessage = `Missing receiver_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }

    const blockedUser = await pool.query(
      "SELECT * FROM blocked_chat_users WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)",
      [sender_id, receiver_id]
    );
    if (blockedUser?.rows?.length > 0) {
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "User blocked. You cannot send messages.",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: blockedUser?.rows,
      });
    } else {
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "User not blocked",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: [],
      });
    }
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.send({
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

// Generate a secret key
let secretKey = envHelper.CHAT_SECRET_KEY;
// Chat encode method
async function encryptMessage(message) {
  const cipher = crypto.createCipher(
    "aes-256-cbc",
    Buffer.from(secretKey, "hex")
  );
  let encrypted = cipher.update(message, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

// Chat decode method
async function decryptMessage(encryptedData) {
  try {
    const decipher = crypto.createDecipher(
      "aes-256-cbc",
      Buffer.from(secretKey, "hex")
    );
    let decrypted = decipher?.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    throw error;
  }
}

async function deleteOldMessages() {
  try {
    const deleteQuery =
      "DELETE FROM chat WHERE timestamp < NOW() - INTERVAL '7 days'";
    const data = await pool.query(deleteQuery);
    console.log("Deleted old messages", data?.rowCount);
  } catch (error) {
    console.error("Error deleting old messages:", error.message);
  }
}
const cronTime = envHelper.CRON_TIME || "0 0 * * *"; // Default to midnight if CRON_TIME is not set

// Run the deleteOldMessages older than 7 days function every day at midnight
cron.schedule(cronTime, deleteOldMessages);

// Email notification
async function sendEmail(message, title, id) {
  try {
    let data = JSON.stringify({
      request: {
        mode: "emails",
        body: `${message}`,
        fromEmail: "",
        emailTemplateType: "",
        subject: `${title}`,
        recipientUserIds: [id],
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${envHelper.api_base_url}/api/user/`,
      headers: {
        Accept: "application/json",
        // "Content-Type": "application/json",
        // Authorization: `Bearer ${envHelper.PORTAL_API_AUTH_TOKEN}`,
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    throw error;
  }
}
// Cron to send chat request to receiver

const notificationCronTime =
  envHelper.NOTIFICATION_CRON_TIME || "30 11,15 * * *"; // Default to midnight if CRON_TIME is not set

cron.schedule(notificationCronTime, notificationForPendingMessages);

async function notificationForPendingMessages() {
  try {
    const getQuery = "SELECT * FROM chat_request where is_accepted='false';";
    const data = await pool.query(getQuery);
    console.log("Email Notification sent", data.rows);
    for (const item of data?.rows) {
      sendEmail(
        "You have received multiple new chat requests. Please log in to your account to view it.",
        "You have pending chat requests",
        item?.receiver_id
      );
    }
  } catch (error) {
    console.error("Error while getting chat requests:", error.message);
  }
}
cron.schedule(notificationCronTime, notificationForPendingUnreadMessages);
async function notificationForPendingUnreadMessages() {
  try {
    const getQuery = "SELECT * FROM chat where is_read=false;";
    const data = await pool.query(getQuery);
    console.log("Email Notification sent for new pending messages", data.rows);
    for (const item of data?.rows) {
      sendEmail(
        "You have a new direct messages in NULP connections. Please log in to your account to view it.",
        "You have new pending messages",
        item?.receiver_id
      );
    }
  } catch (error) {
    console.error("Error while getting chat requests:", error.message);
  }
}
function convertToBoolean(value) {
  return Boolean(value);
}
async function rejectInvitation(req, res) {
  try {
    const { sender_id, receiver_id } = req.body;

    if (!sender_id) {
      const errorMessage = `Missing sender_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }
    if (!receiver_id) {
      const errorMessage = `Missing receiver_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }
    // Check if a chat request is pending
    const pendingRequest = await pool.query(
      "SELECT * FROM chat_request WHERE sender_id = $1 AND receiver_id = $2 AND is_accepted = false",
      [sender_id, receiver_id]
    );
    const data = await pool.query(
      "DELETE FROM chat_request WHERE is_accepted = false AND sender_id = $1 AND receiver_id = $2",
      [sender_id, receiver_id]
    );
    if (pendingRequest?.rows?.length > 0) {
      sendEmail(
        "Your request has been Rejected. Please log in to your account to view it.",
        "Chat Request Rejected",
        pendingRequest?.rows[0]?.sender_id
      );
    }
    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "Chat request Rejected !",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
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

async function updateChat(req, res) {
  try {
    const { sender_id, receiver_id, is_read } = req.body;
    if (!sender_id) {
      const errorMessage = `Missing sender_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }

    if (!receiver_id) {
      const errorMessage = `Missing receiver_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }
    if (sender_id === receiver_id) {
      const errorMessage = `You cannot update message for yourself !`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }

    if (!is_read) {
      const errorMessage = `Missing is_read`;
      const error = new Error(errorMessage);
      error.statusCode = 400; //Bad Request
      throw error;
    }
    // Check if the receiver is blocked
    const isBlocked = await pool.query(
      "SELECT * FROM blocked_chat_users WHERE sender_id = $1 AND receiver_id = $2",
      [sender_id, receiver_id]
    );

    if (isBlocked?.rows?.length > 0) {
      const errorMessage = `Blocked user. You cannot update messages.`;
      const error = new Error(errorMessage);
      error.statusCode = 403; // Forbidden
      throw error;
    }

    // Check if a chat request exists
    const existingRequest = await pool.query(
      "SELECT * FROM chat_request WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) AND is_accepted = true",
      [receiver_id, sender_id]
    );

    if (existingRequest?.rows?.length > 0) {
      // Send message to receiver
      const is_boolean = convertToBoolean(is_read);
      const data = await pool.query(
        "UPDATE chat SET is_read = $3 WHERE sender_id = $1 AND receiver_id = $2",
        [receiver_id, sender_id, is_boolean]
      );
      await pool.query(
        "UPDATE chat_request SET is_read = $3 WHERE sender_id = $1 AND receiver_id = $2",
        [receiver_id, sender_id, is_boolean]
      );
      console.log(data);
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "Message updated successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {},
      });
    } else {
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "Chat not found",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {},
      });
    }
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
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

async function unBlockUserChat(req, res) {
  try {
    const { sender_id, receiver_id } = req.body;

    if (!sender_id) {
      const errorMessage = `Missing sender_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }
    if (!receiver_id) {
      const errorMessage = `Missing receiver_id`;
      const error = new Error(errorMessage);
      error.statusCode = 400;
      throw error;
    }

    await pool.query(
      "DELETE  FROM blocked_chat_users  WHERE sender_id=$1 AND receiver_id=$2 AND is_blocked =true",
      [sender_id, receiver_id]
    );
    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "User unblocked!",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: "",
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
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
  startChat,
  acceptInvitation,
  rejectInvitation,
  getChats,
  blockUserChat,
  getBlockUser,
  updateChat,
  unBlockUserChat,
};

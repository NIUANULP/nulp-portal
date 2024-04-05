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
async function startChat(req, res) {
  try {
    const { sender_id, receiver_id, message, sender_email, receiver_email } =
      req.body;
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
      "SELECT * FROM chat_request WHERE sender_id = $1 AND receiver_id = $2 AND is_accepted = true",
      [sender_id, receiver_id]
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
          receiver_email
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
          "INSERT INTO chat_request (sender_id, receiver_id, message, is_accepted,sender_email,receiver_email) VALUES ($1, $2, $3, false,$4,$5)",
          [sender_id, receiver_id, encryptedChat, sender_email, receiver_email]
        );
        sendEmail(
          "You have received a new chat request. Please log in to your account to view it..",
          "New Chat Request",
          receiver_email
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
        pendingRequest?.rows[0]?.sender_email
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

async function getChats(req, res) {
  try {
    const { sender_id, receiver_id, is_accepted, is_connection } = req.query;

    const chatRequests = await pool.query(
      "SELECT * FROM chat_request WHERE sender_id = $1 AND receiver_id = $2  AND is_accepted = $3",
      [sender_id, receiver_id, is_accepted]
    );

    const is_boolean = convertToBoolean(is_connection);
    let chats;
    // Return connection of sender
    if (is_boolean === true) {
      const chatRequests = await pool.query(
        "SELECT * FROM chat_request WHERE sender_id = $1 OR receiver_id = $2 ",
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
      if (chatRequests?.rows?.length > 0) {
        chats = await pool.query(
          "SELECT * FROM chat WHERE sender_id = $1 AND receiver_id = $2",
          [sender_id, receiver_id]
        );
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
        error.statusCode = 404;
        throw error;
      }
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
async function sendEmail(message, title, email) {
  try {
    let transporter = nodemailer.createTransport({
      host: envHelper.EMAIL_HOST,
      port: 465,
      secure: true, // true for 465 port, false for other ports
      auth: {
        user: envHelper.EMAIL_USER,
        pass: envHelper.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: envHelper.EMAIL_FROM,
      to: email,
      subject: title,
      html: `
    <div style="text-align: center;">
      <p>Dear user,</p>
      </br>
      <p>${message}</p>
      </br>
      <a href="${envHelper.NAVIGATE_URL}"><button>Login</button></a>
      </div>
    `,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
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
        item?.receiver_email
      );
    }
  } catch (error) {
    console.error("Error while getting chat requests:", error.message);
  }
}
function convertToBoolean(value) {
  return Boolean(value);
}
module.exports = {
  startChat,
  acceptInvitation,
  getChats,
  blockUserChat,
};

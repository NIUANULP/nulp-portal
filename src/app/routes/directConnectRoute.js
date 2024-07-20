const bodyParser = require("body-parser");
const proxyUtils = require("../proxy/proxyUtils.js");
const {
  startChat,
  acceptInvitation,
  getChats,
  blockUserChat,
  rejectInvitation,
  getBlockUser,
  updateChat,
  unBlockUserChat,
  getBlockUserList,
} = require("../helpers/directConnectHelper.js");

module.exports = function (app) {
  // Endpoint to send chat
  app.post(
    "/directConnect/send-chat",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    startChat
  );
  // Endpoint to accept chat request
  app.post(
    "/directConnect/accept-invitation",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    acceptInvitation
  );
  // Endpoint to get chats and chat requests for a user
  app.get("/directConnect/get-chats", proxyUtils.verifyToken(), getChats);
  // Endpoint to Blocked user chat
  app.post(
    "/directConnect/block-user",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    blockUserChat
  );
  // Endpoint to reject chat request
  app.post(
    "/directConnect/reject-invitation",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    rejectInvitation
  );
  // Get blocked user
  app.get(
    "/directConnect/get-block-user",
    proxyUtils.verifyToken(),
    getBlockUser
  );
  // Update chat
  app.put(
    "/directConnect/update-chat",
    proxyUtils.verifyToken(),
    bodyParser.json({ limit: "10mb" }),
    updateChat
  );
  // Get blocked user
  app.post(
    "/directConnect/unblock-user",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    unBlockUserChat
  );
  // Get blocked user list
  app.get(
    "/directConnect/get-block-user-list",
    proxyUtils.verifyToken(),
    getBlockUserList
  );
};

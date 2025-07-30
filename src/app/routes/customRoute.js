const bodyParser = require("body-parser");
const proxyUtils = require("../proxy/proxyUtils.js");
const { body, param, validationResult } = require("express-validator");
const {
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
  getCategories,
} = require("../helpers/customHelper.js");
const { syncUsers } = require("../helpers/announcemenHelper.js");
const { main } = require("../helpers/sendEmail.js");

module.exports = function (app) {
  // Create user
  app.post(
    "/custom/user/signup",
    bodyParser.json({ limit: "10mb" }),
    validateUserFields,
    saveUserInfo
  );
  // Update user
  app.put(
    "/custom/user/update",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    updateUserInfo
  );
  // Read user
  app.post(
    "/custom/user/read",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    readUserInfo
  );
  app.post(
    "/custom/user/notification/email",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    emailNotification
  );

  app.post(
    "/custom/data/v1/location/search",
    bodyParser.json({ limit: "10mb" }),
    locationData
  );

  // discussion forum api
  app.get("/auth/token", proxyUtils.verifyToken(), getToken);

  // Email service for discussion forum
  app.post(
    "/discussion/forum/email",
    bodyParser.json({ limit: "10mb" }),
    verifyHMAC,
    emailServiceForDiscussionForum
  );
  // get user posts
  app.get(
    "/discussion/api/user/:username/posts",
    proxyUtils.verifyToken(),
    getUserPosts
  );
  // get search results
  app.get("/discussion/api/search", proxyUtils.verifyToken(), getSearchResults);
  // sync users
  app.get("/admin/sync/users", syncUsers);
  // send email
  app.post("/admin/send/email", bodyParser.json({ limit: "10mb" }), main);
  // get categories
  app.get("/discussion/api/categories", getCategories);
};

const bodyParser = require("body-parser");
const proxyUtils = require("../proxy/proxyUtils.js");
const { body, param, validationResult } = require("express-validator");
const {
  saveUserInfo,
  updateUserInfo,
  readUserInfo,
  validateUserFields,
  emailNotification,
} = require("../helpers/customHelper.js");

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
};

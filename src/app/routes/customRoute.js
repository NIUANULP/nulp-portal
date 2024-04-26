const bodyParser = require("body-parser");
const proxyUtils = require("../proxy/proxyUtils.js");
const { body, param, validationResult } = require("express-validator");
const {
  saveUserInfo,
  updateUserInfo,
  readUserInfo,
  validateUserFields,
} = require("../helpers/customHelper.js");

module.exports = function (app) {
  // Create user
  app.post(
    "/custom/user/signup",
    bodyParser.json({ limit: "10mb" }),
    validateUserFields,
    // proxyUtils.verifyToken(),
    saveUserInfo
  );
  // Update user
  app.post(
    "/custom/user/update",
    bodyParser.json({ limit: "10mb" }),
    // proxyUtils.verifyToken(),
    updateUserInfo
  );
  // Read user
  app.post(
    "/custom/user/read",
    bodyParser.json({ limit: "10mb" }),
    body("user_ids").isArray().notEmpty(),
    // proxyUtils.verifyToken(),
    readUserInfo
  );
};

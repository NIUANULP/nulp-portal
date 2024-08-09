const feedbackHelper = require("../helpers/feedbackHelper.js");
const bodyParser = require("body-parser");
const { checkForValidUser } = require("./learnerRoutes");
const proxyUtils = require("../proxy/proxyUtils.js");
const fs = require("fs");

module.exports = function (app) {
  // Add create feedback
  app.post(
    "/custom_feedback/create",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    feedbackHelper.createFeedback
  );

  // Update feedback
  app.put(
    "/custom_feedback/update",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    feedbackHelper.updateFeedback
  );

  //  List feedback
  app.post(
    "/custom_feedback/list",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    feedbackHelper.listFeedback
  );
};

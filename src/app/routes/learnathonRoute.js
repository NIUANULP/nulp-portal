const learnathonHelper = require("../helpers/learnathonHelper.js");
const bodyParser = require("body-parser");
const { checkForValidUser } = require("./learnerRoutes.js");
const proxyUtils = require("../proxy/proxyUtils.js");
const fs = require("fs");

module.exports = function (app) {
  // Add create polls
  app.post(
    "/learnathon/content/create",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    learnathonHelper.createLearnathonContent
  );
  //   Get poll
  app.post("/learnathon/content/list", 
  bodyParser.json({ limit: "10mb" }),
  proxyUtils.verifyToken(), 
  learnathonHelper.listLearnathonContents
  );

  app.put(
    "/learnathon/content/update",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    learnathonHelper.updateLearnathonContent
  );

  app.delete(
    "/learnathon/content/delete",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    learnathonHelper.deleteLearnathonContent
  );

  
};
const learnathonHelper = require("../helpers/learnathonHelper.js");
const bodyParser = require("body-parser");
const { checkForValidUser } = require("./learnerRoutes.js");
const proxyUtils = require("../proxy/proxyUtils.js");
const fs = require("fs");
const express = require('express');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));


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

  app.post(
    "/learnathon/access/provide",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    learnathonHelper.provideCreatorAccess
  );

    app.get(
    "/learnathon/get/creators",
    proxyUtils.verifyToken(),
    learnathonHelper.listLearnathonCreators
  );

  
};
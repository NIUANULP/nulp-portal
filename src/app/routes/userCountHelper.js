const userCount = require("../helpers/userCountHelper.js")
const bodyParser = require("body-parser");
const express = require('express');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));


module.exports = function (app) {

  app.post(
    "/get/users",
    bodyParser.json({ limit: "10mb" }),
    // proxyUtils.verifyToken(),
    userCount.getUserCount
  );

  
};
const pollsHelper = require("../helpers/pollsHelper");
const bodyParser = require("body-parser");
const { checkForValidUser } = require("./learnerRoutes");
const proxyUtils = require("../proxy/proxyUtils.js");
const fs = require("fs");

module.exports = function (app) {
  // Add create polls
  app.post(
    "/polls/create",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    pollsHelper.createPolls
  );

  app.post(
    "/polls/all/get_poll",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    pollsHelper.getPollsAndVotes
  );
  //   Get poll
  app.get("/polls/get_poll", proxyUtils.verifyToken(), pollsHelper.getPoll);
  // Update polls
  app.put(
    "/polls/update",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    pollsHelper.updatePolls
  );

  // Delete polls
  app.delete(
    "/polls/delete",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    pollsHelper.deletePolls
  );

  //  List polls
  app.post(
    "/polls/list",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    pollsHelper.listPolls
  );

  app.post(
    "/polls/user/create",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    pollsHelper.createUserPoll
  );
  app.put(
    "/polls/user/update",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    pollsHelper.updateUserPoll
  );
  app.get(
    "/polls/user/get_user_poll",
    proxyUtils.verifyToken(),
    pollsHelper.getUserPoll
  );
};

const votingToolService = require("../helpers/votingToolService");
const bodyParser = require("body-parser");
const { checkForValidUser } = require("./learnerRoutes");
const proxyUtils = require("../proxy/proxyUtils.js");
const isAPIWhitelisted = require("../helpers/apiWhiteList");

module.exports = function (app) {
  app.get(
    "/votingTool/newRegistrationsCount",
    proxyUtils.verifyToken(),
    votingToolService.newRegistrationsCount
  );

  // Add learnathon vote
  app.post(
    "/votingTool/learnVote",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    votingToolService.learnVote
  ),
    // Vote count
    app.get("/votingTool/voteCount", votingToolService.voteCount);

  // Delete Vote
  app.delete(
    "/votingTool/deleteVote",
    proxyUtils.verifyToken(),
    votingToolService.deleteVote
  );
};

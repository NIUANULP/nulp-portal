const votingToolConfiguration = require("../helpers/votingToolConfiguration");
const bodyParser = require("body-parser");
const { checkForValidUser } = require("./learnerRoutes");
const proxyUtils = require("../proxy/proxyUtils.js");
const fs = require("fs");

module.exports = function (app) {
  // Get voting configuration
  app.get(
    "/v1/voting/system/config/getdetails",
    proxyUtils.verifyToken(),
    votingToolConfiguration.getVotingConfiguration
  );

  // Add create voting configuration
  app.post(
    "/v1/voting/system/config/create",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    votingToolConfiguration.CreateVotingConfiguration
  ),
    // Update voting configuration
    app.put(
      "/v1/voting/system/config/update",
      bodyParser.json({ limit: "10mb" }),
      proxyUtils.verifyToken(),
      votingToolConfiguration.updateVotingConfiguration
    );

  // Delete voting configuration
  app.delete(
    "/v1/voting/system/config/retired",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    votingToolConfiguration.deleteVotingConfiguration
  );
};

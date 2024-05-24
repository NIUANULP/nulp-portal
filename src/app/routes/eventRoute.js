const bodyParser = require("body-parser");
const {
  createEvent,
  updateEvent,
  getEvent,
} = require("../helpers/eventHelper.js");
const proxyUtils = require("../proxy/proxyUtils.js");

module.exports = function (app) {
  app.post(
    "/event/gmeet/create",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    createEvent
  );

  app.put(
    "/event/gmeet/update",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    updateEvent
  );

  app.get("/event/gmeet/get", proxyUtils.verifyToken(), getEvent);
};

const bodyParser = require("body-parser");
const {
  createEvent,
  updateEvent,
  getEvent,
} = require("../helpers/eventHelper.js");

module.exports = function (app) {
  app.post(
    "/event/gmeet/create",
    bodyParser.json({ limit: "10mb" }),
    createEvent
  );

  app.put(
    "/event/gmeet/update",
    bodyParser.json({ limit: "10mb" }),
    updateEvent
  );

  app.get("/event/gmeet/get", getEvent);
};

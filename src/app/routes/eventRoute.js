const bodyParser = require("body-parser");
const {
  createEvent,
  updateEvent,
  getEvent,
  saveWebinarAttendance,
  listWebinarAttendance,
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

  app.post(
    "/event/webinar/attendance-save",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    saveWebinarAttendance
  );
  app.post(
    "/event/webinar/attendance-list",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    listWebinarAttendance
  );
};

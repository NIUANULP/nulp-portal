const bodyParser = require("body-parser");
const {
  createEvent,
  updateEvent,
  getEvent,
  saveEventAttendance,
  listWebinarAttendance,
  getGmeetAttendance,
  insertEventRegistration,
  getEventRegistration,
  getCountsOfEvent,
  getTopTrending,
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

  app.get("/event/gmeet/get", getEvent);

  app.post(
    "/event/attendance-save",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    saveEventAttendance
  );
  app.post(
    "/event/list",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    listWebinarAttendance
  );
  app.get(
    "/event/gmeet/attendance",
    proxyUtils.verifyToken(),
    getGmeetAttendance
  );
  app.post(
    "/event/registration",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    insertEventRegistration
  );
  app.get("/event/get_event", proxyUtils.verifyToken(), getEventRegistration);

  app.post(
    "/event/event_count",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    getCountsOfEvent
  );

  app.get("/event/get_top_trending", proxyUtils.verifyToken(), getTopTrending);
};

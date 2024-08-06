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
  eventReports,
  userUnregister,
  fetchEventsRecording,
  eventEnrollmentList,
  updateRegistrationEvent,
  deleteRegistrationEvent,
} = require("../helpers/eventHelper.js");
const proxyUtils = require("../proxy/proxyUtils.js");

module.exports = function (app) {
  app.post(
    "/custom_event/gmeet/create",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    createEvent
  );

  app.put(
    "/custom_event/gmeet/update",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    updateEvent
  );

  app.get("/custom_event/gmeet/get", getEvent);

  app.post(
    "/custom_event/attendance-save",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    saveEventAttendance
  );
  app.post(
    "/custom_event/list",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    listWebinarAttendance
  );
  app.get(
    "/custom_event/gmeet/attendance",
    proxyUtils.verifyToken(),
    getGmeetAttendance
  );
  app.post(
    "/custom_event/registration",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    insertEventRegistration
  );
  app.get(
    "/custom_event/get_event",
    proxyUtils.verifyToken(),
    getEventRegistration
  );

  app.post(
    "/custom_event/event_count",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    getCountsOfEvent
  );

  app.get(
    "/custom_event/get_top_trending",
    proxyUtils.verifyToken(),
    getTopTrending
  );
  app.get("/custom_event/reports", proxyUtils.verifyToken(), eventReports);
  app.delete(
    "/custom_event/unregister",
    proxyUtils.verifyToken(),
    userUnregister
  );
  app.get("/custom_event/fetch-recordings", fetchEventsRecording);
  app.post(
    "/custom_event/enrollment-list",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    eventEnrollmentList
  );

  app.put(
    "/custom_event/registration/update",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    updateRegistrationEvent
  );
};

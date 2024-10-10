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
  eventSearchWrapper,
  eventGetByIdWrapper,
  eventCreateWrapper,
  eventUpdateWrapper,
  eventPublishWrapper,
  eventRetire,
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
  app.get(
    "/custom_event/fetch_recordings",
    proxyUtils.verifyToken(),
    fetchEventsRecording
  );
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
  app.post(
    "/custom_event/composite/search",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    eventSearchWrapper
  );
  app.get(
    "/custom_event/read/event",
    proxyUtils.verifyToken(),
    eventGetByIdWrapper
  );
  app.patch(
    "/custom_event/update/event",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    eventUpdateWrapper
  );
  app.post(
    "/custom_event/publish/event",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    eventPublishWrapper
  );
  app.post(
    "/custom_event/create/event",
    bodyParser.json({ limit: "10mb" }),
    proxyUtils.verifyToken(),
    eventCreateWrapper
  );
  app.get("/custom_event/event/retire", proxyUtils.verifyToken(), eventRetire);
};

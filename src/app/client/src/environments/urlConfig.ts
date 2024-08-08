export const urlConfig = {
  baseUrl: "https://dev.sunbirdsaas.com/",

  create: "api/event/v4/create",
  update: "api/event/v4/update",
  publish: "/api/event/v4/publish",
  gmeetcreate: "custom_event/gmeet/create",
  // search: "/api/event/v1/search",
  // search: "/content/composite/v1/search",
  // compositeSearch: "/action/composite/v3/search",
  gmeetget: "custom_event/gmeet/get?eventId=",

  search: "/api/composite/v1/search",
  compositeSearch: "/api/composite/v1/search",
  emailNotification: "/api/user/v1/notification/email",
  adminEnroll: "/learner/course/v1/admin/enroll",
  userData: "/learner/user/v3/search",
  costomUserEnroll: "/custom_event/registration",
  getProfile: "/learner/user/v5/read/",

  detail: "/api/event/v4/read/",
  myEvents: "/api/course/v2/user/enrollment/list?contentType=Event",

  createImage: "/action/content/v3/create",
  uploadImage: "/action/content/v3/upload",

  myEventFilterConfigApi: "api/data/v1/form/read",
  eventFormConfigApi: "api/data/v1/form/read",
  eventFilterConfigApi: "api/data/v1/form/read",

  enrollApi: "/learner/course/v1/enrol",
  unenrollApi: "/learner/course/v1/unenrol",
  batchlist: "/learner/course/v1/batch/list",
  createBatch: "/learner/course/v1/batch/create",
  enrollUserEventList: "/api/course/v2/user/enrollment/list?contentType=Event",

  BBBGetUrlModerator: "/api/event/v4/join/moderator",
  BBBGetUrlAttendee: "/api/event/v4/join/attendee",
  attendanceApi: "/learner/course/v1/attendance/read",
};

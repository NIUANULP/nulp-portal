const bodyParser = require("body-parser");
const proxyUtils = require("../proxy/proxyUtils.js");
const {
    certificateCount,
    courseCount
} = require("../helpers/profileHelper.js");

module.exports = function (app) {
  // Endpoint to get certificate
  app.get(
    "/profilePage/certificateCount",
    proxyUtils.verifyToken(),
    certificateCount
  );

//   Get course enrolled count
app.get(
    "/profilePage/courseCount",
    proxyUtils.verifyToken(),
    courseCount
  );
 
};

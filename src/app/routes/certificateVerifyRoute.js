const {
  verifyCertificate,
  rateLimit,
  noIndex,
} = require("../helpers/certificateVerifyHelper.js");

module.exports = function (app) {
  // Public: opened from the certificate QR code, no login required
  app.get("/certificate/public/v1/verify/:id", noIndex, rateLimit, verifyCertificate);
};

const axios = require("axios");
const _ = require("lodash");
const uuidv1 = require("uuid/v1");
const { logger } = require("@project-sunbird/logger");
const envHelper = require("./environmentVariablesHelper.js");

// RC osids are UUIDs, optionally prefixed (e.g. "1-<uuid>")
const CERTIFICATE_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

// The verify page makes one call per view; 60 a minute leaves room for retries without allowing id-guessing scripts
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const requestCounts = new Map();

class CertificateLookupError extends Error {
  constructor(statusCode, responseCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.responseCode = responseCode;
  }
}

const sendResponse = (res, statusCode, responseCode, result, errmsg) => {
  res.status(statusCode).send({
    id: "api.certificate.public.verify",
    ver: "1.0",
    ts: new Date().toISOString(),
    params: {
      resmsgid: uuidv1(),
      status: statusCode === 200 ? "successful" : "failed",
      errmsg: errmsg || null,
    },
    responseCode,
    result: result || {},
  });
};

// RC reports an unknown id as "Invalid id"; any other error (auth, outage) is our failure, not a fake certificate
const isNotFoundError = (errmsg) => /invalid id|not found/i.test(errmsg || "");

const parseSignedData = (certificate) => {
  try {
    return JSON.parse(_.get(certificate, "_osSignedData") || "{}");
  } catch (e) {
    return {};
  }
};

// Only an explicit non-active status (e.g. REVOKED) invalidates a certificate
const isActive = (certificate) => {
  const status = _.get(certificate, "status", "");
  return !status || _.toUpper(status) === "ACTIVE";
};

// The portal runs behind a proxy without `trust proxy`, so req.ip is the proxy; use the original client address
const getClientIp = (req) =>
  _.trim(_.split(_.get(req, "headers['x-forwarded-for']", ""), ",")[0]) || req.ip || "unknown";

/** Public API: no login, so cap requests per visitor to stop scripts from harvesting names by guessing ids */
const rateLimit = (req, res, next) => {
  const now = Date.now();
  if (requestCounts.size > 10000) {
    requestCounts.forEach((entry, ip) => {
      if (entry.resetAt <= now) requestCounts.delete(ip);
    });
  }
  const ip = getClientIp(req);
  const entry = requestCounts.get(ip);
  if (!entry || entry.resetAt <= now) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
    return sendResponse(res, 429, "TOO_MANY_REQUESTS", {}, "Too many requests, please try again in a minute");
  }
  return next();
};

/** Certificate pages show personal names; keep them and their APIs out of search engines */
const noIndex = (req, res, next) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  next();
};

const registryRequest = (certificateId, headers) =>
  axios.get(`${envHelper.LEARNER_URL}rc/certificate/v1/download/${certificateId}`, {
    headers: { Authorization: `Bearer ${envHelper.PORTAL_API_AUTH_TOKEN}`, ...headers },
    timeout: 20000,
  });

/** Reads the certificate record from NULP's certificate registry with the portal's own token */
const fetchCertificateRecord = async (certificateId) => {
  if (!CERTIFICATE_ID_PATTERN.test(certificateId)) {
    throw new CertificateLookupError(400, "CLIENT_ERROR", "Invalid certificate id");
  }
  let certificate;
  try {
    certificate = (await registryRequest(certificateId, { Accept: "application/json" })).data;
  } catch (error) {
    if (isNotFoundError(_.get(error, "response.data.params.errmsg"))) {
      throw new CertificateLookupError(404, "RESOURCE_NOT_FOUND", "Certificate not found");
    }
    logger.error({ msg: "certificate public verify: registry read failed", certificateId, error: error.message });
    throw new CertificateLookupError(500, "SERVER_ERROR", "Unable to verify certificate right now");
  }
  if (!_.get(certificate, "osid")) {
    // RC can also answer a failure with HTTP 200 and an UNSUCCESSFUL body
    const errmsg = _.get(certificate, "params.errmsg");
    if (errmsg && !isNotFoundError(errmsg)) {
      logger.error({ msg: "certificate public verify: registry read failed", certificateId, error: errmsg });
      throw new CertificateLookupError(500, "SERVER_ERROR", "Unable to verify certificate right now");
    }
    throw new CertificateLookupError(404, "RESOURCE_NOT_FOUND", "Certificate not found");
  }
  return certificate;
};

/**
 * Public (no login) certificate verification used by the QR code page.
 * The QR only needs to carry the certificate id; all details come from NULP's own records.
 */
const verifyCertificate = async (req, res) => {
  const certificateId = _.get(req, "params.id", "");
  let certificate;
  try {
    certificate = await fetchCertificateRecord(certificateId);
  } catch (error) {
    logger.info({ msg: "certificate public verify: scanned", certificateId, result: error.responseCode });
    return sendResponse(res, error.statusCode, error.responseCode, error.statusCode === 404 ? { verified: false } : {}, error.message);
  }

  const signedData = parseSignedData(certificate);
  const status = _.get(certificate, "status", "");
  const verified = isActive(certificate);
  logger.info({ msg: "certificate public verify: scanned", certificateId, result: verified ? "VERIFIED" : status });
  if (!verified) {
    // Revoked: confirm the status only, without repeating the holder's details
    return sendResponse(res, 200, "OK", { verified: false, status });
  }
  return sendResponse(res, 200, "OK", {
    verified: true,
    status,
    certificate: {
      id: certificate.osid,
      recipientName:
        _.get(signedData, "credentialSubject.recipientName") || _.get(certificate, "recipient.name"),
      trainingName:
        _.get(signedData, "credentialSubject.trainingName") || _.get(certificate, "training.name"),
      trainingType: _.get(certificate, "training.type"),
      issuerName: _.get(signedData, "issuer.name") || _.get(certificate, "issuer.name"),
      issuedOn:
        _.get(signedData, "issuanceDate") || _.get(certificate, "issuedOn") || _.get(certificate, "osCreatedAt"),
    },
  });
};

module.exports = { verifyCertificate, rateLimit, noIndex };

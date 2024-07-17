const { SpacesServiceClient, ConferenceRecordsServiceClient } =
  require("@google-apps/meet").v2;
const envHelper = require("../helpers/environmentVariablesHelper.js");
const { google } = require("googleapis");
const uuidv1 = require("uuid/v1");
const moment = require("moment-timezone");
const { pool } = require("../helpers/postgresqlConfig");
const cron = require("node-cron");
const {
  enableLogger,
  logger,
  enableDebugMode,
} = require("@project-sunbird/logger");
const crypto = require("crypto");
const axios = require("axios");

async function authorize() {
  const GOOGLE_CLIENT_ID = envHelper.event_meet_id;
  const GOOGLE_CLIENT_SECRET = envHelper.event_meet_secret;
  const GOOGLE_REFRESH_TOKEN = envHelper.google_refresh_token;
  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  if (GOOGLE_REFRESH_TOKEN) {
    auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  } else {
    throw new Error("Missing Google Refresh Token");
  }

  return auth;
}
function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
}
async function getTimezone(time, date) {
  // Combine the time and date into a single string
  const dateTimeString = `${date}T${time}:00`;

  // Get the timezone
  const timezone = moment.tz.guess();

  // Parse the datetime string in the guessed timezone
  const dateTimeInTimezone = moment.tz(dateTimeString, timezone);

  // Format the datetime in the guessed timezone
  const formattedDateTime = dateTimeInTimezone.format();

  console.log(`Datetime in ${timezone}: ${formattedDateTime}`);
  return { timezone, formattedDateTime };
}

async function createEvent(req, res) {
  try {
    const auth = await authorize();
    const eventData = req.body;
    const calendar = google.calendar({ version: "v3", auth });
    if (!eventData.event_name) {
      return res.status(400).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "failed",
          message: "Missing event_name in request body",
          err: null,
          errmsg: null,
        },
        responseCode: "BAD_REQUEST",
        result: null,
      });
    }

    if (
      !eventData.start_time ||
      !eventData.start_date ||
      !eventData.end_time ||
      !eventData.end_date
    ) {
      return res.status(400).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "failed",
          message:
            "Missing start_time, start_date, end_time, or end_date in request body",
          err: null,
          errmsg: null,
        },
        responseCode: "BAD_REQUEST",
        result: null,
      });
    }

    let startDateTime, startTimezone, endDateTime, endTimezone;

    const { timezone: startTz, formattedDateTime: startDt } = await getTimezone(
      eventData.start_time,
      eventData.start_date
    );
    startDateTime = startDt;
    startTimezone = startTz;

    const { timezone: endTz, formattedDateTime: endDt } = await getTimezone(
      eventData.end_time,
      eventData.end_date
    );
    endDateTime = endDt;
    endTimezone = endTz;

    const requestId = generateRandomString(10);

    const event = {
      summary: eventData.event_name || "",
      location: eventData.event_type || "",
      description: eventData.description || "",
      start: {
        dateTime: startDateTime,
        timeZone: startTimezone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: endTimezone,
      },
      conferenceData: {
        createRequest: {
          requestId: requestId,
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    if (response?.data) {
      const query =
        "INSERT INTO event_details ( event_id,meet_event_id,start_date_time,end_date_time,created_by) VALUES ($1, $2, $3, $4,$5) RETURNING *";
      const values = [
        eventData.event_id,
        response?.data.id,
        startDateTime,
        endDateTime,
        eventData?.created_by || req?.session.userId,
      ];

      await pool.query(query, values);
    }
    res.status(200).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "Event created successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: response.data,
    });
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}

async function updateEvent(req, res) {
  try {
    const auth = await authorize();
    const calendar = google.calendar({ version: "v3", auth });
    const eventId = req.query.eventId;
    const eventData = req.body;

    if (!eventId) {
      return res.status(400).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "failed",
          message: "Missing eventId parameter",
          err: null,
          errmsg: null,
        },
        responseCode: "BAD_REQUEST",
        result: null,
      });
    }

    if (
      !eventData.start_time ||
      !eventData.start_date ||
      !eventData.end_time ||
      !eventData.end_date
    ) {
      return res.status(400).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "failed",
          message:
            "Missing start_time, start_date, end_time, or end_date in request body",
          err: null,
          errmsg: null,
        },
        responseCode: "BAD_REQUEST",
        result: null,
      });
    }

    let startDateTime;
    let startTimezone;
    let endDateTime;
    let endTimezone;

    const { timezone: startTz, formattedDateTime: startDt } = await getTimezone(
      eventData.start_time,
      eventData.start_date
    );
    startDateTime = startDt;
    startTimezone = startTz;

    const { timezone: endTz, formattedDateTime: endDt } = await getTimezone(
      eventData.end_time,
      eventData.end_date
    );
    endDateTime = endDt;
    endTimezone = endTz;

    // Fetch the existing event to get current attendees
    const existingEvent = await calendar.events.get({
      calendarId: "primary",
      eventId: eventId,
    });

    const event = {};
    if (eventData.event_name) {
      event.summary = eventData.event_name;
    }
    if (eventData.event_type) {
      event.location = eventData.event_type;
    }
    if (eventData.description) {
      event.description = eventData.description;
    }
    if (startDateTime && startTimezone) {
      event.start = {
        dateTime: startDateTime,
        timeZone: startTimezone,
      };
    }
    if (endDateTime && endTimezone) {
      event.end = {
        dateTime: endDateTime,
        timeZone: endTimezone,
      };
    }

    // Add the new email to the existing list of attendees
    let attendees = existingEvent.data.attendees || [];
    if (eventData.email) {
      attendees.push({ email: eventData.email, responseStatus: "needsAction" });
      event.attendees = attendees;
    }

    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId: eventId,
      requestBody: event,
      conferenceDataVersion: 1,
    });

    res.status(200).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "Event updated successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: response.data,
    });
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "failed",
        message: "Failed to update event",
        err: err.message,
        errmsg: err.stack,
      },
      responseCode: "SERVER_ERROR",
      result: null,
    });
  }
}

async function getEvent(req, res) {
  try {
    const auth = await authorize();
    const calendar = google.calendar({ version: "v3", auth });
    const eventId = req.query.eventId;

    if (!eventId) {
      return res.status(400).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "failed",
          message: "Missing eventId parameter",
          err: null,
          errmsg: null,
        },
        responseCode: "BAD_REQUEST",
        result: null,
      });
    }

    const response = await calendar.events.get({
      calendarId: "primary",
      eventId: eventId,
    });
    let participants = [];
    let recordings = [];
    if (req?.query?.participants) {
      const meetClient = new ConferenceRecordsServiceClient({
        authClient: auth,
      });
      const spacesClient = new SpacesServiceClient({ authClient: auth });

      const participantsPromises = [];
      const recordingsPromises = [];

      for await (const record of meetClient.listConferenceRecordsAsync({})) {
        const spaceRes = await spacesClient.getSpace({ name: record.space });
        if (
          record.space === spaceRes[0]?.name &&
          response.data.conferenceData.conferenceId === spaceRes[0]?.meetingCode
        ) {
          const parent = record.name;

          // List participants
          const participantsPromise = (async () => {
            const participantsRequest = { parent };
            const participants = [];
            for await (const participant of meetClient.listParticipantsAsync(
              participantsRequest
            )) {
              participants.push(participant);
            }
            return participants;
          })();
          participantsPromises.push(participantsPromise);

          // List recordings
          const recordingsPromise = (async () => {
            const recordingsRequest = { parent };
            const recordings = [];
            for await (const recording of meetClient.listRecordingsAsync(
              recordingsRequest
            )) {
              recordings.push(recording);
            }
            return recordings;
          })();
          recordingsPromises.push(recordingsPromise);
        }
      }

      participants = await Promise.all(participantsPromises);
      recordings = await Promise.all(recordingsPromises);
    }
    res.status(200).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "Event retrieved successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        data: response.data,
        participants,
        recordings,
      },
    });
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "failed",
        message: "Failed to fetch event",
        err: err.message,
        errmsg: err.stack,
      },
      responseCode: "SERVER_ERROR",
      result: null,
    });
  }
}

async function saveEventAttendance(req, res) {
  try {
    const { event_id, user_id, meeting_start_time, attending_via } = req.body;

    if (!event_id & !user_id) {
      return res.status(400).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "failed",
          message: "Missing event_id or user_id in request body",
          err: null,
          errmsg: null,
        },
        responseCode: "BAD_REQUEST",
        result: null,
      });
    }
    const query = `
    INSERT INTO event_attendance (
      event_id,user_id, meeting_start_time,attending_via
    ) VALUES ($1, $2, $3, $4) RETURNING *
  `;

    const values = [event_id, user_id, meeting_start_time, attending_via];
    const { rows } = await pool.query(query, values);

    res.status(200).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "User event attendance saved successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: rows,
    });
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}

function hasRequiredRole(roles) {
  return (
    roles?.includes("SYSTEM_ADMINISTRATION") ||
    roles?.includes("ORG_ADMIN") ||
    roles?.includes("CONTENT_CREATOR")
  );
}

async function listWebinarAttendance(req, res) {
  try {
    if (!hasRequiredRole(req?.session?.roles)) {
      res.status(403).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          statusCode: 403,
          status: "unsuccessful",
          message: "You don't have privilege to fetch records",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {},
      });
    }

    let requestData = req.body.request;
    if (
      req?.session?.roles?.includes("CONTENT_CREATOR") &&
      !req?.session?.roles?.includes("SYSTEM_ADMINISTRATION") &&
      !req?.session?.roles?.includes("ORG_ADMIN")
    ) {
      requestData.filters.owner = req?.session.userId;
    }

    let data = JSON.stringify({
      request: requestData,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${envHelper.api_base_url}/api/composite/v1/search`,
      headers: {
        Authorization: `Bearer ${
          envHelper.PORTAL_API_AUTH_TOKEN ||
          envHelper.sunbird_logged_default_token
        }`,
        Cookie: `${req.headers.cookie}`,
        "Content-Type": "application/json",
      },
      data: data,
    };
    const response = await axios.request(config);
    if (response.status === 200) {
      const events = response?.data?.result?.Event || [];

      await Promise?.all(
        events?.map(async (item) => {
          let query = "SELECT * FROM event_registration WHERE event_id=$1";
          const values = [item.identifier];

          const { rows } = await pool.query(query, values);
          item.totalParticipants = rows?.length;
        })
      );
      res.status(200).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "Event details fetched successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: response.data,
      });
    }
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}

async function processMeetEvent() {
  try {
    console.log("Cron started");
    logger.info("Cron started...");
    const eventDetail = await fetchEvents();
    if (!eventDetail.length) {
      console.log("No data to fetch");
      logger.info("No data to fetch...");

      return;
    }

    const eventId = eventDetail[0]?.meet_event_id;
    if (!eventId) {
      logger.info("Event ID not found.");

      return;
    }

    const auth = await authorize();
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.get({
      calendarId: "primary",
      eventId: eventId,
    });

    if (!response.data.conferenceData?.conferenceId) {
      logger.info("Conference ID not found");
      return;
    }

    const meetClient = new ConferenceRecordsServiceClient({ authClient: auth });
    const spacesClient = new SpacesServiceClient({ authClient: auth });

    const participantsPromises = [];
    for await (const record of meetClient.listConferenceRecordsAsync({})) {
      const spaceRes = await spacesClient.getSpace({ name: record.space });
      if (
        record.space === spaceRes[0]?.name &&
        response.data.conferenceData.conferenceId === spaceRes[0]?.meetingCode
      ) {
        const parent = record.name;
        const participantsPromise = (async () => {
          const participantsRequest = { parent };
          const participants = [];
          for await (const participant of meetClient.listParticipantsAsync(
            participantsRequest
          )) {
            participants.push(participant);
          }
          return participants;
        })();
        participantsPromises.push(participantsPromise);
      }
    }

    const participants = await Promise.all(participantsPromises);

    if (!participants.length) {
      logger.info("No participants data found.");

      return;
    }

    const result = processParticipantsData(participants);
    await saveParticipantsData(result, eventDetail[0]);
    await updateFetchMeetData(eventDetail[0]?.meet_event_id);
  } catch (error) {
    console.error("Error processing meet event:", error);
    logger.info("No participants data found.");
  }
}

async function fetchEvents() {
  const query = `
    SELECT * FROM public.event_details
    WHERE CAST(end_date_time AS TIMESTAMP WITH TIME ZONE) <= NOW() - INTERVAL '30 minutes'
      AND end_date_time IS NOT NULL AND fetch_meet_data=true;
  `;
  try {
    const res = await pool.query(query);
    return res.rows;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

async function updateFetchMeetData(meet_event_id) {
  const query = `UPDATE event_details SET fetch_meet_data = $1 WHERE meet_event_id=$2`;
  const values = [false, meet_event_id];
  try {
    const res = await pool.query(query, values);
    console.log("Update successful:", res.rowCount, "rows affected.");
    logger.info(" Updated successful...");
  } catch (error) {
    console.error("Error updating fetch_meet_data:", error);
  }
}

function processParticipantsData(participants) {
  const result = [];
  function convertToDate(seconds, nanos) {
    return new Date(parseInt(seconds) * 1000 + nanos / 1000000);
  }
  function calculateTotalTime(startDate, endDate) {
    return endDate - startDate;
  }
  function convertToReadableTime(milliseconds) {
    const totalMinutes = milliseconds / 1000 / 60;
    const minutes = Math.floor(totalMinutes % 60);
    return `${minutes}`;
  }
  participants.forEach((conference) => {
    conference.forEach((record) => {
      const startTime = convertToDate(
        record.earliestStartTime.seconds,
        record.earliestStartTime.nanos
      );
      const endTime = convertToDate(
        record.latestEndTime.seconds,
        record.latestEndTime.nanos
      );
      const totalTime = calculateTotalTime(startTime, endTime);
      result.push({
        displayName: record.signedinUser.displayName,
        startTimeDate: startTime.toISOString(),
        endTimeDate: endTime.toISOString(),
        totalTime: convertToReadableTime(totalTime),
      });
    });
  });
  return result;
}

async function saveParticipantsData(result, eventDetail) {
  const addMeetDataPromises = result.map(async (item) => {
    const query = `
      INSERT INTO meet_attendance (
        meet_event_id, display_name, meeting_start_time, meeting_end_time,
        meeting_total_time, attending_via
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `;
    const values = [
      eventDetail.meet_event_id,
      item.displayName,
      item.startTimeDate,
      item.endTimeDate,
      item.totalTime,
      "Online",
    ];
    try {
      const { rows } = await pool.query(query, values);
      return rows;
    } catch (error) {
      console.error("Error saving participants data:", error);
      throw error;
    }
  });
  await Promise.all(addMeetDataPromises);
  console.log("Data saved into DB");
}

const cronTime = envHelper.MEET_CRON_TIME || "*/30 * * * *"; // Default to every 30 minutes if MEET_CRON_TIME is not set

cron.schedule(cronTime, processMeetEvent);

async function getGmeetAttendance(req, res) {
  try {
    if (
      !req?.session?.roles?.includes("CONTENT_CREATOR") &&
      !req?.session?.roles?.includes("SYSTEM_ADMINISTRATION")
    ) {
      res.status(403).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          statusCode: 403,
          status: "unsuccessful",
          message: "You don't have privilege to fetch records",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {},
      });
    }
    const { event_id, meet_event_id, attending_via } = req.query;

    let query = "SELECT * FROM meet_attendance";
    const conditions = [];
    const values = [];

    if (event_id) {
      conditions.push(`event_id = $${conditions.length + 1}`);
      values.push(event_id);
    }
    if (meet_event_id) {
      conditions.push(`meet_event_id = $${conditions.length + 1}`);
      values.push(meet_event_id);
    }
    if (attending_via) {
      conditions.push(`attending_via = $${conditions.length + 1}`);
      values.push(attending_via);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    const { rows } = await pool.query(query, values);

    res.status(200).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "Event attendance fetched successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: rows,
    });
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}

const key = Buffer.from(envHelper.EVENT_ENCRYPTION_KEY, "hex"); // 32 bytes hex string
const encrypt = (text) => {
  const iv = crypto.randomBytes(16); // New IV for each encryption
  let cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  // Concatenate IV and encrypted data
  const encryptedData = iv.toString("hex") + ":" + encrypted.toString("hex");
  return encryptedData;
};

const insertEventRegistration = async (req, res) => {
  const {
    event_id,
    name,
    user_id,
    email,
    designation,
    organisation,
    certificate,
    consentForm,
    user_consent,
  } = req.body;
  const encryptedData = encrypt(email);
  const query = `
    INSERT INTO event_registration (event_id,name, email, designation, organisation, certificate,user_consent, consent_form,user_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9) RETURNING *
  `;

  const values = [
    event_id,
    name,
    encryptedData,
    designation,
    organisation,
    certificate,
    user_consent,
    consentForm,
    user_id,
  ];

  try {
    const { rows } = await pool.query(query, values);
    res.status(200).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "Event registration inserted successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: rows,
    });
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
};

const decrypt = (encryptedData) => {
  const textParts = encryptedData.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  let decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
const getEventRegistration = async (req, res) => {
  const event_id = req.query.event_id;
  const query = `
    SELECT name, email, designation, organisation, certificate, consent_form
    FROM event_registration
    WHERE event_id = $1
  `;

  try {
    const res = await pool.query(query, [event_id]);
    const row = res.rows[0];
    const decryptedEmail = decrypt(row.email);
    console.log("Decrypted Email:", decryptedEmail);
  } catch (err) {
    console.error("Error retrieving event registration:", err);
  }
};

async function getCountsOfEvent(req, res) {
  try {
    if (!hasRequiredRole(req?.session?.roles)) {
      res.status(403).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          statusCode: 403,
          status: "unsuccessful",
          message: "You don't have privilege to fetch records",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {},
      });
    }

    let requestData = req.body.request;
    if (
      req?.session?.roles?.includes("CONTENT_CREATOR") &&
      !req?.session?.roles?.includes("SYSTEM_ADMINISTRATION") &&
      !req?.session?.roles?.includes("ORG_ADMIN")
    ) {
      requestData.filters.owner = req?.session.userId;
    }
    let data = JSON.stringify({
      request: requestData,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${envHelper.api_base_url}/api/composite/v1/search`,
      headers: {
        Authorization: `Bearer ${
          envHelper.PORTAL_API_AUTH_TOKEN ||
          envHelper.sunbird_logged_default_token
        }`,
        Cookie: `${req.headers.cookie}`,
        "Content-Type": "application/json",
      },
      data: data,
    };
    const response = await axios.request(config);
    if (response.status === 200) {
      const events = response?.data?.result?.Event || [];
      const totalEvent = response?.data?.result?.count;
      let totalEventInThisMonth = 0;
      let totalParticipants = 0;
      let totalCertifiedUsers = 0;
      let totalCreators = new Set();
      let upComingEvent = 0;

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      await Promise.all(
        events.map(async (item) => {
          const eventStartDate = new Date(item.startDate);

          // Count events in the current month
          if (
            eventStartDate.getMonth() === currentMonth &&
            eventStartDate.getFullYear() === currentYear
          ) {
            totalEventInThisMonth++;
          }

          // Count upcoming events
          if (eventStartDate > currentDate) {
            upComingEvent++;
          }

          // Count unique creators
          totalCreators.add(item.owner);

          // Count participants
          const query =
            "SELECT COUNT(*) AS participant_count FROM event_registration WHERE event_id=$1";
          const values = [item.identifier];
          const { rows } = await pool.query(query, values);
          totalParticipants += parseInt(rows[0].participant_count, 10);

          // Count certified users
          if (item.IssueCerificate === "Yes") {
            const certQuery =
              "SELECT COUNT(*) AS certified_count FROM event_registration WHERE event_id=$1";
            const certValues = [item.identifier];
            const certResult = await pool.query(certQuery, certValues);
            // totalCertifiedUsers += parseInt(
            //   certResult.rows[0].certified_count,
            //   10
            // );
            totalCertifiedUsers = 0;
          }
        })
      );

      res.status(200).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "Event counts fetched successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {
          totalEvent,
          totalEventInThisMonth,
          totalParticipants,
          totalCreators: totalCreators.size, // Size of the Set for unique creators
          totalCertifiedUsers,
          upComingEvent,
        },
      });
    } else {
      res.status(response.status).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "unsuccessful",
          message: "Failed to fetch events",
          err: null,
          errmsg: null,
        },
        responseCode: "ERROR",
        result: {},
      });
    }
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}

async function getTopTrending(req, res) {
  try {
    if (!hasRequiredRole(req?.session?.roles)) {
      return res.status(403).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          statusCode: 403,
          status: "unsuccessful",
          message: "You don't have privilege to fetch records",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {},
      });
    }

    const isContentCreatorOnly =
      req?.session?.roles?.includes("CONTENT_CREATOR") &&
      !req?.session?.roles?.includes("SYSTEM_ADMINISTRATION") &&
      !req?.session?.roles?.includes("ORG_ADMIN");

    const userId = isContentCreatorOnly ? req?.session.userId : null;

    const queries = [];
    if (req.query.user) {
      queries.push(
        getTopEvents(userId, "user_id", req.query.fromDate, req.query.toDate)
      );
    }
    if (req.query.designation) {
      queries.push(
        getTopEvents(
          userId,
          "designation",
          req.query.fromDate,
          req.query.toDate
        )
      );
    }

    const results = await Promise.all(queries);

    const topEvent = results[0] || [];
    const topDesignation = results[1] || [];

    // Process topDesignation to get unique designations with counts
    const designationCountMap = {};
    topDesignation?.forEach(({ designation }) => {
      if (designationCountMap[designation]) {
        designationCountMap[designation]++;
      } else {
        designationCountMap[designation] = 1;
      }
    });

    // Convert map to array and sort by count descending
    const sortedDesignations = Object?.entries(designationCountMap)
      .map(([designation, count]) => ({ designation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.status(200).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "Top Events fetched successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        topEvent,
        topDesignation: sortedDesignations,
      },
    });
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {},
    });
  }
}

async function getTopEvents(userId, column, fromDate, toDate) {
  let query = `
    SELECT er.event_id, COUNT(er.${column}) AS user_count,er.designation
    FROM event_registration er
    JOIN event_details ed ON er.event_id = ed.event_id
    WHERE 1 = 1
  `;

  const values = [];

  if (userId) {
    query += `AND ed.created_by = $${values.length + 1} `;
    values.push(userId);
  }

  if (fromDate && toDate) {
    query += `AND ed.start_date_time >= $${
      values.length + 1
    } AND ed.end_date_time <= $${values.length + 2} `;
    values.push(fromDate, toDate);
  } else {
    // Default to last 30 days data if fromDate and toDate are not provided
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query += `AND ed.start_date_time >= $${values.length + 1} `;
    values.push(thirtyDaysAgo.toISOString());
  }

  query += `
    GROUP BY er.event_id, er.designation
    ORDER BY user_count DESC
    LIMIT 5;
  `;

  const { rows } = await pool.query(query, values);

  const eventNames = await getEventNames(rows.map((row) => row.event_id));

  return rows.map((row) => ({
    ...row,
    event_name: eventNames[row.event_id] || "Unknown",
  }));
}

async function getEventNames(eventIds) {
  const eventNames = {};
  for (const eventId of eventIds) {
    try {
      const response = await axios.get(
        `${envHelper.api_base_url}/api/event/v4/read/${eventId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              envHelper.PORTAL_API_AUTH_TOKEN ||
              envHelper.sunbird_logged_default_token
            }`,
          },
        }
      );
      if (response.data.result && response.data.result.event) {
        eventNames[eventId] = response.data.result.event.name;
      }
    } catch (error) {
      console.error(`Error fetching event ${eventId}: ${error.message}`);
    }
  }
  return eventNames;
}
async function eventReports(req, res) {
  try {
    if (!hasRequiredRole(req?.session?.roles)) {
      res.status(403).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          statusCode: 403,
          status: "unsuccessful",
          message: "You don't have privilege to fetch records",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {},
      });
    }
    if (!req?.query?.event_id) {
      res.status(404).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          statusCode: 404,
          status: "unsuccessful",
          message: "MIssing field event_id !",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {},
      });
    }
    const eventId = req.query.event_id.trim();
    let query =
      "SELECT event_registration.*,event_details.start_date_time AS date FROM event_registration JOIN event_details  ON event_registration.event_id = event_details.event_id WHERE event_registration.event_id=$1";
    const values = [eventId];

    const { rows } = await pool.query(query, values);
    if (rows?.length > 0) {
      const eventDetail = await getEventNames([eventId]);
      for (const item of rows) {
        const decryptedEmail = decrypt(item.email);
        item.email = decryptedEmail;
        item.eventName = eventDetail[eventId];
        delete item.id;
        delete item.certificate;
        delete item.user_consent;
        delete item.consent_form;
        delete item.created_at;
        delete item.user_id;
        delete item.event_id;
      }
      res.status(200).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "successful",
          message: "Event reports fetched successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: rows || [],
      });
    } else {
      throw new Error("Event not found ");
    }
  } catch (error) {
    console.log(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode: statusCode,
        status: "unsuccessful",
        message: errorMessage,
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: [],
    });
  }
}

async function userUnregister(req, res) {
  try {
    const { event_id, user_id } = req.query;

    if (!event_id || !user_id) {
      return sendErrorResponse(res, 404, "Missing field event_id or user_id!");
    }

    const eventId = event_id.trim();
    const userId = user_id.trim();
    const query =
      "DELETE FROM event_registration WHERE event_id=$1 AND user_id=$2";
    const values = [eventId, userId];

    const { rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return sendErrorResponse(res, 404, "User not registered for this event.");
    }

    res.status(200).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "User unregistered successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: [],
    });
  } catch (error) {
    console.error(error);
    sendErrorResponse(
      res,
      error.statusCode || 500,
      error.message || "Internal Server Error"
    );
  }
}

function sendErrorResponse(res, statusCode, message) {
  res.status(statusCode).send({
    ts: new Date().toISOString(),
    params: {
      resmsgid: uuidv1(),
      msgid: uuidv1(),
      statusCode: statusCode,
      status: "unsuccessful",
      message: message,
      err: null,
      errmsg: null,
    },
    responseCode: "OK",
    result: [],
  });
}

module.exports = {
  createEvent,
  getEvent,
  updateEvent,
  saveEventAttendance,
  listWebinarAttendance,
  getGmeetAttendance,
  insertEventRegistration,
  getEventRegistration,
  getCountsOfEvent,
  getTopTrending,
  eventReports,
  userUnregister,
};

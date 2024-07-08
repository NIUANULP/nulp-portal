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
        "INSERT INTO event_details ( event_id,meet_event_id,start_date_time,end_date_time) VALUES ($1, $2, $3, $4) RETURNING *";
      const values = [
        eventData.event_id,
        response?.data.id,
        startDateTime,
        endDateTime,
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

    const meetClient = new ConferenceRecordsServiceClient({ authClient: auth });
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

    const participants = await Promise.all(participantsPromises);
    const recordings = await Promise.all(recordingsPromises);

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

async function saveWebinarAttendance(req, res) {
  try {
    const { user_id, content_id, meeting_start_time, attending_via } = req.body;

    if (!content_id && !user_id) {
      return res.status(400).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "failed",
          message: "Missing content_id in request body",
          err: null,
          errmsg: null,
        },
        responseCode: "BAD_REQUEST",
        result: null,
      });
    }

    const query =
      "INSERT INTO event_attendance (user_id, content_id, meeting_start_time, attending_via) VALUES ($1, $2, $3, $4) RETURNING *";
    const values = [user_id, content_id, meeting_start_time, attending_via];

    const { rows } = await pool.query(query, values);

    res.status(200).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        message: "User webinar attendance saved successfully",
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

async function listWebinarAttendance(req, res) {
  try {
    const { user_id, meet_event_id, attending_via } = req.body;

    let query = "SELECT * FROM event_attendance";
    const conditions = [];
    const values = [];

    if (meet_event_id) {
      conditions.push(`meet_event_id = $${conditions.length + 1}`);
      values.push(meet_event_id);
    }
    if (content_id) {
      conditions.push(`content_id = $${conditions.length + 1}`);
      values.push(content_id);
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
        message: "User webinar attendance fetched successfully",
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
      INSERT INTO event_attendance (
        event_id, display_name, meeting_start_time, meeting_end_time,
        meeting_total_time, attending_via, meet_event_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const values = [
      eventDetail.event_id,
      item.displayName,
      item.startTimeDate,
      item.endTimeDate,
      item.totalTime,
      "Online",
      eventDetail.meet_event_id,
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

module.exports = {
  createEvent,
  getEvent,
  updateEvent,
  saveWebinarAttendance,
  listWebinarAttendance,
};

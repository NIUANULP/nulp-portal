const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { SpacesServiceClient, ConferenceRecordsServiceClient } =
  require("@google-apps/meet").v2;
const { auth, GoogleAuth, OAuth2Client } = require("google-auth-library");
const { google } = require("googleapis");
const uuidv1 = require("uuid/v1");
const moment = require("moment-timezone");
const SCOPES = [
  "https://www.googleapis.com/auth/meetings.space.created",
  "https://www.googleapis.com/auth/meetings.space.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return auth.fromJSON(credentials);
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
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
    const requestId = generateRandomString(10);

    let startDateTime;
    let startTimezone;
    let endDateTime;
    let endTimezone;

    if (eventData.start_time && eventData.start_date) {
      const { timezone, formattedDateTime } = await getTimezone(
        eventData.start_time,
        eventData.start_date
      );
      startDateTime = formattedDateTime;
      startTimezone = timezone;
    }
    if (eventData.end_time && eventData.end_date) {
      const { timezone, formattedDateTime } = await getTimezone(
        eventData.end_time,
        eventData.end_date
      );
      endDateTime = formattedDateTime;
      endTimezone = timezone;
    }

    const event = {
      summary: eventData.event_name,
      location: eventData.event_type,
      description: eventData.description,
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
          requestId: requestId, // Unique id for every request
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1, // Version 1 for Meet
    });

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

    let startDateTime;
    let startTimezone;
    let endDateTime;
    let endTimezone;

    if (eventData.start_time && eventData.start_date) {
      const { timezone, formattedDateTime } = await getTimezone(
        eventData.start_time,
        eventData.start_date
      );
      startDateTime = formattedDateTime;
      startTimezone = timezone;
    }
    if (eventData.end_time && eventData.end_date) {
      const { timezone, formattedDateTime } = await getTimezone(
        eventData.end_time,
        eventData.end_date
      );
      endDateTime = formattedDateTime;
      endTimezone = timezone;
    }

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

    const response = await calendar.events.get({
      calendarId: "primary",
      eventId: eventId,
    });

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
      result: response.data,
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

module.exports = {
  createEvent,
  getEvent,
  updateEvent,
};

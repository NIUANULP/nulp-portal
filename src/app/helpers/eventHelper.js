const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { SpacesServiceClient, ConferenceRecordsServiceClient } =
  require("@google-apps/meet").v2;
const {
  auth,
  GoogleAuth,
  OAuth2Client,
  AuthClient,
} = require("google-auth-library");
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

module.exports = {
  createEvent,
  getEvent,
  updateEvent,
};

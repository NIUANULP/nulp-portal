const {
  createRecord,
  updateRecord,
  getRecord,
  deleteRecord,
  getRecords,
} = require("./dbOperationHelper");
const uuidv1 = require("uuid/v1");
const cron = require("node-cron");
const { pool } = require("../helpers/postgresqlConfig");
const envHelper = require("./environmentVariablesHelper.js");
const axios = require("axios");

function generateUniqueId() {
  const currentUnixTime = Date.now(); // Get current Unix timestamp in milliseconds
  const randomSuffix = Math.floor(Math.random() * 1000000); // Generate random number between 0 and 999999

  // Construct the unique id with the format "do_{current_unix_time}{random_number}"
  const uniqueId = `do_${currentUnixTime}${randomSuffix}`;

  return uniqueId;
}
const createPolls = async (req, res) => {
  try {
    if (
      !req?.session?.roles?.includes("CONTENT_CREATOR") &&
      !req?.session?.roles?.includes("SYSTEM_ADMINISTRATION")
    ) {
      return res.status(403).send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          statusCode: 403,
          status: "unsuccessful",
          message: "You don't have privilege to create records",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {},
      });
    }
    let data = req.body;
    const now = new Date();
    if (data?.visibility === "private" && !data?.user_list?.length > 0) {
      const error = new Error("User list not found");
      error.statusCode = 404;
      throw error;
    }

    const allowedColumns = [
      "poll_id",
      "title",
      "description",
      "poll_options",
      "poll_keywords",
      "visibility",
      "start_date",
      "end_date",
      "status",
      "organization",
      "image",
      "is_live_poll_result",
      "created_by",
    ];
    const requiredFields = [
      "title",
      "description",
      "poll_options",
      "visibility",
      "start_date",
      "end_date",
    ];
    const missingFields = requiredFields?.filter((column) => !data[column]);
    if (missingFields?.length > 0) {
      const error = new Error(
        `Missing required fields: ${missingFields.join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Convert start_date and end_date to Date objects
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    // Validate start_date and end_date
    if (startDate < now) {
      const error = new Error("Start date cannot be in the past.");
      error.statusCode = 400;
      throw error;
    }
    if (endDate <= startDate) {
      const error = new Error("End date must be after the start date.");
      error.statusCode = 400;
      throw error;
    }

    const generatedId = generateUniqueId();
    data.poll_id = generatedId;
    data.created_by = req?.session?.userId;
    data.organization = req?.session?.rootOrgId;
    if (
      !data?.poll_options ||
      data?.poll_options.filter((option) => option.trim() !== "").length < 2
    ) {
      const error = new Error(`Poll option should be more than 2`);
      error.statusCode = 400;
      throw error;
    }

    const pollOptions = data?.poll_options.map((option) => `"${option}"`);
    data.poll_options = pollOptions;
    const keywords = data?.poll_keywords?.map((item) => `"${item}"`);
    data.poll_keywords = keywords;
    const response = await createRecord(data, "polls", allowedColumns);
    if (response?.length > 0) {
      if (data?.visibility === "private") {
        const userList = data?.user_list;
        userList?.map(async (item) => {
          await emailSend(data, userList);
          const pollData = {
            poll_id: generatedId,
            user_id: item,
          };

          const final = await createRecord(pollData, "user_invited", [
            "poll_id",
            "user_id",
          ]);
          return final;
        });
      }
      return res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "Poll created successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {
          data: response,
        },
      });
    } else {
      throw new Error(response);
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
};
const emailSend = async (poll, userList) => {
  try {
    const message = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <p style="color: #555;">We want your input! Participate in our latest poll on <strong>${poll.title}</strong> on NULP.</p>
        <p style="text-align: center;">
            <a href="${envHelper.api_base_url}/webapp/pollDetails?${poll.poll_id}" style="background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Click here to participate</a>
        </p>
        
    </div>
</body>
</html>`;
    console.log("message", message);
    let data = JSON.stringify({
      request: {
        mode: "email",
        body: `${message}`,
        fromEmail: "",
        emailTemplateType: "",
        subject: `Share Your Opinion in Our Poll ${poll.title} on NULP`,
        recipientUserIds: userList,
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${envHelper.api_base_url}/api/user/v1/notification/email`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${envHelper.PORTAL_API_AUTH_TOKEN}`,
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    throw error;
  }
};
const updatePolls = async (req, res) => {
  try {
    const { poll_id } = req.query;
    const { session, body } = req;

    if (!poll_id) {
      const error = new Error("Poll id is missing");
      error.statusCode = 404;
      throw error;
    }

    if (
      !session?.roles?.includes("CONTENT_CREATOR") &&
      !session?.roles?.includes("SYSTEM_ADMINISTRATION")
    ) {
      const error = new Error("You don't have privilege to update records");
      error.statusCode = 403;
      throw error;
    }
    if (
      body?.poll_options &&
      body?.poll_options?.filter((option) => option?.trim() !== "").length < 2
    ) {
      const error = new Error(`Poll option should be more than 2`);
      error.statusCode = 400;
      throw error;
    }

    if (body.visibility || body.organization || body.poll_id) {
      const error = new Error(
        "You cannot update visibility,poll id and organization"
      );
      error.statusCode = 400;
      throw error;
    }

    const pollData = await getRecord("SELECT * FROM polls WHERE poll_id=$1", [
      poll_id.trim(),
    ]);
    if (!pollData?.length) {
      const error = new Error("Poll not found");
      error.statusCode = 404;
      throw error;
    }

    const currentDateTime = new Date();
    const startDateTime = new Date(pollData[0]?.start_date);

    // Calculate the time difference in milliseconds
    const timeDifference = currentDateTime - startDateTime;
    const twoMinutesInMillis = 2 * 60 * 1000; // 2 minutes in milliseconds

    if (
      (body?.start_date || body?.status) &&
      timeDifference > twoMinutesInMillis
    ) {
      const message = body?.start_date
        ? "Cannot update start date once poll has started."
        : "Cannot update status once poll has started.";
      const error = new Error(message);
      error.statusCode = 400;
      throw error;
    }

    const allowedColumns = [
      "title",
      "description",
      "poll_options",
      "poll_keywords",
      "visibility",
      "start_date",
      "end_date",
      "status",
      "organization",
      "image",
      "is_live_poll_result",
      "updated_by",
    ];

    body.updated_by = session?.userId;
    body.organization = req?.session?.rootOrgId;
    if (body?.poll_options) {
      body.poll_options = body.poll_options.map((option) => `"${option}"`);
    }
    if (body?.poll_keywords) {
      const keywords = body?.poll_keywords?.map((item) => `"${item}"`);
      body.poll_keywords = keywords;
    }

    const response = await updateRecord(
      poll_id.trim(),
      body,
      "polls",
      allowedColumns,
      "poll_id"
    );

    if (response?.length) {
      return res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "Poll updated successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {
          data: response,
        },
      });
    }

    throw new Error("Update failed");
  } catch (error) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode,
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

const getPoll = async (req, res) => {
  try {
    const { poll_id } = req.query;

    if (!poll_id) {
      const error = new Error("Poll id is missing");
      error.statusCode = 404;
      throw error;
    }

    const organization = req?.session?.rootOrgId;

    // Fetch poll data
    const pollDataQuery = `
        SELECT *
        FROM polls
        WHERE poll_id = $1 AND organization = $2
      `;
    const pollData = await getRecord(pollDataQuery, [
      poll_id.trim(),
      organization,
    ]);

    if (!pollData?.length) {
      const error = new Error("Poll not found");
      error.statusCode = 404;
      throw error;
    }

    // Fetch poll options
    const pollOptions = pollData[0]?.poll_options;

    const pollResultsQuery = `
        SELECT poll_result, COUNT(*) as count
        FROM user_poll
        WHERE poll_id = $1
        GROUP BY poll_result
      `;
    const pollResults = await getRecord(pollResultsQuery, [poll_id.trim()]);

    const formattedPollResults = pollOptions?.map((option) => ({
      poll_option: option,
      count: 0,
    }));

    pollResults?.forEach((result) => {
      const option = formattedPollResults?.find(
        (opt) => opt.poll_option === result.poll_result
      );
      if (option) {
        option.count = parseInt(result.count, 10);
      }
    });
    // Sort results by count in descending order
    formattedPollResults.sort((a, b) => b.count - a.count);

    return res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "Poll fetched successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        poll: pollData[0],
        result: formattedPollResults,
      },
    });
  } catch (error) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode,
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

const deletePolls = async (req, res) => {
  try {
    const { poll_id } = req.query;

    if (!poll_id) {
      const error = new Error("Poll id is missing");
      error.statusCode = 404;
      throw error;
    }
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
          message: "You don't have privilege to delete record",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {},
      });
    }
    const isContentCreatorOnly =
      req?.session?.roles?.includes("CONTENT_CREATOR") &&
      !req?.session?.roles?.includes("SYSTEM_ADMINISTRATION");

    const userId = isContentCreatorOnly ? req?.session.userId : null;

    let pollData;
    if (isContentCreatorOnly) {
      pollData = await deleteRecord(
        "DELETE FROM polls WHERE poll_id=$1 AND created_by=$2",
        [poll_id.trim(), userId]
      );
    } else if (req?.session?.roles?.includes("SYSTEM_ADMINISTRATION")) {
      pollData = await deleteRecord("DELETE FROM polls WHERE poll_id=$1", [
        poll_id.trim(),
      ]);
    } else {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      throw error;
    }

    if (pollData <= 0) {
      const error = new Error("Unable to delete");
      error.statusCode = 500;
      throw error;
    }
    if (pollData > 0) {
      return res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "Poll deleted successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {
          data: pollData,
        },
      });
    }

    throw new Error("Delete failed");
  } catch (error) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode,
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
const listPolls = async (req, res) => {
  try {
    const {
      filters = {},
      sort_by = {},
      limit = 10,
      offset = 0,
      search = "",
    } = req.body.request;
    const isSystemAdmin = req?.session?.roles?.includes(
      "SYSTEM_ADMINISTRATION"
    );
    const isContentCreatorOnly =
      req?.session?.roles?.includes("CONTENT_CREATOR") &&
      !req?.session?.roles?.includes("SYSTEM_ADMINISTRATION");

    const userId = filters.user_id || req?.session?.userId;
    const organization = req?.session?.rootOrgId;

    // Base query for polls
    let query = `
      SELECT DISTINCT polls.* 
      FROM polls 
      LEFT JOIN user_invited ON polls.poll_id = user_invited.poll_id AND polls.visibility = 'private' AND user_invited.user_id = $1
      WHERE 1=1
    `;
    if (req?.query?.list_page) {
      query += ` AND polls.created_by != $1`;
    }
    const values = [userId];
    const countValues = [userId];

    // Apply filters for user-specific data
    if (filters.created_by) {
      values.push(filters.created_by);
      query += ` AND polls.created_by = $${values.length}`;
    }
    if (!isSystemAdmin && organization) {
      values.push(organization);
      query += ` AND polls.organization = $${values.length}`;
    }

    // Apply field-specific filters
    if (filters.poll_options) {
      values.push(filters.poll_options);
      query += ` AND polls.poll_options @> $${values.length}`;
    }
    if (filters.visibility) {
      values.push(filters.visibility);
      query += ` AND polls.visibility = $${values.length}`;
    }
    if (filters.poll_keywords) {
      values.push(filters.poll_keywords);
      query += ` AND polls.poll_keywords = $${values.length}`;
    }
    if (filters.status && filters.status.length > 0) {
      values.push(filters.status);
      query += ` AND polls.status = ANY($${values.length}::text[])`;
    }

    if (filters.is_live_poll_result !== undefined) {
      values.push(filters.is_live_poll_result);
      query += ` AND polls.is_live_poll_result = $${values.length}`;
    }
    if (filters.from_date) {
      values.push(filters.from_date);
      query += ` AND polls.start_date >= $${values.length}`;
    }
    if (filters.to_date) {
      values.push(filters.to_date);
      query += ` AND polls.end_date <= $${values.length}`;
    }

    // Apply search across all relevant fields
    if (search) {
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      query += `
      AND (polls.title ILIKE $${values.length - 3}
      OR polls.description ILIKE $${values.length - 2}
      OR EXISTS (
        SELECT 1
        FROM unnest(polls.poll_keywords) AS elem
        WHERE elem::text ILIKE $${values.length - 1}
      )
      OR polls.created_by::text ILIKE $${values.length})
    `;
    }

    // Include polls where the user is invited if visibility is private
    if (userId) {
      values.push(userId);
      query += ` AND (polls.visibility <> 'private' OR user_invited.user_id = $${values.length})`;
    }

    // Sorting
    const sortClauses = [];
    for (const [column, direction] of Object.entries(sort_by)) {
      sortClauses.push(`${column} ${direction.toUpperCase()}`);
    }
    if (sortClauses.length > 0) {
      query += ` ORDER BY ${sortClauses.join(", ")}`;
    }

    // Pagination
    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(parseInt(limit), parseInt(offset));
    console.log(query, values);
    // Fetch the polls
    const result = await getRecords(query, values);
    // Now, to get the count of total records matching the filters
    let countQuery = `
      SELECT COUNT(DISTINCT polls.poll_id) 
      FROM polls 
      LEFT JOIN user_invited ON polls.poll_id = user_invited.poll_id AND polls.visibility = 'private' AND user_invited.user_id = $1 
      WHERE 1=1
    `;
    if (req?.query?.list_page) {
      countQuery += ` AND polls.created_by != $1`;
    }

    // Apply the same filters as above for the count query
    if (filters.created_by) {
      countValues.push(filters.created_by);
      countQuery += ` AND polls.created_by = $${countValues.length}`;
    }
    if (!isSystemAdmin && organization) {
      countValues.push(organization);
      countQuery += ` AND polls.organization = $${countValues.length}`;
    }
    if (filters.poll_options) {
      countValues.push(filters.poll_options);
      countQuery += ` AND polls.poll_options @> $${countValues.length}`;
    }
    if (filters.visibility) {
      countValues.push(filters.visibility);
      countQuery += ` AND polls.visibility = $${countValues.length}`;
    }
    if (filters.poll_keywords) {
      countValues.push(filters.poll_keywords);
      countQuery += ` AND polls.poll_keywords = $${countValues.length}`;
    }
    if (filters.status && filters.status.length > 0) {
      countValues.push(filters.status);
      countQuery += ` AND polls.status = ANY($${countValues.length}::text[])`;
    }
    if (filters.is_live_poll_result !== undefined) {
      countValues.push(filters.is_live_poll_result);
      countQuery += ` AND polls.is_live_poll_result = $${countValues.length}`;
    }
    if (filters.from_date) {
      countValues.push(filters.from_date);
      countQuery += ` AND polls.start_date >= $${countValues.length}`;
    }
    if (filters.to_date) {
      countValues.push(filters.to_date);
      countQuery += ` AND polls.end_date <= $${countValues.length}`;
    }
    if (search) {
      countValues.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
      countQuery += `
    AND (polls.title ILIKE $${countValues.length - 3}
    OR polls.description ILIKE $${countValues.length - 2}
    OR EXISTS (
      SELECT 1
      FROM unnest(polls.poll_keywords) AS elem
      WHERE elem::text ILIKE $${countValues.length - 1}
    )
    OR polls.created_by::text ILIKE $${countValues.length})
  `;
    }

    // Include polls where the user is invited if visibility is private
    if (userId) {
      countValues.push(userId);
      countQuery += ` AND (polls.visibility <> 'private' OR user_invited.user_id = $${countValues.length})`;
    }

    // Get the total count
    const countResult = await getRecords(countQuery, countValues);
    const totalCount = parseInt(countResult?.rows[0]?.count, 10); // Convert to integer

    // Return response including polls and count
    return res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "Polls fetched successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        totalCount: totalCount,
        data: result.rows || [],
      },
    });
  } catch (error) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        statusCode,
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

const createUserPoll = async (req, res) => {
  try {
    let data = req.body;
    const requiredFields = [
      "poll_id",
      "user_id",
      "poll_submitted",
      "poll_result",
    ];
    const missingFields = requiredFields?.filter((column) => !data[column]);
    if (missingFields?.length > 0) {
      const error = new Error(
        `Missing required fields: ${missingFields.join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }
    const pollData = await getRecord("SELECT * FROM polls WHERE poll_id=$1", [
      data.poll_id.trim(),
    ]);
    if (!pollData?.length) {
      const error = new Error("Poll not found");
      error.statusCode = 404;
      throw error;
    }
    if (pollData[0]?.created_by === data.user_id.trim()) {
      const error = new Error("You cannot vote own poll");
      error.statusCode = 400;
      throw error;
    }
    if (pollData[0]?.status != "Live") {
      const error = new Error("Poll is not live");
      error.statusCode = 400;
      throw error;
    }
    if (!pollData[0]?.poll_options?.includes(`${data.poll_result}`)) {
      const error = new Error("You selection not matched with poll options");
      error.statusCode = 404;
      throw error;
    }
    const currentDateTime = new Date();
    const endTime = new Date(pollData[0]?.end_date);
    if (currentDateTime > endTime) {
      const message = "Poll window has been closed.";
      const error = new Error(message);
      error.statusCode = 403;
      throw error;
    }
    const allowedColumns = [
      "poll_id",
      "user_id",
      "poll_submitted",
      "poll_result",
      "poll_date",
    ];
    data.poll_date = currentDateTime;
    const response = await createRecord(data, "user_poll", allowedColumns);
    if (response?.length > 0) {
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "User poll created successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {
          data: response,
        },
      });
    } else {
      throw new Error(response);
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
};

const updateUserPoll = async (req, res) => {
  try {
    let data = req.body;
    const requiredFields = [
      "poll_id",
      "user_id",
      "poll_submitted",
      "poll_result",
    ];
    const missingFields = requiredFields?.filter((column) => !data[column]);
    if (missingFields?.length > 0) {
      const error = new Error(
        `Missing required fields: ${missingFields.join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }

    const userPollData = await getRecord(
      "SELECT * FROM user_poll WHERE poll_id=$1 AND user_id=$2",
      [data?.poll_id.trim(), data?.user_id.trim()]
    );
    if (!userPollData?.length) {
      const error = new Error("User poll not found");
      error.statusCode = 404;
      throw error;
    }

    // Calculate the time difference between now and the time poll was created
    const currentDateTime = new Date();
    const pollCreatedTime = new Date(userPollData[0]?.poll_date);
    const timeDiffMinutes = (currentDateTime - pollCreatedTime) / (1000 * 60);

    if (timeDiffMinutes > 15) {
      const message = "You cannot edit the poll after 15 minutes.";
      const error = new Error(message);
      error.statusCode = 403;
      throw error;
    }

    const pollData = await getRecord("SELECT * FROM polls WHERE poll_id=$1", [
      data?.poll_id.trim(),
    ]);
    if (!pollData?.length) {
      const error = new Error("Poll not found");
      error.statusCode = 404;
      throw error;
    }
    if (pollData[0]?.status != "Live") {
      const error = new Error("Poll is not live");
      error.statusCode = 400;
      throw error;
    }
    if (!pollData[0]?.poll_options?.includes(`${data.poll_result}`)) {
      const error = new Error("Your selection does not match the poll options");
      error.statusCode = 400;
      throw error;
    }

    const endTime = new Date(pollData[0]?.end_date);
    if (currentDateTime > endTime) {
      const message = "Poll window has been closed.";
      const error = new Error(message);
      error.statusCode = 403;
      throw error;
    }

    const allowedColumns = [
      "poll_id",
      "user_id",
      "poll_submitted",
      "poll_result",
    ];
    data.poll_date = currentDateTime;
    const response = await updateRecord(
      data.user_id,
      data,
      "user_poll",
      allowedColumns,
      "user_id",
      "poll_id",
      data.poll_id
    );
    if (response?.length > 0) {
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "User poll updated successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {
          data: response,
        },
      });
    } else {
      throw new Error(response);
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
};

const getUserPoll = async (req, res) => {
  try {
    const { poll_id, user_id } = req.query;
    if (!poll_id && !user_id) {
      const error = new Error(`Missing required fields: poll id or user id`);
      error.statusCode = 400;
      throw error;
    }

    const userPollData = await getRecord(
      "SELECT * FROM user_poll WHERE poll_id=$1 AND user_id=$2",
      [poll_id.trim(), user_id.trim()]
    );
    if (!userPollData?.length) {
      const error = new Error("User poll not found");
      error.statusCode = 404;
      throw error;
    }

    if (userPollData?.length > 0) {
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "User poll fetched successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: userPollData || [],
      });
    } else {
      throw new Error(response);
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
};
// Cron job to run every minute
cron.schedule("* * * * *", async () => {
  console.log("Running cron job to update poll statuses");

  try {
    // Update polls to "Closed" if end_date has passed and log updated polls
    const closedResult = await pool.query(`
      UPDATE polls
      SET status = 'Closed'
      WHERE TO_TIMESTAMP(end_date, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') <= NOW()
        AND status = 'Live'
      RETURNING id, status, end_date
    `);
    if (closedResult.rows.length > 0) {
      console.log("Closed polls updated:", closedResult.rows);
    } else {
      console.log("No polls needed to be closed.");
    }

    // Update polls to "Live" if start_date has arrived and end_date hasn't passed, and log updated polls
    const liveResult = await pool.query(`
      UPDATE polls
      SET status = 'Live'
      WHERE TO_TIMESTAMP(start_date, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') <= NOW()
        AND TO_TIMESTAMP(end_date, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') > NOW()
        AND status = 'Draft'
      RETURNING id, status, start_date, end_date
    `);
    if (liveResult.rows.length > 0) {
      console.log("Live polls updated:", liveResult.rows);
    } else {
      console.log("No polls needed to be activated.");
    }

    console.log("Poll statuses updated successfully");
  } catch (err) {
    console.error("Error updating poll statuses:", err);
  }
});

module.exports = {
  createPolls,
  updatePolls,
  getPoll,
  deletePolls,
  listPolls,
  createUserPoll,
  updateUserPoll,
  getUserPoll,
};

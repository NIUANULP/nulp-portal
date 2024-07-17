const {
  createRecord,
  updateRecord,
  getRecord,
  deleteRecord,
  getRecords,
} = require("./dbOperationHelper");
const uuidv1 = require("uuid/v1");
const envHelper = require("../helpers/environmentVariablesHelper.js");
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
      res.status(403).send({
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
    const allowedColumns = [
      "poll_id",
      "title",
      "description",
      "poll_options",
      "poll_type",
      "visibility",
      "start_date",
      "end_date",
      "status",
      "organization",
      "image",
      "is_live_poll_result",
      "created_by",
    ];
    const generatedId = generateUniqueId();
    data.poll_id = generatedId;
    data.created_by = req?.session?.userId;
    const pollOptions = data?.poll_options.map((option) => `"${option}"`);
    data.poll_options = pollOptions;
    const response = await createRecord(data, "polls", allowedColumns);
    if (response?.length > 0) {
      res.send({
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

    if ((body?.start_date || body?.status) && currentDateTime > startDateTime) {
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
      "poll_type",
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

    if (body?.poll_options) {
      body.poll_options = body.poll_options.map((option) => `"${option}"`);
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

    // const isContentCreatorOnly =
    //   req?.session?.roles?.includes("CONTENT_CREATOR") &&
    //   !req?.session?.roles?.includes("SYSTEM_ADMINISTRATION");

    // const userId = isContentCreatorOnly ? req?.session.userId : null;

    const pollData = await getRecord("SELECT * FROM polls WHERE poll_id=$1", [
      poll_id.trim(),
    ]);
    if (!pollData?.length) {
      const error = new Error("Poll not found");
      error.statusCode = 404;
      throw error;
    }

    if (pollData?.length) {
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
          data: pollData[0],
        },
      });
    }

    throw new Error("Fetched failed");
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
    } = req.body.request;
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
      !req?.session?.roles?.includes("SYSTEM_ADMINISTRATION");

    const userId = isContentCreatorOnly ? req?.session?.userId : null;

    let query = "SELECT * FROM polls WHERE 1=1";
    const values = [];

    // Apply filters
    if (userId) {
      values.push(userId);
      query += ` AND created_by = $${values.length}`;
    }
    // Filters
    if (filters.poll_options) {
      values.push(filters.poll_options);
      query += ` AND poll_options @> $${values.length}`;
    }
    if (filters.poll_type) {
      values.push(filters.poll_type);
      query += ` AND poll_type = $${values.length}`;
    }
    if (filters.status) {
      values.push(filters.status);
      query += ` AND status = $${values.length}`;
    }
    if (filters.is_live_poll_result !== undefined) {
      values.push(filters.is_live_poll_result);
      query += ` AND is_live_poll_result = $${values.length}`;
    }
    if (filters.from_date) {
      values.push(filters.from_date);
      query += ` AND start_date >= $${values.length}`;
    }
    if (filters.to_date) {
      values.push(filters.to_date);
      query += ` AND end_date <= $${values.length}`;
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

    const result = await getRecords(query, values);
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
const createUserPoll = (req, res) => {};
const updateUserPoll = (req, res) => {};
module.exports = {
  createPolls,
  updatePolls,
  getPoll,
  deletePolls,
  listPolls,
  createUserPoll,
  updateUserPoll,
};

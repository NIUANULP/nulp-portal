const {
  createRecord,
  updateRecord,
  getRecord,
  deleteRecord,
  getRecords,
} = require("./dbOperationHelper");
const uuidv1 = require("uuid/v1");

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
    if (data?.visibility === "private" && !data?.user_list) {
      const error = new Error("User list not found");
      error.statusCode = 404;
      throw error;
    }

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
    const generatedId = generateUniqueId();
    data.poll_id = generatedId;
    data.created_by = req?.session?.userId;
    data.organization = req?.session?.rootOrgId;
    if (data?.poll_options?.length < 2) {
      const error = new Error(`Poll option should be more than 2`);
      error.statusCode = 400;
      throw error;
    }
    const pollOptions = data?.poll_options.map((option) => `"${option}"`);
    data.poll_options = pollOptions;
    const response = await createRecord(data, "polls", allowedColumns);
    if (response?.length > 0) {
      if (data?.visibility === "private") {
        const userList = data?.user_list;
        userList?.map(async (item) => {
          const data = {
            poll_id: generatedId,
            user_id: item,
          };

          const final = await createRecord(data, "user_invited", [
            "poll_id",
            "user_id",
          ]);
          return final;
        });
      }
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
    body.organization = req?.session?.rootOrgId;
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

    const userId = isContentCreatorOnly ? req?.session?.userId : null;
    const organization = req?.session?.rootOrgId;

    // Base query for polls
    let query = "SELECT * FROM polls WHERE 1=1";
    const values = [];
    const countValues = [];

    // Apply filters for user-specific data
    if (filters.created_by) {
      values.push(filters.created_by);
      query += ` AND created_by = $${values.length}`;
    }
    if (!isSystemAdmin && organization) {
      values.push(organization);
      query += ` AND organization = $${values.length}`;
    }

    // Apply field-specific filters
    if (filters.poll_options) {
      values.push(filters.poll_options);
      query += ` AND poll_options @> $${values.length}`;
    }
    if (filters.visibility) {
      values.push(filters.visibility);
      query += ` AND visibility = $${values.length}`;
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

    // Apply search across all relevant fields
    if (search) {
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      query += ` AND (title ILIKE $${values.length - 3} OR description ILIKE $${
        values.length - 2
      } OR poll_type ILIKE $${values.length - 1} OR created_by::text ILIKE $${
        values.length
      })`;
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
    let countQuery = "SELECT COUNT(*) FROM polls WHERE 1=1";

    // Apply the same filters as above for the count query
    if (filters.created_by) {
      countValues.push(filters.created_by);
      countQuery += ` AND created_by = $${countValues.length}`;
    }
    if (!isSystemAdmin && organization) {
      countValues.push(organization);
      countQuery += ` AND organization = $${countValues.length}`;
    }
    if (filters.poll_options) {
      countValues.push(filters.poll_options);
      countQuery += ` AND poll_options @> $${countValues.length}`;
    }
    if (filters.visibility) {
      countValues.push(filters.visibility);
      countQuery += ` AND visibility =$${countValues.length}`;
    }
    if (filters.poll_type) {
      countValues.push(filters.poll_type);
      countQuery += ` AND poll_type = $${countValues.length}`;
    }
    if (filters.status) {
      countValues.push(filters.status);
      countQuery += ` AND status = $${countValues.length}`;
    }
    if (filters.is_live_poll_result !== undefined) {
      countValues.push(filters.is_live_poll_result);
      countQuery += ` AND is_live_poll_result = $${countValues.length}`;
    }
    if (filters.from_date) {
      countValues.push(filters.from_date);
      countQuery += ` AND start_date >= $${countValues.length}`;
    }
    if (filters.to_date) {
      countValues.push(filters.to_date);
      countQuery += ` AND end_date <= $${countValues.length}`;
    }
    if (search) {
      countValues.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
      countQuery += ` AND (title ILIKE $${
        countValues.length - 3
      } OR description ILIKE $${countValues.length - 2} OR poll_type ILIKE $${
        countValues.length - 1
      } OR created_by::text ILIKE $${countValues.length})`;
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

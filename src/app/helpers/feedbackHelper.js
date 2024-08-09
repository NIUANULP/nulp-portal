const {
  createRecord,
  updateRecord,
  getRecord,
  deleteRecord,
  getRecords,
} = require("./dbOperationHelper");
const uuidv1 = require("uuid/v1");

const createFeedback = async (req, res) => {
  try {
    let data = req.body;

    const allowedColumns = [
      "content_id",
      "user_id",
      "rating",
      "default_feedback",
      "other_feedback",
    ];
    const requiredFields = ["content_id", "user_id"];
    const missingFields = requiredFields?.filter((column) => !data[column]);
    if (missingFields?.length > 0) {
      const error = new Error(
        `Missing required fields: ${missingFields.join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      !data?.default_feedback ||
      data?.default_feedback.filter((option) => option.trim() !== "").length < 1
    ) {
      const error = new Error(`Default feedback option should be at least 1`);
      error.statusCode = 400;
      throw error;
    }

    const feedback = data?.default_feedback.map((option) => `"${option}"`);
    data.default_feedback = feedback;

    const response = await createRecord(data, "feedback", allowedColumns);
    if (response?.length > 0) {
      return res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "Feedback created successfully",
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

const updateFeedback = async (req, res) => {
  try {
    let data = req.body;
    const requiredFields = ["content_id", "user_id"];
    const missingFields = requiredFields?.filter((column) => !data[column]);
    if (missingFields?.length > 0) {
      const error = new Error(
        `Missing required fields: ${missingFields.join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }

    const feedbackData = await getRecord(
      "SELECT * FROM feedback WHERE content_id=$1 AND user_id=$2",
      [data?.content_id.trim(), data?.user_id.trim()]
    );
    if (!feedbackData?.length) {
      const error = new Error("Feedback not found");
      error.statusCode = 404;
      throw error;
    }
    if (data?.default_feedback) {
      if (
        !data?.default_feedback ||
        data?.default_feedback.filter((option) => option.trim() !== "").length <
          1
      ) {
        const error = new Error(`Default feedback option should be at least 1`);
        error.statusCode = 400;
        throw error;
      }

      const feedback = data?.default_feedback.map((option) => `"${option}"`);
      data.default_feedback = feedback;
    }
    const allowedColumns = [
      "content_id",
      "user_id",
      "rating",
      "default_feedback",
      "other_feedback",
    ];
    const response = await updateRecord(
      data.content_id,
      data,
      "feedback",
      allowedColumns,
      "content_id",
      "user_id",
      data.user_id
    );
    if (response?.length > 0) {
      res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "feedback updated successfully",
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
const listFeedback = async (req, res) => {
  try {
    const {
      filters = {},
      search = "",
      sort_by = {},
      offset = 0,
      limit = 10,
    } = req.body.request;

    const { content_id, user_id } = filters;

    // Main query
    let query = `
          SELECT * 
          FROM feedback
          WHERE 1=1
        `;
    const values = [];

    // Apply filters
    if (content_id) {
      values.push(content_id);
      query += ` AND content_id = $${values.length}`;
    }

    if (user_id) {
      values.push(user_id);
      query += ` AND user_id = $${values.length}`;
    }

    // Apply search
    // if (search) {
    //   const searchTerms = search
    //     .split(" ")
    //     .filter((term) => term.trim() !== "");
    //   if (searchTerms.length) {
    //     searchTerms.forEach((term, index) => {
    //       values.push(`%${term}%`);
    //     });
    //     query += `
    //           AND (
    //              other_feedback ILIKE $${values.length - searchTerms.length + 2}
    //             OR content_id ILIKE $${values.length - searchTerms.length + 3}
    //             OR user_id ILIKE $${values.length - searchTerms.length + 4}
    //           )
    //         `;
    //   }
    // }

    // Apply sorting
    const sortClauses = Object.entries(sort_by).map(
      ([key, direction]) => `${key} ${direction.toUpperCase()}`
    );
    if (sortClauses.length) {
      query += ` ORDER BY ${sortClauses.join(", ")}`;
    }

    // Apply pagination
    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(parseInt(limit, 10), parseInt(offset, 10));

    console.log("Main Query:", query);
    console.log("Values:", values);

    // Execute the main query
    const feedbackResult = await getRecords(query, values);
    console.log("Feedback Result:", feedbackResult);

    // Count query
    let countQuery = `
          SELECT COUNT(*) 
          FROM feedback
          WHERE 1=1
        `;
    const countValues = [];

    // Apply filters for count query
    if (content_id) {
      countValues.push(content_id);
      countQuery += ` AND content_id = $${countValues.length}`;
    }

    if (user_id) {
      countValues.push(user_id);
      countQuery += ` AND user_id = $${countValues.length}`;
    }

    // Apply search for count query
    // if (search) {
    //   const searchTerms = search
    //     .split(" ")
    //     .filter((term) => term.trim() !== "");
    //   if (searchTerms.length) {
    //     searchTerms.forEach((term, index) => {
    //       countValues.push(`%${term}%`);
    //     });
    //     countQuery += `
    //           AND (
    //              other_feedback ILIKE $${
    //                countValues.length - searchTerms.length + 2
    //              }
    //             OR content_id ILIKE $${
    //               countValues.length - searchTerms.length + 3
    //             }
    //             OR user_id ILIKE $${countValues.length - searchTerms.length + 4}
    //           )
    //         `;
    //   }
    // }

    console.log("Count Query:", countQuery);
    console.log("Count Values:", countValues);

    // Execute the count query
    const countResult = await getRecords(countQuery, countValues);
    console.log("Count Result:", countResult);
    const totalCount = parseInt(countResult?.rows[0]?.count, 10 || 0);

    return res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "Feedback fetched successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        totalCount,
        data: feedbackResult?.rows || [],
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

module.exports = {
  createFeedback,
  updateFeedback,
  listFeedback,
};

const {
  createRecord,
  updateRecord,
  getRecord,
  deleteRecord,
  getRecords,
} = require("./dbOperationHelper.js");
const uuidv1 = require("uuid/v1");
const cron = require("node-cron");
const { pool } = require("./postgresqlConfig.js");
const envHelper = require("./environmentVariablesHelper.js");
const axios = require("axios");
const crypto = require("crypto");


function generateUniqueId() {
  const currentUnixTime = Date.now(); // Get current Unix timestamp in milliseconds
  const randomSuffix = Math.floor(Math.random() * 1000000); // Generate random number between 0 and 999999

  // Construct the unique id with the format "do_{current_unix_time}{random_number}"
  const uniqueId = `do_${currentUnixTime}${randomSuffix}`;

  return uniqueId;
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

const createLearnathonContent = async (req, res) => {
  try {
    // Role-based authorization (comment if required)
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
          message: "You don't have the privilege to create records",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {},
      });
    }

    let data = req.body;
    const allowedColumns = [
      "learnathon_content_id",
      "user_name",
      "email",
      "mobile_number",
      "category_of_participation",
      "link_to_guidelines",
      "name_of_organisation",
      "name_of_department_group",
      "indicative_theme",
      "title_of_submission",
      "content_id",
      "consent_checkbox",
      "created_by",
      "icon",
      "is_published"
    ];

    const requiredFields = [
      "user_name",
      "email",
      "mobile_number",
      "category_of_participation",
      "name_of_organisation",
      "indicative_theme",
      "title_of_submission",
      "created_by"
    ];

    const missingFields = requiredFields.filter((column) => !data[column]);

    if (missingFields.length > 0) {
      const error = new Error(
        `Missing required fields: ${missingFields.join(", ")}`
      );
      error.statusCode = 400;
      throw error;
    }
    const generatedId = generateUniqueId();
    const encryptedEmail = encrypt(data.email);
    const encryptedMobile = encrypt(data.mobile_number);
    // data.poll_id = generatedId;

    const now = new Date();
    
    const newRecord = {
      learnathon_content_id : generatedId,
      user_name: data.user_name,
      email: encryptedEmail,
      mobile_number: encryptedMobile,
      category_of_participation: data.category_of_participation,
      link_to_guidelines: data.link_to_guidelines || null, 
      name_of_organisation: data.name_of_organisation,
      name_of_department_group: data.name_of_department_group || null, 
      indicative_theme: data.indicative_theme,
      title_of_submission: data.title_of_submission,
      content_id: data.content_id || null, 
      consent_checkbox: data.consent_checkbox || false,
      created_on: now,
      updated_on: now,
      created_by: req?.session?.userId || data.created_by,
      poll_id: null,
      is_published: data.is_published || false,
      icon : data.icon,
      is_published : data.is_published
    };

    const response = await createRecord(newRecord, "learnathon_contents",allowedColumns);

    if (response?.length > 0) {
      return res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "Learnathon content created successfully",
          err: null,
          errmsg: null,
        },
        responseCode: "OK",
        result: {
          data: response,
        },
      });
    } else {
      throw new Error("Error creating learnathon content");
    }
  } catch (error) {
    console.error(error);
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
      responseCode: "ERROR",
      result: {},
    });
  }
};

const listLearnathonContents = async (req, res) => {
  try {
    const {
      filters = {},
      sort_by = {},
      limit = 10,
      offset = 0,
      search = "",
    } = req.body.request;

    const userId = filters.user_id || req?.session?.userId;

    let query = `
      SELECT * 
      FROM learnathon_contents 
      WHERE 1=1
    `;
    let values = []; 

    if (filters.name_of_organisation) {
      values.push(filters.name_of_organisation);
      query += ` AND name_of_organisation ILIKE $${values.length}`;
    }
    if (filters.created_by) {
      values.push(filters.created_by);
      query += ` AND created_by ILIKE $${values.length}`;
    }
    if (filters.content_id) {
      values.push(filters.content_id);
      query += ` AND content_id = $${values.length}`;
    }
    if (filters.name_of_department_group) {
      values.push(filters.name_of_department_group);
      query += ` AND name_of_department_group = $${values.length}`;
    }
    if (filters.category_of_participation) {
      values.push(filters.category_of_participation);
      query += ` AND category_of_participation ILIKE $${values.length}`;
    }
    if (filters.is_published !== undefined) {
      values.push(filters.is_published);
      query += ` AND is_published = $${values.length}`;
    }
    if (filters.from_date) {
      values.push(filters.from_date);
      query += ` AND created_on >= $${values.length}`;
    }
    if (filters.to_date) {
      values.push(filters.to_date);
      query += ` AND created_on <= $${values.length}`;
    }

    if (search) {
      values.push(`%${search}%`);
      query += `
      AND (title_of_submission ILIKE $${values.length} OR content_id ILIKE $${values.length})
    `;
    }

    const sortClauses = [];
    for (const [column, direction] of Object.entries(sort_by)) {
      sortClauses.push(`${column} ${direction.toUpperCase()}`);
    }
    if (sortClauses.length > 0) {
      query += ` ORDER BY ${sortClauses.join(", ")}`;
    }

    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await getRecords(query, values);

    let countQuery = `
      SELECT COUNT(*) 
      FROM learnathon_contents 
      WHERE 1=1
    `;
    let countValues = [];

    if (filters.name_of_organisation) {
      countValues.push(filters.name_of_organisation);
      countQuery += ` AND name_of_organisation ILIKE $${countValues.length}`;
    }
    if (filters.created_by) {
      countValues.push(filters.created_by);
      countQuery += ` AND created_by ILIKE $${countValues.length}`;
    }
    if (filters.content_id) {
      countValues.push(filters.content_id);
      countQuery += ` AND content_id = $${countValues.length}`;
    }
    if (filters.name_of_department_group) {
      countValues.push(filters.name_of_department_group);
      countQuery += ` AND name_of_department_group = $${countValues.length}`;
    }
    if (filters.category_of_participation) {
      countValues.push(filters.category_of_participation);
      countQuery += ` AND category_of_participation ILIKE $${countValues.length}`;
    }
    if (filters.is_published !== undefined) {
      countValues.push(filters.is_published);
      countQuery += ` AND is_published = $${countValues.length}`;
    }
    if (filters.from_date) {
      countValues.push(filters.from_date);
      countQuery += ` AND created_on >= $${countValues.length}`;
    }
    if (filters.to_date) {
      countValues.push(filters.to_date);
      countQuery += ` AND created_on <= $${countValues.length}`;
    }
    if (search) {
      countValues.push(`%${search}%`);
      countQuery += `
      AND (title_of_submission ILIKE $${countValues.length} OR content_id ILIKE $${countValues.length})
    `;
    }

    const countResult = await getRecords(countQuery, countValues);
    const totalCount = parseInt(countResult?.rows[0]?.count, 10); 

    return res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "Learnathon contents fetched successfully",
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

const updateLearnathonContent = async (req, res) => {
  try {
    const  content_id  = req.query.id;
    const { session, body } = req;

    if (!content_id) {
      const error = new Error("Content id is missing");
      error.statusCode = 404;
      throw error;
    }

    // Check user roles
    if (
      !session?.roles?.includes("CONTENT_CREATOR") &&
      !session?.roles?.includes("SYSTEM_ADMINISTRATION")
    ) {
      const error = new Error("You don't have privilege to update records");
      error.statusCode = 403;
      throw error;
    }

    // Allowed fields for updating
    const allowedColumns = [
      "title_of_submission",
      "user_name",
      "mobile_number",
      "category_of_participation",
      "isPublished",
      "updated_on",
    ];

    // Set updated by user
    body.updated_by = session?.userId;
    if (body.email) {
      body.email = encrypt(body.email);
    }
    if (body.mobile_number) {
      body.mobile_number = encrypt(body.mobile_number); 
    }

    // Validate update logic here if necessary

    // Call your method to update record
   const response = await updateRecord(
  content_id, // id
  body, // data to update
  "learnathon_contents", // table name
  ["user_name",
      "email",
      "mobile_number",
      "category_of_participation",
      "link_to_guidelines",
      "name_of_organisation",
      "name_of_department_group",
      "indicative_theme",
      "title_of_submission",
      "content_id",
      "consent_checkbox",
      "updated_on",
      "is_published",
      "poll_id",
      "icon"
      ], // allowed columns
  "content_id", // column for the WHERE clause
  "updated_by", // optional second column
  // session.userId // value for the optional second column
);


    if (response?.length) {
      return res.send({
        ts: new Date().toISOString(),
        params: {
          resmsgid: uuidv1(),
          msgid: uuidv1(),
          status: "Content updated successfully",
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

const deleteLearnathonContent = async (req, res) => {
  try {
    const { id } = req.query; // Get the content ID from the query parameters

    // Check if the content ID is provided
    if (!id) {
      const error = new Error("Content ID is missing");
      error.statusCode = 404;
      throw error;
    }

    // Check user privileges
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

    let contentData= await deleteRecord(
        "DELETE FROM learnathon_contents WHERE content_id=$1",
        [id.trim()]
      );
    // if (isContentCreatorOnly) {
    //   contentData = await deleteRecord(
    //     "DELETE FROM learnathon_contents WHERE content_id=$1 AND created_by=$2",
    //     [id.trim(), userId]
    //   );
    // } else if (req?.session?.roles?.includes("SYSTEM_ADMINISTRATION")) {
    //   contentData = await deleteRecord("DELETE FROM learnathon_contents WHERE content_id=$1", [
    //     id.trim(),
    //   ]);
    // } else {
    //   const error = new Error("Unauthorized");
    //   error.statusCode = 401;
    //   throw error;
    // }

    // Check if the deletion was successful
    if (contentData <= 0) {
      const error = new Error("Unable to delete");
      error.statusCode = 500;
      throw error;
    }

    // Send success response
    return res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "Content deleted successfully",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        data: contentData,
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
  createLearnathonContent,
  listLearnathonContents,
  updateLearnathonContent,
  deleteLearnathonContent,
};
const { pool } = require("../helpers/postgresqlConfig");

// save function
async function createRecord(data, tableName, allowedColumns) {
  try {
    // Check if allowedColumns is provided and is an array
    if (!Array.isArray(allowedColumns)) {
      throw new Error("Invalid allowedColumns parameter.");
    }

    // Filter out extra columns that are not allowed
    const validData = {};
    for (const key of allowedColumns) {
      if (data.hasOwnProperty(key)) {
        validData[key] = data[key];
      }
    }

    const columns = Object.keys(validData).join(", ");
    const values = Object.values(validData);

    const paramPlaceholders = Object.keys(validData)
      .map((_, i) => `$${i + 1}`)
      .join(", "); //Generate placeholders $1,$2...

    const query = `INSERT INTO ${tableName} (${columns}) VALUES (${paramPlaceholders}) RETURNING *`;
    const response = await pool.query(query, values);

    return response.rows;
  } catch (err) {
    if (err?.code === "23505") {
      const errorMessage = `Similar record found.`;
      const error = new Error(errorMessage);
      error.statusCode = 409;
      throw error;
    }
    return `Error saving data: ${err}`;
  }
}

// Get saved data for given id

async function getRecord(query, values) {
  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    return error;
  }
}

// Get all function
async function getRecords(query, values) {
  try {
    const result = await pool.query(query, values);
    return result;
  } catch (error) {
    return error;
  }
}

// Delete saved data for given id

async function deleteRecord(id, tableName) {
  try {
    const query = `DELETE FROM ${tableName} WHERE id = $1`;

    // Execute the delete query
    const result = await pool.query(query, [id]);

    // Check if any rows were affected
    if (result.rowCount === 0) {
      return result.rowCount;
    }
    return result.rowCount;
  } catch (error) {
    throw error;
  }
}

async function updateRecord(id, data, tableName, allowedColumns) {
  try {
    // Check if allowedColumns is provided and is an array
    if (!Array.isArray(allowedColumns)) {
      throw new Error("Invalid allowedColumns parameter.");
    }

    // Filter out extra columns that are not allowed
    const validData = {};
    for (const key of allowedColumns) {
      if (data.hasOwnProperty(key)) {
        validData[key] = data[key];
      }
    }

    const values = Object.values(validData);
    const paramPlaceholders = Object.keys(validData)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(", ");
    // Update data
    const query = `UPDATE ${tableName} SET ${paramPlaceholders} WHERE id = $${
      values.length + 1
    }`;
    values.push(id);
    const response = await pool.query(query, values);

    return response.rowCount;
  } catch (error) {
    if (error?.code === "23505") {
      const errorMessage = `Similar record found.`;
      const error = new Error(errorMessage);
      error.statusCode = 409;
      throw error;
    }
    // Handle the error
    throw error;
  }
}

function getPagination(limit, offset) {
  try {
    // Check if pagination exist
    let query;
    if (limit) {
      limit = limit;
    } else {
      // Setting default limit 20
      limit = 20;
    }
    if (offset) {
      // Adding pagination to query
      query = ` LIMIT ${limit} OFFSET ${parseInt(offset)}`;
    } else {
      // Adding pagination to query
      offset = 0;
      query = ` LIMIT ${limit} OFFSET ${parseInt(offset)}`;
    }
    return query;
  } catch (error) {
    return error;
  }
}

async function updateRecordToReturnData(id, data, tableName, allowedColumns) {
  try {
    // Check if allowedColumns is provided and is an array
    if (!Array.isArray(allowedColumns)) {
      throw new Error("Invalid allowedColumns parameter.");
    }

    // Filter out extra columns that are not allowed
    const validData = {};
    for (const key of allowedColumns) {
      if (data.hasOwnProperty(key)) {
        validData[key] = data[key];
      }
    }

    const values = Object.values(validData);
    const paramPlaceholders = Object.keys(validData)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(", ");
    // Update data
    const query = `UPDATE ${tableName} SET ${paramPlaceholders} WHERE id = $${
      values.length + 1
    }  RETURNING *`;
    values.push(id);
    const response = await pool.query(query, values);

    return response.rows;
  } catch (error) {
    // Handle the error
    throw error;
  }
}

module.exports = {
  createRecord,
  getRecord,
  getRecords,
  deleteRecord,
  updateRecord,
  getPagination,
  updateRecordToReturnData,
};
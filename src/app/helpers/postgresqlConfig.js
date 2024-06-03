const { Pool } = require("pg");
const envHelper = require("../helpers/environmentVariablesHelper.js");
const pool = new Pool({
  user: envHelper.elite_system_db_username,
  host: envHelper.elite_system_db_host,
  database: envHelper.elite_system_db_database,
  password: envHelper.elite_system_db_password,
  port: envHelper.elite_system_db_port,
});

module.exports = {
  pool,
};

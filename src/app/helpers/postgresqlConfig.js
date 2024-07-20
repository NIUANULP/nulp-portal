const { Pool } = require("pg");
const envHelper = require("../helpers/environmentVariablesHelper.js");
const poolConfig = {
  host: envHelper.elite_system_db_host,
  database: envHelper.elite_system_db_database,
  port: envHelper.elite_system_db_port,
};

if (envHelper.elite_system_db_username) {
  poolConfig.user = envHelper.elite_system_db_username;
}
if (envHelper.elite_system_db_password) {
  poolConfig.password = envHelper.elite_system_db_password;
}

const pool = new Pool(poolConfig);

module.exports = {
  pool,
};

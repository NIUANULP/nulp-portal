const { Pool } = require("pg");
const envHelper = require("../helpers/environmentVariablesHelper.js");
const pool = new Pool({
  user: envHelper.learnathon_voting_table_user,
  host: envHelper.learnathon_voting_table_host,
  database: envHelper.learnathon_voting_table_database,
  password: envHelper.Learnathon_voting_table_password,
  port: envHelper.learnathon_voting_table_port,
});

// pool.connect((err, client, done) => {
//   if (err) throw err;
//   console.log("Connected to PostgreSQL database");
//   // Create table if not exists

// });
module.exports = {
  pool,
};

const { Pool } = require("pg");

const pool = new Pool({
  user: "nulp",
  host: "localhost",
  database: "nulp",
  password: "nulp",
  port: 5433,
});

// pool.connect((err, client, done) => {
//   if (err) throw err;
//   console.log("Connected to PostgreSQL database");
//   // Create table if not exists

// });
module.exports = {
  pool,
};

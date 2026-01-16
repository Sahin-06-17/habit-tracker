const mysql = require('mysql2'); // or mysql2/promise
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // 👇 ADD THIS SSL BLOCK FOR CLOUD DBs
    ssl: {
        rejectUnauthorized: true
    }
});

module.exports = pool.promise();
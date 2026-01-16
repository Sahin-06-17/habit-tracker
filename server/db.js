require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // 👇 THIS IS THE MAGIC FIX FOR CLOUD DATABASES
    ssl: {
        rejectUnauthorized: true
    }
});

pool.on('error', (err) => {
    console.error('Database Error:', err);
});

module.exports = pool.promise();
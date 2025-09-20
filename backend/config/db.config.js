const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'kunal@9420',
    database: 'e-commerce',
});

db.getConnection()
    .then(() => console.log('Database connected successfully (from db.config.js)!'))
    .catch(err => console.error('Database connection failed:', err));

module.exports = db;



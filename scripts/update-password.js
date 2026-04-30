const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  /*password123*/
  await conn.query('UPDATE usuario SET password_hash = ? WHERE identificador = ?', [
    '$2a$10$CBar31hSxYGe/KB0WiIDmOQ5q8jP.z0BOtxKbKaetyciXrUauBpLG',
    '2026630151'
  ]);
  console.log('Password updated successfully.');
  await conn.end();
}

run().catch(console.error);

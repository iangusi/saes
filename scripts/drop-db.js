const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

async function reset() {
  console.log('Connecting to MySQL to drop saes2 database...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });

  await conn.query('DROP DATABASE IF EXISTS saes2;');
  console.log('Database saes2 dropped successfully.');
  await conn.end();
}

reset().catch(console.error);

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  const seedDir = path.join(__dirname, '../database/seeders');
  const files = fs.readdirSync(seedDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log(`Ejecutando seeder: ${file}`);
    const sql = fs.readFileSync(path.join(seedDir, file), 'utf-8');
    await conn.query(sql);
  }

  console.log('Seeders aplicados correctamente');
  await conn.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

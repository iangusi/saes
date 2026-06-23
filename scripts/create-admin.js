/**
 * Script para crear un usuario administrador en la base de datos.
 *
 * Uso:
 *   node scripts/create-admin.js
 *   node scripts/create-admin.js --id ADMIN001 --nombre Juan --apellido Perez --correo admin@escom.ipn.mx --password MiClave123
 *
 * Si no se pasan argumentos, usa los valores por defecto definidos abajo.
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

// ─── Valores por defecto ──────────────────────────────────────────────────────
const DEFAULTS = {
  identificador: 'ADMIN001',
  nombre: 'Administrador',
  apellido_paterno: 'SAES',
  apellido_materno: null,
  correo: 'admin@escom.ipn.mx',
  password: 'Admin2026!',
};

// ─── Parseo de argumentos CLI ─────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const val = args[i + 1];
    if (key && val) result[key] = val;
  }
  return result;
}

async function run() {
  const cli = parseArgs();

  const identificador  = cli.id        ?? DEFAULTS.identificador;
  const nombre         = cli.nombre    ?? DEFAULTS.nombre;
  const apellido       = cli.apellido  ?? DEFAULTS.apellido_paterno;
  const correo         = cli.correo    ?? DEFAULTS.correo;
  const password       = cli.password  ?? DEFAULTS.password;

  console.log('\n=== Crear usuario administrador ===');
  console.log(`  Identificador : ${identificador}`);
  console.log(`  Nombre        : ${nombre} ${apellido}`);
  console.log(`  Correo        : ${correo}`);
  console.log(`  Contraseña    : ${password}`);
  console.log('');

  const conn = await mysql.createConnection({
    host    : process.env.DB_HOST     ?? 'localhost',
    port    : parseInt(process.env.DB_PORT ?? '3306'),
    user    : process.env.DB_USER     ?? 'root',
    password: process.env.DB_PASS     ?? '',
    database: process.env.DB_NAME     ?? 'saes2',
  });

  try {
    // Generar hash de contraseña
    const hash = await bcrypt.hash(password, 10);

    // Verificar si ya existe el identificador
    const [existing] = await conn.query(
      'SELECT id_usuario FROM usuario WHERE identificador = ?',
      [identificador]
    );

    let idUsuario;

    if (existing.length > 0) {
      // Usuario existe: actualizar contraseña
      idUsuario = existing[0].id_usuario;
      console.log(`⚠ Usuario "${identificador}" ya existe. Actualizando contraseña...`);
      
      await conn.query(
        'UPDATE usuario SET password_hash = ?, activo = 1 WHERE id_usuario = ?',
        [hash, idUsuario]
      );
      
      console.log(`✓ Contraseña actualizada.`);
    } else {
      // Usuario no existe: crear uno nuevo
      const [result] = await conn.query(
        `INSERT INTO usuario (identificador, nombre, apellido_paterno, apellido_materno, correo_contacto, password_hash, activo)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [identificador, nombre, apellido, DEFAULTS.apellido_materno, correo, hash]
      );

      idUsuario = result.insertId;
      console.log(`✓ Usuario creado.`);
    }

    // Asignar rol admin si no lo tiene (id_rol = 1)
    const [hasRole] = await conn.query(
      'SELECT id_usuario FROM usuario_rol WHERE id_usuario = ? AND id_rol = 1',
      [idUsuario]
    );

    if (hasRole.length === 0) {
      await conn.query(
        'INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, 1)',
        [idUsuario]
      );
      console.log(`✓ Rol administrador asignado.`);
    }

    console.log(`✓ Usuario administrador listo (id_usuario = ${idUsuario})`);
    console.log('');
    console.log('  Datos de acceso al sistema:');
    console.log(`    Identificador : ${identificador}`);
    console.log(`    Contraseña    : ${password}`);
    console.log('');
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});

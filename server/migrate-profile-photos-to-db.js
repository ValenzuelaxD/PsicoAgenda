require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

function getMimeFromPath(filePath) {
  const ext = path.extname(filePath || '').toLowerCase();
  return MIME_BY_EXT[ext] || null;
}

function resolveLocalFilePath(fotoPerfil) {
  if (!fotoPerfil || typeof fotoPerfil !== 'string') return null;
  if (!fotoPerfil.startsWith('/uploads/')) return null;
  return path.join(__dirname, fotoPerfil.replace(/^\//, ''));
}

async function validateSchema() {
  const result = await db.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
      AND column_name IN ('fotoperfil_data', 'fotoperfil_mime')
    `
  );

  const columns = new Set(result.rows.map((row) => row.column_name));
  return columns.has('fotoperfil_data') && columns.has('fotoperfil_mime');
}

async function main() {
  const deleteFiles = process.argv.includes('--delete-files');

  const schemaOk = await validateSchema();
  if (!schemaOk) {
    console.error('Faltan columnas fotoperfil_data/fotoperfil_mime en usuarios. Ejecuta la migracion SQL primero.');
    process.exit(1);
  }

  const usersResult = await db.query(
    `
    SELECT usuarioid, fotoperfil
    FROM usuarios
    WHERE fotoperfil IS NOT NULL
      AND fotoperfil <> ''
      AND fotoperfil_data IS NULL
    ORDER BY usuarioid
    `
  );

  const users = usersResult.rows;
  if (users.length === 0) {
    console.log('No hay fotos pendientes por migrar.');
    process.exit(0);
  }

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    const localFilePath = resolveLocalFilePath(user.fotoperfil);
    if (!localFilePath) {
      skipped += 1;
      console.warn(`Usuario ${user.usuarioid}: fotoperfil no es ruta local, se omite.`);
      continue;
    }

    if (!fs.existsSync(localFilePath)) {
      skipped += 1;
      console.warn(`Usuario ${user.usuarioid}: archivo no existe (${localFilePath}), se omite.`);
      continue;
    }

    const mimeType = getMimeFromPath(localFilePath);
    if (!mimeType) {
      skipped += 1;
      console.warn(`Usuario ${user.usuarioid}: extension no soportada (${localFilePath}), se omite.`);
      continue;
    }

    const buffer = fs.readFileSync(localFilePath);

    await db.query(
      `
      UPDATE usuarios
      SET fotoperfil_data = $1,
          fotoperfil_mime = $2,
          fotoperfil = NULL
      WHERE usuarioid = $3
      `,
      [buffer, mimeType, user.usuarioid]
    );

    if (deleteFiles) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (error) {
        console.warn(`Usuario ${user.usuarioid}: foto migrada, pero no se pudo eliminar archivo local.`);
      }
    }

    migrated += 1;
    console.log(`Usuario ${user.usuarioid}: migrado.`);
  }

  console.log(`Migracion finalizada. Migrados: ${migrated}. Omitidos: ${skipped}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Error en migracion de fotos:', error.message);
  process.exit(1);
});

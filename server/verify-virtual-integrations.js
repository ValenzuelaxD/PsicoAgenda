require('dotenv').config();
const db = require('./db');

async function verifyVirtualIntegrations() {
  try {
    const tablesResult = await db.query(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('citas_virtuales', 'correos_cita')
        ORDER BY table_name
      `
    );

    const indexesResult = await db.query(
      `
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename IN ('citas_virtuales', 'correos_cita')
        ORDER BY tablename, indexname
      `
    );

    console.log('Tablas detectadas:', tablesResult.rows);
    console.log('Indices detectados:', indexesResult.rows);

    const tableNames = new Set(tablesResult.rows.map((r) => r.table_name));
    const ok = tableNames.has('citas_virtuales') && tableNames.has('correos_cita');

    if (!ok) {
      console.error('Faltan tablas de integracion virtual.');
      process.exit(1);
    }

    console.log('Verificacion completada correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error al verificar integraciones virtuales:', error.message);
    process.exit(1);
  }
}

verifyVirtualIntegrations();

require('dotenv').config();
const db = require('./db');

async function migrateAddSesionesCompletadas() {
  try {
    console.log('Verificando si existe la columna sesionescompletadas...');
    
    const columnCheckResult = await db.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'pacientes'
        AND column_name = 'sesionescompletadas'
      `
    );

    if (columnCheckResult.rows.length > 0) {
      console.log('✓ La columna sesionescompletadas ya existe.');
      
      // Actualizar los valores existentes con el conteo correcto
      console.log('Actualizando conteos de sesiones completadas...');
      const result = await db.query(
        `
        UPDATE pacientes p
        SET sesionescompletadas = (
          SELECT COUNT(*)
          FROM citas c
          WHERE c.pacienteid = p.pacienteid
            AND COALESCE(LOWER(TRIM(c.estado)), '') = 'completada'
        )
        `
      );
      console.log(`✓ ${result.rowCount} pacientes actualizados.`);
      process.exit(0);
    }

    console.log('La columna no existe. Creándola...');
    
    // Crear la columna
    await db.query(
      `
      ALTER TABLE pacientes
      ADD COLUMN sesionescompletadas INTEGER DEFAULT 0
      `
    );
    console.log('✓ Columna sesionescompletadas creada.');

    // Poblar con datos existentes
    console.log('Poblando columna con datos de citas completadas...');
    const result = await db.query(
      `
      UPDATE pacientes p
      SET sesionescompletadas = (
        SELECT COUNT(*)
        FROM citas c
        WHERE c.pacienteid = p.pacienteid
          AND COALESCE(LOWER(TRIM(c.estado)), '') = 'completada'
      )
      `
    );
    console.log(`✓ ${result.rowCount} pacientes procesados.`);

    // Verificar algunos pacientes
    console.log('\nVerificando datos de algunos pacientes:');
    const verificacion = await db.query(
      `
      SELECT p.pacienteid, u.nombre, u.apellidopaterno, p.sesionescompletadas, 
             (SELECT COUNT(*) FROM citas c WHERE c.pacienteid = p.pacienteid AND COALESCE(LOWER(TRIM(c.estado)), '') = 'completada') as verificacion
      FROM pacientes p
      JOIN usuarios u ON p.usuarioid = u.usuarioid
      ORDER BY p.sesionescompletadas DESC
      LIMIT 10
      `
    );
    
    console.table(verificacion.rows);

    console.log('\n✓ Migración completada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error en la migración:', error);
    process.exit(1);
  }
}

migrateAddSesionesCompletadas();

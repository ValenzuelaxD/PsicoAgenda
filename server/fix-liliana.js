const { Pool } = require('pg');

// Conectar directamente a Cloud SQL (puede tardar varios segundos)
const pool = new Pool({
  user: 'postgres',
  password: 'psicoagenda',
  host: '136.113.211.224', // IP pública de psicoagenda-db
  port: 5432,
  database: 'psicoagenda',
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
});

(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado a Cloud SQL');

    // 1. Verificar estado de Liliana
    console.log('\n📊 Estado actual de Liliana:');
    const status = await client.query(`
      SELECT 
        p.pacienteid,
        p.usuarioid,
        COUNT(c.citaid) as total_citas,
        COUNT(CASE WHEN c.psicologaid IS NULL THEN 1 END) as citas_sin_psicologa
      FROM pacientes p
      LEFT JOIN citas c ON p.pacienteid = c.pacienteid
      WHERE p.usuarioid = 41
      GROUP BY p.pacienteid, p.usuarioid
    `);
    console.log(status.rows);

    // 2. Mostrar citas problemáticas
    console.log('\n🔍 Citas de Liliana:');
    const citas = await client.query(`
      SELECT 
        c.citaid,
        c.pacienteid,
        c.psicologaid,
        c.fechahora,
        c.estado,
        CASE WHEN ps.psicologaid IS NULL THEN '❌ FALTA PSICOLOGA' ELSE '✅ OK' END as status
      FROM citas c
      LEFT JOIN psicologas ps ON c.psicologaid = ps.psicologaid
      WHERE c.pacienteid = 22
      ORDER BY c.citaid
    `);
    console.log(citas.rows);

    // 3. LIMPIAR y CORREGIR
    console.log('\n🔧 Limpiando datos corruptos...');
    
    // Eliminar citas sin psicóloga
    const deleted = await client.query(`
      DELETE FROM citas 
      WHERE pacienteid = 22 
      AND (psicologaid IS NULL OR psicologaid NOT IN (SELECT psicologaid FROM psicologas))
    `);
    console.log(`✅ Eliminadas ${deleted.rowCount} citas corruptas`);

    // Resetear contador
    const updated = await client.query(`
      UPDATE pacientes SET sesionescompletadas = 0 WHERE usuarioid = 41
    `);
    console.log(`✅ Contador de sesiones reiniciado`);

    // 4. Verificar estado final
    console.log('\n📊 Estado final de Liliana:');
    const final = await client.query(`
      SELECT 
        p.pacienteid,
        p.usuarioid,
        COUNT(c.citaid) as total_citas_actuales,
        COUNT(CASE WHEN c.estado = 'Completada' THEN 1 END) as citas_completadas
      FROM pacientes p
      LEFT JOIN citas c ON p.pacienteid = c.pacienteid
      WHERE p.usuarioid = 41
      GROUP BY p.pacienteid, p.usuarioid
    `);
    console.log(final.rows);

    console.log('\n✅ Corrección completada');

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

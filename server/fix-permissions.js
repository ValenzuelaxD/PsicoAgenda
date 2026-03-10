#!/usr/bin/env node
/**
 * Script para otorgar permisos necesarios al usuario PsicoAgenda
 * Ejecutar como: node fix-permissions.js
 */

const { Pool } = require('pg');

async function fixPermissions() {
  // Conectar como postgres (admin) - sin especificar DB primero
  const adminPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres', // Conectar a DB por defecto primero
    port: 5432,
    // Si postgres tiene contraseña, agrégala aquí:
    password: 'PsicoAgenda' // Cambia esto si tu usuario postgres tiene contraseña
  });

  try {
    console.log('🔐 Conectando como admin (postgres)...');
    
    // Test de conexión
    const result = await adminPool.query('SELECT version()');
    console.log('✅ Conectado como admin');

    // Cambiar a BD psicoagenda
    console.log('\n📝 Otorgando permisos a usuario PsicoAgenda...\n');

    const commands = [
      // Usar la BD correcta
      "\\c psicoagenda",
      
      // Dar permisos en todas las secuencias
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "PsicoAgenda";`,
      
      // Dar permisos en todas las tablas
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "PsicoAgenda";`,
      
      // Dar permisos en secuencias específicas por si acaso
      `GRANT USAGE, SELECT ON SEQUENCE usuarios_usuarioid_seq TO "PsicoAgenda";`,
      `GRANT USAGE, SELECT ON SEQUENCE pacientes_pacienteid_seq TO "PsicoAgenda";`,
      `GRANT USAGE, SELECT ON SEQUENCE psicologas_psicologaid_seq TO "PsicoAgenda";`,
      `GRANT USAGE, SELECT ON SEQUENCE citas_citaid_seq TO "PsicoAgenda";`,
      `GRANT USAGE, SELECT ON SEQUENCE agendas_agendaid_seq TO "PsicoAgenda";`,
      `GRANT USAGE, SELECT ON SEQUENCE historialclinico_historiaid_seq TO "PsicoAgenda";`,
      `GRANT USAGE, SELECT ON SEQUENCE notificaciones_notificacionid_seq TO "PsicoAgenda";`,
      `GRANT USAGE, SELECT ON SEQUENCE solicitudesreagenda_solicitudid_seq TO "PsicoAgenda";`,
    ];

    // Conectar a psicoagenda como admin
    const dbPool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'psicoagenda',
      port: 5432,
    });

    // Ejecutar los comandos
    for (const cmd of commands) {
      if (cmd.startsWith('\\c')) {
        console.log(`  Usando BD: psicoagenda`);
        continue;
      }
      
      try {
        await dbPool.query(cmd);
        console.log(`  ✅ ${cmd.substring(0, 70)}...`);
      } catch (err) {
        // Algunos comandos pueden fallar si la secuencia no existe, es OK
        if (err.message.includes('does not exist')) {
          console.log(`  ⚠️  ${cmd.substring(0, 50)}... (no existe, ignorado)`);
        } else {
          console.log(`  ❌ Error: ${err.message}`);
        }
      }
    }

    // Verificar que los permisos funcionan
    console.log('\n✅ Verificando que los permisos funcionan...\n');
    
    const testPool = new Pool({
      user: 'PsicoAgenda',
      host: 'localhost',
      database: 'psicoagenda',
      port: 5432,
      password: 'PsicoAgenda'
    });

    try {
      // Intentar insertar para verificar que funciona
      const testResult = await testPool.query(
        `INSERT INTO usuarios (nombre, apellidopaterno, correo, contrasenahash, rol, activo) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING usuarioid`,
        ['Test', 'User', 'test@test.com', 'hash123', 'paciente', true]
      );
      
      console.log(`  ✅ Usuario de prueba creado con ID: ${testResult.rows[0].usuarioid}`);
      
      // Limpiar: eliminar el usuario de prueba
      await testPool.query('DELETE FROM usuarios WHERE correo = $1', ['test@test.com']);
      console.log(`  ✅ Usuario de prueba eliminado`);
      
      console.log('\n✅ ¡Todos los permisos están configurados correctamente!\n');
      console.log('Ahora puedes ejecutar: node test-api.js\n');
    } catch (err) {
      console.log(`  ❌ Error al verificar permisos: ${err.message}`);
      console.log('\nPuede ser que aún haya problemas de permisos.');
    }

    await adminPool.end();
    await dbPool.end();
    await testPool.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPosibles soluciones:');
    console.log('1. Verifica que PostgreSQL está ejecutándose');
    console.log('2. Verifica que el usuario "postgres" existe');
    console.log('3. Si postgres tiene contraseña, edita este archivo y agrégala');
    console.log('4. Verifica que la BD "psicoagenda" existe');
  }
}

fixPermissions();

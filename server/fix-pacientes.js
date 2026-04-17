#!/usr/bin/env node
/**
 * Script para arreglar usuarios pacientes sin perfil
 * Ejecutar con: node fix-pacientes.js
 */

require('dotenv').config();
const db = require('./db');

async function fixPacientes() {
  try {
    console.log('\n🔧 Arreglando perfiles de pacientes...\n');

    // 1. Encontrar usuarios sin perfil
    console.log('1️⃣  Buscando usuarios sin perfil de paciente...');
    const sinPerfilResult = await db.query(`
      SELECT u.usuarioid, u.nombre, u.apellidopaterno
      FROM usuarios u
      WHERE u.rol = 'paciente' AND u.usuarioid NOT IN (SELECT usuarioid FROM pacientes)
    `);

    if (sinPerfilResult.rows.length === 0) {
      console.log('✅ Todos los pacientes ya tienen perfil\n');
      process.exit(0);
    }

    console.log(`⚠️  Encontrados ${sinPerfilResult.rows.length} usuarios sin perfil\n`);

    // 2. Crear perfiles para cada uno
    console.log('2️⃣  Creando perfiles...\n');
    for (const user of sinPerfilResult.rows) {
      try {
        await db.query(
          `INSERT INTO pacientes (usuarioid) VALUES ($1)`,
          [user.usuarioid]
        );
        console.log(`✅ ${user.nombre} ${user.apellidopaterno} (ID: ${user.usuarioid})`);
      } catch (err) {
        console.error(`❌ Error con ${user.nombre}: ${err.message}`);
      }
    }

    console.log('\n✅ ¡Arreglado! Recarga la página y prueba de nuevo.\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPacientes();

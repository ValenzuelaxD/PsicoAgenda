#!/usr/bin/env node
/**
 * Script para diagnosticar problemas con pacientes
 * Ejecutar con: node diagnose-paciente.js
 */

require('dotenv').config();
const db = require('./db');

async function diagnose() {
  try {
    console.log('\n🔍 Diagnosticando configuración de pacientes...\n');

    // 1. Verificar que la BD está conectada
    console.log('1️⃣  Verificando conexión a BD...');
    const connTest = await db.query('SELECT NOW()');
    console.log('✅ BD conectada\n');

    // 2. Contar usuarios con rol paciente
    console.log('2️⃣  Usuarios registrados como paciente:');
    const usuariosResult = await db.query(
      `SELECT usuarioid, nombre, apellidopaterno, correo, rol FROM usuarios WHERE rol = $1`,
      ['paciente']
    );
    console.log(`   Total: ${usuariosResult.rows.length}`);
    usuariosResult.rows.forEach(u => {
      console.log(`   - ${u.nombre} ${u.apellidopaterno} (ID: ${u.usuarioid}, Email: ${u.correo})`);
    });
    console.log('');

    // 3. Contar registros en tabla pacientes
    console.log('3️⃣  Perfiles en tabla pacientes:');
    const pacientesResult = await db.query(`SELECT pacienteid, usuarioid FROM pacientes`);
    console.log(`   Total: ${pacientesResult.rows.length}`);
    pacientesResult.rows.forEach(p => {
      console.log(`   - PacienteID: ${p.pacienteid}, UsuarioID: ${p.usuarioid}`);
    });
    console.log('');

    // 4. Encontrar usuarios sin perfil de paciente
    console.log('4️⃣  Usuarios SIN perfil de paciente (PROBLEMA ⚠️):');
    const sinPerfilResult = await db.query(`
      SELECT u.usuarioid, u.nombre, u.apellidopaterno, u.correo
      FROM usuarios u
      WHERE u.rol = 'paciente' AND u.usuarioid NOT IN (SELECT usuarioid FROM pacientes)
    `);
    
    if (sinPerfilResult.rows.length === 0) {
      console.log('   ✅ Todos los pacientes tienen perfil\n');
    } else {
      console.log(`   ⚠️  ${sinPerfilResult.rows.length} usuarios SIN perfil:`);
      sinPerfilResult.rows.forEach(u => {
        console.log(`      - ${u.nombre} ${u.apellidopaterno} (ID: ${u.usuarioid})`);
      });
      console.log('\n   SOLUCIÓN: Ejecuta esto en la BD para cada usuario:\n');
      sinPerfilResult.rows.forEach(u => {
        console.log(`   INSERT INTO pacientes (usuarioid) VALUES (${u.usuarioid});`);
      });
      console.log('');
    }

    // 5. Verificar citas
    console.log('5️⃣  Total de citas en el sistema: ');
    const citasResult = await db.query(`SELECT COUNT(*) as total FROM citas`);
    console.log(`   ${citasResult.rows[0].total}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

diagnose();

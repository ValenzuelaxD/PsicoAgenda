#!/usr/bin/env node
/**
 * Script para verificar que todo está configurado correctamente
 * Ejecutar con: node verify-setup.js
 */

require('dotenv').config();
const db = require('./db');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

async function log(type, message, details = '') {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  console.log(`${icons[type]} ${message}`);
  if (details) console.log(`   ${details}`);
  
  if (type === 'success') checks.passed++;
  if (type === 'error') checks.failed++;
  if (type === 'warning') checks.warnings++;
}

async function verifyEnvironment() {
  console.log('\n🔍 Verificando Configuración de Entorno...\n');
  
  const envVars = {
    'DB_USER': process.env.DB_USER,
    'DB_HOST': process.env.DB_HOST,
    'DB_DATABASE': process.env.DB_DATABASE,
    'DB_PASSWORD': process.env.DB_PASSWORD,
    'DB_PORT': process.env.DB_PORT,
    'PORT': process.env.PORT || '3001',
    'JWT_SECRET': process.env.JWT_SECRET
  };

  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      const displayValue = key === 'DB_PASSWORD' || key === 'JWT_SECRET' 
        ? '***' + value.substring(value.length - 3)
        : value;
      await log('success', `${key}`, `=${displayValue}`);
    } else {
      await log('error', `${key} no está configurado`);
    }
  }
}

async function verifyDatabaseConnection() {
  console.log('\n🗄️  Verificando Conexión a Base de Datos...\n');
  
  try {
    const result = await db.query('SELECT NOW()');
    await log('success', 'Conexión a PostgreSQL exitosa');
    await log('info', `Hora del servidor: ${result.rows[0].now}`);
  } catch (error) {
    await log('error', 'No se pudo conectar a PostgreSQL', error.message);
    return false;
  }

  // Verificar que DB existe
  try {
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = result.rows.map(r => r.table_name);
    
    if (tables.length === 0) {
      await log('warning', 'No hay tablas en la base de datos');
      await log('info', 'Necesitas ejecutar el esquema de DB.md');
      return false;
    }

    await log('success', `Base de datos tiene ${tables.length} tablas`);
    
    const requiredTables = ['usuarios', 'pacientes', 'psicologas', 'citas', 'agendas', 'historialclinico'];
    for (const table of requiredTables) {
      if (tables.includes(table)) {
        await log('success', `✓ Tabla '${table}' existe`);
      } else {
        await log('error', `✗ Tabla '${table}' NO existe`);
      }
    }

    // Contar usuarios
    try {
      const userResult = await db.query('SELECT COUNT(*) as count FROM usuarios');
      await log('info', `Usuarios en BD: ${userResult.rows[0].count}`);
    } catch (e) {
      // Table doesn't exist, already logged above
    }

  } catch (error) {
    await log('error', 'Error al verificar tablas', error.message);
    return false;
  }

  return true;
}

async function verifyServerSetup() {
  console.log('\n🚀 Verificando Configuración del Servidor...\n');

  try {
    const express = require('express');
    await log('success', 'Express está instalado');
  } catch {
    await log('error', 'Express NO está instalado', 'Ejecuta: npm install');
  }

  try {
    const cors = require('cors');
    await log('success', 'CORS está instalado');
  } catch {
    await log('error', 'CORS NO está instalado', 'Ejecuta: npm install cors');
  }

  try {
    const jwt = require('jsonwebtoken');
    await log('success', 'jsonwebtoken está instalado');
  } catch {
    await log('error', 'jsonwebtoken NO está instalado', 'Ejecuta: npm install jsonwebtoken');
  }

  try {
    const bcrypt = require('bcrypt');
    await log('success', 'bcrypt está instalado');
  } catch {
    await log('error', 'bcrypt NO está instalado', 'Ejecuta: npm install bcrypt');
  }

  try {
    const pg = require('pg');
    await log('success', 'pg (PostgreSQL) está instalado');
  } catch {
    await log('error', 'pg NO está instalado', 'Ejecuta: npm install pg');
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   VERIFICADOR DE CONFIGURACIÓN         ║');
  console.log('║   PsicoAgenda Backend                  ║');
  console.log('╚════════════════════════════════════════╝\n');

  await verifyEnvironment();
  await verifyServerSetup();
  await verifyDatabaseConnection();

  console.log('\n╔════════════════════════════════════════╗');
  console.log(`║   RESULTADOS                           ║`);
  console.log(`║   ✅ Pasadas: ${checks.passed}                      ║`);
  console.log(`║   ❌ Errores: ${checks.failed}                      ║`);
  console.log(`║   ⚠️  Advertencias: ${checks.warnings}                 ║`);
  console.log('╚════════════════════════════════════════╝\n');

  if (checks.failed === 0) {
    console.log('✅ Todo está configurado correctamente. Puedes ejecutar: npm start\n');
    process.exit(0);
  } else {
    console.log('❌ Hay errores que deben corregirse antes de ejecutar el servidor.\n');
    process.exit(1);
  }
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * Script para iniciar Cloud SQL Proxy automáticamente
 * Uso: node start-proxy.js PROJECT:REGION:INSTANCE
 * Ejemplo: node start-proxy.js mi-proyecto:us-central1:psicoagenda
 */

const { spawn } = require('child_process');
const path = require('path');

const instance = process.argv[2];

if (!instance) {
  console.log('\n❌ Error: Debes proporcionar la instancia de Cloud SQL\n');
  console.log('Uso: node start-proxy.js PROJECT:REGION:INSTANCE');
  console.log('Ejemplo: node start-proxy.js mi-proyecto:us-central1:psicoagenda\n');
  process.exit(1);
}

console.log('\n🚀 Iniciando Cloud SQL Proxy...\n');
console.log(`   Instancia: ${instance}`);
console.log(`   Puerto: 5433\n`);

const proxy = spawn('cloud_sql_proxy', [
  `-instances=${instance}=tcp:5433`
], {
  stdio: 'inherit',
  shell: true
});

proxy.on('error', (err) => {
  console.error('\n❌ Error al iniciar Cloud SQL Proxy:', err.message);
  console.log('\n💡 ¿No tienes Cloud SQL Proxy instalado?');
  console.log('   Descárgalo desde: https://cloud.google.com/sql/docs/postgres/sql-proxy\n');
  process.exit(1);
});

proxy.on('exit', (code) => {
  console.log('\n⚠️  Cloud SQL Proxy se cerró con código:', code);
  process.exit(code);
});

console.log('\n✅ Cloud SQL Proxy corriendo. Presiona Ctrl+C para detener.\n');

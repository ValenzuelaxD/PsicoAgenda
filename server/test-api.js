#!/usr/bin/env node

/**
 * Script para testear la API sin necesidad de navegador
 * Uso: node test-api.js
 */

const http = require('http');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(type, message) {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    test: '🧪'
  };
  const color = type === 'success' ? colors.green : type === 'error' ? colors.red : type === 'info' ? colors.blue : colors.cyan;
  console.log(`${color}${icons[type] || '•'} ${message}${colors.reset}`);
}

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAPI() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   PRUEBA DE API                        ║');
  console.log('║   PsicoAgenda Backend                  ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // Test 1: Verificar que el servidor está corriendo
    log('info', 'Verificando que el servidor está en línea...');
    const homeTest = await request('GET', '/');
    if (homeTest.status === 200) {
      log('success', `Servidor respondiendo: "${homeTest.body}"`);
    } else {
      log('error', `Servidor respondió con status ${homeTest.status}`);
      return;
    }

    // Test 2: Verificar conexión a BD
    log('info', 'Verificando conexión a base de datos...');
    const dbTest = await request('GET', '/test-db');
    if (dbTest.status === 200 && dbTest.body.success) {
      log('success', `BD conectada: ${dbTest.body.message}`);
    } else {
      log('error', `Error de BD: ${dbTest.body.error || 'desconocido'}`);
      return;
    }

    // Test 3: Prueba de login con credenciales inválidas
    log('info', 'Probando endpoint POST /api/auth/login (credenciales inválidas)...');
    const loginTest = await request('POST', '/api/auth/login', {
      email: 'noexiste@example.com',
      password: 'wrongpass'
    });
    
    if (loginTest.status === 401) {
      log('success', `Login rechazado correctamente: ${loginTest.body.message}`);
    } else if (loginTest.status === 400) {
      log('success', `Validación de input: ${loginTest.body.message}`);
    } else {
      log('error', `Status inesperado: ${loginTest.status}`);
    }

    // Test 4: Prueba de registro
    log('info', 'Probando endpoint POST /api/auth/register...');
    const registerTest = await request('POST', '/api/auth/register', {
      nombre: 'Test User',
      apellidoPaterno: 'Usuario',
      correo: `test${Date.now()}@example.com`,
      password: 'Test1234@',
      rol: 'paciente'
    });

    if (registerTest.status === 201 || registerTest.status === 200) {
      if (registerTest.body.success) {
        log('success', `Registro exitoso: usuario ID ${registerTest.body.user.id}`);
        
        // Test 5: Intentar login con usuario recién creado
        log('info', 'Probando login con usuario recién creado...');
        const loginNewUser = await request('POST', '/api/auth/login', {
          email: registerTest.body.user.correo,
          password: 'Test1234@'
        });

        if (loginNewUser.status === 200 && loginNewUser.body.success && loginNewUser.body.token) {
          log('success', `Login exitoso! Token: ${loginNewUser.body.token.substring(0, 50)}...`);
          
          // Test 6: Usar el token en una ruta protegida
          log('info', 'Probando ruta protegida /api/citas con token...');
          const citasTest = await request('GET', '/api/citas', null);
          
          // Necesita el header Authorization, pero sin él debería dar 401
          const citasOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/citas',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${loginNewUser.body.token}`,
              'Content-Type': 'application/json'
            }
          };

          const citasReq = await new Promise((resolve, reject) => {
            const req = http.request(citasOptions, (res) => {
              let body = '';
              res.on('data', chunk => body += chunk);
              res.on('end', () => {
                try {
                  resolve({
                    status: res.statusCode,
                    body: JSON.parse(body)
                  });
                } catch {
                  resolve({
                    status: res.statusCode,
                    body: body
                  });
                }
              });
            });
            req.on('error', reject);
            req.end();
          });

          if (citasReq.status === 200 || citasReq.status === 404) {
            log('success', `Token validado correctamente (status ${citasReq.status})`);
          } else if (citasReq.status === 401) {
            log('error', `Token no fue validado: ${citasReq.body.message}`);
          }
        } else {
          log('error', `Login falló: ${loginNewUser.body.message}`);
        }
      } else {
        log('error', `Registro falló: ${registerTest.body.message}`);
      }
    } else {
      log('error', `Status de registro inesperado: ${registerTest.status} - ${JSON.stringify(registerTest.body)}`);
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   PRUEBAS COMPLETADAS                  ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    log('error', `Error: ${error.message}`);
    log('info', 'Asegúrate de que el servidor está ejecutándose con: npm start');
  }
}

testAPI();

# 🔧 Troubleshooting: Error 404 y Problemas de Conexión

## ¿Por qué estoy viendo Error 404?

El error 404 significa que el servidor está ejecutándose pero las rutas no se encuentran. Aquí está cómo solucionarlo paso a paso.

---

## 📋 VERIFICACIÓN RÁPIDA

### Paso 1: Verifica que PostgreSQL está ejecutándose

**En Windows** (si usas PostgreSQL instalado localmente):
```powershell
# Abrir Services y buscar "PostgreSQL"
# O ejecutar en PowerShell:
Get-Service | grep -i postgres
```

**Si PostgreSQL no está ejecutándose**:
- Abre "Services" (services.msc)
- Busca "PostgreSQL"
- Click derecho → Start

### Paso 2: Verifica la configuración del servidor

Ejecuta el script de verificación:
```bash
cd server
node verify-setup.js
```

Esto te dirá exactamente qué está fallando.

---

## 🐛 Causas Comunes del Error 404

### Causa 1: Base de Datos No Existe
**Síntoma**: ❌ DB Connection Error

**Solución**:
```sql
-- Conectar a PostgreSQL como admin
createdb -U PsicoAgenda psicoagenda

-- Luego importar el esquema desde DB.md
-- Copiar todo el contenido de BD.md y ejecutarlo en psql
```

### Causa 2: Credenciales Incorrectas en .env
**Síntoma**: ❌ FATAL: password authentication failed

**Solución**:
1. Verifica que el conexión a PostgreSQL es correcta:
   ```bash
   psql -U PsicoAgenda -d psicoagenda -h localhost
   ```
   
2. Si no funciona, verifica las credenciales en `server/.env`:
   ```
   DB_USER=PsicoAgenda
   DB_HOST=localhost
   DB_DATABASE=psicoagenda
   DB_PASSWORD=PsicoAgenda
   DB_PORT=5432
   ```

### Causa 3: Puerto Already in Use
**Síntoma**: `Error: listen EADDRINUSE :::3001`

**Solución**:
```powershell
# Mata el proceso en puerto 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# O usa otro puerto:
# En server/.env:
PORT=3002

# O en archivo .env si no existe
```

### Causa 4: Rutas No Encontradas (404 en /api/auth/*)
**Síntoma**: `404 Not Found` en `/api/auth/login`

**Solución**: Verifica que los archivos existen:
```bash
# Debe existir:
server/routes/api.js          ✓
server/controllers/authController.js  ✓
server/middleware/authMiddleware.js   ✓
```

---

## 🚀 PROCEDIMIENTO COMPLETO DE VERIFICACIÓN

### 1. Verifica todas las dependencias del servidor:
```bash
cd server
npm install
```

### 2. Verifica la configuración:
```bash
node verify-setup.js
```

### 3. Prueba la conexión a BD:
```bash
curl http://localhost:3001/test-db
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "Database connection successful!",
  "time": "2026-03-09T14:23:45.123Z"
}
```

### 4. Inicia el servidor en modo debug:
```bash
npm run dev
```

### 5. Prueba en otra terminal:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 📊 Estado de Rutas Esperadas

| Ruta | Método | Estado | Requiere Token |
|------|--------|--------|---|
| `/` | GET | 200 OK - "PsicoAgenda API is running!" | No |
| `/test-db` | GET | 200 OK - BD info | No |
| `/api/auth/login` | POST | 200 OK - token + user | No |
| `/api/auth/register` | POST | 201 Created - user | No |
| `/api/citas` | GET | 200 OK - citas | ✓ Sí |
| `/api/dashboard/paciente` | GET | 200 OK - dashboard | ✓ Sí |

---

## 🌐 Si Usas Cloud SQL (Google Cloud)

### Problema: No puedo conectar a Cloud SQL
**Solución**:
1. Descarga el certificado SSL de Cloud SQL
2. Actualiza el `.env`:
   ```
   DB_HOST=<IP_PUBLICA_CLOUD_SQL>
   DB_SSLMODE=require
   DB_CA=/path/to/ca.pem
   ```

3. O usa el Cloud SQL Proxy:
   ```bash
   cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432
   ```

---

## 📝 Logs para Debugging

### Ver todos los logs del servidor
```bash
npm run dev  # Ya muestra logs en consola
```

### Logs específicos:
```javascript
// En server.js ya hay:
console.log(`✅ Server is running on port ${PORT}`);
console.log(`📝 Test connection: http://localhost:${PORT}/test-db`);
console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/login`);

// En authController.js hay:
console.log(`Registrando usuario ${rol}: ${usuarioId}`);
console.log(`Paciente creado: ${usuarioId}`);
console.log(`Error en el login:`, error);
```

---

## ✅ Checklist Final Antes de Testear

- [ ] PostgreSQL está ejecutándose (`net start postgresql-x64-15` en Windows)
- [ ] Base de datos `psicoagenda` existe
- [ ] Todas las tablas están creadas
- [ ] `server/.env` tiene credenciales correctas
- [ ] `npm install` ejecutado en carpeta `server/`
- [ ] No hay otros procesos usando puerto 3001
- [ ] Frontend apunta a `http://localhost:3001` (verificar en Autenticar.tsx)
- [ ] `node verify-setup.js` pasa todos los checks
- [ ] `npm start` en server muestra: "✅ Server is running on port 3001"

---

## 📞 Si Aún No Funciona

Proporciona:
1. Salida completa de `node verify-setup.js`
2. Salida completa de `npm start` (todos los mensajes de error)
3. Salida de `curl http://localhost:3001/test-db`
4. Contenido sanitizado de `server/.env` (sin contraseña)
5. Resultado de `psql -U PsicoAgenda -d psicoagenda -c "SELECT COUNT(*) FROM usuarios"`

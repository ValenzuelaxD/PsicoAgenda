# 🧪 Cómo Testear Correctamente los Endpoints POST

## El Problema: "Cannot GET /api/auth/login"

Este error significa que **estás intentando acceder con GET** (navegador) a un endpoint que requiere **POST**.

```
❌ INCORRECTO (navegador):
http://localhost:3001/api/auth/login

✅ CORRECTO (POST):
POST http://localhost:3001/api/auth/login
Con body JSON: {"email":"...", "password":"..."}
```

---

## Opción 1: Script de Prueba Automático (Recomendado)

Ejecuta el script que prueba TODO automáticamente:

```bash
cd server
node test-api.js
```

**Esto probará**:
- ✅ Servidor está corriendo
- ✅ Conexión a BD
- ✅ Endpoint POST `/api/auth/login` (credenciales inválidas)
- ✅ Endpoint POST `/api/auth/register` (crear usuario)
- ✅ Login con usuario recién creado
- ✅ Token validation en rutas protegidas

**Salida esperada**:
```
✅ Servidor respondiendo
✅ BD conectada
✅ Login rechazado correctamente: "Credenciales inválidas"
✅ Registro exitoso: usuario ID 123
✅ Login exitoso! Token: eyJ0eXAiOiJKV1QiLCJhbGc...
✅ Token validado correctamente
```

---

## Opción 2: Usar `curl` en Terminal

### Registrar User (POST)
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellidoPaterno": "Perez",
    "correo": "juan@example.com",
    "password": "Test1234@",
    "rol": "paciente"
  }'
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "Usuario registrado con éxito",
  "user": {
    "id": 1,
    "nombre": "Juan",
    "apellidoPaterno": "Perez",
    "correo": "juan@example.com",
    "rol": "paciente"
  }
}
```

### Login (POST)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "Test1234@"
  }'
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "nombre": "Juan",
    "correo": "juan@example.com",
    "rol": "paciente",
    "activo": true
  }
}
```

### Probar Ruta Protegida (GET con Token)
```bash
# Guarda el token de la respuesta anterior
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

curl -X GET http://localhost:3001/api/citas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Test Rápido de Conexión
```bash
# Verificar servidor está en línea
curl http://localhost:3001/

# Verificar conexión a BD
curl http://localhost:3001/test-db
```

---

## Opción 3: Usar Postman (GUI)

1. Descargar [Postman](https://www.postman.com/downloads/)
2. Crear nueva colección "PsicoAgenda"
3. Agregar request:

**Request 1: Register**
- URL: `POST http://localhost:3001/api/auth/register`
- Headers: `Content-Type: application/json`
- Body (raw):
```json
{
  "nombre": "Juan",
  "apellidoPaterno": "Perez",
  "correo": "juan@example.com",
  "password": "Test1234@",
  "rol": "paciente"
}
```

**Request 2: Login**
- URL: `POST http://localhost:3001/api/auth/login`
- Headers: `Content-Type: application/json`
- Body (raw):
```json
{
  "email": "juan@example.com",
  "password": "Test1234@"
}
```

**Request 3: Citas (Protegida)**
- URL: `GET http://localhost:3001/api/citas`
- Headers: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`

---

## Opción 4: Usar VS Code REST Client

1. Instalar extensión "REST Client"
2. Crear archivo `test.http`:

```http
### Verificar servidor
GET http://localhost:3001/

### Test DB
GET http://localhost:3001/test-db

### Registrar usuario
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "nombre": "Juan",
  "apellidoPaterno": "Perez",
  "correo": "juan@example.com",
  "password": "Test1234@",
  "rol": "paciente"
}

### Login
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "Test1234@"
}
```

3. Hacer click en "Send Request" arriba de cada llamada

---

## Checklist de Prueba

- [ ] Ejecutaste `npm start` en `server/`
- [ ] Servidor muestra: "✅ Server is running on port 3001"
- [ ] Ejecutaste `node test-api.js` Y todas las pruebas pasaron
- [ ] Puedes registrar un usuario
- [ ] Puedes hacer login con ese usuario
- [ ] El token se genera correctamente
- [ ] Las rutas protegidas responden con el token

---

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|---------|
| `Connection refused` | Servidor no está corriendo | Ejecuta `npm start` en `server/` |
| `Cannot GET /api/auth/login` | Intentas GET en endpoint POST | Usa POST, no navegador |
| `Error: ENOTFOUND localhost` | DNS issues | Usa `127.0.0.1` en lugar de `localhost` |
| `400 Bad Request` | Body JSON inválido | Verifica sintaxis JSON, todas las comillas |
| `401 Unauthorized` | Credenciales incorrectas | Verifica email/password exactos |
| `CORS error` | Headers incorrectos en request | Agrega `Content-Type: application/json` |

---

## Debugging

Si ves errores, verifica en el terminal donde corre `npm start`:

```
✅ Success:
POST /api/auth/register 201 - 145ms
POST /api/auth/login 200 - 87ms
GET /api/citas 200 - 234ms

❌ Error Example:
Error en el registro: ReferenceError: ...
```

Copia el error exacto y búscalo en [TROUBLESHOOTING_404.md](TROUBLESHOOTING_404.md)

---

## Próximo Paso

Una vez que `node test-api.js` pase todas las pruebas:

1. Inicia el frontend: `npm run dev`
2. Abre http://localhost:5173
3. Intenta registrarte y loguear desde la interfaz
4. Debería funcionar sin errores

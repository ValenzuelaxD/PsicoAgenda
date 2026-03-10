# Guía de Prueba: Flujo de Autenticación Corregido

## Requisitos Previos

⚠️ **IMPORTANTE**: Antes de testear, verifica que TODO está configurado:

```bash
cd server
node verify-setup.js
```

Si hay errores, ve a [TROUBLESHOOTING_404.md](TROUBLESHOOTING_404.md) para solucionarlos.

**Después de que verify-setup.js pase todos los checks:**
- ✅ PostgreSQL está ejecutándose en localhost:5432
- ✅ Base de datos `psicoagenda` creada con el esquema de BD.md
- ✅ Variables de entorno en `server/.env` configuradas
- ✅ Todas las dependencias instaladas

## Pasos para Testear

### 1. Iniciar el Servidor Backend
```bash
cd server
npm start
```
**Verificar**: Debe ver mensaje `Server is running on port 3001`

### 2. Iniciar el Frontend
```bash
# En otra terminal
npm run dev
```
**Verificar**: Aplicación carga en `localhost:5173`

### 3. Probar Registro de Paciente
1. Ir a la pestaña **"Registrarse"**
2. Seleccionar **"Paciente"** como tipo de usuario
3. Llenar el formulario:
   - **Nombre Completo**: Juan Pérez García
   - **Correo**: juan@example.com
   - **Contraseña**: Test1234@
4. Hacer click en **"Crear Cuenta"**

**Esperado**:
- Toast verde: "¡Registro exitoso!" 
- El correo debe auto-aparecer en la pestaña de Login
- Tab cambia automáticamente a "Iniciar Sesión"
- Sin errores en console

### 4. Probar Login con Nuevo Usuario
1. Verificar que el email está pre-llenado (juan@example.com)
2. Ingrese **Contraseña**: Test1234@
3. Asegurar que tipo de usuario sea **"Paciente"**
4. Hacer click en **"Iniciar Sesión"**

**Esperado**:
- Toast verde: "¡Bienvenido!"
- Pantalla cambia al Dashboard
- Token aparece en localStorage (abrir DevTools → Application → LocalStorage → token)
- Si hay error JSON: revisar console para mensaje específico

### 5. Probar Registro de Psicólogo
1. Volver a la pestaña **"Registrarse"**
2. Seleccionar **"Psicólogo"** como tipo
3. Llenar el formulario:
   - **Nombre Completo**: Dra. María López
   - **Cedula Profesional**: PSI-1234567890
   - **Correo**: dra.maria@example.com
   - **Contraseña**: Test1234@
4. Hacer click en **"Crear Cuenta"**

**Esperado**:
- Toast verde: "¡Registro exitoso!"
- Entrada en tabla `Psicologas` con cédula guardada

### 6. Probar Login de Psicólogo
1. Cambiar tipo a **"Psicólogo"**
2. Ingresar credenciales de dra.maria@example.com
3. Login

**Esperado**:
- Dashboard diferente al de pacientes
- Acceso a funcionalidades de psicólogo

## Validaciones en Base de Datos

### Verificar Usuarios Creados
```sql
SELECT usuarioid, nombre, correo, rol FROM usuarios;
```

### Verificar Pacientes Creados
```sql
SELECT p.pacienteid, u.nombre, u.correo 
FROM pacientes p
JOIN usuarios u ON p.usuarioid = u.usuarioid;
```

### Verificar Psicólogos Creados
```sql
SELECT ps.psicologaid, u.nombre, u.correo, ps.cedulaprofesional
FROM psicologas ps
JOIN usuarios u ON ps.usuarioid = u.usuarioid;
```

## Debugging

### Error: "Unexpected end of JSON input"
1. Abrir DevTools → Network → pestaña "auth/register"
2. Revisar la respuesta (Response tab)
3. Debe ser JSON válido como: `{ "success": true, "message": "...", "user": {...} }`

### Error: "Credenciales inválidas"
1. Verificar que el usuario existe en BD
2. Verificar que la contraseña es correcta
3. Revisar en console.log del servidor lo que devuelve

### Error 401 después de login exitoso
1. Revisar que token está en localStorage
2. Verificar que token no ha expirado (expira en 8 horas)
3. Verificar headers en DevTools → Network → Authorization: Bearer <token>

## Problemas Comunes

### CORS Error
- Verificar que el servidor está en puerto 3001
- Verificar que CORS está habilitado en server.js

### "Usuario ya registrado"
- Limpiar todos los usuarios registrados con ese email en la BD

### Token no se guarda
- Verificar que localStorage.setItem() se ejecuta (breakpoint en Autenticar.tsx línea 65)
- Verificar que navegador tiene localStorage habilitado

### Contraseña incorrecta pero debería ser correcta
- Verificar que bcrypt está hasheando correctamente
- Verificar en console.log si bcrypt.compare retorna true/false

## Checklist Final
- [ ] Registro de paciente funciona
- [ ] Login de paciente funciona
- [ ] Token se guarda en localStorage
- [ ] Dashboard carga sin errores
- [ ] Registro de psicólogo funciona
- [ ] Login de psicólogo funciona
- [ ] No hay errores JSON parsing en console
- [ ] Base de datos tiene usuarios/pacientes/psicologas correctos

## Llamadas API de Referencia

### Register (POST)
```
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "apellidoPaterno": "Pérez",
  "correo": "juan@example.com",
  "password": "Test1234@",
  "rol": "paciente"
}

Response 201:
{
  "success": true,
  "message": "Usuario registrado con éxito",
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "apellidoPaterno": "Pérez",
    "correo": "juan@example.com",
    "rol": "paciente"
  }
}
```

### Login (POST)
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "Test1234@"
}

Response 200:
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "apellidoPaterno": "Pérez",
    "correo": "juan@example.com",
    "rol": "paciente",
    "activo": true
  }
}
```

---

**Última Actualización**: 2024 - Después de agregar mejor manejo de JSON responses
**Issues Resueltos**: Unexpected end of JSON input, Missing headers validation

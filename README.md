
# PsicoAgenda

Sistema de gestión de citas y pacientes para clínicas de psicología.

## 📋 Requisitos Previos

- **Node.js** 18+ y npm
- **PostgreSQL** o acceso a Google Cloud SQL
- Git

## 🚀 Instalación para Desarrollo Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/PsicoAgenda.git
cd PsicoAgenda
```

### 2. Instalar dependencias

```bash
# Dependencias del frontend
npm install

# Dependencias del backend
cd server
npm install
cd ..
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `server/` basándote en `.env.example`:

```bash
# En Windows PowerShell
Copy-Item server\.env.example server\.env

# En Linux/Mac
cp server/.env.example server/.env
```

Edita `server/.env` con tus credenciales reales:

```env
DB_USER=tu_usuario
DB_HOST=localhost  # o tu instancia de Cloud SQL
DB_DATABASE=psicoagenda
DB_PASSWORD=tu_contraseña
DB_PORT=5432
PORT=3001
JWT_SECRET=genera_una_clave_secreta_aqui
```

**Generar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Configurar la base de datos

#### Opción A: PostgreSQL Local

1. Crea la base de datos:
```sql
CREATE DATABASE psicoagenda;
```

2. Ejecuta los scripts de creación de tablas (contacta al administrador para obtener el script SQL completo)

#### Opción B: Google Cloud SQL

1. Obtén las credenciales de conexión del administrador del proyecto
2. Actualiza `DB_HOST` en `.env` con la IP o connection name de Cloud SQL
3. Asegúrate de que tu IP esté en la lista blanca del Cloud SQL

### 5. Ejecutar el proyecto

**Terminal 1 - Backend:**
```bash
cd server
npm start
# El servidor estará en http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# La aplicación estará en http://localhost:5173
```

## 🏗️ Estructura del Proyecto

```
PsicoAgenda/
├── src/                          # Código fuente del frontend (React + TypeScript)
│   ├── components/               # Componentes React
│   │   ├── Autenticar.tsx       # Login/Registro
│   │   ├── Dashboard.tsx        # Panel principal
│   │   ├── AgendarCita.tsx      # Solicitar citas
│   │   ├── MisCitas.tsx         # Ver citas del paciente
│   │   ├── Historial.tsx        # Historial clínico
│   │   └── ...
│   ├── utils/                   # Utilidades
│   │   ├── api.ts               # Configuración de endpoints API
│   │   ├── types.ts             # Interfaces TypeScript
│   │   └── validators.ts        # Validadores de formularios
│   └── styles/                  # Estilos globales
├── server/                       # Backend (Express.js + PostgreSQL)
│   ├── controllers/             # Lógica de negocio
│   │   ├── authController.js    # Autenticación
│   │   ├── citasController.js   # Gestión de citas
│   │   ├── pacientesController.js
│   │   ├── psicologasController.js
│   │   ├── dashboardController.js
│   │   ├── historialClinicoController.js
│   │   └── notificacionesController.js
│   ├── middleware/              # Middleware de autenticación
│   ├── routes/                  # Definición de rutas
│   ├── db.js                    # Configuración de PostgreSQL
│   ├── server.js                # Punto de entrada del servidor
│   ├── .env.example             # Template de variables de entorno
│   └── package.json
├── .gitignore
├── package.json
├── vite.config.ts
└── README.md
```

## 📚 Funcionalidades Principales

### Para Pacientes
- ✅ Registro y autenticación
- ✅ Solicitar citas con psicólogas (presencial/en línea)
- ✅ Ver próximas citas y historial
- ✅ Dashboard con estadísticas personales
- ✅ Notificaciones de citas

### Para Psicólogas (En desarrollo)
- 🚧 Gestión de agenda
- 🚧 Ver pacientes asignados
- 🚧 Actualizar historial clínico
- 🚧 Reportes y estadísticas

## 🔧 Scripts Disponibles

### Frontend
```bash
npm run dev          # Modo desarrollo (Vite)
npm run build        # Compilar para producción
npm run preview      # Vista previa del build
```

### Backend
```bash
cd server
npm start            # Iniciar servidor
npm run dev          # Modo desarrollo con nodemon (si está configurado)
```

## 🌐 Endpoints de API

Base URL: `http://localhost:3001/api`

### Autenticación
- `POST /api/registrar` - Registrar nuevo usuario
- `POST /api/login` - Iniciar sesión

### Pacientes
- `GET /api/dashboard/paciente` - Dashboard del paciente
- `GET /api/psicologas` - Listar psicólogas disponibles
- `GET /api/citas/tipos` - Tipos de modalidad (Presencial/En línea)
- `GET /api/disponibilidad/:psicologaId` - Horarios disponibles
- `POST /api/citas` - Crear nueva cita
- `GET /api/citas` - Obtener citas del paciente
- `GET /api/historialclinico` - Historial clínico del paciente
- `GET /api/notificaciones` - Notificaciones del usuario

## 🔐 Autenticación

El sistema usa JWT (JSON Web Tokens) para autenticación. El token se almacena en `localStorage` y se envía en el header `Authorization: Bearer <token>` en todas las peticiones protegidas.

**Expiración del token:** 8 horas

## 🤝 Workflow de Colaboración

### Ramas
- `main` - Código estable en producción
- `develop` - Desarrollo activo
- `feature/nombre` - Nuevas funcionalidades
- `fix/nombre` - Correcciones de bugs

### Proceso
1. Crea una rama desde `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/mi-funcionalidad
   ```

2. Haz commits descriptivos:
   ```bash
   git add .
   git commit -m "feat: descripción clara del cambio"
   ```

3. Sube tu rama y crea un Pull Request:
   ```bash
   git push origin feature/mi-funcionalidad
   ```

4. Solicita revisión de código antes de hacer merge

### Convenciones de commits
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato/estilo
- `refactor:` - Refactorización de código
- `test:` - Agregar o modificar tests

## 🐛 Solución de Problemas

### El frontend no conecta con el backend
- Verifica que el backend esté corriendo en puerto 3001
- Revisa la consola del navegador para errores de CORS
- Confirma que `API_BASE_URL` en `src/utils/api.ts` apunte a `http://localhost:3001`

### Error de conexión a la base de datos
- Verifica las credenciales en `server/.env`
- Confirma que PostgreSQL esté corriendo
- Si usas Cloud SQL, verifica que tu IP esté autorizada

### Token expirado/no autorizado
- El token JWT expira después de 8 horas
- Cierra sesión y vuelve a iniciar sesión
- Verifica que el `JWT_SECRET` en `.env` sea consistente

## 📞 Contacto y Soporte

Para dudas o problemas, contacta al equipo de desarrollo o abre un issue en GitHub.

## 📝 Licencia

Proyecto privado - Todos los derechos reservados
  
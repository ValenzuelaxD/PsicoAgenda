# 🚀 Guía de Instalación - PsicoAgenda

Esta guía es para miembros del equipo que van a trabajar en el proyecto por primera vez.

## ✅ Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

- **Node.js 18 o superior** - [Descargar aquí](https://nodejs.org/)
- **Git** - [Descargar aquí](https://git-scm.com/)
- **Acceso a la base de datos** - Solicita las credenciales al administrador del proyecto

Para verificar que tienes Node.js instalado:
```powershell
node --version
# Debe mostrar v18.0.0 o superior
```

---

## 📥 Paso 1: Clonar el Repositorio

```powershell
# Clona el proyecto (reemplaza TU_USUARIO con el usuario correcto)
git clone https://github.com/TU_USUARIO/PsicoAgenda.git

# Entra a la carpeta del proyecto
cd PsicoAgenda
```

---

## 📦 Paso 2: Instalar Dependencias

### Frontend (React + Vite)
Desde la **raíz** del proyecto:
```powershell
npm install
```

### Backend (Express + PostgreSQL)
```powershell
cd server
npm install
cd ..
```

⏱️ Este proceso puede tomar 2-3 minutos.

---

## 🔧 Paso 3: Configurar Variables de Entorno

### 3.1 Copiar el archivo de ejemplo
```powershell
Copy-Item server\.env.example server\.env
```

### 3.2 Editar con las credenciales reales

Abre el archivo `server\.env` con cualquier editor de texto (VS Code, Notepad++, etc.) y reemplaza los valores:

```env
# Credenciales de la base de datos
DB_USER=PsicoAgenda
DB_HOST=localhost
DB_DATABASE=psicoagenda
DB_PASSWORD=PsicoAgenda
DB_PORT=5432

# Puerto del servidor backend
PORT=3001

# Clave secreta para JWT (pide esta clave al administrador)
JWT_SECRET=CLAVE_ULTRA_SECRETA_PARA_GENERAR_TOKENS_JWT
```

> ⚠️ **IMPORTANTE**: Nunca subas el archivo `.env` a Git. Ya está protegido en `.gitignore`.

### 3.3 Opciones de base de datos

#### Opción A: Base de datos local (PostgreSQL)
Si tienes PostgreSQL instalado localmente:
- `DB_HOST=localhost`
- Asegúrate de tener creada la base de datos `psicoagenda`

#### Opción B: Google Cloud SQL (Recomendado para el equipo)
Solicita al administrador:
- La IP o connection name de Cloud SQL
- Usuario y contraseña de la base de datos
- Actualiza `DB_HOST` con la IP proporcionada

---

## ▶️ Paso 4: Ejecutar el Proyecto

Necesitarás **DOS terminales abiertas simultáneamente**.

### Terminal 1️⃣ - Backend (Express)

```powershell
cd server
npm start
```

✅ **Salida esperada:**
```
Servidor corriendo en puerto 3001
Conectado a PostgreSQL
```

❌ **Si ves errores de conexión:**
- Verifica las credenciales en `server\.env`
- Asegúrate de que la base de datos esté accesible

### Terminal 2️⃣ - Frontend (Vite)

Abre **otra terminal** y desde la **raíz** del proyecto:

```powershell
npm run dev
```

✅ **Salida esperada:**
```
  VITE v6.3.5  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## 🌐 Paso 5: Abrir en el Navegador

Abre tu navegador y ve a:
```
http://localhost:5173
```

Deberías ver la pantalla de login de PsicoAgenda.

---

## 🧪 Verificar que Todo Funciona

1. **Frontend cargando**: Ves la interfaz de login/registro ✅
2. **Backend respondiendo**: Abre la consola del navegador (F12), no debe haber errores de red ❌ 404
3. **Conexión a BD**: Intenta hacer login o registrar un usuario de prueba

---

## 🐛 Solución de Problemas Comunes

### ❌ Error: "Cannot find module"
**Causa:** No se instalaron las dependencias correctamente.

**Solución:**
```powershell
# En la raíz
npm install

# En server
cd server
npm install
cd ..
```

---

### ❌ Error: "connect ECONNREFUSED localhost:3001"
**Causa:** El backend no está corriendo.

**Solución:**
- Abre una terminal y ejecuta `cd server; npm start`
- Verifica que veas el mensaje "Servidor corriendo en puerto 3001"

---

### ❌ Error: "FATAL: password authentication failed for user"
**Causa:** Las credenciales de la base de datos en `.env` son incorrectas.

**Solución:**
- Verifica que los valores en `server\.env` coincidan con las credenciales reales
- Contacta al administrador para obtener las credenciales correctas
- Si usas Google Cloud SQL, verifica que tu IP esté autorizada

---

### ❌ Error: "Port 3001 is already in use"
**Causa:** Ya hay un proceso usando el puerto 3001.

**Solución en Windows:**
```powershell
# Ver qué proceso está usando el puerto
netstat -ano | Select-String ':3001'

# Matar el proceso (reemplaza PID con el número que viste)
Stop-Process -Id PID -Force

# Volver a ejecutar
npm start
```

---

### ❌ Error 404 al hacer login
**Causa:** El frontend no está apuntando al backend correcto.

**Solución:**
- Verifica que el backend esté corriendo en puerto 3001
- Revisa la consola del navegador (F12) para ver errores específicos
- El archivo `src/utils/api.ts` debe tener `API_BASE_URL` apuntando a `http://localhost:3001`

---

## 🔄 Workflow de Desarrollo

### Actualizar tu código con los cambios del equipo
```powershell
git pull origin main
npm install                # Por si hay nuevas dependencias
cd server
npm install
cd ..
```

### Crear una nueva funcionalidad
```powershell
# Crea una rama desde main
git checkout main
git pull origin main
git checkout -b feature/nombre-de-tu-funcionalidad

# Trabaja en tu código...
# Cuando termines:
git add .
git commit -m "feat: descripción de tu cambio"
git push origin feature/nombre-de-tu-funcionalidad

# Luego crea un Pull Request en GitHub
```

### Estructura del proyecto

```
PsicoAgenda/
├── src/                    # Código del frontend (React)
│   ├── components/         # Componentes de UI
│   ├── utils/              # Utilidades y configuración
│   └── styles/             # Estilos CSS
├── server/                 # Código del backend (Express)
│   ├── controllers/        # Lógica de negocio
│   ├── routes/             # Definición de endpoints
│   ├── middleware/         # Autenticación, etc.
│   └── .env               # ⚠️ NO SUBIR A GIT
└── README.md              # Documentación general
```

---

## 📞 ¿Necesitas Ayuda?

Si después de seguir esta guía sigues teniendo problemas:

1. Revisa la sección de **Solución de Problemas** arriba
2. Consulta el [README.md](README.md) para más detalles técnicos
3. Contacta al administrador del proyecto
4. Abre un issue en GitHub describiendo el problema

---

## 🎯 Siguiente Paso

Una vez que tengas todo funcionando:

1. Lee el [README.md](README.md) para entender la arquitectura del proyecto
2. Explora el código en `src/components/` para familiarizarte con los componentes
3. Revisa los endpoints disponibles en `server/routes/api.js`
4. ¡Empieza a contribuir! 🚀

---

**Fecha de última actualización:** Marzo 2026

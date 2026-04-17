# PASO 1: Instala Cloud SQL Proxy

## Opción A: Mediante gcloud (recomendado, pero requiere permisos de admin)

```powershell
gcloud components install cloud-sql-proxy
```

Si dice que necesitas permisos de admin:
- Abre PowerShell como Administrador
- Ejecuta el comando anterior de nuevo

## Opción B: Descarga manual (sin permisos requeridos)

```powershell
# Descarga cloud-sql-proxy directo desde Google
cd "C:\Users\zas78\OneDrive\Escritorio\Semestre\Semestre VI\IS\PsicoAgenda"

# Descargar versión más nueva
$url = "https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases/download/v2.11.0/cloud-sql-proxy.exe.zip"
$output = "cloud-sql-proxy.zip"

# Si tienes curl disponible:
curl -L -o $output $url
Expand-Archive -Path $output -DestinationPath . -Force
```

# PASO 2: Inicia Cloud SQL Proxy

Una vez instalado, ejecuta en UNA TERMINAL:

```powershell
cloud_sql_proxy -instances=psicoagenda-489800:us-central1:psicoagenda-db=tcp:5433
```

Deverías ver:
```
Listening on 127.0.0.1:5433
```

# PASO 3: Ejecuta el comando de corrección SQL

En OTRA TERMINAL, ejecuta:

```powershell
cd "C:\Users\zas78\OneDrive\Escritorio\Semestre\Semestre VI\IS\PsicoAgenda\server"

# Ejecuta el archivo fix-liliana.js
node fix-liliana.js
```

# PASO 4: Comprueba que "Mis Citas" funciona

1. Abre la aplicación en: http://localhost:3000
2. Inicia sesión como Liliana
3. Ve a "Mis Citas"
4. Las citas deberían cargar sin error

-----

# ALTERNATIVA: Ejecutar SQL manualmente

Si los pasos anteriores no funcionan, ejecuta el script SQL desde Google Cloud Console:

1. Ve a: https://console.cloud.google.com/sql/instances/psicoagenda-db/overview?project=psicoagenda-489800
2. Click en "psicoagenda-db"
3. Click en tab "SQL Editor"
4. Copia y pega el contenido de: FIX_LILIANA_DATA.sql
5. Click en "Run"

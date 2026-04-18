# Flujo de Trabajo del Equipo (Rapido)

Objetivo: clonar, cambiar, push a main y desplegar automatico.

## 1) Primera vez (solo una vez)

```bash
git --version
```
Comentario: verifica que Git este instalado.

```bash
git clone https://github.com/ValenzuelaxD/PsicoAgenda.git
cd PsicoAgenda
```
Comentario: descarga el repositorio y entra al proyecto.

## 2) Flujo diario (siempre)

```bash
git pull origin main
```
Comentario: trae lo ultimo antes de editar.

```bash
git add .
git commit -m "nombreDeSuUsuario: descripcion corta"
git push origin main
```
Comentario: sube tus cambios a main y dispara deploy automatico.

## 3) Verificar despliegue

1. Ir a GitHub Actions.
2. Confirmar en verde:
- build-and-deploy
- deploy-backend

Comentario: si ambos estan en verde, el cambio ya se publico.

## 4) Si el push falla (rejected/fetch first)

```bash
git pull --rebase origin main
git push origin main
```
Comentario: integra cambios remotos y reintenta push.

## 5) URLs de verificacion

- Frontend: https://psicoagenda-489800.web.app
- Backend (salud): https://psicoagenda-api-315439788368.us-central1.run.app/test-db

Comentario: backend debe responder success=true.

## 6) Regla simple de equipo

- Siempre hacer pull antes de empezar.
- Hacer commits pequenos y claros.
- Esperar Actions en verde antes del siguiente cambio grande.

## 6.1) Dependencias (evitar errores de modulo faltante)

Si aparece un error tipo "Cannot find module" o "Failed to resolve import", ejecutar desde la raiz:

```bash
npm run setup
```

Comentario: este comando instala dependencias del frontend y, automaticamente, tambien las del backend en /server.

Verificacion opcional:

```bash
npm run deps:check
```

Regla de commit cuando se agrega/actualiza una dependencia:

- Subir siempre package.json y package-lock.json de la raiz.
- Si la dependencia es del backend, subir tambien server/package.json y server/package-lock.json.

Nota importante: no se versiona node_modules. Cada integrante debe instalar dependencias en su maquina, pero con estos archivos en Git se garantiza que todos instalen exactamente las mismas versiones.

## 7) Configuracion de notificaciones (frontend)

Archivo de referencia: .env.example

Variables disponibles:

- VITE_NOTIF_POLL_DESKTOP_MS=45000
- VITE_NOTIF_POLL_MOBILE_MS=75000
- VITE_NOTIF_TOAST_COOLDOWN_MS=30000
- VITE_APPOINTMENT_WINDOW_PATIENT_DAYS=45
- VITE_APPOINTMENT_WINDOW_PSYCHOLOGIST_DAYS=180
- MAX_BOOKING_DAYS_PACIENTE=45
- MAX_BOOKING_DAYS_PSICOLOGA=180

Recomendacion base:

- Desktop: 45000 ms (45s)
- Mobile: 75000 ms (75s)
- Cooldown de toast: 30000 ms (30s)
- Ventana paciente: 45 dias
- Ventana psicologa: 180 dias

Si necesitas ajustar tiempos en tu entorno local:

1. Copia .env.example como .env.local.
2. Cambia solo estas variables.
3. Reinicia el frontend para aplicar cambios.

Nota: usar tiempos muy cortos aumenta llamadas al backend y puede generar mas consumo en celular.

## 8) Migracion de duracion fija (60 min)

Si hay citas historicas con duraciones distintas a 60 min, usa estos comandos desde /server:

```bash
npm run migrate:duration-60
```

Comentario: ejecuta una vista previa (dry-run) y reporta posibles solapes futuros.

```bash
npm run migrate:duration-60 -- --apply
```

Comentario: aplica la normalizacion de duracion a 60 min en la base de datos.

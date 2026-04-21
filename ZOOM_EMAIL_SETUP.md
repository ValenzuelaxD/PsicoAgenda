# Integracion Zoom + Correo (Hostinger)

Guia operativa para habilitar reuniones virtuales y envio de correos en cada cita en linea.

## 1) Estado del backend (ya implementado)

Se agrego integracion en:
- Creacion de cita en linea: crea/actualiza reunion Zoom y envia correo.
- Actualizacion de cita en linea: sincroniza reunion Zoom y reenvia correo.
- Cancelacion de cita en linea: cancela reunion Zoom y envia correo de cancelacion.

Se agregaron tablas:
- citas_virtuales
- correos_cita

## 2) Dependencias

En la carpeta server ejecutar:

npm install

Dependencias nuevas:
- axios
- nodemailer

## 3) Variables de entorno

Copiar server/.env.example y completar:

- ENABLE_ZOOM_INTEGRATION=true
- ENABLE_EMAIL_INTEGRATION=true
- ZOOM_ACCOUNT_ID
- ZOOM_CLIENT_ID
- ZOOM_CLIENT_SECRET
- ZOOM_USER_ID
- SMTP_HOST=smtp.hostinger.com
- SMTP_PORT=465 (o 587 segun tu cuenta)
- SMTP_SECURE=true (o false si usas 587)
- SMTP_USER=tu_correo@psicoagenda.online
- SMTP_PASS=tu_password
- MAIL_FROM_NAME=PsicoAgenda
- MAIL_FROM_ADDRESS=no-reply@psicoagenda.online
- APP_TIMEZONE=America/Mexico_City

## 4) Migracion SQL

En la carpeta server ejecutar:

npm run migrate:virtual-integrations

Esto crea/actualiza:
- citas_virtuales
- correos_cita
- indices de soporte

## 5) Zoom Server-to-Server OAuth

En Zoom Marketplace:

1. Crear app tipo Server-to-Server OAuth.
2. Copiar Account ID, Client ID, Client Secret.
3. Configurar scopes minimos:
   - meeting:write:meeting
   - meeting:read:meeting
   - user:read:user
4. Definir ZOOM_USER_ID (correo del host o userId valido en Zoom).

## 6) Hostinger correo y entregabilidad

En DNS del dominio psicoagenda.online:

1. SPF activo para Hostinger.
2. DKIM activo para el dominio.
3. DMARC en modo inicial p=none para monitoreo.

Recomendacion: mover a p=quarantine cuando verifiques entrega estable.

## 7) Prueba funcional (end-to-end)

1. Crear cita con modalidad En linea desde la app.
2. Verificar en Zoom que se creo la reunion.
3. Verificar correo en paciente y psicologa.
4. Reagendar cita y confirmar actualizacion de enlace/correo.
5. Cancelar cita y confirmar cancelacion en Zoom/correo.

## 8) Verificacion en base de datos

Consultas utiles:

SELECT * FROM citas_virtuales ORDER BY updated_at DESC LIMIT 20;
SELECT * FROM correos_cita ORDER BY created_at DESC LIMIT 50;

## 9) Rollback rapido

Si necesitas desactivar sin quitar codigo:

- ENABLE_ZOOM_INTEGRATION=false
- ENABLE_EMAIL_INTEGRATION=false

Con eso la API sigue agendando citas sin integraciones externas.

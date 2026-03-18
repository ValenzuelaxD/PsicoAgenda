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

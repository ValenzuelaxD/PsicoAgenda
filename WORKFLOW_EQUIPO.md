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

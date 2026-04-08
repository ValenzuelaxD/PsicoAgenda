# Fix: Sesiones Completadas Se Restaban en Lugar de Sumarse

## Problema Identificado
Los triggers automáticos `tg_sync_sesiones_completadas` en la base de datos estaban **interfiriendo** con la lógica del backend, causando incrementos incorrectos o decrementos en lugar de sumas cuando se completaba una cita.

## Solución Implementada
Se han eliminado los triggers conflictivos. Ahora **solo el backend** maneja el contador de sesiones completadas con lógica simple y predecible:
- ✅ **Incrementa +1** cuando una cita cambia a estado 'Completada'
- ✅ **Decrementa -1** cuando se cancela una cita que estaba 'Completada'

## Pasos para Aplicar el Fix

### 1️⃣ Ejecutar el Script SQL de Limpieza
Ejecuta el siguiente SQL en tu base de datos (Cloud SQL o PostgreSQL):

```sql
-- Eliminar triggers conflictivos
DROP TRIGGER IF EXISTS tr_sync_sesiones_completadas ON Citas;
DROP FUNCTION IF EXISTS tg_sync_sesiones_completadas() CASCADE;
DROP FUNCTION IF EXISTS fn_recalcular_sesiones_completadas(INTEGER) CASCADE;

-- Recalcular sesiones completadas una sola vez (backfill)
UPDATE Pacientes p
SET SesionesCompletadas = COALESCE(src.total, 0)
FROM (
  SELECT c.pacienteid, COUNT(*)::int AS total
  FROM Citas c
  WHERE COALESCE(LOWER(TRIM(c.estado)), '') = 'completada'
  GROUP BY c.pacienteid
) src
WHERE p.pacienteid = src.pacienteid;

UPDATE Pacientes
SET SesionesCompletadas = 0
WHERE SesionesCompletadas IS NULL;
```

**📁 Archivo**: [`cleanup_triggers.sql`](cleanup_triggers.sql)

### 2️⃣ Reiniciar el Servidor Backend
```bash
cd server
npm start
# o si usas nodemon
npm run dev
```

### 3️⃣ Verificar que Funciona Correctamente
Ejecuta este query en la BD para verificar los contadores:
```sql
SELECT 
  p.pacienteid, 
  u.nombre, 
  u.apellidopaterno,
  p.sesionescompletadas,
  (SELECT COUNT(*) FROM citas c 
   WHERE c.pacienteid = p.pacienteid 
   AND COALESCE(LOWER(TRIM(c.estado)), '') = 'completada') as verificacion
FROM pacientes p
JOIN usuarios u ON p.usuarioid = u.usuarioid
ORDER BY p.sesionescompletadas DESC;
```

El valor de `sesionescompletadas` debe coincidir con `verificacion`.

### 4️⃣ Prueba en la Aplicación
1. Abre la aplicación
2. Ve a "Mis Citas" como psicóloga
3. Marca una cita como **Completada** ✓
4. El contador debe **incrementar en 1** (no decrementar)
5. Cancela esa cita completada - el contador debe decrementar en 1

## Cambios Realizados

### Base de Datos (DB.md)
✅ Eliminados triggers automáticos que causaban recálculos  
✅ Columna `SesionesCompletadas` se mantiene para registro persistente  
✅ Se hace un backfill único al migrar para recalcular correctamente  

### Backend (citasController.js)
✅ La lógica ya estaba correcta (incremento/decremento simple)  
✅ Ahora funciona sin interferencias de triggers  

## Archivos Modificados
- `DB.md` - Triggers eliminados, backfill agregado
- `cleanup_triggers.sql` - Script SQL para limpiar la BD
- `SESIONES_COMPLETADAS_FIX.md` - Este documento

## ¿Qué Sucedía Antes?
1. Backend incrementaba +1 correctamente
2. Simultáneamente, el trigger se ejecutaba
3. El trigger recalculaba el TOTAL desde Citas
4. Si había un timing issue o inconsistencia, resultaba en número incorrecto
5. Efecto visible: contador parecía restar en lugar de sumar

## ¿Por Qué Esta Solución Es Mejor?
✅ **Simple**: Una operación por evento (no múltiples triggers)  
✅ **Predecible**: Incremento/decremento directo, sin recálculos  
✅ **Eficiente**: Menos carga en BD (sin triggers innecesarios)  
✅ **Centralizado**: Todo el control en el backend (más fácil de debuggear)  

## Testing Completo
```bash
# Terminal 1: Backend servidor
cd server && npm start

# Terminal 2: Ejecutar pruebas
node server/test-api.js
```

Si todos los tests pasan ✅, entonces el contador está funcionando correctamente.

---

**Estado**: ✅ READY TO DEPLOY  
**Fecha**: 2026-04-08

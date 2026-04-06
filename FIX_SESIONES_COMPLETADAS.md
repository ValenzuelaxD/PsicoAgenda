# Fix: Sesiones Completadas No Se Actualizaban

## Estado Actual
Se ha identificado y corregido el problema donde el contador de sesiones completadas no se actualizaba cuando una cita se marcaba como completada.

## Cambios Realizados

### Backend
1. **citasController.js** - Actualizar estado de cita
   - Ahora incrementa `sesionescompletadas` cuando cambia a "Completada"
   - Decrementa si se cancela una cita completada
   
2. **pacientesController.js** - Obtener lista de pacientes
   - Estandarizó filtros para usar `COALESCE(LOWER(TRIM(estado)), '') = 'completada'`
   - Ahora prefiere usar columna persistente si existe

3. **dashboardController.js** - Dashboard del paciente
   - Estandarizó filtro de estado a 'completada'

### Frontend
- **BuscarPaciente.tsx** - Refrescamiento automático cada 30 segundos
- **BitacoraPaciente.tsx** - Refrescamiento automático cada 30 segundos

## Pasos para Completar el Fix

### 1. Crear la Columna en BD (SI NO EXISTE)
Ejecuta el siguiente script SQL en tu base de datos:

```sql
-- Migración: Agregar y poblar columna sesionescompletadas

-- Agregar la columna si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pacientes'
      AND column_name = 'sesionescompletadas'
  ) THEN
    ALTER TABLE pacientes
    ADD COLUMN sesionescompletadas INTEGER DEFAULT 0;
    RAISE NOTICE 'Columna sesionescompletadas agregada';
  ELSE
    RAISE NOTICE 'La columna sesionescompletadas ya existe';
  END IF;
END $$;

-- Poblar/Actualizar con conteo correcto
UPDATE pacientes p
SET sesionescompletadas = (
  SELECT COUNT(*)
  FROM citas c
  WHERE c.pacienteid = p.pacienteid
    AND COALESCE(LOWER(TRIM(c.estado)), '') = 'completada'
)
WHERE p.pacienteid IN (
  SELECT DISTINCT pacienteid FROM citas
);

-- Verificar resultados
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

### 2. Reiniciar el Servidor
- Detén el servidor si está corriendo
- Reinicia para aplicar cambios

### 3. Prueba
- Marca una cita como Completada
- El contador debe incrementar inmediatamente en la BD
- Los datos refrescarán en pantalla en máximo 30 segundos
- O puedes hacer clic en el botón de refrescr (🔍) para actualizar al instante

## Archivos Modificados
- `server/controllers/citasController.js`
- `server/controllers/pacientesController.js`
- `server/controllers/dashboardController.js`
- `src/components/BuscarPaciente.tsx`
- `src/components/BitacoraPaciente.tsx`
- `server/sql/migrate-add-sesiones-completadas.sql` (nuevo)

## Testing
Para verificar que el fix está funcionando:

1. **BD directamente:**
   ```sql
   SELECT p.pacienteid, u.nombre, p.sesionescompletadas FROM pacientes p 
   JOIN usuarios u ON p.usuarioid = u.usuarioid 
   WHERE u.nombre = 'Liliana';
   ```

2. **API de Pacientes:**
   - GET `/api/pacientes` → Debe mostrar sesionesTotales actualizado

3. **UI:**
   - Buscar Paciente → sesiones completadas deben coincidir con BD
   - Bitácora de Pacientes → sesiones completadas deben coincidir con BD

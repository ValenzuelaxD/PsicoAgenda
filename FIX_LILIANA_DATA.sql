-- =======================
-- FIX LILIANA DATA CORRUPTION
-- =======================
-- Liliana: Usuario ID 41, Paciente ID 22

-- 1. Verificar datos de Liliana
SELECT 
  p.pacienteid,
  p.usuarioid,
  COUNT(c.citaid) as total_citas,
  COUNT(CASE WHEN c.psicologaid IS NULL THEN 1 END) as citas_sin_psicologa
FROM pacientes p
LEFT JOIN citas c ON p.pacienteid = c.pacienteid
WHERE p.usuarioid = 41
GROUP BY p.pacienteid, p.usuarioid;

-- 2. Mostrar todas las citas de Liliana (para identificar problemas)
SELECT 
  c.citaid,
  c.pacienteid,
  c.psicologaid,
  c.fechahora,
  c.estado,
  CASE WHEN ps.psicologaid IS NULL THEN 'FALTA PSICOLOGA' ELSE 'OK' END as status
FROM citas c
LEFT JOIN psicologas ps ON c.psicologaid = ps.psicologaid
WHERE c.pacienteid = 22
ORDER BY c.citaid;

-- 3. LIMPIAR: Eliminar citas con psicologaid NULL o inexistente
DELETE FROM citas 
WHERE pacienteid = 22 
AND (psicologaid IS NULL OR psicologaid NOT IN (SELECT psicologaid FROM psicologas));

-- 4. LIMPIAR: Eliminar historial clinico huérfano
DELETE FROM historialclinico 
WHERE pacienteid = 22
AND citaid NOT IN (SELECT citaid FROM citas WHERE pacienteid = 22);

-- 5. CORREGIR: Resetear contador de sesiones completadas a 0 (se recalculará con triggers)
UPDATE pacientes SET sesionescompletadas = 0 WHERE usuarioid = 41;

-- 6. VERIFICAR: Mostrar estado final de Liliana
SELECT 
  p.pacienteid,
  p.usuarioid,
  p.nombre,
  p.sesionescompletadas,
  COUNT(c.citaid) as total_citas_actuales,
  COUNT(CASE WHEN c.estado = 'Completada' THEN 1 END) as citas_completadas
FROM pacientes p
LEFT JOIN citas c ON p.pacienteid = c.pacienteid
WHERE p.usuarioid = 41
GROUP BY p.pacienteid, p.usuarioid, p.nombre, p.sesionescompletadas;

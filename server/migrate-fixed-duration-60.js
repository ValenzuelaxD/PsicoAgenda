require('dotenv').config();
const db = require('./db');

const FIXED_DURATION_MIN = 60;

const ACTIVE_STATES_WHERE = "COALESCE(LOWER(TRIM(estado)), '') NOT IN ('cancelada', 'cancelado')";

async function getRowsToNormalize() {
  const result = await db.query(
    `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE fechahora >= NOW())::int AS futuras,
        COUNT(*) FILTER (WHERE fechahora < NOW())::int AS pasadas
      FROM citas
      WHERE COALESCE(duracionmin, $1) <> $1
    `,
    [FIXED_DURATION_MIN]
  );

  return result.rows[0] || { total: 0, futuras: 0, pasadas: 0 };
}

async function getPotentialOverlapsWithFixedDuration() {
  const result = await db.query(
    `
      WITH citas_normalizadas AS (
        SELECT
          c.citaid,
          c.psicologaid,
          c.fechahora,
          c.fechahora + make_interval(mins => $1) AS fin_estimado
        FROM citas c
        WHERE ${ACTIVE_STATES_WHERE}
          AND c.fechahora >= NOW()
      )
      SELECT
        a.psicologaid,
        a.citaid AS cita_a,
        a.fechahora AS inicio_a,
        a.fin_estimado AS fin_a,
        b.citaid AS cita_b,
        b.fechahora AS inicio_b,
        b.fin_estimado AS fin_b
      FROM citas_normalizadas a
      JOIN citas_normalizadas b
        ON a.psicologaid = b.psicologaid
       AND a.citaid < b.citaid
       AND a.fechahora < b.fin_estimado
       AND b.fechahora < a.fin_estimado
      ORDER BY a.psicologaid, a.fechahora
      LIMIT 30
    `,
    [FIXED_DURATION_MIN]
  );

  return result.rows;
}

async function applyNormalization() {
  const result = await db.query(
    `
      UPDATE citas
      SET duracionmin = $1,
          fechamodificacion = NOW()
      WHERE COALESCE(duracionmin, $1) <> $1
    `,
    [FIXED_DURATION_MIN]
  );

  return result.rowCount || 0;
}

async function main() {
  const shouldApply = process.argv.includes('--apply');

  console.log('Duration normalization plan');
  console.log(`- Target duration: ${FIXED_DURATION_MIN} minutes`);
  console.log(`- Mode: ${shouldApply ? 'APPLY' : 'DRY-RUN'}`);

  const summary = await getRowsToNormalize();
  console.log('\nRows pending normalization:');
  console.log(`- Total: ${summary.total}`);
  console.log(`- Future: ${summary.futuras}`);
  console.log(`- Past: ${summary.pasadas}`);

  const overlapsBefore = await getPotentialOverlapsWithFixedDuration();
  if (overlapsBefore.length > 0) {
    console.log('\nPotential future overlaps with 60-minute normalization (showing up to 30):');
    overlapsBefore.forEach((row) => {
      console.log(
        `- psicologaid=${row.psicologaid} cita_a=${row.cita_a} (${row.inicio_a} -> ${row.fin_a}) ` +
        `cita_b=${row.cita_b} (${row.inicio_b} -> ${row.fin_b})`
      );
    });
  } else {
    console.log('\nNo potential future overlaps detected with 60-minute normalization.');
  }

  if (!shouldApply) {
    console.log('\nDry-run complete. To apply changes run: node migrate-fixed-duration-60.js --apply');
    process.exit(0);
  }

  await db.query('BEGIN');
  try {
    const updated = await applyNormalization();
    await db.query('COMMIT');

    console.log(`\nNormalization applied. Updated rows: ${updated}`);

    const overlapsAfter = await getPotentialOverlapsWithFixedDuration();
    if (overlapsAfter.length > 0) {
      console.log('\nWarning: potential future overlaps still exist after normalization (showing up to 30).');
      overlapsAfter.forEach((row) => {
        console.log(
          `- psicologaid=${row.psicologaid} cita_a=${row.cita_a} (${row.inicio_a} -> ${row.fin_a}) ` +
          `cita_b=${row.cita_b} (${row.inicio_b} -> ${row.fin_b})`
        );
      });
      console.log('\nReview these appointments manually if needed.');
    } else {
      console.log('\nPost-check passed: no potential future overlaps detected.');
    }

    process.exit(0);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('\nNormalization failed:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Migration error:', error.message);
  process.exit(1);
});

require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('./db');

const API_BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:3001/api';
const SEARCH_DAYS = 21;
const POLL_MAX_ATTEMPTS = 10;
const POLL_DELAY_MS = 1500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const makeToken = ({ userId, email, rol }) => {
  return jwt.sign(
    {
      id: userId,
      email,
      rol,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
};

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const esSlotFuturo = ({ fecha, hora }) => {
  const hhmm = String(hora || '').slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(hhmm)) {
    return false;
  }

  const [hour, minute] = hhmm.split(':').map(Number);
  const slotDate = new Date(`${fecha}T00:00:00`);
  slotDate.setHours(hour, minute, 0, 0);

  return slotDate.getTime() > Date.now();
};

const getPacienteActivo = async () => {
  const result = await db.query(
    `
      SELECT p.pacienteid, p.usuarioid, u.correo
      FROM pacientes p
      JOIN usuarios u ON u.usuarioid = p.usuarioid
      WHERE u.activo = true
      ORDER BY p.pacienteid ASC
      LIMIT 1
    `
  );

  return result.rows[0] || null;
};

const getPsicologas = async () => {
  const result = await db.query(
    `
      SELECT p.psicologaid
      FROM psicologas p
      JOIN usuarios u ON u.usuarioid = p.usuarioid
      WHERE u.activo = true
      ORDER BY p.psicologaid ASC
    `
  );

  return result.rows.map((row) => row.psicologaid);
};

const findFirstAvailableSlot = async ({ token, psicologaIds }) => {
  const headers = { Authorization: `Bearer ${token}` };

  for (let dayOffset = 0; dayOffset < SEARCH_DAYS; dayOffset += 1) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const fecha = toIsoDate(date);

    for (const psicologaId of psicologaIds) {
      try {
        const response = await axios.get(`${API_BASE_URL}/psicologas/${psicologaId}/disponibilidad`, {
          headers,
          params: { fecha },
          timeout: 12000,
        });

        const horarios = (Array.isArray(response.data) ? response.data : []).filter((hora) => esSlotFuturo({ fecha, hora }));
        if (horarios.length > 0) {
          return {
            psicologaId,
            fecha,
            hora: horarios[0],
          };
        }
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        console.log(`[slot] ${fecha} psicologa=${psicologaId} -> ${status || 'ERR'} ${message}`);
      }
    }
  }

  return null;
};

const waitForVirtualRecord = async (citaId) => {
  for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt += 1) {
    const result = await db.query(
      `
        SELECT citaid, zoom_status, integration_attempts, last_error, updated_at
        FROM citas_virtuales
        WHERE citaid = $1
      `,
      [citaId]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    await sleep(POLL_DELAY_MS);
  }

  return null;
};

async function main() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no esta configurado en .env');
    }

    const paciente = await getPacienteActivo();
    if (!paciente) {
      throw new Error('No se encontro un paciente activo para la prueba.');
    }

    const psicologaIds = await getPsicologas();
    if (psicologaIds.length === 0) {
      throw new Error('No se encontraron psicologas activas para la prueba.');
    }

    const tokenPaciente = makeToken({
      userId: paciente.usuarioid,
      email: paciente.correo || `paciente${paciente.usuarioid}@psicoagenda.local`,
      rol: 'paciente',
    });

    const slot = await findFirstAvailableSlot({
      token: tokenPaciente,
      psicologaIds,
    });

    if (!slot) {
      throw new Error('No se encontro un horario disponible en los proximos dias.');
    }

    console.log('Slot seleccionado:', slot);

    const createResponse = await axios.post(
      `${API_BASE_URL}/citas`,
      {
        psicologaId: slot.psicologaId,
        fecha: slot.fecha,
        hora: slot.hora,
        modalidad: 'En linea',
        notas: `Prueba virtual ${new Date().toISOString()}`,
      },
      {
        headers: {
          Authorization: `Bearer ${tokenPaciente}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const citaId = createResponse.data?.citaId;
    if (!citaId) {
      throw new Error('La API no devolvio citaId al crear la cita.');
    }

    console.log('Cita creada:', citaId);

    const virtualRecord = await waitForVirtualRecord(citaId);
    if (!virtualRecord) {
      throw new Error('No se genero registro en citas_virtuales dentro del tiempo esperado.');
    }

    console.log('Registro virtual detectado:', virtualRecord);

    const cancelResponse = await axios.put(
      `${API_BASE_URL}/citas/${citaId}/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${tokenPaciente}`,
        },
        timeout: 15000,
      }
    );

    console.log('Cita cancelada para limpieza:', cancelResponse.data?.citaid || citaId);

    const postCancelRecord = await waitForVirtualRecord(citaId);
    console.log('Registro virtual tras cancelacion:', postCancelRecord);

    console.log('\nPrueba E2E de integracion virtual completada correctamente.');
    process.exit(0);
  } catch (error) {
    const status = error.response?.status;
    const body = error.response?.data;
    console.error('Error en prueba E2E virtual:', status || '', body || error.message);
    process.exit(1);
  }
}

main();

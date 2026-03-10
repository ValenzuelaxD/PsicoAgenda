const db = require('../db');

const getMisNotificaciones = async (req, res) => {
  const usuarioId = req.user.id;

  try {
    const result = await db.query('SELECT notificacionid, tipo, mensaje, leida, fechaenvio FROM notificaciones WHERE usuarioid = $1 ORDER BY fechaenvio DESC', [usuarioId]);
    
    const notificaciones = result.rows.map(n => {
      let titulo = '';
      let tipoFrontend = 'info';

      switch (n.tipo) {
        case 'Confirmacion':
          titulo = 'Cita Confirmada';
          tipoFrontend = 'cita';
          break;
        case 'Cancelacion':
          titulo = 'Cita Cancelada';
          tipoFrontend = 'cita';
          break;
        case 'Reagenda':
          titulo = 'Cita Reagendada';
          tipoFrontend = 'cita';
          break;
        case 'Recordatorio':
          titulo = 'Recordatorio de Cita';
          tipoFrontend = 'recordatorio';
          break;
        case 'Sistema':
          titulo = 'Notificación del Sistema';
          tipoFrontend = 'sistema';
          break;
        default:
          titulo = 'Información';
          tipoFrontend = 'info';
          break;
      }

      return {
        notificacionid: n.notificacionid,
        tipo: tipoFrontend,
        titulo: titulo,
        descripcion: n.mensaje,
        leida: n.leida,
        fechaenvio: n.fechaenvio
      };
    });

    res.json(notificaciones);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const marcarNotificacionComoLeida = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user.id;

  try {
    const result = await db.query(
      'UPDATE notificaciones SET leida = true WHERE notificacionid = $1 AND usuarioid = $2 RETURNING *',
      [id, usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notificación no encontrada o no tienes permiso para modificarla." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al marcar la notificación como leída:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const eliminarNotificacion = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user.id;

  try {
    const result = await db.query('DELETE FROM notificaciones WHERE notificacionid = $1 AND usuarioid = $2', [id, usuarioId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notificación no encontrada o no tienes permiso para eliminarla." });
    }

    res.status(204).send(); // No content
  } catch (error) {
    console.error("Error al eliminar la notificación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

module.exports = { getMisNotificaciones, marcarNotificacionComoLeida, eliminarNotificacion };

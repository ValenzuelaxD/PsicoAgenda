const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all users
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT UsuarioID, Nombre, ApellidoPaterno, ApellidoMaterno, Correo, Telefono, Rol FROM Usuarios');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./db'); // Import the db module
const apiRoutes = require('./routes/api'); // Ajusta la ruta si es necesario

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3001;

// Basic route
app.get('/', (req, res) => {
  res.send('PsicoAgenda API is running!');
});

// Test DB connection
app.get('/test-db', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT NOW()');
    res.json({ 
      success: true,
      message: 'Database connection successful!', 
      time: rows[0].now 
    });
  } catch (err) {
    console.error('DB Connection Error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Database connection failed',
      details: err.message 
    });
  }
});

// API Routes - Todas las rutas de /api vienen de aquí
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    success: false,
    message: 'Error interno del servidor',
    error: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📝 Test connection: http://localhost:${PORT}/test-db`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/login`);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db'); // Import the db module
const apiRoutes = require('./routes/api'); // Ajusta la ruta si es necesario

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3001;

// Verificar conexión a BD al iniciar
let dbConnected = false;

async function verifyDatabaseConnection() {
  try {
    console.log('\n🔍 Verificando conexión a Base de Datos...');
    console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`   Database: ${process.env.DB_DATABASE}`);
    console.log(`   User: ${process.env.DB_USER}`);
    
    const result = await db.query('SELECT NOW()');
    console.log('✅ ¡Conexión exitosa a la Base de Datos!\n');
    dbConnected = true;
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a Base de Datos:', error.message);
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   Si usas Cloud SQL Proxy, ejecuta en otra terminal:');
    console.log('   cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5433\n');
    dbConnected = false;
    return false;
  }
}

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

// Iniciar servidor
async function startServer() {
  // Verificar BD primero
  const connected = await verifyDatabaseConnection();
  
  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`📝 Test connection: http://localhost:${PORT}/test-db`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/login`);
    
    if (!connected) {
      console.log('\n⚠️  ADVERTENCIA: El servidor está corriendo pero sin conexión a BD');
      console.log('   Por favor, asegúrate de que:');
      console.log('   1. Cloud SQL Proxy está corriendo');
      console.log('   2. Las credenciales en .env son correctas\n');
    }
  });
}

startServer();

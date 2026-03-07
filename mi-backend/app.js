const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

// Importar rutes
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const categoriesRoutes = require('./routes/categories');
const coursesRoutes = require('./routes/courses');
const authRoutes = require('./routes/auth');
const draftsRoutes = require('./routes/drafts');

const app = express();

// Middleware
app.use(express.json());

// CORS amb credencials per sessions
app.use(cors({
  origin: 'http://localhost:5173', // URL del frontend Vite
  credentials: true // Permet enviar cookies
}));

// Configuració de sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'clau-super-secreta-canviar-en-produccio',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Protegeix contra XSS
    secure: false, // True només en producció amb HTTPS
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dies
  }
}));

// Rutes
app.use('/auth', authRoutes);            // /auth/login, /auth/register, etc.
app.use('/reports', reportsRoutes);      // /reports/generate-report, /reports/:reportId
app.use('/usuarios', usersRoutes);       // /usuarios, /usuarios/:id
app.use('/userCategories', categoriesRoutes); // /userCategories
app.use('/courses', coursesRoutes);      // /courses
app.use('/drafts', draftsRoutes);        // /drafts/:studentId

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
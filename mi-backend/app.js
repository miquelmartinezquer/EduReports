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
const invitationsRoutes = require('./routes/invitations');

const app = express();
const isProduction = ['prod', 'production'].includes((process.env.NODE_ENV || '').toLowerCase());

if (isProduction) {
    // Necessari quan l'app va darrere d'un reverse proxy (Nginx/Render/Fly, etc.)
    app.set('trust proxy', 1);
}

// Middleware
app.use(express.json());

const allowedOriginsFromEnv = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOriginsSet = new Set(allowedOriginsFromEnv);

const isAllowedOrigin = (origin) => {
    if (allowedOriginsSet.has(origin)) {
        return true;
    }

    // En desenvolupament, mantenim la comoditat de Vite local.
    if (!isProduction) {
        return /^http:\/\/(localhost|127\.0\.0\.1):517\d$/.test(origin);
    }

    return false;
};

const normalizeSameSite = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (['lax', 'strict', 'none'].includes(normalized)) {
        return normalized;
    }
    return isProduction ? 'none' : 'lax';
};

const sessionCookieSecure =
    process.env.SESSION_COOKIE_SECURE !== undefined
        ? String(process.env.SESSION_COOKIE_SECURE).toLowerCase() === 'true'
        : isProduction;

const sessionCookieSameSite = normalizeSameSite(process.env.SESSION_COOKIE_SAMESITE);

// CORS amb credencials per sessions
app.use(cors({
    origin: (origin, callback) => {
        // Permetre peticions sense origin (tools, curl, etc.)
        if (!origin) return callback(null, true);

        if (isAllowedOrigin(origin)) return callback(null, true);

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // Permet enviar cookies
    exposedHeaders: ['Content-Disposition']
}));

// Configuració de sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'clau-super-secreta-canviar-en-produccio',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true, // Protegeix contra XSS
        secure: sessionCookieSecure,
        sameSite: sessionCookieSameSite,
        domain: process.env.SESSION_COOKIE_DOMAIN || undefined,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dies
    }
}));

// Rutes
app.use('/auth', authRoutes); // /auth/login, /auth/register, etc.
app.use('/reports', reportsRoutes); // /reports/generate-report, /reports/:reportId
app.use('/usuarios', usersRoutes); // /usuarios, /usuarios/:id
app.use('/userCategories', categoriesRoutes); // /userCategories
app.use('/courses', coursesRoutes); // /courses
app.use('/drafts', draftsRoutes); // /drafts/:studentId
app.use('/invitations', invitationsRoutes); // /invitations/:userId

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en ${PORT}`);
});
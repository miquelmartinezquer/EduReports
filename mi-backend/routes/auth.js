const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const readModel = require('../services/readModel');
const { query } = require('../services/db');

const isDuplicateEmailError = (error) => {
    return error && (error.code === 'ER_DUP_ENTRY' || error.errno === 1062);
};

// POST /auth/register - Registrar nou usuari
router.post('/register', async(req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Tots els camps són obligatoris' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contrasenya ha de tenir mínim 6 caràcters' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await readModel.getUserByEmail(normalizedEmail);
        if (existingUser) {
            return res.status(400).json({ error: 'Aquest email ja està registrat' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await query(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            [name.trim(), normalizedEmail, passwordHash],
        );

        const rows = await query(
            'SELECT id, name, email, password_hash AS passwordHash, created_at AS createdAt FROM users WHERE id = ? LIMIT 1',
            [result.insertId],
        );

        const newUser = rows[0];

        req.session.userId = newUser.id;
        req.session.userEmail = newUser.email;
        req.session.userName = newUser.name;

        const { passwordHash: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            success: true,
            user: userWithoutPassword,
            message: 'Usuari creat correctament',
        });
    } catch (error) {
        if (isDuplicateEmailError(error)) {
            return res.status(400).json({ error: 'Aquest email ja està registrat' });
        }

        console.error('SQL auth register error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
});

// POST /auth/login - Iniciar sessió
router.post('/login', async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email i contrasenya són obligatoris' });
        }

        const user = await readModel.getUserByEmail(email.toLowerCase().trim());
        if (!user) {
            return res.status(401).json({ error: 'Credencials incorrectes' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credencials incorrectes' });
        }

        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;

        const { passwordHash: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            user: userWithoutPassword,
            message: 'Sessió iniciada correctament',
        });
    } catch (error) {
        console.error('SQL auth login error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
});

// POST /auth/logout - Tancar sessió
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error tancant la sessió' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Sessió tancada correctament' });
    });
});

// GET /auth/me - Obtenir informació de l'usuari actual
router.get('/me', async(req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'No autenticat' });
    }

    try {
        const user = await readModel.getUserById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuari no trobat' });
        }

        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('SQL auth me error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
});

// GET /auth/check - Verificar si hi ha sessió activa
router.get('/check', (req, res) => {
    res.json({
        authenticated: !!req.session.userId,
        userId: req.session.userId || null,
    });
});

module.exports = router;

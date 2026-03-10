const readModel = require('../services/readModel');
const { query } = require('../services/db');

const isDuplicateEmailError = (error) => {
    return error && (error.code === 'ER_DUP_ENTRY' || error.errno === 1062);
};

const getUsers = async(req, res) => {
    try {
        const users = await readModel.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('SQL users GET / error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

const getUserById = async(req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const usuario = await readModel.getUserById(userId);

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const { passwordHash, ...safeUser } = usuario;
        res.json(safeUser);
    } catch (error) {
        console.error('SQL users GET /:id error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

const createUser = async(req, res) => {
    if (!req.body.name || !req.body.email) {
        return res.status(400).json({
            error: 'name i email són requerits',
        });
    }

    try {
        const name = req.body.name.trim();
        const email = req.body.email.toLowerCase().trim();

        const result = await query(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            [name, email, ''],
        );

        const rows = await query(
            'SELECT id, name, email, created_at AS createdAt FROM users WHERE id = ? LIMIT 1',
            [result.insertId],
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        if (isDuplicateEmailError(error)) {
            return res.status(409).json({ mensaje: 'El email ya existe' });
        }

        console.error('SQL users POST / error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

const updateUser = async(req, res) => {
    const userId = parseInt(req.params.id);

    if (Number.isNaN(userId)) {
        return res.status(400).json({ error: 'ID d\'usuari invàlid' });
    }

    try {
        const usuario = await readModel.getUserById(userId);

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const nextName = req.body.name ? req.body.name.trim() : usuario.name;
        const nextEmail = req.body.email ? req.body.email.toLowerCase().trim() : usuario.email;

        await query(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [nextName, nextEmail, userId],
        );

        const rows = await query(
            'SELECT id, name, email, created_at AS createdAt FROM users WHERE id = ? LIMIT 1',
            [userId],
        );

        res.json(rows[0]);
    } catch (error) {
        if (isDuplicateEmailError(error)) {
            return res.status(409).json({ mensaje: 'El email ya existe' });
        }

        console.error('SQL users PUT /:id error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

const deleteUser = async(req, res) => {
    const userId = parseInt(req.params.id);

    if (Number.isNaN(userId)) {
        return res.status(400).json({ error: 'ID d\'usuari invàlid' });
    }

    try {
        const userDeleted = await readModel.getUserById(userId);

        if (!userDeleted) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        await query('DELETE FROM users WHERE id = ?', [userId]);

        const { passwordHash, ...safeUser } = userDeleted;
        res.json({ mensaje: 'Usuario eliminado', usuario: safeUser });
    } catch (error) {
        console.error('SQL users DELETE /:id error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};

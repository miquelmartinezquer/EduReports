const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mockData = require('../data/mockData');

// POST /auth/register - Registrar nou usuari
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validacions
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Tots els camps són obligatoris' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contrasenya ha de tenir mínim 6 caràcters' });
    }

    // Verificar si l'email ja existeix
    const existingUser = mockData.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Aquest email ja està registrat' });
    }

    // Hashear la contrasenya
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear nou usuari
    const newUser = {
      id: mockData.userIdCounter++,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'teacher', // Per defecte professor
      createdAt: new Date().toISOString()
    };

    mockData.users.push(newUser);

    // Crear sessió
    req.session.userId = newUser.id;
    req.session.userEmail = newUser.email;
    req.session.userName = newUser.name;
    req.session.userRole = newUser.role;

    // No retornar el hash de la contrasenya
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      message: 'Usuari creat correctament'
    });
  } catch (error) {
    console.error('Error en registre:', error);
    res.status(500).json({ error: 'Error en el registre' });
  }
});

// POST /auth/login - Iniciar sessió
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validacions
    if (!email || !password) {
      return res.status(400).json({ error: 'Email i contrasenya són obligatoris' });
    }

    // Buscar usuari
    const user = mockData.users.find(u => u.email === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Credencials incorrectes' });
    }

    // Verificar contrasenya
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credencials incorrectes' });
    }

    // Crear sessió
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.name;
    req.session.userRole = user.role;

    // No retornar el hash de la contrasenya
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
      message: 'Sessió iniciada correctament'
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en iniciar sessió' });
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
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autenticat' });
  }

  const user = mockData.users.find(u => u.id === req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuari no trobat' });
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// GET /auth/check - Verificar si hi ha sessió activa
router.get('/check', (req, res) => {
  res.json({ 
    authenticated: !!req.session.userId,
    userId: req.session.userId || null
  });
});

module.exports = router;

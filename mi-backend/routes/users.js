// Rutes d'usuaris
const express = require('express');
const router = express.Router();
const { usuarios } = require('../data/mockData');

// GET /usuarios - Obtenir tots els usuaris
router.get('/', (req, res) => {
  res.json(usuarios);
});

// GET /usuarios/:id - Obtenir un usuari per ID
router.get('/:id', (req, res) => {
  const usuario = usuarios.find(u => u.id === parseInt(req.params.id));
  
  if (!usuario) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  }
  
  res.json(usuario);
});

// POST /usuarios - Crear un nou usuari
router.post('/', (req, res) => {
  if (!req.body.nombre || !req.body.email) {
    return res.status(400).json({ 
      error: 'El nombre y email son requeridos' 
    });
  }

  const nuevoUsuario = {
    id: usuarios.length + 1,
    nombre: req.body.nombre,
    email: req.body.email
  };

  usuarios.push(nuevoUsuario);
  res.status(201).json(nuevoUsuario);
});

// PUT /usuarios/:id - Actualitzar un usuari
router.put('/:id', (req, res) => {
  const usuario = usuarios.find(u => u.id === parseInt(req.params.id));
  
  if (!usuario) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  }

  if (req.body.nombre) usuario.nombre = req.body.nombre;
  if (req.body.email) usuario.email = req.body.email;

  res.json(usuario);
});

// DELETE /usuarios/:id - Eliminar un usuari
router.delete('/:id', (req, res) => {
  const index = usuarios.findIndex(u => u.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  }

  const usuarioEliminado = usuarios.splice(index, 1);
  res.json({ mensaje: 'Usuario eliminado', usuario: usuarioEliminado[0] });
});

module.exports = router;

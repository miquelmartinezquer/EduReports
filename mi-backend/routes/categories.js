// Rutes de categories
const express = require('express');
const router = express.Router();
const mockData = require('../data/mockData');
const requireAuth = require('../middleware/requireAuth');

// Aplicar autenticació a totes les rutes
router.use(requireAuth);

// GET /userCategories - Obtenir categories globals + personalitzades de l'usuari
router.get('/', (req, res) => {
  const userId = req.session.userId;
  
  // Retornar categories globals + personalitzades de l'usuari
  const globalCats = mockData.globalCategories || {};
  const userCats = mockData.userCustomCategories[userId] || {};
  
  // Combinar categories globals i personalitzades
  const allCategories = { ...globalCats, ...userCats };
  
  res.json(allCategories);
});

// GET /userCategories/colors - Obtenir els colors disponibles
router.get('/colors', (req, res) => {
  res.json(mockData.availableColors);
});

// POST /userCategories - Crear una nova categoria personalitzada
router.post('/', (req, res) => {
  const { key, name, color, items } = req.body;
  const userId = req.session.userId;

  if (!key || !name) {
    return res.status(400).json({ error: 'key i name són requerits' });
  }

  // Inicialitzar categories de l'usuari si no existeixen
  if (!mockData.userCustomCategories[userId]) {
    mockData.userCustomCategories[userId] = {};
  }

  // Verificar que no existeixi ja (ni en globals ni en personalitzades)
  if (mockData.globalCategories[key] || mockData.userCustomCategories[userId][key]) {
    return res.status(400).json({ error: 'Aquesta categoria ja existeix' });
  }

  mockData.userCustomCategories[userId][key] = {
    name,
    color: color || 'purple',
    items: items || []
  };

  res.status(201).json({ 
    success: true, 
    category: mockData.userCustomCategories[userId][key],
    key 
  });
});

// PUT /userCategories/:key - Actualitzar una categoria personalitzada
router.put('/:key', (req, res) => {
  const { key } = req.params;
  const { name, color, items } = req.body;
  const userId = req.session.userId;

  // Només es poden modificar categories personalitzades, no les globals
  if (mockData.globalCategories[key]) {
    return res.status(403).json({ error: 'No es poden modificar categories globals' });
  }

  if (!mockData.userCustomCategories[userId] || !mockData.userCustomCategories[userId][key]) {
    return res.status(404).json({ error: 'Categoria no trobada' });
  }

  if (name) mockData.userCustomCategories[userId][key].name = name;
  if (color) mockData.userCustomCategories[userId][key].color = color;
  if (items) mockData.userCustomCategories[userId][key].items = items;

  res.json({ 
    success: true, 
    category: mockData.userCustomCategories[userId][key] 
  });
});

// DELETE /userCategories/:key - Eliminar una categoria personalitzada
router.delete('/:key', (req, res) => {
  const { key } = req.params;
  const userId = req.session.userId;

  // Només es poden eliminar categories personalitzades
  if (mockData.globalCategories[key]) {
    return res.status(403).json({ error: 'No es poden eliminar categories globals' });
  }

  if (!mockData.userCustomCategories[userId] || !mockData.userCustomCategories[userId][key]) {
    return res.status(404).json({ error: 'Categoria no trobada' });
  }

  delete mockData.userCustomCategories[userId][key];
  res.json({ success: true, message: 'Categoria eliminada' });
});

// POST /userCategories/:key/items - Afegir un item a una categoria
router.post('/:key/items', (req, res) => {
  const { key } = req.params;
  const { item } = req.body;
  const userId = req.session.userId;

  if (!item) {
    return res.status(400).json({ error: 'item és requerit' });
  }

  // Verificar si és categoria global o personalitzada
  if (mockData.globalCategories[key]) {
    // No es poden afegir items a categories globals directament
    return res.status(403).json({ 
      error: 'No es poden afegir items a categories globals. Crea una categoria personalitzada.' 
    });
  }

  if (!mockData.userCustomCategories[userId]) {
    mockData.userCustomCategories[userId] = {};
  }

  if (!mockData.userCustomCategories[userId][key]) {
    return res.status(404).json({ error: 'Categoria no trobada' });
  }

  mockData.userCustomCategories[userId][key].items.push(item);
  res.status(201).json({ 
    success: true, 
    items: mockData.userCustomCategories[userId][key].items 
  });
});

// DELETE /userCategories/:key/items/:index - Eliminar un item d'una categoria
router.delete('/:key/items/:index', (req, res) => {
  const { key, index } = req.params;
  const itemIndex = parseInt(index);
  const userId = req.session.userId;

  // Només es poden eliminar items de categories personalitzades
  if (mockData.globalCategories[key]) {
    return res.status(403).json({ error: 'No es poden modificar categories globals' });
  }

  if (!mockData.userCustomCategories[userId] || !mockData.userCustomCategories[userId][key]) {
    return res.status(404).json({ error: 'Categoria no trobada' });
  }

  if (itemIndex < 0 || itemIndex >= mockData.userCustomCategories[userId][key].items.length) {
    return res.status(400).json({ error: 'Index invàlid' });
  }

  mockData.userCustomCategories[userId][key].items.splice(itemIndex, 1);
  res.json({ 
    success: true, 
    items: mockData.userCustomCategories[userId][key].items 
  });
});

module.exports = router;

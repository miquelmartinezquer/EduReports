// Rutes de categories
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const categoriesController = require('../controllers/categories.controller');

// Aplicar autenticació a totes les rutes
router.use(requireAuth);
router.get('/', categoriesController.getUserCategories);
router.get('/colors', categoriesController.getAvailableColors);
router.post('/', categoriesController.createUserCategory);
router.put('/:key', categoriesController.updateUserCategory);
router.delete('/:key', categoriesController.deleteUserCategory);
router.post('/:key/items', categoriesController.addUserCategoryItem);
router.delete('/:key/items/:index', categoriesController.deleteUserCategoryItem);

module.exports = router;

const express = require('express');
const router = express.Router({ mergeParams: true });
const templatesController = require('../controllers/templates.controller');

router.get('/', templatesController.listTemplatesByCourse);
router.get('/:templateId', templatesController.getTemplateById);
router.post('/', templatesController.upsertTemplate);
router.put('/:templateId', templatesController.updateTemplateById);
router.delete('/:templateId', templatesController.deleteTemplateById);

module.exports = router;

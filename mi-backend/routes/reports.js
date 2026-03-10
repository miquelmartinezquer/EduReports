// Rutes per a la generació d'informes
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const reportsController = require('../controllers/reports.controller');

router.post('/generate-report', requireAuth, reportsController.generateReport);
router.get('/:reportId', requireAuth, reportsController.getReport);

module.exports = router;

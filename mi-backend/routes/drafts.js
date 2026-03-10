const express = require('express');
const router = express.Router();
const draftsController = require('../controllers/drafts.controller');

router.get('/:studentId', draftsController.requireAuth, draftsController.getDraftByStudent);
router.post('/:studentId', draftsController.requireAuth, draftsController.upsertDraftByStudent);
router.delete('/:studentId', draftsController.requireAuth, draftsController.deleteDraftByStudent);

module.exports = router;

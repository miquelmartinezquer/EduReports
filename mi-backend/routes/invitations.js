const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const invitationsController = require('../controllers/invitations.controller');

router.use(requireAuth);

router.post('/by-email', invitationsController.createInvitationByEmail);
router.get('/course/:courseId/pending', invitationsController.getPendingCourseInvitations);
router.get('/:userId', invitationsController.getUserInvitations);
router.post('/accept/:invitationId', invitationsController.acceptInvitation);
router.post('/decline/:invitationId', invitationsController.declineInvitation);
router.delete('/:invitationId', invitationsController.deleteInvitation);

module.exports = router;

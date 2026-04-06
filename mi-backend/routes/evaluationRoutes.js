const express = require('express');
const router = express.Router({ mergeParams: true });
const evaluationRoutesController = require('../controllers/evaluationRoutes.controller');

router.get('/', evaluationRoutesController.listEvaluationRoutesByCourse);
router.get('/:routeId', evaluationRoutesController.getEvaluationRouteById);
router.post('/', evaluationRoutesController.upsertEvaluationRoute);
router.put('/:routeId', evaluationRoutesController.updateEvaluationRouteById);
router.delete('/:routeId', evaluationRoutesController.deleteEvaluationRouteById);

module.exports = router;

const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const coursesController = require('../controllers/courses.controller');

router.use(requireAuth);

router.get('/', coursesController.getCourses);
router.get('/shared', coursesController.getSharedCourses);
router.get('/:id', coursesController.getCourseById);

router.post('/', coursesController.createCourse);
router.delete('/:id', coursesController.deleteCourse);
router.put('/:id', coursesController.updateCourse);

router.get('/:courseId/collaborators', coursesController.getCollaborators);
router.post('/:courseId/collaborators', coursesController.addCollaborator);
router.delete('/:courseId/collaborators/:id', coursesController.deleteCollaborator);

router.get('/:courseId/classes', coursesController.getClasses);
router.post('/:courseId/classes', coursesController.createClass);
router.delete('/:courseId/classes/:id', coursesController.deleteClass);

router.get('/:courseId/classes/:classId/students', coursesController.getStudentsByClass);
router.post('/:courseId/classes/:classId/students', coursesController.addStudent);
router.delete('/:courseId/classes/:classId/students/:id', coursesController.deleteStudent);

router.get('/:courseId/categories/colors', coursesController.getCategoryColors);
router.get('/:courseId/categories', coursesController.getCategories);
router.post('/:courseId/categories/import', coursesController.importCategories);
router.get('/:courseId/categories/export/csv', coursesController.exportCategoriesCsv);
router.post('/:courseId/categories', coursesController.createCategory);
router.put('/:courseId/categories/:key', coursesController.updateCategory);
router.delete('/:courseId/categories/:key', coursesController.deleteCategory);
router.post('/:courseId/categories/:key/items', coursesController.addCategoryItem);
router.delete('/:courseId/categories/:key/items/:index', coursesController.deleteCategoryItem);

router.get('/:courseId/students/:studentId/reports', coursesController.getStudentReports);
router.get('/:courseId/students/:studentId/reports/latest', coursesController.getLatestStudentReport);
router.get('/:courseId/reports/:reportId', coursesController.getReportById);
router.post('/:courseId/students/:studentId/reports', coursesController.createStudentReport);
router.put('/:courseId/reports/:reportId', coursesController.updateReport);
router.delete('/:courseId/reports/:reportId', coursesController.deleteReport);
router.delete('/:courseId/students/:studentId/reports/:reportId', coursesController.deleteStudentReport);

module.exports = router;

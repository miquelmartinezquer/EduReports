// Rutes de cursos
const express = require('express');
const router = express.Router();
const mockData = require('../data/mockData');
const requireAuth = require('../middleware/requireAuth');

// Aplicar autenticació a totes les rutes de cursos
router.use(requireAuth);

// GET /courses - Obtenir tots els cursos de l'usuari autenticat
router.get('/', (req, res) => {
  const userId = req.session.userId;
  const userCourses = mockData.courses.filter(c => c.userId === userId);
  res.json(userCourses);
});

// GET /courses/:id - Obtenir un curs per ID amb les seves relacions
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const course = mockData.courses.find(c => c.id === parseInt(id) && c.userId === userId);
  
  if (!course) {
    return res.status(404).json({ error: 'Curs no trobat o no tens permís per accedir-hi' });
  }
  
  // Obtenir col·laboradors del curs
  const collaborators = mockData.collaborators.filter(c => c.courseId === parseInt(id));
  
  // Obtenir classes del curs
  const classes = mockData.classes.filter(c => c.courseId === parseInt(id));
  
  // Per cada classe, obtenir els seus alumnes
  const classesWithStudents = classes.map(classItem => {
    const students = mockData.students.filter(s => s.classId === classItem.id);
    return {
      ...classItem,
      students
    };
  });
  
  res.json({
    ...course,
    collaborators,
    classes: classesWithStudents
  });
});

// POST /courses - Crear un nou curs
router.post('/', (req, res) => {
  const { name, level } = req.body;
  const userId = req.session.userId;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nom del curs és requerit' });
  }
  
  if (!level || !level.trim()) {
    return res.status(400).json({ error: 'El nivell del curs és requerit' });
  }
  
  const newCourse = {
    id: mockData.courseIdCounter++,
    userId: userId,
    name: name.trim(),
    level: level.trim(),
    createdAt: new Date().toISOString().split('T')[0]
  };
  
  mockData.courses.push(newCourse);
  
  // Afegir l'usuari creador com a col·laborador principal
  const user = mockData.users.find(u => u.id === userId);
  if (user) {
    const ownerCollaborator = {
      id: mockData.collaboratorIdCounter++,
      courseId: newCourse.id,
      name: user.name,
      role: 'Professor/a',
      email: user.email,
      isOwner: true,
      addedAt: newCourse.createdAt
    };
    mockData.collaborators.push(ownerCollaborator);
  }
  
  res.status(201).json({
    success: true,
    course: newCourse
  });
});

// DELETE /courses/:id - Eliminar un curs
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const courseIndex = mockData.courses.findIndex(c => c.id === parseInt(id) && c.userId === userId);
  
  if (courseIndex === -1) {
    return res.status(404).json({ error: 'Curs no trobat o no tens permís per eliminar-lo' });
  }
  
  const deletedCourse = mockData.courses.splice(courseIndex, 1)[0];
  
  res.json({
    success: true,
    course: deletedCourse
  });
});

// PUT /courses/:id - Actualitzar un curs
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, level } = req.body;
  const userId = req.session.userId;
  
  const course = mockData.courses.find(c => c.id === parseInt(id) && c.userId === userId);
  
  if (!course) {
    return res.status(404).json({ error: 'Curs no trobat o no tens permís per modificar-lo' });
  }
  
  if (name && name.trim()) {
    course.name = name.trim();
  }
  
  if (level && level.trim()) {
    course.level = level.trim();
  }
  
  res.json({
    success: true,
    course
  });
});

// ==========================
// RUTES PER COL·LABORADORS
// ==========================

// GET /courses/:courseId/collaborators - Obtenir col·laboradors d'un curs
router.get('/:courseId/collaborators', (req, res) => {
  const { courseId } = req.params;
  const collaborators = mockData.collaborators.filter(c => c.courseId === parseInt(courseId));
  res.json(collaborators);
});

// POST /courses/:courseId/collaborators - Afegir un col·laborador a un curs
router.post('/:courseId/collaborators', (req, res) => {
  const { courseId } = req.params;
  const { name, role, email } = req.body;
  
  if (!name || !role || !email) {
    return res.status(400).json({ error: 'Nom, rol i email són requerits' });
  }
  
  const newCollaborator = {
    id: mockData.collaboratorIdCounter++,
    courseId: parseInt(courseId),
    name: name.trim(),
    role: role.trim(),
    email: email.trim(),
    addedAt: new Date().toISOString().split('T')[0]
  };
  
  mockData.collaborators.push(newCollaborator);
  
  res.status(201).json({
    success: true,
    collaborator: newCollaborator
  });
});

// DELETE /courses/:courseId/collaborators/:id - Eliminar un col·laborador
router.delete('/:courseId/collaborators/:id', (req, res) => {
  const { id } = req.params;
  const collaborator = mockData.collaborators.find(c => c.id === parseInt(id));
  
  if (!collaborator) {
    return res.status(404).json({ error: 'Col·laborador no trobat' });
  }
  
  // No permetre eliminar el creador del curs
  if (collaborator.isOwner) {
    return res.status(403).json({ error: 'No es pot eliminar el creador del curs' });
  }
  
  const index = mockData.collaborators.findIndex(c => c.id === parseInt(id));
  const deleted = mockData.collaborators.splice(index, 1)[0];
  
  res.json({
    success: true,
    collaborator: deleted
  });
});

// ==========================
// RUTES PER CLASSES
// ==========================

// GET /courses/:courseId/classes - Obtenir classes d'un curs
router.get('/:courseId/classes', (req, res) => {
  const { courseId } = req.params;
  const classes = mockData.classes.filter(c => c.courseId === parseInt(courseId));
  
  // Afegir alumnes a cada classe
  const classesWithStudents = classes.map(classItem => {
    const students = mockData.students.filter(s => s.classId === classItem.id);
    return {
      ...classItem,
      students
    };
  });
  
  res.json(classesWithStudents);
});

// POST /courses/:courseId/classes - Crear una nova classe
router.post('/:courseId/classes', (req, res) => {
  const { courseId } = req.params;
  const { name, schedule } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'El nom de la classe és requerit' });
  }
  
  const newClass = {
    id: mockData.classIdCounter++,
    courseId: parseInt(courseId),
    name: name.trim(),
    schedule: schedule ? schedule.trim() : '',
    createdAt: new Date().toISOString().split('T')[0]
  };
  
  mockData.classes.push(newClass);
  
  res.status(201).json({
    success: true,
    class: { ...newClass, students: [] }
  });
});

// DELETE /courses/:courseId/classes/:id - Eliminar una classe
router.delete('/:courseId/classes/:id', (req, res) => {
  const { id } = req.params;
  const index = mockData.classes.findIndex(c => c.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Classe no trobada' });
  }
  
  // També eliminar els alumnes d'aquesta classe
  mockData.students = mockData.students.filter(s => s.classId !== parseInt(id));
  
  const deleted = mockData.classes.splice(index, 1)[0];
  
  res.json({
    success: true,
    class: deleted
  });
});

// ==========================
// RUTES PER ALUMNES
// ==========================

// GET /courses/:courseId/classes/:classId/students - Obtenir alumnes d'una classe
router.get('/:courseId/classes/:classId/students', (req, res) => {
  const { classId } = req.params;
  const students = mockData.students.filter(s => s.classId === parseInt(classId));
  res.json(students);
});

// POST /courses/:courseId/classes/:classId/students - Afegir un alumne a una classe
router.post('/:courseId/classes/:classId/students', (req, res) => {
  const { classId } = req.params;
  const { name, age } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'El nom de l\'alumne és requerit' });
  }
  
  const newStudent = {
    id: mockData.studentIdCounter++,
    classId: parseInt(classId),
    name: name.trim(),
    age: age || null,
    enrolledAt: new Date().toISOString().split('T')[0]
  };
  
  mockData.students.push(newStudent);
  
  res.status(201).json({
    success: true,
    student: newStudent
  });
});

// DELETE /courses/:courseId/classes/:classId/students/:id - Eliminar un alumne
router.delete('/:courseId/classes/:classId/students/:id', (req, res) => {
  const { id } = req.params;
  const index = mockData.students.findIndex(s => s.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Alumne no trobat' });
  }
  
  const deleted = mockData.students.splice(index, 1)[0];
  
  res.json({
    success: true,
    student: deleted
  });
});

// ==========================
// RUTES PER CATEGORIES I ITEMS DEL CURS
// ==========================

// GET /courses/:courseId/categories/colors - Obtenir colors disponibles
router.get('/:courseId/categories/colors', (req, res) => {
  res.json(mockData.availableColors);
});

// GET /courses/:courseId/categories - Obtenir categories d'un curs
router.get('/:courseId/categories', (req, res) => {
  const { courseId } = req.params;
  const categories = mockData.courseCategories[courseId] || {};
  res.json(categories);
});

// POST /courses/:courseId/categories - Crear una nova categoria en un curs
router.post('/:courseId/categories', (req, res) => {
  const { courseId } = req.params;
  const { key, name, color, items } = req.body;

  if (!key || !name) {
    return res.status(400).json({ error: 'key i name són requerits' });
  }

  // Inicialitzar categories del curs si no existeixen
  if (!mockData.courseCategories[courseId]) {
    mockData.courseCategories[courseId] = {};
  }

  if (mockData.courseCategories[courseId][key]) {
    return res.status(400).json({ error: 'Aquesta categoria ja existeix en aquest curs' });
  }

  mockData.courseCategories[courseId][key] = {
    name,
    color: color || 'purple',
    items: items || []
  };

  res.status(201).json({
    success: true,
    category: mockData.courseCategories[courseId][key],
    key
  });
});

// PUT /courses/:courseId/categories/:key - Actualitzar una categoria del curs
router.put('/:courseId/categories/:key', (req, res) => {
  const { courseId, key } = req.params;
  const { name, color, items } = req.body;

  if (!mockData.courseCategories[courseId] || !mockData.courseCategories[courseId][key]) {
    return res.status(404).json({ error: 'Categoria no trobada' });
  }

  if (name) mockData.courseCategories[courseId][key].name = name;
  if (color) mockData.courseCategories[courseId][key].color = color;
  if (items) mockData.courseCategories[courseId][key].items = items;

  res.json({
    success: true,
    category: mockData.courseCategories[courseId][key]
  });
});

// DELETE /courses/:courseId/categories/:key - Eliminar una categoria del curs
router.delete('/:courseId/categories/:key', (req, res) => {
  const { courseId, key } = req.params;

  if (!mockData.courseCategories[courseId] || !mockData.courseCategories[courseId][key]) {
    return res.status(404).json({ error: 'Categoria no trobada' });
  }

  delete mockData.courseCategories[courseId][key];
  res.json({ success: true, message: 'Categoria eliminada' });
});

// POST /courses/:courseId/categories/:key/items - Afegir un item a una categoria del curs
router.post('/:courseId/categories/:key/items', (req, res) => {
  const { courseId, key } = req.params;
  const { item } = req.body;

  if (!mockData.courseCategories[courseId] || !mockData.courseCategories[courseId][key]) {
    return res.status(404).json({ error: 'Categoria no trobada' });
  }

  if (!item) {
    return res.status(400).json({ error: 'item és requerit' });
  }

  mockData.courseCategories[courseId][key].items.push(item);
  res.status(201).json({
    success: true,
    items: mockData.courseCategories[courseId][key].items
  });
});

// DELETE /courses/:courseId/categories/:key/items/:index - Eliminar un item d'una categoria del curs
router.delete('/:courseId/categories/:key/items/:index', (req, res) => {
  const { courseId, key, index } = req.params;
  const itemIndex = parseInt(index);

  if (!mockData.courseCategories[courseId] || !mockData.courseCategories[courseId][key]) {
    return res.status(404).json({ error: 'Categoria no trobada' });
  }

  if (itemIndex < 0 || itemIndex >= mockData.courseCategories[courseId][key].items.length) {
    return res.status(404).json({ error: 'Item no trobat' });
  }

  mockData.courseCategories[courseId][key].items.splice(itemIndex, 1);
  res.json({
    success: true,
    items: mockData.courseCategories[courseId][key].items
  });
});

// ==========================
// RUTES PER INFORMES D'ALUMNES
// ==========================

// GET /courses/:courseId/students/:studentId/reports - Obtenir informes d'un alumne
router.get('/:courseId/students/:studentId/reports', (req, res) => {
  const { studentId } = req.params;
  const reports = mockData.reports.filter(r => r.studentId === parseInt(studentId));
  res.json(reports);
});

// GET /courses/:courseId/students/:studentId/reports/latest - Obtenir l'últim informe d'un alumne
router.get('/:courseId/students/:studentId/reports/latest', (req, res) => {
  const { studentId } = req.params;
  const studentReports = mockData.reports.filter(r => r.studentId === parseInt(studentId));
  
  if (studentReports.length === 0) {
    return res.json(null);
  }
  
  // Retornar el més recent
  const latestReport = studentReports.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  )[0];
  
  res.json(latestReport);
});

// GET /courses/:courseId/reports/:reportId - Obtenir un informe específic
router.get('/:courseId/reports/:reportId', (req, res) => {
  const { reportId } = req.params;
  const report = mockData.reports.find(r => r.id === parseInt(reportId));
  
  if (!report) {
    return res.status(404).json({ error: 'Informe no trobat' });
  }
  
  res.json(report);
});

// POST /courses/:courseId/students/:studentId/reports - Crear un nou informe per un alumne
router.post('/:courseId/students/:studentId/reports', (req, res) => {
  const { courseId, studentId } = req.params;
  const { title, htmlContent } = req.body;
  
  console.log('=== GUARDANT INFORME ===');
  console.log('courseId:', courseId);
  console.log('studentId:', studentId);
  console.log('title:', title);
  console.log('htmlContent length:', htmlContent?.length);
  console.log('reportIdCounter actual:', mockData.reportIdCounter);
  
  const newReport = {
    id: mockData.reportIdCounter++,
    studentId: parseInt(studentId),
    courseId: parseInt(courseId),
    title: title || 'Informe sense títol',
    createdAt: new Date().toISOString().split('T')[0],
    htmlContent: htmlContent || '',
    status: 'completed'
  };
  
  mockData.reports.push(newReport);
  console.log('Informe guardat amb ID:', newReport.id);
  console.log('Total informes ara:', mockData.reports.length);
  
  res.status(201).json({
    success: true,
    report: newReport
  });
});

// PUT /courses/:courseId/reports/:reportId - Actualitzar un informe
router.put('/:courseId/reports/:reportId', (req, res) => {
  const { reportId } = req.params;
  const { title, htmlContent, status } = req.body;
  
  const report = mockData.reports.find(r => r.id === parseInt(reportId));
  
  if (!report) {
    return res.status(404).json({ error: 'Informe no trobat' });
  }
  
  if (title) report.title = title;
  if (htmlContent) report.htmlContent = htmlContent;
  if (status) report.status = status;
  
  res.json({
    success: true,
    report
  });
});

// DELETE /courses/:courseId/reports/:reportId - Eliminar un informe
router.delete('/:courseId/reports/:reportId', (req, res) => {
  const { reportId } = req.params;
  const index = mockData.reports.findIndex(r => r.id === parseInt(reportId));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Informe no trobat' });
  }
  
  const deleted = mockData.reports.splice(index, 1)[0];
  
  res.json({
    success: true,
    report: deleted
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const mockData = require('../data/mockData');
const requireAuth = require('../middleware/requireAuth');

// GET /drafts/:studentId - Obtenir l'esborrany d'un alumne
router.get('/:studentId', requireAuth, (req, res) => {
  const { studentId } = req.params;
  const userId = req.session.userId;

  // Buscar l'esborrany per studentId i userId
  const draft = mockData.reportDrafts.find(
    d => d.studentId === parseInt(studentId) && d.userId === userId
  );

  if (!draft) {
    return res.status(404).json({ error: 'No s\'ha trobat cap esborrany per aquest alumne' });
  }

  res.json(draft);
});

// POST /drafts/:studentId - Crear o actualitzar l'esborrany d'un alumne
router.post('/:studentId', requireAuth, (req, res) => {
  const { studentId } = req.params;
  const userId = req.session.userId;
  const {
    courseId,
    elements,
    studentName,
    course,
    language,
    elementCounter
  } = req.body;

  // Validar dades rebudes
  if (!elements || !studentName || !course || !language || elementCounter === undefined) {
    return res.status(400).json({ error: 'Falten dades obligatòries' });
  }

  // Buscar si ja existeix un esborrany
  const existingDraftIndex = mockData.reportDrafts.findIndex(
    d => d.studentId === parseInt(studentId) && d.userId === userId
  );

  const draftData = {
    studentId: parseInt(studentId),
    courseId: courseId || null,
    userId,
    elements,
    studentName,
    course,
    language,
    elementCounter,
    lastModified: new Date().toISOString()
  };

  if (existingDraftIndex !== -1) {
    // Actualitzar esborrany existent
    mockData.reportDrafts[existingDraftIndex] = {
      ...mockData.reportDrafts[existingDraftIndex],
      ...draftData
    };
    res.json({
      message: 'Esborrany actualitzat correctament',
      draft: mockData.reportDrafts[existingDraftIndex]
    });
  } else {
    // Crear nou esborrany
    const newDraft = {
      id: mockData.draftIdCounter++,
      ...draftData
    };
    mockData.reportDrafts.push(newDraft);
    res.status(201).json({
      message: 'Esborrany creat correctament',
      draft: newDraft
    });
  }
});

// DELETE /drafts/:studentId - Eliminar l'esborrany d'un alumne
router.delete('/:studentId', requireAuth, (req, res) => {
  const { studentId } = req.params;
  const userId = req.session.userId;

  const draftIndex = mockData.reportDrafts.findIndex(
    d => d.studentId === parseInt(studentId) && d.userId === userId
  );

  if (draftIndex === -1) {
    return res.status(404).json({ error: 'No s\'ha trobat cap esborrany per eliminar' });
  }

  mockData.reportDrafts.splice(draftIndex, 1);
  res.json({ message: 'Esborrany eliminat correctament' });
});

module.exports = router;

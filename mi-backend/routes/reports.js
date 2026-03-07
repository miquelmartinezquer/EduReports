// Rutes per a la generació d'informes
const express = require('express');
const router = express.Router();
const { sendMessage } = require('../services/claude');
const { REPORT_SYSTEM_PROMPT } = require('../config/prompts');
const requireAuth = require('../middleware/requireAuth');

// POST /generate-report - Generar informe amb IA
router.post('/generate-report', requireAuth, async (req, res) => {
  try {
    console.log('=== GENERANT INFORME ===');
    const { reportData } = req.body;

    if (!reportData) {
      console.error('ERROR: reportData no proporcionat');
      return res.status(400).json({ error: 'reportData és requerit' });
    }

    console.log('Dades rebudes:', JSON.stringify(reportData, null, 2));

    const userPrompt = "Dades de l'alumne: " + JSON.stringify(reportData);
    console.log('Cridant servei Claude...');
    
    const response = await sendMessage(REPORT_SYSTEM_PROMPT, userPrompt);
    console.log('Resposta de Claude rebuda');

    // Extreure el contingut HTML de la resposta
    const htmlContent = response.content?.[0]?.text || '';
    console.log('HTML generat correctament, longitud:', htmlContent.length);

    res.json({
      success: true,
      html: htmlContent,
      usage: response.usage
    });

  } catch (error) {
    console.error('ERROR GENERANT INFORME:');
    console.error('Missatge:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error generant informe', 
      details: error.message,
      stack: process.env.NODE_ENV === 'dev' ? error.stack : undefined
    });
  }
});

// GET /reports/:reportId - Obtenir un informe per ID
router.get('/:reportId', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const mockData = require('../data/mockData');
    
    console.log('=== CARREGANT INFORME ===');
    console.log('reportId demanat:', reportId);
    console.log('reportId com a INT:', parseInt(reportId));
    console.log('Informes disponibles:', mockData.reports.map(r => ({ id: r.id, title: r.title })));
    
    const report = mockData.reports.find(r => r.id === parseInt(reportId));
    
    if (!report) {
      console.log('❌ Informe no trobat!');
      return res.status(404).json({ error: 'Informe no trobat' });
    }
    
    console.log('✅ Informe trobat:', report.title);
    res.json(report);
  } catch (error) {
    console.error('ERROR OBTENINT INFORME:');
    console.error('Missatge:', error.message);
    res.status(500).json({ 
      error: 'Error obtenint informe', 
      details: error.message 
    });
  }
});

module.exports = router;

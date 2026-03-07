// Rutes per a la generació d'informes
const express = require('express');
const router = express.Router();
const { sendMessage } = require('../services/claude');
const { REPORT_SYSTEM_PROMPT } = require('../config/prompts');
const requireAuth = require('../middleware/requireAuth');
const readModel = require('../services/readModel');
const { query } = require('../services/db');

const findExistingReportForToday = async(studentId, courseId, reportTitle) => {
        const rows = await query(
                `SELECT id
                 FROM reports
                 WHERE student_id = ?
                     AND course_id = ?
                     AND title = ?
                     AND created_at = CURDATE()
                 ORDER BY id DESC
                 LIMIT 1`,
                [studentId, courseId, reportTitle],
        );

        if (!rows[0]) return null;
        return readModel.getReportById(rows[0].id);
};

// POST /generate-report - Generar informe amb IA
router.post('/generate-report', requireAuth, async(req, res) => {
    try {
        console.log('=== GENERANT INFORME ===');
        const { reportData, studentId, courseId } = req.body;

        if (!reportData) {
            console.error('ERROR: reportData no proporcionat');
            return res.status(400).json({ error: 'reportData és requerit' });
        }

        const parsedStudentId = parseInt(studentId);
        const parsedCourseId = parseInt(courseId);

        if (Number.isNaN(parsedStudentId) || Number.isNaN(parsedCourseId)) {
            return res.status(400).json({ error: 'studentId i courseId són requerits' });
        }

        const reportTitle = `Informe de ${reportData?.student?.name || 'Alumne'} - ${reportData?.student?.date || new Date().toLocaleDateString()}`;

        // Evita duplicats: mateix alumne/curs i mateix títol en el mateix dia.
        const existingReport = await findExistingReportForToday(
            parsedStudentId,
            parsedCourseId,
            reportTitle,
        );

        if (existingReport) {
            return res.json({
                success: true,
                report: existingReport,
                duplicated: true,
            });
        }

        console.log('Dades rebudes:', JSON.stringify(reportData, null, 2));

        const userPrompt = "Dades de l'alumne: " + JSON.stringify(reportData);
        console.log('Cridant servei Claude...');

        const response = await sendMessage(REPORT_SYSTEM_PROMPT, userPrompt);
        console.log('Resposta de Claude rebuda');

        // Extreure el contingut HTML de la resposta
        const htmlContent = response.content?.[0]?.text || '';
        console.log('HTML generat correctament, longitud:', htmlContent.length);

        const insertResult = await query(
            `INSERT INTO reports (student_id, course_id, title, created_at, html_content, status)
             VALUES (?, ?, ?, CURDATE(), ?, 'completed')`,
            [parsedStudentId, parsedCourseId, reportTitle, htmlContent],
        );

        const savedReport = await readModel.getReportById(insertResult.insertId);

        res.json({
            success: true,
            report: savedReport,
            usage: response.usage,
        });

    } catch (error) {
        console.error('ERROR GENERANT INFORME:');
        console.error('Missatge:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            error: 'SQL ERROR',
            details: error.message,
            stack: process.env.NODE_ENV === 'dev' ? error.stack : undefined
        });
    }
});

// GET /reports/:reportId - Obtenir un informe per ID
router.get('/:reportId', requireAuth, async(req, res) => {
    try {
        const { reportId } = req.params;
        const parsedReportId = parseInt(reportId);

        console.log('=== CARREGANT INFORME ===');
        console.log('reportId demanat:', reportId);
        console.log('reportId com a INT:', parsedReportId);

        const report = await readModel.getReportById(parsedReportId);

        if (!report) {
            console.log('❌ Informe no trobat!');
            return res.status(404).json({ error: 'Informe no trobat' });
        }

        console.log('✅ Informe trobat:', report.title);
        res.json(report);
    } catch (error) {
        console.error('ERROR OBTENINT INFORME:');
        console.error('Missatge:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
});

module.exports = router;
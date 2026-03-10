const { sendMessage } = require('../services/claude');
const { REPORT_SYSTEM_PROMPT } = require('../config/prompts');
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

const getNameInitialType = (name) => {
    const firstLetter = String(name || '').trim().charAt(0).toLowerCase();
    if (!firstLetter) return 'consonant';

    const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'à', 'á', 'è', 'é', 'ê', 'ì', 'í', 'ï', 'ò', 'ó', 'ú', 'ü']);
    return vowels.has(firstLetter) ? 'vocal' : 'consonant';
};

const sanitizeReportDataForAI = (reportData, student) => {
    const studentInput = reportData?.student || {};

    return {
        ...reportData,
        student: {
            ...studentInput,
            name: 'STUDENT_NAME',
            gender: studentInput.gender || student?.gender || 'no_indicat',
            nameInitialType: studentInput.nameInitialType || getNameInitialType(student?.name),
        },
    };
};

const escapeHtml = (value) => {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const injectStudentName = (htmlContent, studentName) => {
    if (!htmlContent || !studentName) return htmlContent;

    const escapedStudentName = escapeHtml(studentName);
    return String(htmlContent).replace(/\bSTUDENT_NAME\b/g, escapedStudentName);
};

const normalizeReportBodyHtml = (htmlContent) => {
    if (!htmlContent) return htmlContent;

    let normalized = String(htmlContent);

    // Keep report title exclusively in frontend card, never inside injected body.
    normalized = normalized.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, '');

    // Prevent accidental status rendering in body.
    normalized = normalized.replace(/<(span|p|div|h2|h3|h4)\b[^>]*>\s*(Completat|Esborrany)\s*<\/\1>/gi, '');

    return normalized;
};

const getStudentFullName = (student) => {
    const fullName = [student?.name, student?.lastName].filter(Boolean).join(' ').trim();
    return fullName || student?.name || 'Alumne';
};

const getStudentGivenName = (student) => {
    const normalized = String(student?.name || '').trim();
    if (!normalized) return 'Alumne';

    // Always inject only the given name into AI body text.
    return normalized.split(/\s+/)[0] || 'Alumne';
};

const generateReport = async(req, res) => {
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

        const student = await readModel.getStudentById(parsedStudentId);
        if (!student) {
            return res.status(404).json({ error: 'Alumne no trobat' });
        }

        const studentFullName = getStudentFullName(student);
        const studentGivenName = getStudentGivenName(student);
        const reportTitle = `Informe de ${studentFullName} - ${reportData?.student?.date || new Date().toLocaleDateString()}`;

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

        const aiReportData = sanitizeReportDataForAI(reportData, student);

        console.log('Dades rebudes (sanititzades):', JSON.stringify(aiReportData, null, 2));

        const userPrompt = "Dades de l'alumne: " + JSON.stringify(aiReportData);
        console.log('Cridant servei Claude...');

        const response = await sendMessage(REPORT_SYSTEM_PROMPT, userPrompt);
        console.log('Resposta de Claude rebuda');

        const rawHtmlContent = response.content?.[0]?.text || '';
        const htmlContent = normalizeReportBodyHtml(
            injectStudentName(rawHtmlContent, studentGivenName),
        );
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
            stack: process.env.NODE_ENV === 'dev' ? error.stack : undefined,
        });
    }
};

const getReport = async(req, res) => {
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

        const reportToReturn = { ...report };
        if (String(reportToReturn.htmlContent || '').includes('STUDENT_NAME')) {
            const student = await readModel.getStudentById(reportToReturn.studentId);
            const studentGivenName = getStudentGivenName(student);
            if (studentGivenName) {
                reportToReturn.htmlContent = injectStudentName(reportToReturn.htmlContent, studentGivenName);
            }
        }

        reportToReturn.htmlContent = normalizeReportBodyHtml(reportToReturn.htmlContent);

        console.log('✅ Informe trobat:', reportToReturn.title);
        res.json(reportToReturn);
    } catch (error) {
        console.error('ERROR OBTENINT INFORME:');
        console.error('Missatge:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

module.exports = {
    generateReport,
    getReport,
};

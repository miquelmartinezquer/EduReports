const requireAuth = require('../middleware/requireAuth');
const readModel = require('../services/readModel');
const { query } = require('../services/db');

const getDraftByStudent = async(req, res) => {
    const { studentId } = req.params;
    const userId = req.session.userId;

    try {
        const draft = await readModel.getDraftByStudentAndUser(parseInt(studentId), userId);

        if (!draft) {
            return res.status(404).json({ error: 'No s\'ha trobat cap esborrany per aquest alumne' });
        }

        res.json(draft);
    } catch (error) {
        console.error('SQL drafts GET /:studentId error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

const upsertDraftByStudent = async(req, res) => {
    const { studentId } = req.params;
    const parsedStudentId = parseInt(studentId);
    const userId = req.session.userId;

    const {
        courseId,
        elements,
        conclusions,
        studentName,
        course,
        language,
        elementCounter,
    } = req.body;

    if (!elements || !studentName || !course || !language || elementCounter === undefined) {
        return res.status(400).json({ error: 'Falten dades obligatòries' });
    }

    try {
        const draftPayload = {
            elements,
            conclusions: {
                enabled: Boolean(conclusions?.enabled),
                title: conclusions?.title || 'Observacions finals',
                guidance: conclusions?.guidance || null,
            },
        };

        await query(
            `INSERT INTO report_drafts (
                student_id, course_id, user_id, elements_json, student_name,
                course_label, language, element_counter, last_modified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                course_id = VALUES(course_id),
                elements_json = VALUES(elements_json),
                student_name = VALUES(student_name),
                course_label = VALUES(course_label),
                language = VALUES(language),
                element_counter = VALUES(element_counter),
                last_modified = NOW()`,
            [
                parsedStudentId,
                courseId || null,
                userId,
                JSON.stringify(draftPayload),
                studentName,
                course,
                language,
                elementCounter,
            ],
        );

        const draft = await readModel.getDraftByStudentAndUser(parsedStudentId, userId);

        res.json({
            message: 'Esborrany guardat correctament',
            draft,
        });
    } catch (error) {
        console.error('SQL drafts POST /:studentId error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

const deleteDraftByStudent = async(req, res) => {
    const { studentId } = req.params;
    const userId = req.session.userId;

    try {
        const result = await query(
            'DELETE FROM report_drafts WHERE student_id = ? AND user_id = ?',
            [parseInt(studentId), userId],
        );

        if (!result.affectedRows) {
            return res.status(404).json({ error: 'No s\'ha trobat cap esborrany per eliminar' });
        }

        res.json({ message: 'Esborrany eliminat correctament' });
    } catch (error) {
        console.error('SQL drafts DELETE /:studentId error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

module.exports = {
    requireAuth,
    getDraftByStudent,
    upsertDraftByStudent,
    deleteDraftByStudent,
};

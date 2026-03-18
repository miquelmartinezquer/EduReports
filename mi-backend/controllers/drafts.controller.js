const requireAuth = require('../middleware/requireAuth');
const readModel = require('../services/readModel');
const { query } = require('../services/db');

const resolveStudentCourseAccess = async(studentId, userId) => {
    const rows = await query(
        `SELECT s.id AS studentId, c.id AS courseId, c.user_id AS ownerId,
                col.id AS collaboratorId
         FROM students s
         INNER JOIN classes cls ON cls.id = s.class_id
         INNER JOIN courses c ON c.id = cls.course_id
         LEFT JOIN collaborators col ON col.course_id = c.id AND col.user_id = ?
         WHERE s.id = ?
         LIMIT 1`,
        [userId, studentId],
    );

    if (!rows[0]) {
        return {
            allowed: false,
            notFound: true,
            reason: 'Alumne no trobat',
        };
    }

    const context = rows[0];
    const isOwner = context.ownerId === userId;
    const isCollaborator = Boolean(context.collaboratorId);

    if (!isOwner && !isCollaborator) {
        return {
            allowed: false,
            notFound: false,
            reason: 'No tens permís per accedir a aquest alumne',
        };
    }

    return {
        allowed: true,
        courseId: context.courseId,
    };
};

const getDraftByStudent = async(req, res) => {
    const { studentId } = req.params;
    const parsedStudentId = parseInt(studentId);
    const userId = req.session.userId;

    if (Number.isNaN(parsedStudentId)) {
        return res.status(400).json({ error: 'studentId invàlid' });
    }

    try {
        const access = await resolveStudentCourseAccess(parsedStudentId, userId);
        if (!access.allowed) {
            return res.status(access.notFound ? 404 : 403).json({ error: access.reason });
        }

        const draft = await readModel.getDraftByStudent(parsedStudentId);

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
        elements,
        conclusions,
        studentName,
        course,
        language,
        elementCounter,
    } = req.body;

    if (Number.isNaN(parsedStudentId)) {
        return res.status(400).json({ error: 'studentId invàlid' });
    }

    if (!elements || !studentName || !course || !language || elementCounter === undefined) {
        return res.status(400).json({ error: 'Falten dades obligatòries' });
    }

    try {
        const access = await resolveStudentCourseAccess(parsedStudentId, userId);
        if (!access.allowed) {
            return res.status(access.notFound ? 404 : 403).json({ error: access.reason });
        }

        const draftPayload = {
            elements,
            conclusions: {
                enabled: Boolean(conclusions?.enabled),
                title: conclusions?.title || 'Observacions finals',
                guidance: conclusions?.guidance || null,
            },
        };

        const existingRows = await query(
            `SELECT id
             FROM report_drafts
             WHERE student_id = ?
             ORDER BY last_modified DESC, id DESC`,
            [parsedStudentId],
        );

        const latestDraftId = existingRows[0]?.id;

        if (latestDraftId) {
            await query(
                `UPDATE report_drafts
                 SET course_id = ?, user_id = ?, elements_json = ?, student_name = ?,
                     course_label = ?, language = ?, element_counter = ?, last_modified = NOW()
                 WHERE id = ?`,
                [
                    access.courseId,
                    userId,
                    JSON.stringify(draftPayload),
                    studentName,
                    course,
                    language,
                    elementCounter,
                    latestDraftId,
                ],
            );

            // Netegem possibles duplicats antics (un per professor) i en deixem només un.
            await query(
                'DELETE FROM report_drafts WHERE student_id = ? AND id <> ?',
                [parsedStudentId, latestDraftId],
            );
        } else {
            await query(
                `INSERT INTO report_drafts (
                    student_id, course_id, user_id, elements_json, student_name,
                    course_label, language, element_counter, last_modified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    parsedStudentId,
                    access.courseId,
                    userId,
                    JSON.stringify(draftPayload),
                    studentName,
                    course,
                    language,
                    elementCounter,
                ],
            );
        }

        const draft = await readModel.getDraftByStudent(parsedStudentId);

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
    const parsedStudentId = parseInt(studentId);
    const userId = req.session.userId;

    if (Number.isNaN(parsedStudentId)) {
        return res.status(400).json({ error: 'studentId invàlid' });
    }

    try {
        const access = await resolveStudentCourseAccess(parsedStudentId, userId);
        if (!access.allowed) {
            return res.status(access.notFound ? 404 : 403).json({ error: access.reason });
        }

        const result = await query(
            'DELETE FROM report_drafts WHERE student_id = ?',
            [parsedStudentId],
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

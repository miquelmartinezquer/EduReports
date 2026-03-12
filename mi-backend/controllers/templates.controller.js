const readModel = require('../services/readModel');
const { query } = require('../services/db');

const sqlError = (res, context, error) => {
    console.error(`SQL ${context} error:`, error.message);
    return res.status(500).json({ error: 'SQL ERROR' });
};

const parseTemplateRow = (row) => {
    const parsedStructure = row.structure ? JSON.parse(row.structure) : [];
    const isLegacyArray = Array.isArray(parsedStructure);

    return {
        id: row.id,
        courseId: row.courseId,
        userId: row.userId,
        name: row.name,
        sections: isLegacyArray ? parsedStructure : (parsedStructure.sections || []),
        conclusions: isLegacyArray
            ? {
                enabled: false,
                title: 'Observacions finals',
                guidance: null,
            }
            : {
                enabled: Boolean(parsedStructure.conclusions?.enabled),
                title: parsedStructure.conclusions?.title || 'Observacions finals',
                guidance: parsedStructure.conclusions?.guidance || null,
            },
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
};

const ensureCourseAccess = async(courseId, userId) => {
    const course = await readModel.getCourseById(courseId);
    if (!course) {
        return { allowed: false, reason: 'Curs no trobat' };
    }

    if (course.userId === userId) {
        return { allowed: true, course };
    }

    const collaborators = await readModel.getCollaboratorsByCourse(courseId);
    const isCollaborator = collaborators.some((c) => c.userId === userId);

    if (!isCollaborator) {
        return {
            allowed: false,
            reason: 'No tens permís per accedir a les plantilles d\'aquest curs',
        };
    }

    return { allowed: true, course };
};

const listTemplatesByCourse = async(req, res) => {
    const { courseId } = req.params;
    const parsedCourseId = parseInt(courseId, 10);
    const userId = req.session.userId;

    if (Number.isNaN(parsedCourseId)) {
        return res.status(400).json({ error: 'CourseId invàlid' });
    }

    try {
        const access = await ensureCourseAccess(parsedCourseId, userId);
        if (!access.allowed) {
            return res.status(403).json({ error: access.reason });
        }

        const rows = await query(
            `SELECT id, course_id AS courseId, user_id AS userId, name,
                    structure_json AS structure, created_at AS createdAt,
                    updated_at AS updatedAt
             FROM report_templates
             WHERE course_id = ?
             ORDER BY updated_at DESC, id DESC`,
            [parsedCourseId],
        );

        res.json(rows.map(parseTemplateRow));
    } catch (error) {
        sqlError(res, 'templates GET /courses/:courseId/templates', error);
    }
};

const getTemplateById = async(req, res) => {
    const { courseId, templateId } = req.params;
    const parsedCourseId = parseInt(courseId, 10);
    const parsedTemplateId = parseInt(templateId, 10);
    const userId = req.session.userId;

    if (Number.isNaN(parsedCourseId) || Number.isNaN(parsedTemplateId)) {
        return res.status(400).json({ error: 'Paràmetres invàlids' });
    }

    try {
        const access = await ensureCourseAccess(parsedCourseId, userId);
        if (!access.allowed) {
            return res.status(403).json({ error: access.reason });
        }

        const rows = await query(
            `SELECT id, course_id AS courseId, user_id AS userId, name,
                    structure_json AS structure, created_at AS createdAt,
                    updated_at AS updatedAt
             FROM report_templates
             WHERE id = ? AND course_id = ?
             LIMIT 1`,
            [parsedTemplateId, parsedCourseId],
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Plantilla no trobada' });
        }

        res.json(parseTemplateRow(rows[0]));
    } catch (error) {
        sqlError(res, 'templates GET /courses/:courseId/templates/:templateId', error);
    }
};

const upsertTemplate = async(req, res) => {
    const { courseId } = req.params;
    const parsedCourseId = parseInt(courseId, 10);
    const userId = req.session.userId;
    const { name, sections, conclusions } = req.body;

    if (Number.isNaN(parsedCourseId)) {
        return res.status(400).json({ error: 'CourseId invàlid' });
    }

    if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'El nom de la plantilla és obligatori' });
    }

    if (!Array.isArray(sections)) {
        return res.status(400).json({ error: 'Les seccions de la plantilla són obligatòries' });
    }

    try {
        const access = await ensureCourseAccess(parsedCourseId, userId);
        if (!access.allowed) {
            return res.status(403).json({ error: access.reason });
        }

        const normalizedName = String(name).trim();

        const normalizedConclusions = {
            enabled: Boolean(conclusions?.enabled),
            title: conclusions?.title || 'Observacions finals',
            guidance: conclusions?.guidance || null,
        };

        const structurePayload = {
            sections,
            conclusions: normalizedConclusions,
        };

        await query(
            `INSERT INTO report_templates (course_id, user_id, name, structure_json, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                user_id = VALUES(user_id),
                structure_json = VALUES(structure_json),
                updated_at = NOW()`,
            [parsedCourseId, userId, normalizedName, JSON.stringify(structurePayload)],
        );

        const rows = await query(
            `SELECT id, course_id AS courseId, user_id AS userId, name,
                    structure_json AS structure, created_at AS createdAt,
                    updated_at AS updatedAt
             FROM report_templates
             WHERE course_id = ? AND name = ?
             LIMIT 1`,
            [parsedCourseId, normalizedName],
        );

        res.status(201).json({
            success: true,
            template: parseTemplateRow(rows[0]),
        });
    } catch (error) {
        sqlError(res, 'templates POST /courses/:courseId/templates', error);
    }
};

const updateTemplateById = async(req, res) => {
    const { courseId, templateId } = req.params;
    const parsedCourseId = parseInt(courseId, 10);
    const parsedTemplateId = parseInt(templateId, 10);
    const userId = req.session.userId;
    const { name, sections, conclusions } = req.body;

    if (Number.isNaN(parsedCourseId) || Number.isNaN(parsedTemplateId)) {
        return res.status(400).json({ error: 'Paràmetres invàlids' });
    }

    if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'El nom de la plantilla és obligatori' });
    }

    if (!Array.isArray(sections)) {
        return res.status(400).json({ error: 'Les seccions de la plantilla són obligatòries' });
    }

    try {
        const access = await ensureCourseAccess(parsedCourseId, userId);
        if (!access.allowed) {
            return res.status(403).json({ error: access.reason });
        }

        const existing = await query(
            'SELECT id FROM report_templates WHERE id = ? AND course_id = ? LIMIT 1',
            [parsedTemplateId, parsedCourseId],
        );

        if (!existing[0]) {
            return res.status(404).json({ error: 'Plantilla no trobada' });
        }

        const normalizedConclusions = {
            enabled: Boolean(conclusions?.enabled),
            title: conclusions?.title || 'Observacions finals',
            guidance: conclusions?.guidance || null,
        };

        const structurePayload = {
            sections,
            conclusions: normalizedConclusions,
        };

        await query(
            `UPDATE report_templates
             SET name = ?, structure_json = ?, user_id = ?, updated_at = NOW()
             WHERE id = ? AND course_id = ?`,
            [
                String(name).trim(),
                JSON.stringify(structurePayload),
                userId,
                parsedTemplateId,
                parsedCourseId,
            ],
        );

        const rows = await query(
            `SELECT id, course_id AS courseId, user_id AS userId, name,
                    structure_json AS structure, created_at AS createdAt,
                    updated_at AS updatedAt
             FROM report_templates
             WHERE id = ? AND course_id = ?
             LIMIT 1`,
            [parsedTemplateId, parsedCourseId],
        );

        res.json({
            success: true,
            template: parseTemplateRow(rows[0]),
        });
    } catch (error) {
        sqlError(res, 'templates PUT /courses/:courseId/templates/:templateId', error);
    }
};

const deleteTemplateById = async(req, res) => {
    const { courseId, templateId } = req.params;
    const parsedCourseId = parseInt(courseId, 10);
    const parsedTemplateId = parseInt(templateId, 10);
    const userId = req.session.userId;

    if (Number.isNaN(parsedCourseId) || Number.isNaN(parsedTemplateId)) {
        return res.status(400).json({ error: 'Paràmetres invàlids' });
    }

    try {
        const access = await ensureCourseAccess(parsedCourseId, userId);
        if (!access.allowed) {
            return res.status(403).json({ error: access.reason });
        }

        const result = await query(
            'DELETE FROM report_templates WHERE id = ? AND course_id = ?',
            [parsedTemplateId, parsedCourseId],
        );

        if (!result.affectedRows) {
            return res.status(404).json({ error: 'Plantilla no trobada' });
        }

        res.json({ success: true });
    } catch (error) {
        sqlError(res, 'templates DELETE /courses/:courseId/templates/:templateId', error);
    }
};

module.exports = {
    listTemplatesByCourse,
    getTemplateById,
    upsertTemplate,
    updateTemplateById,
    deleteTemplateById,
};

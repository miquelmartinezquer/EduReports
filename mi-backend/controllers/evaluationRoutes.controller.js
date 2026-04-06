const readModel = require('../services/readModel');
const { query } = require('../services/db');

const sqlError = (res, context, error) => {
    console.error(`SQL ${context} error:`, error.message);
    return res.status(500).json({ error: 'SQL ERROR' });
};

// Normalize rubric
const normalizeRubric = (r) => ({
    title: String(r?.title || '').trim(),
    variants: Array.isArray(r?.variants)
        ? r.variants.map((v) => String(v || '').trim()).filter(Boolean)
        : [],
});

// Normalize sections
const normalizeSections = (sections) => {
    if (!Array.isArray(sections)) return [];
    return sections
        .map((s) => ({
            title: String(s?.title || '').trim(),
            rubrics: Array.isArray(s?.rubrics)
                ? s.rubrics.map(normalizeRubric).filter((r) => r.title)
                : [],
        }))
        .filter((s) => s.title);
};

// Convert old flat steps format to new sections format for backward compatibility
const stepsToSections = (steps) => {
    if (!Array.isArray(steps) || steps.length === 0) return [];
    return [{
        title: 'General',
        rubrics: steps
            .map((step) => ({
                title: String(step?.title || '').trim(),
                variants: Array.isArray(step?.variants)
                    ? step.variants.map((v) => String(v || '').trim()).filter(Boolean)
                    : [],
            }))
            .filter((r) => r.title),
    }];
};

// Convert very old items-based sections to new sections format
const oldSectionsToNew = (oldSections) => {
    if (!Array.isArray(oldSections)) return [];
    return oldSections
        .map((section) => ({
            title: String(section?.title || '').trim(),
            rubrics: (Array.isArray(section.items) ? section.items : [])
                .map((item) => ({
                    title: String(item?.content || '').trim(),
                    variants: Array.isArray(item?.responseOptions)
                        ? item.responseOptions.map((v) => String(v || '').trim()).filter(Boolean)
                        : [],
                }))
                .filter((r) => r.title),
        }))
        .filter((s) => s.title);
};

const parseEvaluationRouteRow = (row) => {
    const parsedStructure = row.structure ? JSON.parse(row.structure) : {};

    let sections;
    if (Array.isArray(parsedStructure.sections)) {
        // Check if it\'s the new sections (with rubrics) or old (with items)
        const first = parsedStructure.sections[0];
        if (first && Array.isArray(first.rubrics)) {
            // New format
            sections = parsedStructure.sections;
        } else {
            // Old sections with items
            sections = oldSectionsToNew(parsedStructure.sections);
        }
    } else if (Array.isArray(parsedStructure.steps)) {
        // Previous flat steps format
        sections = stepsToSections(parsedStructure.steps);
    } else {
        sections = [];
    }

    return {
        id: row.id,
        courseId: row.courseId,
        userId: row.userId,
        name: row.name,
        sections,
        conclusions: {
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
            reason: 'No tens permis per accedir a les rutes d\'avaluacio d\'aquest curs',
        };
    }

    return { allowed: true, course };
};

const listEvaluationRoutesByCourse = async(req, res) => {
    const { courseId } = req.params;
    const parsedCourseId = parseInt(courseId, 10);
    const userId = req.session.userId;

    if (Number.isNaN(parsedCourseId)) {
        return res.status(400).json({ error: 'CourseId invalid' });
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
             FROM evaluation_routes
             WHERE course_id = ?
             ORDER BY updated_at DESC, id DESC`,
            [parsedCourseId],
        );

        res.json(rows.map(parseEvaluationRouteRow));
    } catch (error) {
        sqlError(res, 'evaluation-routes GET /courses/:courseId/evaluation-routes', error);
    }
};

const getEvaluationRouteById = async(req, res) => {
    const { courseId, routeId } = req.params;
    const parsedCourseId = parseInt(courseId, 10);
    const parsedRouteId = parseInt(routeId, 10);
    const userId = req.session.userId;

    if (Number.isNaN(parsedCourseId) || Number.isNaN(parsedRouteId)) {
        return res.status(400).json({ error: 'Parametres invalids' });
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
             FROM evaluation_routes
             WHERE id = ? AND course_id = ?
             LIMIT 1`,
            [parsedRouteId, parsedCourseId],
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Ruta d\'avaluacio no trobada' });
        }

        res.json(parseEvaluationRouteRow(rows[0]));
    } catch (error) {
        sqlError(res, 'evaluation-routes GET /courses/:courseId/evaluation-routes/:routeId', error);
    }
};

const upsertEvaluationRoute = async(req, res) => {
    const { courseId } = req.params;
    const parsedCourseId = parseInt(courseId, 10);
    const userId = req.session.userId;
    const { name, sections, conclusions } = req.body;

    if (Number.isNaN(parsedCourseId)) {
        return res.status(400).json({ error: 'CourseId invalid' });
    }

    if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'El nom de la ruta d\'avaluacio es obligatori' });
    }

    if (!Array.isArray(sections)) {
        return res.status(400).json({ error: 'Els apartats de la ruta d\'avaluacio son obligatoris' });
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
            sections: normalizeSections(sections),
            conclusions: normalizedConclusions,
        };

        await query(
            `INSERT INTO evaluation_routes (course_id, user_id, name, structure_json, created_at, updated_at)
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
             FROM evaluation_routes
             WHERE course_id = ? AND name = ?
             LIMIT 1`,
            [parsedCourseId, normalizedName],
        );

        res.status(201).json({
            success: true,
            evaluationRoute: parseEvaluationRouteRow(rows[0]),
        });
    } catch (error) {
        sqlError(res, 'evaluation-routes POST /courses/:courseId/evaluation-routes', error);
    }
};

const updateEvaluationRouteById = async(req, res) => {
    const { courseId, routeId } = req.params;
    const parsedCourseId = parseInt(courseId, 10);
    const parsedRouteId = parseInt(routeId, 10);
    const userId = req.session.userId;
    const { name, sections, conclusions } = req.body;

    if (Number.isNaN(parsedCourseId) || Number.isNaN(parsedRouteId)) {
        return res.status(400).json({ error: 'Parametres invalids' });
    }

    if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'El nom de la ruta d\'avaluacio es obligatori' });
    }

    if (!Array.isArray(sections)) {
        return res.status(400).json({ error: 'Els apartats de la ruta d\'avaluacio son obligatoris' });
    }

    try {
        const access = await ensureCourseAccess(parsedCourseId, userId);
        if (!access.allowed) {
            return res.status(403).json({ error: access.reason });
        }

        const existing = await query(
            'SELECT id FROM evaluation_routes WHERE id = ? AND course_id = ? LIMIT 1',
            [parsedRouteId, parsedCourseId],
        );

        if (!existing[0]) {
            return res.status(404).json({ error: 'Ruta d\'avaluacio no trobada' });
        }

        const normalizedConclusions = {
            enabled: Boolean(conclusions?.enabled),
            title: conclusions?.title || 'Observacions finals',
            guidance: conclusions?.guidance || null,
        };

        const structurePayload = {
            sections: normalizeSections(sections),
            conclusions: normalizedConclusions,
        };

        await query(
            `UPDATE evaluation_routes
             SET name = ?, structure_json = ?, user_id = ?, updated_at = NOW()
             WHERE id = ? AND course_id = ?`,
            [
                String(name).trim(),
                JSON.stringify(structurePayload),
                userId,
                parsedRouteId,
                parsedCourseId,
            ],
        );

        const rows = await query(
            `SELECT id, course_id AS courseId, user_id AS userId, name,
                    structure_json AS structure, created_at AS createdAt,
                    updated_at AS updatedAt
             FROM evaluation_routes
             WHERE id = ? AND course_id = ?
             LIMIT 1`,
            [parsedRouteId, parsedCourseId],
        );

        res.json({
            success: true,
            evaluationRoute: parseEvaluationRouteRow(rows[0]),
        });
    } catch (error) {
        sqlError(res, 'evaluation-routes PUT /courses/:courseId/evaluation-routes/:routeId', error);
    }
};

const deleteEvaluationRouteById = async(req, res) => {
    const { courseId, routeId } = req.params;
    const parsedCourseId = parseInt(courseId, 10);
    const parsedRouteId = parseInt(routeId, 10);
    const userId = req.session.userId;

    if (Number.isNaN(parsedCourseId) || Number.isNaN(parsedRouteId)) {
        return res.status(400).json({ error: 'Parametres invalids' });
    }

    try {
        const access = await ensureCourseAccess(parsedCourseId, userId);
        if (!access.allowed) {
            return res.status(403).json({ error: access.reason });
        }

        const result = await query(
            'DELETE FROM evaluation_routes WHERE id = ? AND course_id = ?',
            [parsedRouteId, parsedCourseId],
        );

        if (!result.affectedRows) {
            return res.status(404).json({ error: 'Ruta d\'avaluacio no trobada' });
        }

        res.json({ success: true });
    } catch (error) {
        sqlError(res, 'evaluation-routes DELETE /courses/:courseId/evaluation-routes/:routeId', error);
    }
};

module.exports = {
    listEvaluationRoutesByCourse,
    getEvaluationRouteById,
    upsertEvaluationRoute,
    updateEvaluationRouteById,
    deleteEvaluationRouteById,
};

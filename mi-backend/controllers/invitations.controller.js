const readModel = require('../services/readModel');
const { query } = require('../services/db');

const canAccessCourse = async(courseId, userId) => {
    const course = await readModel.getCourseById(courseId);
    if (!course) return false;

    if (course.userId === userId) return true;

    const collaborators = await query(
        'SELECT id FROM collaborators WHERE course_id = ? AND user_id = ? LIMIT 1',
        [courseId, userId],
    );

    return Boolean(collaborators[0]);
};

const createInvitationByEmail = async(req, res) => {
    const { email, courseId } = req.body;
    const normalizedEmail = email ? email.trim().toLowerCase() : null;
    const parsedCourseId = parseInt(courseId);

    if (!normalizedEmail || Number.isNaN(parsedCourseId)) {
        return res.status(400).json({ mensaje: 'Email i courseId són requerits' });
    }

    try {
        const user = await readModel.getUserByEmail(normalizedEmail);
        if (!user) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const course = await readModel.getCourseById(parsedCourseId);
        if (!course) {
            return res.status(404).json({ mensaje: 'Curso no encontrado' });
        }

        const existingCollaborators = await query(
            'SELECT id FROM collaborators WHERE course_id = ? AND user_id = ? LIMIT 1',
            [parsedCourseId, user.id],
        );
        if (existingCollaborators[0]) {
            return res.status(400).json({ mensaje: 'El usuario ya es colaborador del curso' });
        }

        const existingPendingInvitations = await query(
            `SELECT id FROM course_invitations
             WHERE user_id = ? AND course_id = ? AND status = 'pending' LIMIT 1`,
            [user.id, parsedCourseId],
        );
        if (existingPendingInvitations[0]) {
            return res.status(400).json({ mensaje: 'Ya existe una invitación pendiente para este usuario' });
        }

        const result = await query(
            `INSERT INTO course_invitations (user_id, course_id, inviter_id, status)
             VALUES (?, ?, ?, 'pending')`,
            [user.id, parsedCourseId, req.session.userId],
        );

        const invitationRows = await query(
            `SELECT ci.id, ci.user_id AS userId, ci.course_id AS courseId, ci.status, ci.invited_at AS invitedAt,
                    inviter.name AS inviterName
             FROM course_invitations ci
             LEFT JOIN users inviter ON inviter.id = ci.inviter_id
             WHERE ci.id = ? LIMIT 1`,
            [result.insertId],
        );

        res.status(201).json({ message: 'Invitación añadida', invitation: invitationRows[0] });
    } catch (error) {
        console.error('SQL invitations POST /by-email error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

const getPendingCourseInvitations = async(req, res) => {
    const courseId = parseInt(req.params.courseId);

    if (Number.isNaN(courseId)) {
        return res.status(400).json({ error: 'courseId invàlid' });
    }

    try {
        const hasAccess = await canAccessCourse(courseId, req.session.userId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'No tens permís per veure aquestes invitacions' });
        }

        const rows = await query(
            `SELECT ci.id, ci.user_id AS userId, ci.course_id AS courseId, ci.status,
                    ci.invited_at AS invitedAt, u.name AS userName, u.email AS userEmail,
                    inviter.name AS inviterName
             FROM course_invitations ci
             INNER JOIN users u ON u.id = ci.user_id
             LEFT JOIN users inviter ON inviter.id = ci.inviter_id
             WHERE ci.course_id = ? AND ci.status = 'pending'
             ORDER BY ci.invited_at DESC, ci.id DESC`,
            [courseId],
        );

        res.json({ invitations: rows });
    } catch (error) {
        console.error('SQL invitations GET /course/:courseId/pending error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

const getUserInvitations = async(req, res) => {
    const userId = parseInt(req.params.userId);

    if (req.session.userId !== userId) {
        return res.status(403).json({ mensaje: 'No tens permís per veure aquestes invitacions' });
    }

    try {
        const user = await readModel.getUserById(userId);
        if (!user) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const courseInvitations = await readModel.getInvitationsByUser(userId);
        res.json({ invitations: courseInvitations });
    } catch (error) {
        console.error('SQL invitations GET /:userId error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

const acceptInvitation = async(req, res) => {
    const invitationId = parseInt(req.params.invitationId);

    try {
        const invitationRows = await query(
            'SELECT id, user_id AS userId, course_id AS courseId, status, invited_at AS invitedAt FROM course_invitations WHERE id = ? LIMIT 1',
            [invitationId],
        );
        const invitation = invitationRows[0];

        if (!invitation) {
            return res.status(404).json({ mensaje: 'Invitación no encontrada' });
        }

        if (invitation.userId !== req.session.userId) {
            return res.status(403).json({ mensaje: 'No tens permís per acceptar aquesta invitació' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ mensaje: 'Aquesta invitació ja no està pendent' });
        }

        const existingCollaborators = await query(
            'SELECT id FROM collaborators WHERE course_id = ? AND user_id = ? LIMIT 1',
            [invitation.courseId, req.session.userId],
        );

        if (!existingCollaborators[0]) {
            await query(
                `INSERT INTO collaborators (course_id, user_id, role, is_owner)
                 VALUES (?, ?, ?, 0)`,
                [invitation.courseId, req.session.userId, 'Professor/a'],
            );
        }

        await query(
            "UPDATE course_invitations SET status = 'accepted' WHERE id = ?",
            [invitationId],
        );

        const acceptedRows = await query(
            'SELECT id, user_id AS userId, course_id AS courseId, status, invited_at AS invitedAt FROM course_invitations WHERE id = ? LIMIT 1',
            [invitationId],
        );

        res.json({ message: 'Invitación aceptada', invitation: acceptedRows[0] });
    } catch (error) {
        console.error('SQL invitations POST /accept/:invitationId error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

const declineInvitation = async(req, res) => {
    const invitationId = parseInt(req.params.invitationId);

    try {
        const invitationRows = await query(
            'SELECT id, user_id AS userId, course_id AS courseId, status, invited_at AS invitedAt FROM course_invitations WHERE id = ? LIMIT 1',
            [invitationId],
        );
        const invitation = invitationRows[0];

        if (!invitation) {
            return res.status(404).json({ mensaje: 'Invitación no encontrada' });
        }

        if (invitation.userId !== req.session.userId) {
            return res.status(403).json({ mensaje: 'No tens permís per declinar aquesta invitació' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ mensaje: 'Aquesta invitació ja no està pendent' });
        }

        await query(
            "UPDATE course_invitations SET status = 'rejected' WHERE id = ?",
            [invitationId],
        );

        const rejectedRows = await query(
            'SELECT id, user_id AS userId, course_id AS courseId, status, invited_at AS invitedAt FROM course_invitations WHERE id = ? LIMIT 1',
            [invitationId],
        );

        res.json({ message: 'Invitación declinada', invitation: rejectedRows[0] });
    } catch (error) {
        console.error('SQL invitations POST /decline/:invitationId error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

const deleteInvitation = async(req, res) => {
    const invitationId = parseInt(req.params.invitationId);

    if (Number.isNaN(invitationId)) {
        return res.status(400).json({ error: 'invitationId invàlid' });
    }

    try {
        const rows = await query(
            'SELECT id, course_id AS courseId, status FROM course_invitations WHERE id = ? LIMIT 1',
            [invitationId],
        );
        const invitation = rows[0];

        if (!invitation) {
            return res.status(404).json({ error: 'Invitació no trobada' });
        }

        const course = await readModel.getCourseById(invitation.courseId);
        if (!course || course.userId !== req.session.userId) {
            return res.status(403).json({ error: 'No tens permís per eliminar aquesta invitació' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ error: 'Només es poden eliminar invitacions pendents' });
        }

        await query('DELETE FROM course_invitations WHERE id = ?', [invitationId]);
        res.json({ success: true, message: 'Invitació eliminada' });
    } catch (error) {
        console.error('SQL invitations DELETE /:invitationId error:', error.message);
        res.status(500).json({ error: 'SQL ERROR' });
    }
};

module.exports = {
    createInvitationByEmail,
    getPendingCourseInvitations,
    getUserInvitations,
    acceptInvitation,
    declineInvitation,
    deleteInvitation,
};

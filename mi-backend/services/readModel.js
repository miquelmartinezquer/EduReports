const { query } = require('./db');

const DEFAULT_AVAILABLE_COLORS = [
    { key: 'purple', name: 'Porpra', hover: 'hover:border-purple-400 hover:bg-purple-50' },
    { key: 'blue', name: 'Blau', hover: 'hover:border-blue-400 hover:bg-blue-50' },
    { key: 'green', name: 'Verd', hover: 'hover:border-green-400 hover:bg-green-50' },
    { key: 'orange', name: 'Taronja', hover: 'hover:border-orange-400 hover:bg-orange-50' },
    { key: 'red', name: 'Vermell', hover: 'hover:border-red-400 hover:bg-red-50' },
    { key: 'pink', name: 'Rosa', hover: 'hover:border-pink-400 hover:bg-pink-50' },
    { key: 'yellow', name: 'Groc', hover: 'hover:border-yellow-400 hover:bg-yellow-50' },
    { key: 'teal', name: 'Jade', hover: 'hover:border-teal-400 hover:bg-teal-50' },
    { key: 'cyan', name: 'Cian', hover: 'hover:border-cyan-400 hover:bg-cyan-50' },
    { key: 'indigo', name: 'Indi', hover: 'hover:border-indigo-400 hover:bg-indigo-50' },
    { key: 'slate', name: 'Pissarra', hover: 'hover:border-slate-400 hover:bg-slate-50' },
    { key: 'emerald', name: 'Maragda', hover: 'hover:border-emerald-400 hover:bg-emerald-50' },
];

const getUserById = async(userId) => {
    const rows = await query(
        'SELECT id, name, email, password_hash AS passwordHash, created_at AS createdAt FROM users WHERE id = ? LIMIT 1',
        [userId],
    );
    return rows[0] || null;
};

const getUserByEmail = async(email) => {
    const rows = await query(
        'SELECT id, name, email, password_hash AS passwordHash, created_at AS createdAt FROM users WHERE email = ? LIMIT 1',
        [email],
    );
    return rows[0] || null;
};

const getAllUsers = async() => {
    return query('SELECT id, name, email, created_at AS createdAt FROM users ORDER BY id');
};

const getCoursesByOwner = async(userId) => {
    return query(
        'SELECT id, user_id AS userId, name, level, created_at AS createdAt FROM courses WHERE user_id = ? ORDER BY id DESC',
        [userId],
    );
};

const getSharedCourses = async(userId) => {
    return query(
        `SELECT c.id, c.user_id AS userId, c.name, c.level, c.created_at AS createdAt
       FROM courses c
       INNER JOIN collaborators col ON col.course_id = c.id
       WHERE col.user_id = ? AND col.is_owner = 0 AND c.user_id <> ?
       ORDER BY c.id DESC`,
        [userId, userId],
    );
};

const getCourseById = async(courseId) => {
    const rows = await query(
        'SELECT id, user_id AS userId, name, level, created_at AS createdAt FROM courses WHERE id = ? LIMIT 1',
        [courseId],
    );
    return rows[0] || null;
};

const getCollaboratorsByCourse = async(courseId) => {
    return query(
        `SELECT col.id, col.course_id AS courseId, col.user_id AS userId, col.role,
              col.is_owner AS isOwner, col.added_at AS addedAt,
              u.name, u.email
       FROM collaborators col
       INNER JOIN users u ON u.id = col.user_id
       WHERE col.course_id = ?
       ORDER BY col.id`,
        [courseId],
    );
};

const getClassesByCourse = async(courseId) => {
    return query(
        'SELECT id, course_id AS courseId, name, schedule, created_at AS createdAt FROM classes WHERE course_id = ? ORDER BY id',
        [courseId],
    );
};

const getStudentsByClass = async(classId) => {
    return query(
        'SELECT id, class_id AS classId, name, age, enrolled_at AS enrolledAt FROM students WHERE class_id = ? ORDER BY id',
        [classId],
    );
};

const getReportsByStudent = async(studentId) => {
    return query(
        'SELECT id, student_id AS studentId, course_id AS courseId, title, created_at AS createdAt, html_content AS htmlContent, status FROM reports WHERE student_id = ? ORDER BY created_at DESC, id DESC',
        [studentId],
    );
};

const getLatestReportByStudent = async(studentId) => {
    const rows = await query(
        'SELECT id, student_id AS studentId, course_id AS courseId, title, created_at AS createdAt, html_content AS htmlContent, status FROM reports WHERE student_id = ? ORDER BY created_at DESC, id DESC LIMIT 1',
        [studentId],
    );
    return rows[0] || null;
};

const getReportById = async(reportId) => {
    const rows = await query(
        'SELECT id, student_id AS studentId, course_id AS courseId, title, created_at AS createdAt, html_content AS htmlContent, status FROM reports WHERE id = ? LIMIT 1',
        [reportId],
    );
    return rows[0] || null;
};

const getDraftByStudentAndUser = async(studentId, userId) => {
    const rows = await query(
        `SELECT id, student_id AS studentId, course_id AS courseId, user_id AS userId,
                elements_json AS elements, student_name AS studentName,
                course_label AS course, language, element_counter AS elementCounter,
                last_modified AS lastModified
         FROM report_drafts
         WHERE student_id = ? AND user_id = ?
         LIMIT 1`,
        [studentId, userId],
    );

    if (!rows[0]) return null;

    const draft = rows[0];
    return {
        ...draft,
        elements: draft.elements ? JSON.parse(draft.elements) : [],
    };
};

const getCourseCategories = async(courseId) => {
    const categories = await query(
        'SELECT id, category_key AS categoryKey, name, color_key AS color FROM course_categories WHERE course_id = ? ORDER BY id',
        [courseId],
    );

    const items = await query(
        `SELECT cci.course_category_id AS courseCategoryId, cci.item_text AS itemText, cci.sort_order AS sortOrder
         FROM course_category_items cci
         INNER JOIN course_categories cc ON cc.id = cci.course_category_id
         WHERE cc.course_id = ?
         ORDER BY cci.sort_order, cci.id`,
        [courseId],
    );

    const byCategoryId = {};
    for (const item of items) {
        if (!byCategoryId[item.courseCategoryId]) byCategoryId[item.courseCategoryId] = [];
        byCategoryId[item.courseCategoryId].push(item.itemText);
    }

    const result = {};
    for (const category of categories) {
        result[category.categoryKey] = {
            name: category.name,
            color: category.color,
            items: byCategoryId[category.id] || [],
        };
    }

    return result;
};

const getAvailableColors = async() => {
    let rows = await query('SELECT color_key AS `key`, name, hover_class AS hover FROM available_colors ORDER BY color_key');

    if (rows.length === 0) {
        for (const color of DEFAULT_AVAILABLE_COLORS) {
            await query(
                'INSERT IGNORE INTO available_colors (color_key, name, hover_class) VALUES (?, ?, ?)',
                [color.key, color.name, color.hover],
            );
        }

        rows = await query('SELECT color_key AS `key`, name, hover_class AS hover FROM available_colors ORDER BY color_key');
    }

    return rows;
};

const getInvitationsByUser = async(userId) => {
    return query(
        `SELECT ci.id, ci.user_id AS userId, ci.course_id AS courseId, ci.status,
              ci.invited_at AS invitedAt, c.name AS courseName, c.level AS courseLevel
       FROM course_invitations ci
       INNER JOIN courses c ON c.id = ci.course_id
       WHERE ci.user_id = ?
       ORDER BY ci.id DESC`,
        [userId],
    );
};

module.exports = {
    getUserById,
    getUserByEmail,
    getAllUsers,
    getCoursesByOwner,
    getSharedCourses,
    getCourseById,
    getCollaboratorsByCourse,
    getClassesByCourse,
    getStudentsByClass,
    getReportsByStudent,
    getLatestReportByStudent,
    getReportById,
    getDraftByStudentAndUser,
    getCourseCategories,
    getAvailableColors,
    getInvitationsByUser,
};

const readModel = require('../services/readModel');
const { query } = require('../services/db');

const sqlError = (res, context, error) => {
    console.error(`SQL ${context} error:`, error.message);
    return res.status(500).json({ error: 'SQL ERROR' });
};

const ensureColorExists = async(colorKey) => {
    if (!colorKey) return;

    const rows = await query(
        'SELECT color_key FROM available_colors WHERE color_key = ? LIMIT 1',
        [colorKey],
    );

    if (!rows[0]) {
        await query(
            'INSERT INTO available_colors (color_key, name, hover_class) VALUES (?, ?, ?)',
            [colorKey, colorKey, null],
        );
    }
};

const getCourses = async(req, res) => {
    try {
        const userId = req.session.userId;
        const userCourses = await readModel.getCoursesByOwner(userId);
        res.json(userCourses);
    } catch (error) {
        sqlError(res, 'courses GET /', error);
    }
};

const getSharedCourses = async(req, res) => {
    try {
        const userId = req.session.userId;
        const sharedCourses = await readModel.getSharedCourses(userId);
        res.json(sharedCourses);
    } catch (error) {
        sqlError(res, 'courses GET /shared', error);
    }
};

const getCourseById = async(req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;
        const courseId = parseInt(id);
        const course = await readModel.getCourseById(courseId);

        const isOwner = course && course.userId === userId;
        const dbCollaborators = await readModel.getCollaboratorsByCourse(courseId);
        const isCollaborator = !!dbCollaborators.find((c) =>
            c.courseId === courseId && c.userId === userId,
        );

        if (!course || (!isOwner && !isCollaborator)) {
            return res.status(404).json({ error: 'Curs no trobat o no tens permís per accedir-hi' });
        }

        const classes = await readModel.getClassesByCourse(courseId);
        const classesWithStudents = await Promise.all(
            classes.map(async(classItem) => {
                const students = await readModel.getStudentsByClass(classItem.id);
                return {
                    ...classItem,
                    students,
                };
            }),
        );

        res.json({
            ...course,
            collaborators: dbCollaborators,
            classes: classesWithStudents,
        });
    } catch (error) {
        sqlError(res, 'courses GET /:id', error);
    }
};

const createCourse = async(req, res) => {
    const { name, level } = req.body;
    const userId = req.session.userId;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'El nom del curs és requerit' });
    }

    if (!level || !level.trim()) {
        return res.status(400).json({ error: 'El nivell del curs és requerit' });
    }

    try {
        const result = await query(
            'INSERT INTO courses (user_id, name, level, created_at) VALUES (?, ?, ?, CURDATE())',
            [userId, name.trim(), level.trim()],
        );

        await query(
            `INSERT INTO collaborators (course_id, user_id, role, is_owner, added_at)
             VALUES (?, ?, 'Professor/a', 1, NOW())`,
            [result.insertId, userId],
        );

        const course = await readModel.getCourseById(result.insertId);

        res.status(201).json({
            success: true,
            course,
        });
    } catch (error) {
        sqlError(res, 'courses POST /', error);
    }
};

const deleteCourse = async(req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;

    try {
        const rows = await query(
            'SELECT id, user_id AS userId, name, level, created_at AS createdAt FROM courses WHERE id = ? AND user_id = ? LIMIT 1',
            [parseInt(id), userId],
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Curs no trobat o no tens permís per eliminar-lo' });
        }

        await query('DELETE FROM courses WHERE id = ? AND user_id = ?', [parseInt(id), userId]);

        res.json({
            success: true,
            course: rows[0],
        });
    } catch (error) {
        sqlError(res, 'courses DELETE /:id', error);
    }
};

const updateCourse = async(req, res) => {
    const { id } = req.params;
    const { name, level } = req.body;
    const userId = req.session.userId;

    try {
        const course = await query(
            'SELECT id, user_id AS userId, name, level, created_at AS createdAt FROM courses WHERE id = ? AND user_id = ? LIMIT 1',
            [parseInt(id), userId],
        );

        if (!course[0]) {
            return res.status(404).json({ error: 'Curs no trobat o no tens permís per modificar-lo' });
        }

        const updatedName = name && name.trim() ? name.trim() : course[0].name;
        const updatedLevel = level && level.trim() ? level.trim() : course[0].level;

        await query(
            'UPDATE courses SET name = ?, level = ? WHERE id = ? AND user_id = ?',
            [updatedName, updatedLevel, parseInt(id), userId],
        );

        const updated = await readModel.getCourseById(parseInt(id));

        res.json({
            success: true,
            course: updated,
        });
    } catch (error) {
        sqlError(res, 'courses PUT /:id', error);
    }
};

const getCollaborators = async(req, res) => {
    try {
        const { courseId } = req.params;
        const collaborators = await readModel.getCollaboratorsByCourse(parseInt(courseId));
        res.json(collaborators);
    } catch (error) {
        sqlError(res, 'courses GET /:courseId/collaborators', error);
    }
};

const addCollaborator = async(req, res) => {
    const { courseId } = req.params;
    const { userId, role, email } = req.body;

    try {
        const course = await readModel.getCourseById(parseInt(courseId));
        if (!course) {
            return res.status(404).json({ error: 'Curs no trobat' });
        }

        let collaboratorUserId = userId ? parseInt(userId) : null;
        if (!collaboratorUserId && email) {
            const userByEmail = await readModel.getUserByEmail(email.trim().toLowerCase());
            if (userByEmail) collaboratorUserId = userByEmail.id;
        }

        if (!collaboratorUserId) {
            return res.status(400).json({ error: 'User no trobat. Introdueix un email registrat.' });
        }

        const collaboratorUser = await readModel.getUserById(collaboratorUserId);
        if (!collaboratorUser) {
            return res.status(404).json({ error: 'Usuari no trobat' });
        }

        if (!role || !role.trim()) {
            return res.status(400).json({ error: 'El rol és requerit' });
        }

        const alreadyCollaborator = await query(
            'SELECT id FROM collaborators WHERE course_id = ? AND user_id = ? LIMIT 1',
            [parseInt(courseId), collaboratorUserId],
        );

        if (alreadyCollaborator[0]) {
            return res.status(400).json({ error: 'Aquest usuari ja és col·laborador del curs' });
        }

        const result = await query(
            'INSERT INTO collaborators (course_id, user_id, role, is_owner, added_at) VALUES (?, ?, ?, 0, NOW())',
            [parseInt(courseId), collaboratorUserId, role.trim()],
        );

        const rows = await query(
            `SELECT col.id, col.course_id AS courseId, col.user_id AS userId, col.role,
                    col.is_owner AS isOwner, col.added_at AS addedAt, u.name, u.email
             FROM collaborators col
             INNER JOIN users u ON u.id = col.user_id
             WHERE col.id = ? LIMIT 1`,
            [result.insertId],
        );

        res.status(201).json({
            success: true,
            collaborator: rows[0],
        });
    } catch (error) {
        sqlError(res, 'courses POST /:courseId/collaborators', error);
    }
};

const deleteCollaborator = async(req, res) => {
    const { id } = req.params;

    try {
        const rows = await query(
            'SELECT id, is_owner AS isOwner FROM collaborators WHERE id = ? LIMIT 1',
            [parseInt(id)],
        );
        const collaborator = rows[0];

        if (!collaborator) {
            return res.status(404).json({ error: 'Col·laborador no trobat' });
        }

        if (collaborator.isOwner) {
            return res.status(403).json({ error: 'No es pot eliminar el creador del curs' });
        }

        await query('DELETE FROM collaborators WHERE id = ?', [parseInt(id)]);

        res.json({
            success: true,
            collaborator,
        });
    } catch (error) {
        sqlError(res, 'courses DELETE /:courseId/collaborators/:id', error);
    }
};

const getClasses = async(req, res) => {
    try {
        const { courseId } = req.params;
        const classes = await readModel.getClassesByCourse(parseInt(courseId));

        const classesWithStudents = await Promise.all(
            classes.map(async(classItem) => {
                const students = await readModel.getStudentsByClass(classItem.id);
                return {
                    ...classItem,
                    students,
                };
            }),
        );

        res.json(classesWithStudents);
    } catch (error) {
        sqlError(res, 'courses GET /:courseId/classes', error);
    }
};

const createClass = async(req, res) => {
    const { courseId } = req.params;
    const { name, schedule } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'El nom de la classe és requerit' });
    }

    try {
        const result = await query(
            'INSERT INTO classes (course_id, name, schedule, created_at) VALUES (?, ?, ?, CURDATE())',
            [parseInt(courseId), name.trim(), schedule ? schedule.trim() : null],
        );

        const rows = await query(
            'SELECT id, course_id AS courseId, name, schedule, created_at AS createdAt FROM classes WHERE id = ? LIMIT 1',
            [result.insertId],
        );

        res.status(201).json({
            success: true,
            class: { ...rows[0], students: [] },
        });
    } catch (error) {
        sqlError(res, 'courses POST /:courseId/classes', error);
    }
};

const updateClass = async(req, res) => {
    const { courseId, id } = req.params;
    const { name, schedule } = req.body;

    if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'El nom de la classe és requerit' });
    }

    try {
        const existingRows = await query(
            'SELECT id, course_id AS courseId, name, schedule, created_at AS createdAt FROM classes WHERE id = ? AND course_id = ? LIMIT 1',
            [parseInt(id), parseInt(courseId)],
        );

        if (!existingRows[0]) {
            return res.status(404).json({ error: 'Classe no trobada' });
        }

        const normalizedSchedule = (() => {
            const value = String(schedule || '').trim();
            return value || null;
        })();

        await query(
            'UPDATE classes SET name = ?, schedule = ? WHERE id = ? AND course_id = ?',
            [String(name).trim(), normalizedSchedule, parseInt(id), parseInt(courseId)],
        );

        const rows = await query(
            'SELECT id, course_id AS courseId, name, schedule, created_at AS createdAt FROM classes WHERE id = ? LIMIT 1',
            [parseInt(id)],
        );

        res.json({
            success: true,
            class: rows[0],
        });
    } catch (error) {
        sqlError(res, 'courses PUT /:courseId/classes/:id', error);
    }
};

const deleteClass = async(req, res) => {
    const { id } = req.params;

    try {
        const rows = await query(
            'SELECT id, course_id AS courseId, name, schedule, created_at AS createdAt FROM classes WHERE id = ? LIMIT 1',
            [parseInt(id)],
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Classe no trobada' });
        }

        await query('DELETE FROM classes WHERE id = ?', [parseInt(id)]);

        res.json({
            success: true,
            class: rows[0],
        });
    } catch (error) {
        sqlError(res, 'courses DELETE /:courseId/classes/:id', error);
    }
};

const getStudentsByClass = async(req, res) => {
    try {
        const { classId } = req.params;
        const students = await readModel.getStudentsByClass(parseInt(classId));
        res.json(students);
    } catch (error) {
        sqlError(res, 'courses GET /:courseId/classes/:classId/students', error);
    }
};

const addStudent = async(req, res) => {
    const { classId } = req.params;
    const { name, lastName, age, gender } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'El nom de l\'alumne és requerit' });
    }

    const normalizedGender = (() => {
        const value = String(gender || '').trim().toLowerCase();
        if (!value) return null;

        const allowedValues = ['nen', 'nena', 'altre', 'no_indicat'];
        if (!allowedValues.includes(value)) {
            return undefined;
        }
        return value;
    })();

    if (normalizedGender === undefined) {
        return res.status(400).json({ error: 'Gènere invàlid' });
    }

    try {
        const normalizedLastName = (() => {
            const value = String(lastName || '').trim();
            return value || null;
        })();

        const result = await query(
            'INSERT INTO students (class_id, name, last_name, gender, age, enrolled_at) VALUES (?, ?, ?, ?, ?, CURDATE())',
            [parseInt(classId), name.trim(), normalizedLastName, normalizedGender, age || null],
        );

        const rows = await query(
            'SELECT id, class_id AS classId, name, last_name AS lastName, gender, age, enrolled_at AS enrolledAt FROM students WHERE id = ? LIMIT 1',
            [result.insertId],
        );

        res.status(201).json({
            success: true,
            student: rows[0],
        });
    } catch (error) {
        sqlError(res, 'courses POST /:courseId/classes/:classId/students', error);
    }
};

const updateStudent = async(req, res) => {
    const { id } = req.params;
    const { name, lastName, age, gender } = req.body;

    if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'El nom de l\'alumne és requerit' });
    }

    const normalizedGender = (() => {
        const value = String(gender || '').trim().toLowerCase();
        if (!value) return null;

        const allowedValues = ['nen', 'nena', 'altre', 'no_indicat'];
        if (!allowedValues.includes(value)) {
            return undefined;
        }
        return value;
    })();

    if (normalizedGender === undefined) {
        return res.status(400).json({ error: 'Gènere invàlid' });
    }

    const normalizedLastName = (() => {
        const value = String(lastName || '').trim();
        return value || null;
    })();

    const normalizedAge = age === null || age === undefined || age === ''
        ? null
        : parseInt(age, 10);

    if (normalizedAge !== null && Number.isNaN(normalizedAge)) {
        return res.status(400).json({ error: 'Edat invàlida' });
    }

    try {
        const existingRows = await query(
            'SELECT id, class_id AS classId, name, last_name AS lastName, gender, age, enrolled_at AS enrolledAt FROM students WHERE id = ? LIMIT 1',
            [parseInt(id)],
        );

        if (!existingRows[0]) {
            return res.status(404).json({ error: 'Alumne no trobat' });
        }

        await query(
            'UPDATE students SET name = ?, last_name = ?, gender = ?, age = ? WHERE id = ?',
            [String(name).trim(), normalizedLastName, normalizedGender, normalizedAge, parseInt(id)],
        );

        const rows = await query(
            'SELECT id, class_id AS classId, name, last_name AS lastName, gender, age, enrolled_at AS enrolledAt FROM students WHERE id = ? LIMIT 1',
            [parseInt(id)],
        );

        res.json({
            success: true,
            student: rows[0],
        });
    } catch (error) {
        sqlError(res, 'courses PUT /:courseId/classes/:classId/students/:id', error);
    }
};

const deleteStudent = async(req, res) => {
    const { id } = req.params;

    try {
        const rows = await query(
            'SELECT id, class_id AS classId, name, last_name AS lastName, gender, age, enrolled_at AS enrolledAt FROM students WHERE id = ? LIMIT 1',
            [parseInt(id)],
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Alumne no trobat' });
        }

        await query('DELETE FROM students WHERE id = ?', [parseInt(id)]);

        res.json({
            success: true,
            student: rows[0],
        });
    } catch (error) {
        sqlError(res, 'courses DELETE /:courseId/classes/:classId/students/:id', error);
    }
};

const getCategoryColors = async(req, res) => {
    try {
        const colors = await readModel.getAvailableColors();
        res.json(colors);
    } catch (error) {
        sqlError(res, 'courses GET /:courseId/categories/colors', error);
    }
};

const getCategories = async(req, res) => {
    try {
        const { courseId } = req.params;
        const categories = await readModel.getCourseCategories(parseInt(courseId));
        res.json(categories);
    } catch (error) {
        sqlError(res, 'courses GET /:courseId/categories', error);
    }
};

const normalizeCategoryKey = (value) => {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s_-]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60);
};

const importCategories = async(req, res) => {
    const parsedCourseId = parseInt(req.params.courseId);
    const userId = req.session.userId;
    const { categories: incomingCategories } = req.body || {};

    if (Number.isNaN(parsedCourseId)) {
        return res.status(400).json({ error: 'courseId invàlid' });
    }

    if (!Array.isArray(incomingCategories) || incomingCategories.length === 0) {
        return res.status(400).json({ error: 'No s\'han rebut categories per importar' });
    }

    try {
        const course = await readModel.getCourseById(parsedCourseId);
        if (!course) {
            return res.status(404).json({ error: 'Curs no trobat' });
        }

        const isOwner = course.userId === userId;
        const collaborators = await readModel.getCollaboratorsByCourse(parsedCourseId);
        const isCollaborator = collaborators.some((collab) => collab.userId === userId);

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ error: 'No tens permís per importar en aquest curs' });
        }

        const normalizedCategories = incomingCategories
            .map((category) => {
                const categoryName = String(category?.name || '').trim();
                const items = Array.isArray(category?.items)
                    ? category.items
                        .map((item) => String(item || '').trim())
                        .filter((item) => item.length > 0)
                    : [];
                return { name: categoryName, items };
            })
            .filter((category) => category.name.length > 0);

        if (normalizedCategories.length === 0) {
            return res.status(400).json({ error: 'No hi ha categories vàlides al fitxer' });
        }

        await query('DELETE FROM course_categories WHERE course_id = ?', [parsedCourseId]);

        const usedKeys = new Set();
        let totalItems = 0;

        for (const category of normalizedCategories) {
            const baseKey = normalizeCategoryKey(category.name) || 'categoria';
            let nextKey = baseKey;
            let suffix = 2;

            while (usedKeys.has(nextKey)) {
                nextKey = `${baseKey}_${suffix}`;
                suffix += 1;
            }

            usedKeys.add(nextKey);

            const categoryInsert = await query(
                'INSERT INTO course_categories (course_id, category_key, name, color_key) VALUES (?, ?, ?, ?)',
                [parsedCourseId, nextKey, category.name, 'purple'],
            );

            for (let index = 0; index < category.items.length; index += 1) {
                await query(
                    'INSERT INTO course_category_items (course_category_id, item_text, sort_order) VALUES (?, ?, ?)',
                    [categoryInsert.insertId, category.items[index], index],
                );
                totalItems += 1;
            }
        }

        return res.status(200).json({
            success: true,
            imported: {
                categories: normalizedCategories.length,
                items: totalItems,
            },
        });
    } catch (error) {
        sqlError(res, 'courses POST /:courseId/categories/import', error);
    }
};

const escapeCsvCell = (value) => {
    const text = String(value ?? '');
    if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
};

const sanitizeFileName = (value) => {
    return String(value || 'curs')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '');
};

const exportCategoriesCsv = async(req, res) => {
    const parsedCourseId = parseInt(req.params.courseId);
    const userId = req.session.userId;

    if (Number.isNaN(parsedCourseId)) {
        return res.status(400).json({ error: 'courseId invàlid' });
    }

    try {
        const course = await readModel.getCourseById(parsedCourseId);
        if (!course) {
            return res.status(404).json({ error: 'Curs no trobat' });
        }

        const isOwner = course.userId === userId;
        const collaborators = await readModel.getCollaboratorsByCourse(parsedCourseId);
        const isCollaborator = collaborators.some((collab) => collab.userId === userId);

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ error: 'No tens permís per exportar aquest curs' });
        }

        const categories = await readModel.getCourseCategories(parsedCourseId);
        const categoryKeys = Object.keys(categories || {});

        if (categoryKeys.length === 0) {
            return res.status(400).json({ error: 'No hi ha categories per exportar' });
        }

        const headers = categoryKeys.map((key) => categories[key]?.name || key);
        const maxItems = categoryKeys.reduce((max, key) => {
            const items = Array.isArray(categories[key]?.items) ? categories[key].items.length : 0;
            return Math.max(max, items);
        }, 0);

        const rows = [];
        rows.push(headers.map(escapeCsvCell).join(','));

        for (let index = 0; index < maxItems; index += 1) {
            const row = categoryKeys.map((key) => {
                const items = Array.isArray(categories[key]?.items) ? categories[key].items : [];
                return escapeCsvCell(items[index] || '');
            });
            rows.push(row.join(','));
        }

        const csvContent = `\uFEFF${rows.join('\r\n')}`;
        const courseNameSlug = sanitizeFileName(course.name) || 'sense-nom';
        const fileName = `${courseNameSlug}-items.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.status(200).send(csvContent);
    } catch (error) {
        sqlError(res, 'courses GET /:courseId/categories/export/csv', error);
    }
};

const createCategory = async(req, res) => {
    const { courseId } = req.params;
    const { key, name, color, items } = req.body;

    if (!key || !name) {
        return res.status(400).json({ error: 'key i name són requerits' });
    }

    try {
        await ensureColorExists(color || 'purple');

        const duplicate = await query(
            'SELECT id FROM course_categories WHERE course_id = ? AND category_key = ? LIMIT 1',
            [parseInt(courseId), key],
        );

        if (duplicate[0]) {
            return res.status(400).json({ error: 'Aquesta categoria ja existeix en aquest curs' });
        }

        const result = await query(
            'INSERT INTO course_categories (course_id, category_key, name, color_key) VALUES (?, ?, ?, ?)',
            [parseInt(courseId), key, name, color || 'purple'],
        );

        if (Array.isArray(items) && items.length > 0) {
            for (let i = 0; i < items.length; i += 1) {
                await query(
                    'INSERT INTO course_category_items (course_category_id, item_text, sort_order) VALUES (?, ?, ?)',
                    [result.insertId, items[i], i],
                );
            }
        }

        const categories = await readModel.getCourseCategories(parseInt(courseId));

        res.status(201).json({
            success: true,
            category: categories[key],
            key,
        });
    } catch (error) {
        sqlError(res, 'courses POST /:courseId/categories', error);
    }
};

const updateCategory = async(req, res) => {
    const { courseId, key } = req.params;
    const { name, color, items } = req.body;

    try {
        const rows = await query(
            'SELECT id FROM course_categories WHERE course_id = ? AND category_key = ? LIMIT 1',
            [parseInt(courseId), key],
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Categoria no trobada' });
        }

        const categoryId = rows[0].id;

        if (name || color) {
            if (color) {
                await ensureColorExists(color);
            }

            await query(
                'UPDATE course_categories SET name = COALESCE(?, name), color_key = COALESCE(?, color_key) WHERE id = ?',
                [name || null, color || null, categoryId],
            );
        }

        if (Array.isArray(items)) {
            await query('DELETE FROM course_category_items WHERE course_category_id = ?', [categoryId]);
            for (let i = 0; i < items.length; i += 1) {
                await query(
                    'INSERT INTO course_category_items (course_category_id, item_text, sort_order) VALUES (?, ?, ?)',
                    [categoryId, items[i], i],
                );
            }
        }

        const categories = await readModel.getCourseCategories(parseInt(courseId));

        res.json({
            success: true,
            category: categories[key],
        });
    } catch (error) {
        sqlError(res, 'courses PUT /:courseId/categories/:key', error);
    }
};

const deleteCategory = async(req, res) => {
    const { courseId, key } = req.params;

    try {
        const result = await query(
            'DELETE FROM course_categories WHERE course_id = ? AND category_key = ?',
            [parseInt(courseId), key],
        );

        if (!result.affectedRows) {
            return res.status(404).json({ error: 'Categoria no trobada' });
        }

        res.json({ success: true, message: 'Categoria eliminada' });
    } catch (error) {
        sqlError(res, 'courses DELETE /:courseId/categories/:key', error);
    }
};

const addCategoryItem = async(req, res) => {
    const { courseId, key } = req.params;
    const { item } = req.body;

    if (!item) {
        return res.status(400).json({ error: 'item és requerit' });
    }

    try {
        const rows = await query(
            'SELECT id FROM course_categories WHERE course_id = ? AND category_key = ? LIMIT 1',
            [parseInt(courseId), key],
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Categoria no trobada' });
        }

        const categoryId = rows[0].id;
        const orderRows = await query(
            'SELECT COALESCE(MAX(sort_order), -1) + 1 AS nextOrder FROM course_category_items WHERE course_category_id = ?',
            [categoryId],
        );

        await query(
            'INSERT INTO course_category_items (course_category_id, item_text, sort_order) VALUES (?, ?, ?)',
            [categoryId, item, orderRows[0].nextOrder],
        );

        const categories = await readModel.getCourseCategories(parseInt(courseId));
        res.status(201).json({
            success: true,
            items: categories[key]?.items || [],
        });
    } catch (error) {
        sqlError(res, 'courses POST /:courseId/categories/:key/items', error);
    }
};

const deleteCategoryItem = async(req, res) => {
    const { courseId, key, index } = req.params;
    const itemIndex = parseInt(index);

    try {
        const rows = await query(
            'SELECT id FROM course_categories WHERE course_id = ? AND category_key = ? LIMIT 1',
            [parseInt(courseId), key],
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Categoria no trobada' });
        }

        const categoryId = rows[0].id;
        const itemRows = await query(
            'SELECT id FROM course_category_items WHERE course_category_id = ? ORDER BY sort_order, id',
            [categoryId],
        );

        if (itemIndex < 0 || itemIndex >= itemRows.length) {
            return res.status(404).json({ error: 'Item no trobat' });
        }

        await query('DELETE FROM course_category_items WHERE id = ?', [itemRows[itemIndex].id]);

        const categories = await readModel.getCourseCategories(parseInt(courseId));
        res.json({
            success: true,
            items: categories[key]?.items || [],
        });
    } catch (error) {
        sqlError(res, 'courses DELETE /:courseId/categories/:key/items/:index', error);
    }
};

const getStudentReports = async(req, res) => {
    try {
        const { studentId } = req.params;
        const reports = await readModel.getReportsByStudent(parseInt(studentId));
        res.json(reports);
    } catch (error) {
        sqlError(res, 'courses GET /:courseId/students/:studentId/reports', error);
    }
};

const getLatestStudentReport = async(req, res) => {
    try {
        const { studentId } = req.params;
        const latestReport = await readModel.getLatestReportByStudent(parseInt(studentId));
        res.json(latestReport);
    } catch (error) {
        sqlError(res, 'courses GET /:courseId/students/:studentId/reports/latest', error);
    }
};

const getReportById = async(req, res) => {
    try {
        const { reportId } = req.params;
        const report = await readModel.getReportById(parseInt(reportId));

        if (!report) {
            return res.status(404).json({ error: 'Informe no trobat' });
        }

        res.json(report);
    } catch (error) {
        sqlError(res, 'courses GET /:courseId/reports/:reportId', error);
    }
};

const createStudentReport = async(req, res) => {
    const { courseId, studentId } = req.params;
    const { title, htmlContent } = req.body;

    try {
        const result = await query(
            `INSERT INTO reports (student_id, course_id, title, created_at, html_content, status)
             VALUES (?, ?, ?, CURDATE(), ?, 'completed')`,
            [parseInt(studentId), parseInt(courseId), title || 'Informe sense títol', htmlContent || ''],
        );

        const report = await readModel.getReportById(result.insertId);

        res.status(201).json({
            success: true,
            report,
        });
    } catch (error) {
        sqlError(res, 'courses POST /:courseId/students/:studentId/reports', error);
    }
};

const updateReport = async(req, res) => {
    const { courseId, reportId } = req.params;
    const { title, htmlContent, status } = req.body;

    try {
        const parsedCourseId = parseInt(courseId);
        const parsedReportId = parseInt(reportId);
        const userId = req.session.userId;

        if (Number.isNaN(parsedCourseId) || Number.isNaN(parsedReportId)) {
            return res.status(400).json({ error: 'Paràmetres invàlids' });
        }

        const report = await readModel.getReportById(parsedReportId);

        if (!report) {
            return res.status(404).json({ error: 'Informe no trobat' });
        }

        if (report.courseId !== parsedCourseId) {
            return res.status(404).json({ error: 'Informe no trobat' });
        }

        const course = await readModel.getCourseById(parsedCourseId);
        if (!course) {
            return res.status(404).json({ error: 'Curs no trobat' });
        }

        const isOwner = course.userId === userId;
        const collaborators = await readModel.getCollaboratorsByCourse(parsedCourseId);
        const isCollaborator = collaborators.some((c) => c.userId === userId);

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ error: 'No tens permís per editar aquest informe' });
        }

        await query(
            'UPDATE reports SET title = ?, html_content = ?, status = ? WHERE id = ?',
            [title || report.title, htmlContent || report.htmlContent, status || report.status, parsedReportId],
        );

        const updated = await readModel.getReportById(parsedReportId);

        res.json({
            success: true,
            report: updated,
        });
    } catch (error) {
        sqlError(res, 'courses PUT /:courseId/reports/:reportId', error);
    }
};

const deleteReport = async(req, res) => {
    const { courseId, reportId } = req.params;

    try {
        const parsedCourseId = parseInt(courseId);
        const parsedReportId = parseInt(reportId);

        if (Number.isNaN(parsedCourseId) || Number.isNaN(parsedReportId)) {
            return res.status(400).json({ error: 'Paràmetres invàlids' });
        }

        const report = await readModel.getReportById(parsedReportId);

        if (!report || report.courseId !== parsedCourseId) {
            return res.status(404).json({ error: 'Informe no trobat' });
        }

        await query('DELETE FROM reports WHERE id = ? AND course_id = ?', [parsedReportId, parsedCourseId]);

        res.json({
            success: true,
            report,
        });
    } catch (error) {
        sqlError(res, 'courses DELETE /:courseId/reports/:reportId', error);
    }
};

const deleteStudentReport = async(req, res) => {
    const { courseId, studentId, reportId } = req.params;

    try {
        const parsedCourseId = parseInt(courseId);
        const parsedStudentId = parseInt(studentId);
        const parsedReportId = parseInt(reportId);

        if (
            Number.isNaN(parsedCourseId) ||
            Number.isNaN(parsedStudentId) ||
            Number.isNaN(parsedReportId)
        ) {
            return res.status(400).json({ error: 'Paràmetres invàlids' });
        }

        const report = await readModel.getReportById(parsedReportId);

        if (
            !report ||
            report.courseId !== parsedCourseId ||
            report.studentId !== parsedStudentId
        ) {
            return res.status(404).json({ error: 'Informe no trobat' });
        }

        await query(
            'DELETE FROM reports WHERE id = ? AND course_id = ? AND student_id = ?',
            [parsedReportId, parsedCourseId, parsedStudentId],
        );

        res.json({
            success: true,
            report,
        });
    } catch (error) {
        sqlError(res, 'courses DELETE /:courseId/students/:studentId/reports/:reportId', error);
    }
};

module.exports = {
    getCourses,
    getSharedCourses,
    getCourseById,
    createCourse,
    deleteCourse,
    updateCourse,
    getCollaborators,
    addCollaborator,
    deleteCollaborator,
    getClasses,
    createClass,
    updateClass,
    deleteClass,
    getStudentsByClass,
    addStudent,
    updateStudent,
    deleteStudent,
    getCategoryColors,
    getCategories,
    importCategories,
    exportCategoriesCsv,
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryItem,
    deleteCategoryItem,
    getStudentReports,
    getLatestStudentReport,
    getReportById,
    createStudentReport,
    updateReport,
    deleteReport,
    deleteStudentReport,
};

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

const getUserCategories = async(req, res) => {
    const userId = req.session.userId;

    try {
        const categories = await query(
            `SELECT uc.id, uc.category_key AS categoryKey, uc.name, uc.color_key AS color,
                    uci.item_text AS itemText, uci.sort_order AS sortOrder
             FROM user_categories uc
             LEFT JOIN user_category_items uci ON uci.user_category_id = uc.id
             WHERE uc.user_id = ?
             ORDER BY uc.id, uci.sort_order, uci.id`,
            [userId],
        );

        const grouped = {};
        for (const row of categories) {
            if (!grouped[row.categoryKey]) {
                grouped[row.categoryKey] = {
                    name: row.name,
                    color: row.color,
                    items: [],
                };
            }
            if (row.itemText) grouped[row.categoryKey].items.push(row.itemText);
        }

        res.json(grouped);
    } catch (error) {
        sqlError(res, 'userCategories GET /', error);
    }
};

const getAvailableColors = async(req, res) => {
    try {
        const colors = await readModel.getAvailableColors();
        res.json(colors);
    } catch (error) {
        sqlError(res, 'userCategories GET /colors', error);
    }
};

const createUserCategory = async(req, res) => {
    const { key, name, color, items } = req.body;
    const userId = req.session.userId;

    if (!key || !name) {
        return res.status(400).json({ error: 'key i name són requerits' });
    }

    try {
        await ensureColorExists(color || 'purple');

        const duplicate = await query(
            'SELECT id FROM user_categories WHERE user_id = ? AND category_key = ? LIMIT 1',
            [userId, key],
        );

        if (duplicate[0]) {
            return res.status(400).json({ error: 'Aquesta categoria ja existeix' });
        }

        const result = await query(
            'INSERT INTO user_categories (user_id, category_key, name, color_key) VALUES (?, ?, ?, ?)',
            [userId, key, name, color || 'purple'],
        );

        if (Array.isArray(items)) {
            for (let i = 0; i < items.length; i += 1) {
                await query(
                    'INSERT INTO user_category_items (user_category_id, item_text, sort_order) VALUES (?, ?, ?)',
                    [result.insertId, items[i], i],
                );
            }
        }

        res.status(201).json({
            success: true,
            key,
            category: {
                name,
                color: color || 'purple',
                items: Array.isArray(items) ? items : [],
            },
        });
    } catch (error) {
        sqlError(res, 'userCategories POST /', error);
    }
};

const updateUserCategory = async(req, res) => {
    const { key } = req.params;
    const { name, color, items } = req.body;
    const userId = req.session.userId;

    try {
        const rows = await query(
            'SELECT id, name, color_key AS color FROM user_categories WHERE user_id = ? AND category_key = ? LIMIT 1',
            [userId, key],
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Categoria no trobada' });
        }

        const category = rows[0];

        if (color) {
            await ensureColorExists(color);
        }

        await query(
            'UPDATE user_categories SET name = COALESCE(?, name), color_key = COALESCE(?, color_key) WHERE id = ?',
            [name || null, color || null, category.id],
        );

        if (Array.isArray(items)) {
            await query('DELETE FROM user_category_items WHERE user_category_id = ?', [category.id]);
            for (let i = 0; i < items.length; i += 1) {
                await query(
                    'INSERT INTO user_category_items (user_category_id, item_text, sort_order) VALUES (?, ?, ?)',
                    [category.id, items[i], i],
                );
            }
        }

        const itemRows = await query(
            'SELECT item_text AS itemText FROM user_category_items WHERE user_category_id = ? ORDER BY sort_order, id',
            [category.id],
        );

        res.json({
            success: true,
            category: {
                name: name || category.name,
                color: color || category.color,
                items: itemRows.map((i) => i.itemText),
            },
        });
    } catch (error) {
        sqlError(res, 'userCategories PUT /:key', error);
    }
};

const deleteUserCategory = async(req, res) => {
    const { key } = req.params;
    const userId = req.session.userId;

    try {
        const result = await query(
            'DELETE FROM user_categories WHERE user_id = ? AND category_key = ?',
            [userId, key],
        );

        if (!result.affectedRows) {
            return res.status(404).json({ error: 'Categoria no trobada' });
        }

        res.json({ success: true, message: 'Categoria eliminada' });
    } catch (error) {
        sqlError(res, 'userCategories DELETE /:key', error);
    }
};

const addUserCategoryItem = async(req, res) => {
    const { key } = req.params;
    const { item } = req.body;
    const userId = req.session.userId;

    if (!item) {
        return res.status(400).json({ error: 'item és requerit' });
    }

    try {
        const rows = await query(
            'SELECT id FROM user_categories WHERE user_id = ? AND category_key = ? LIMIT 1',
            [userId, key],
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Categoria no trobada' });
        }

        const categoryId = rows[0].id;
        const orderRows = await query(
            'SELECT COALESCE(MAX(sort_order), -1) + 1 AS nextOrder FROM user_category_items WHERE user_category_id = ?',
            [categoryId],
        );

        await query(
            'INSERT INTO user_category_items (user_category_id, item_text, sort_order) VALUES (?, ?, ?)',
            [categoryId, item, orderRows[0].nextOrder],
        );

        const itemRows = await query(
            'SELECT item_text AS itemText FROM user_category_items WHERE user_category_id = ? ORDER BY sort_order, id',
            [categoryId],
        );

        res.status(201).json({
            success: true,
            items: itemRows.map((i) => i.itemText),
        });
    } catch (error) {
        sqlError(res, 'userCategories POST /:key/items', error);
    }
};

const deleteUserCategoryItem = async(req, res) => {
    const { key, index } = req.params;
    const itemIndex = parseInt(index);
    const userId = req.session.userId;

    try {
        const rows = await query(
            'SELECT id FROM user_categories WHERE user_id = ? AND category_key = ? LIMIT 1',
            [userId, key],
        );

        if (!rows[0]) {
            return res.status(404).json({ error: 'Categoria no trobada' });
        }

        const categoryId = rows[0].id;
        const itemRows = await query(
            'SELECT id, item_text AS itemText FROM user_category_items WHERE user_category_id = ? ORDER BY sort_order, id',
            [categoryId],
        );

        if (itemIndex < 0 || itemIndex >= itemRows.length) {
            return res.status(400).json({ error: 'Index invàlid' });
        }

        await query('DELETE FROM user_category_items WHERE id = ?', [itemRows[itemIndex].id]);

        const afterRows = await query(
            'SELECT item_text AS itemText FROM user_category_items WHERE user_category_id = ? ORDER BY sort_order, id',
            [categoryId],
        );

        res.json({
            success: true,
            items: afterRows.map((i) => i.itemText),
        });
    } catch (error) {
        sqlError(res, 'userCategories DELETE /:key/items/:index', error);
    }
};

module.exports = {
    getUserCategories,
    getAvailableColors,
    createUserCategory,
    updateUserCategory,
    deleteUserCategory,
    addUserCategoryItem,
    deleteUserCategoryItem,
};

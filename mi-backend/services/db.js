const mysql = require('mysql2/promise');

let pool;

const pickFirstDefined = (...values) => {
    for (const value of values) {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return String(value);
        }
    }
    return '';
};

const getDbConfig = () => ({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: pickFirstDefined(
        process.env.DB_PASSWORD,
        process.env.DB_PASS,
        process.env.MYSQL_PASSWORD,
        process.env.MYSQL_ROOT_PASSWORD,
    ),
    database: process.env.DB_NAME,
});

const isDbConfigured = () => {
    const config = getDbConfig();
    return Boolean(
        config.host &&
        config.user &&
        config.database,
    );
};

const getPool = () => {
    if (!pool) {
        const config = getDbConfig();
        pool = mysql.createPool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
    }

    return pool;
};

const query = async(sql, params = []) => {
    const activePool = getPool();
    const [rows] = await activePool.query(sql, params);
    return rows;
};

module.exports = {
    isDbConfigured,
    query,
};
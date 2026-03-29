const mysql = require('mysql2/promise');
(async () => {
  // Use Railway internal variables (better than public proxy)
  const host = process.env.MYSQLHOST || 'mysql.railway.internal';
  const port = process.env.MYSQLPORT || 3306;
  const user = process.env.MYSQLUSER || 'root';
  const password = process.env.MYSQLPASSWORD || '';
  const database = process.env.MYSQLDATABASE || 'railway';
  
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
  });
  console.log('connected');
  await conn.query("GRANT ALL PRIVILEGES ON railway.* TO 'root'@'%' IDENTIFIED BY 'ZalBLjfhNWkjPESnvjprezQKozetBxeh'");
  await conn.query('FLUSH PRIVILEGES');
  console.log('granted');
  await conn.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

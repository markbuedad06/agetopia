const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'gondola.proxy.rlwy.net',
    port: 55945,
    user: 'root',
    password: 'ZalBLjfhNWkjPESnvjprezQKozetBxeh',
    database: 'railway',
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

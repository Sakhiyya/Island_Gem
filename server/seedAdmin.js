require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedAdmins() {
  const admins = [
    { username: process.env.ADMIN1_USERNAME, email: process.env.ADMIN1_EMAIL, password: process.env.ADMIN1_PASSWORD },
    { username: process.env.ADMIN2_USERNAME, email: process.env.ADMIN2_EMAIL, password: process.env.ADMIN2_PASSWORD },
  ];

  for (const admin of admins) {
    const hash = await bcrypt.hash(admin.password, 10);
    await pool.query(
      'INSERT INTO admin (username, email, password_hash) VALUES ($1, $2, $3)',
      [admin.username, admin.email, hash]
    );
    console.log(`Created admin: ${admin.username}`);
  }

  await pool.end();
  console.log('Done.');
}

seedAdmins();

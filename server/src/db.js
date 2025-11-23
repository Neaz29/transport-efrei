const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DB || 'efrei_covoit',
  waitForConnections: true,
  connectionLimit: 10,
});

async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
    );

    await conn.query(
      `CREATE TABLE IF NOT EXISTS rides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        driver_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        origin VARCHAR(180) NOT NULL,
        destination VARCHAR(180) NOT NULL,
        departure DATETIME NOT NULL,
        seats_total INT NOT NULL,
        seats_available INT NOT NULL,
        price DECIMAL(10,2),
        notes VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_rides_user FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
    );

    await conn.query(
      `CREATE TABLE IF NOT EXISTS ride_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        ride_id INT NOT NULL,
        passenger_name VARCHAR(180) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_book_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_book_ride FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
    );

    const [rows] = await conn.query('SELECT COUNT(*) AS count FROM rides');
    if (rows[0].count === 0) {
      await seedData(conn);
    }
  } finally {
    conn.release();
  }
}

async function seedData(conn) {
  const passwordHash = bcrypt.hashSync('efrei123', 10);
  const [aliceResult] = await conn.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    ['Alice Etudiante', 'alice@efrei.fr', passwordHash],
  );
  const [brunoResult] = await conn.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    ['Bruno Campus', 'bruno@efrei.fr', passwordHash],
  );

  const rides = [
    {
      driver_id: aliceResult.insertId,
      title: 'Covoit matin depuis Paris 14',
      origin: 'Paris 14e',
      destination: 'Campus EFREI Villejuif',
      departure: futureDateHours(2),
      seats_total: 3,
      seats_available: 3,
      price: 4,
      notes: 'Depart station Glaciere, cafe offert.',
    },
    {
      driver_id: aliceResult.insertId,
      title: 'Retour soiree BDE',
      origin: 'Campus EFREI',
      destination: 'Montparnasse',
      departure: futureDateHours(10),
      seats_total: 4,
      seats_available: 4,
      price: 5,
      notes: 'Playlist chill, arret possible a Porte d Italie.',
    },
    {
      driver_id: brunoResult.insertId,
      title: 'Navette depuis Creteil',
      origin: 'Creteil Universite',
      destination: 'EFREI Villejuif',
      departure: futureDateHours(4),
      seats_total: 2,
      seats_available: 2,
      price: 3,
      notes: 'Clio bleue, badge campus visible.',
    },
  ];

  for (const ride of rides) {
    await conn.query(
      `INSERT INTO rides (driver_id, title, origin, destination, departure, seats_total, seats_available, price, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ride.driver_id,
        ride.title,
        ride.origin,
        ride.destination,
        ride.departure,
        ride.seats_total,
        ride.seats_available,
        ride.price,
        ride.notes,
      ],
    );
  }
}

function futureDateHours(hours) {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  return toSqlDateTime(d);
}

function toSqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = {
  pool,
  initDatabase,
  toSqlDateTime,
};

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { pool, initDatabase, toSqlDateTime } = require('./db');
const {
  requireAuth,
  setAuthCookie,
  clearAuthCookie,
  getUserFromToken,
  registerUser,
  loginUser,
  signUser,
} = require('./auth');

const PORT = process.env.PORT || 4000;
const app = express();

const CAMPUS_ADDRESSES = [
  '30-32 Av. de la République, 94800 Villejuif',
  '136 bis Bd Maxime Gorki, 94800 Villejuif',
  '143-145 Bd Maxime Gorki, 94800 Villejuif',
];

function isCampusAddress(text) {
  if (!text) return false;
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  return CAMPUS_ADDRESSES.some((addr) => normalized === addr.toLowerCase().replace(/\s+/g, ' ').trim());
}

async function isValidFrenchAddress(text) {
  if (!text) return false;
  // API adresse.data.gouv.fr : pas de clé, CORS OK
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(text)}&limit=1`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return false;
    const data = await resp.json();
    return Array.isArray(data.features) && data.features.length > 0;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const user = await registerUser({ name, email, password });
    const token = setToken(res, user);
    return res.json({ user, token });
  } catch (err) {
    if (err.message === 'EMAIL_TAKEN') {
      return res.status(400).json({ error: 'Email deja utilisee' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  try {
    const user = await loginUser({ email, password });
    const token = setToken(res, user);
    return res.json({ user, token });
  } catch (err) {
    const status = err.message === 'INVALID_CREDENTIALS' ? 401 : 500;
    const error = err.message === 'INVALID_CREDENTIALS' ? 'Identifiants invalides' : 'Login failed';
    return res.status(status).json({ error });
  }
});

app.post('/api/auth/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user });
});

// Rides (trajets)
app.get('/api/rides', async (req, res) => {
  const futureOnly = req.query.futureOnly !== 'false';
  try {
    const where = futureOnly ? 'WHERE departure >= UTC_TIMESTAMP()' : '';
    const [rows] = await pool.query(
      `SELECT rides.*, users.name as driver_name, users.email as driver_email
       FROM rides
       JOIN users ON users.id = rides.driver_id
       ${where}
       ORDER BY departure ASC`,
    );
    res.json({ rides: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des trajets' });
  }
});

app.post('/api/rides', requireAuth, async (req, res) => {
  const { title, origin, destination, departure, seats_total, price, notes } = req.body || {};
  if (!title || !origin || !destination || !departure || !seats_total) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }
  const originCampus = isCampusAddress(origin);
  const destCampus = isCampusAddress(destination);
  if (!originCampus && !destCampus) {
    return res
      .status(400)
      .json({ error: 'Si le depart n est pas EFREI, la destination doit etre un campus EFREI.' });
  }
  const validOrigin = await isValidFrenchAddress(origin);
  const validDestination = await isValidFrenchAddress(destination);
  if (!validOrigin || !validDestination) {
    return res.status(400).json({ error: 'Adresse invalide. Choisir une adresse en France.' });
  }
  try {
    const formattedDeparture = toSqlDateTime(new Date(departure));
    const [result] = await pool.query(
      `INSERT INTO rides (driver_id, title, origin, destination, departure, seats_total, seats_available, price, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        origin,
        destination,
        formattedDeparture,
        seats_total,
        seats_total,
        price || null,
        notes || null,
      ],
    );
    const [rows] = await pool.query(
      'SELECT rides.*, users.name as driver_name, users.email as driver_email FROM rides JOIN users ON users.id = rides.driver_id WHERE rides.id = ?',
      [result.insertId],
    );
    res.status(201).json({ ride: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la creation du trajet' });
  }
});

app.patch('/api/rides/:id', requireAuth, async (req, res) => {
  const rideId = req.params.id;
  const { title, origin, destination, departure, seats_total, price, notes } = req.body || {};
  try {
    const [rideRows] = await pool.query('SELECT * FROM rides WHERE id = ?', [rideId]);
    const ride = rideRows[0];
    if (!ride) return res.status(404).json({ error: 'Trajet introuvable' });
    if (ride.driver_id !== req.user.id) {
      return res.status(403).json({ error: 'Action non autorisee' });
    }

    const currentBookings = ride.seats_total - ride.seats_available;
    const nextSeatsTotal = seats_total ? Number(seats_total) : ride.seats_total;
    const nextSeatsAvailable = Math.max(0, nextSeatsTotal - currentBookings);
    const formattedDeparture = departure ? toSqlDateTime(new Date(departure)) : ride.departure;
    const originCampus = origin ? isCampusAddress(origin) : isCampusAddress(ride.origin);
    const destCampus = destination ? isCampusAddress(destination) : isCampusAddress(ride.destination);
    if (!originCampus && !destCampus) {
      return res
        .status(400)
        .json({ error: 'Si le depart n est pas EFREI, la destination doit etre un campus EFREI.' });
    }
    const validOrigin = await isValidFrenchAddress(origin || ride.origin);
    const validDestination = await isValidFrenchAddress(destination || ride.destination);
    if (!validOrigin || !validDestination) {
      return res.status(400).json({ error: 'Adresse invalide. Choisir une adresse en France.' });
    }

    await pool.query(
      `UPDATE rides SET
        title = COALESCE(?, title),
        origin = COALESCE(?, origin),
        destination = COALESCE(?, destination),
        departure = ?,
        seats_total = ?,
        seats_available = ?,
        price = COALESCE(?, price),
        notes = COALESCE(?, notes)
       WHERE id = ?`,
      [
        title ?? null,
        origin ?? null,
        destination ?? null,
        formattedDeparture,
        nextSeatsTotal,
        nextSeatsAvailable,
        typeof price === 'undefined' ? ride.price : price,
        typeof notes === 'undefined' ? ride.notes : notes,
        rideId,
      ],
    );

    const [updatedRows] = await pool.query(
      'SELECT rides.*, users.name as driver_name, users.email as driver_email FROM rides JOIN users ON users.id = rides.driver_id WHERE rides.id = ?',
      [rideId],
    );
    res.json({ ride: updatedRows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la mise a jour du trajet' });
  }
});

app.delete('/api/rides/:id', requireAuth, async (req, res) => {
  const rideId = req.params.id;
  try {
    const [rideRows] = await pool.query('SELECT * FROM rides WHERE id = ?', [rideId]);
    const ride = rideRows[0];
    if (!ride) return res.status(404).json({ error: 'Trajet introuvable' });
    if (ride.driver_id !== req.user.id) {
      return res.status(403).json({ error: 'Action non autorisee' });
    }
    await pool.query('DELETE FROM rides WHERE id = ?', [rideId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la suppression du trajet' });
  }
});

// Bookings (reservations)
app.get('/api/bookings', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT rb.id, rb.passenger_name, rb.created_at,
              rides.id as ride_id, rides.title, rides.origin, rides.destination, rides.departure,
              rides.driver_id, rides.price,
              users.name as driver_name
       FROM ride_bookings rb
       JOIN rides ON rides.id = rb.ride_id
       JOIN users ON users.id = rides.driver_id
       WHERE rb.user_id = ?
       ORDER BY rb.created_at DESC`,
      [req.user.id],
    );
    res.json({ bookings: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des reservations' });
  }
});

app.post('/api/bookings', requireAuth, async (req, res) => {
  const { rideId, passengerName } = req.body || {};
  if (!rideId || !passengerName) {
    return res.status(400).json({ error: 'Trajet et nom passager requis' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rides] = await conn.query('SELECT * FROM rides WHERE id = ? FOR UPDATE', [rideId]);
    const ride = rides[0];
    if (!ride) {
      await conn.rollback();
      return res.status(404).json({ error: 'Trajet introuvable' });
    }
    if (ride.seats_available <= 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Plus de places disponibles' });
    }
    await conn.query(
      'INSERT INTO ride_bookings (user_id, ride_id, passenger_name) VALUES (?, ?, ?)',
      [req.user.id, rideId, passengerName],
    );
    await conn.query('UPDATE rides SET seats_available = seats_available - 1 WHERE id = ?', [
      rideId,
    ]);
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    if (conn) {
      await conn.rollback();
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la reservation' });
  } finally {
    conn.release();
  }
});

app.delete('/api/bookings/:id', requireAuth, async (req, res) => {
  const bookingId = req.params.id;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [bookingRows] = await conn.query(
      'SELECT * FROM ride_bookings WHERE id = ? AND user_id = ?',
      [bookingId, req.user.id],
    );
    const booking = bookingRows[0];
    if (!booking) {
      await conn.rollback();
      return res.status(404).json({ error: 'Reservation introuvable' });
    }
    await conn.query('DELETE FROM ride_bookings WHERE id = ?', [bookingId]);
    await conn.query('UPDATE rides SET seats_available = seats_available + 1 WHERE id = ?', [
      booking.ride_id,
    ]);
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    if (conn) {
      await conn.rollback();
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de l annulation' });
  } finally {
    conn.release();
  }
});

// Profile summary (mes trajets + mes reservations)
app.get('/api/me/summary', requireAuth, async (req, res) => {
  try {
    const [myRides] = await pool.query(
      'SELECT rides.*, users.name as driver_name FROM rides JOIN users ON users.id = rides.driver_id WHERE rides.driver_id = ? ORDER BY departure DESC',
      [req.user.id],
    );
    const [myBookings] = await pool.query(
      `SELECT rb.id, rb.passenger_name, rb.created_at,
              rides.id as ride_id, rides.title, rides.origin, rides.destination, rides.departure,
              rides.driver_id, rides.price,
              users.name as driver_name
       FROM ride_bookings rb
       JOIN rides ON rides.id = rb.ride_id
       JOIN users ON users.id = rides.driver_id
       WHERE rb.user_id = ?
       ORDER BY rb.created_at DESC`,
      [req.user.id],
    );
    res.json({ rides: myRides, bookings: myBookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur profil' });
  }
});

function setToken(res, user) {
  const token = signUser(user);
  setAuthCookie(res, token);
  return token;
}

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Covoiturage API server ready on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Impossible de demarrer le serveur', err);
  process.exit(1);
});

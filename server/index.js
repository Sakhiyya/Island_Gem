require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── NOMINATIM GEOCODING (OpenStreetMap, free, no API key) ─────────────
const geocodeCache = {};

function nominatimGeocode(name) {
  const https = require('https');
  const q = encodeURIComponent(name + ', Mauritius');
  return new Promise((resolve) => {
    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: `/search?q=${q}&format=json&limit=1&countrycodes=mu`,
      headers: {
        'User-Agent': 'IslandGems/1.0 (tourism capstone project)',
        'Accept-Language': 'en',
      },
    };
    https.get(options, (r) => {
      let raw = '';
      r.on('data', c => { raw += c; });
      r.on('end', () => {
        try {
          const d = JSON.parse(raw);
          resolve(d[0] ? { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) } : null);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'island_gems_secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// ── PASSPORT SERIALISE ───────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const r = await pool.query('SELECT * FROM tourist WHERE id = $1', [id]);
    done(null, r.rows[0] || null);
  } catch (e) { done(e); }
});

// ── GOOGLE STRATEGY ──────────────────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/google/callback`,
  proxy:        true,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('[Google OAuth] callback triggered, profile id:', profile.id);
    const email = profile.emails?.[0]?.value;
    const avatar = profile.photos?.[0]?.value;
    const firstName = profile.name?.givenName || '';
    const lastName  = profile.name?.familyName || '';
    console.log('[Google OAuth] email:', email, 'name:', firstName, lastName);

    // Find by oauth_id first, then by email
    let result = await pool.query(
      'SELECT * FROM tourist WHERE oauth_provider=$1 AND oauth_id=$2',
      ['google', profile.id]
    );
    console.log('[Google OAuth] found by oauth_id:', result.rows.length);
    if (result.rows.length === 0 && email) {
      result = await pool.query('SELECT * FROM tourist WHERE "Email"=$1', [email]);
      console.log('[Google OAuth] found by email:', result.rows.length);
    }

    if (result.rows.length > 0) {
      // Update avatar / oauth link if needed
      await pool.query(
        'UPDATE tourist SET avatar_url=$1, oauth_provider=$2, oauth_id=$3, first_name=COALESCE(first_name,$4), last_name=COALESCE(last_name,$5) WHERE id=$6',
        [avatar, 'google', profile.id, firstName, lastName, result.rows[0].id]
      );
      console.log('[Google OAuth] existing user updated, id:', result.rows[0].id);
      return done(null, result.rows[0]);
    }

    // New user via Google
    console.log('[Google OAuth] creating new user...');
    const inserted = await pool.query(
      `INSERT INTO tourist (username, "Email", "Password_hash", first_name, last_name, oauth_provider, oauth_id, avatar_url)
       VALUES ($1, $2, NULL, $3, $4, 'google', $5, $6) RETURNING *`,
      [email || profile.displayName, email, firstName, lastName, profile.id, avatar]
    );
    console.log('[Google OAuth] new user created, id:', inserted.rows[0].id);
    done(null, inserted.rows[0]);
  } catch (e) {
    console.error('[Google OAuth error]', e.message);
    console.error('[Google OAuth error detail]', e);
    done(e);
  }
}));

// ── FACEBOOK STRATEGY ────────────────────────────────────────────────
passport.use(new FacebookStrategy({
  clientID:     process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL:  `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/facebook/callback`,
  profileFields: ['id', 'emails', 'name', 'photos'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || null;
    const avatar = profile.photos?.[0]?.value || null;
    const firstName = profile.name?.givenName || '';
    const lastName  = profile.name?.familyName || '';

    let result = await pool.query(
      'SELECT * FROM tourist WHERE oauth_provider=$1 AND oauth_id=$2',
      ['facebook', profile.id]
    );
    if (result.rows.length === 0 && email) {
      result = await pool.query('SELECT * FROM tourist WHERE "Email"=$1', [email]);
    }

    if (result.rows.length > 0) {
      await pool.query(
        'UPDATE tourist SET avatar_url=$1, oauth_provider=$2, oauth_id=$3, first_name=COALESCE(first_name,$4), last_name=COALESCE(last_name,$5) WHERE id=$6',
        [avatar, 'facebook', profile.id, firstName, lastName, result.rows[0].id]
      );
      return done(null, result.rows[0]);
    }

    const inserted = await pool.query(
      `INSERT INTO tourist (username, "Email", "Password_hash", first_name, last_name, oauth_provider, oauth_id, avatar_url)
       VALUES ($1, $2, NULL, $3, $4, 'facebook', $5, $6) RETURNING *`,
      [email || profile.displayName, email || null, firstName, lastName, profile.id, avatar]
    );
    done(null, inserted.rows[0]);
  } catch (e) { console.error('[Facebook OAuth error]', e); done(e); }
}));

// ── OAUTH ROUTES ─────────────────────────────────────────────────────
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
app.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error('[Google callback] auth error:', err);
      return res.redirect(`${FRONTEND_URL}/tourist-login?error=google`);
    }
    if (!user) {
      console.error('[Google callback] no user returned, info:', info);
      return res.redirect(`${FRONTEND_URL}/tourist-login?error=google`);
    }
    console.log('[Google callback] user authenticated:', user.id);
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('[Google callback] logIn error:', loginErr);
      }
      // Redirect regardless of session save — we pass data via URL params
      const params = new URLSearchParams({
        id: user.id,
        email: user.Email || '',
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        avatar_url: user.avatar_url || '',
        nationality: user.nationality || '',
      });
      console.log('[Google callback] redirecting to frontend...');
      res.redirect(`${FRONTEND_URL}/auth/callback?${params.toString()}`);
    });
  })(req, res, next);
});

app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);
app.get('/auth/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', (err, user, info) => {
    if (err) {
      console.error('[Facebook callback] auth error:', err);
      return res.redirect(`${FRONTEND_URL}/tourist-login?error=facebook`);
    }
    if (!user) {
      console.error('[Facebook callback] no user returned, info:', info);
      return res.redirect(`${FRONTEND_URL}/tourist-login?error=facebook`);
    }
    console.log('[Facebook callback] user authenticated:', user.id);
    req.logIn(user, (loginErr) => {
      if (loginErr) console.error('[Facebook callback] logIn error:', loginErr);
      const params = new URLSearchParams({
        id: user.id,
        email: user.Email || '',
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
          avatar_url: user.avatar_url || '',
        nationality: user.nationality || '',
      });
      console.log('[Facebook callback] redirecting to frontend...');
      res.redirect(`${FRONTEND_URL}/auth/callback?${params.toString()}`);
    });
  })(req, res, next);
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// ── HELPERS ───────────────────────────────────────────────────────────────────
async function logEvent(level, category, message, detail = null) {
  try {
    await pool.query(
      'INSERT INTO system_logs (level, category, message, detail) VALUES ($1, $2, $3, $4)',
      [level, category, message, detail ? JSON.stringify(detail) : null]
    );
  } catch (_) { /* never crash the server if logging fails */ }
}

async function adminAuth(req, res, next) {
  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const r = await pool.query(
      "SELECT admin_id FROM admin_sessions WHERE token=$1 AND created_at > NOW() - INTERVAL '24 hours'",
      [token]
    );
    if (r.rows.length === 0) return res.status(401).json({ message: 'Session expired' });
    req.adminId = r.rows[0].admin_id;
    next();
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

// REGISTER — creates a new tourist account
app.post('/api/tourist/register', async (req, res) => {
  const {
    username, email, password,
    first_name, last_name, nationality,
    date_of_birth, phone, travel_interests,
  } = req.body;

  try {
    const existing = await pool.query(
      'SELECT id FROM tourist WHERE "Email" = $1', [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO tourist
         (username, "Email", "Password_hash",
          first_name, last_name, nationality,
          date_of_birth, phone, travel_interests)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, username, "Email", first_name, last_name, nationality, avatar_url`,
      [
        username, email, password_hash,
        first_name || null, last_name || null, nationality || null,
        date_of_birth || null, phone || null,
        travel_interests ? travel_interests.join(',') : null,
      ]
    );

    res.status(201).json({ message: 'Account created', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN — checks credentials and returns user info
app.post('/api/tourist/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM tourist WHERE "Email" = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const tourist = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, tourist.Password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: tourist.id,
        username: tourist.username,
        email: tourist.Email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN LOGIN
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admin WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ message: 'Invalid email or password' });

    const admin = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatch)
      return res.status(400).json({ message: 'Invalid email or password' });

    const token = crypto.randomBytes(32).toString('hex');
    await pool.query('INSERT INTO admin_sessions (token, admin_id) VALUES ($1, $2)', [token, admin.id]);
    await logEvent('info', 'auth', `Admin login: ${admin.email}`);

    res.json({
      message: 'Login successful',
      token,
      user: { id: admin.id, username: admin.username, email: admin.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN LOGOUT
app.post('/api/admin/logout', adminAuth, async (req, res) => {
  const token = (req.headers.authorization || '').slice(7);
  await pool.query('DELETE FROM admin_sessions WHERE token=$1', [token]);
  await logEvent('info', 'auth', `Admin ${req.adminId} logged out`);
  res.json({ message: 'Logged out' });
});

// UPDATE tourist profile — called after OAuth login to save nationality, DOB, interests
app.put('/api/tourist/profile', async (req, res) => {
  const { id, nationality, date_of_birth, travel_interests } = req.body;
  if (!id) return res.status(400).json({ message: 'User ID required' });
  try {
    await pool.query(
      `UPDATE tourist
       SET nationality=$1, date_of_birth=$2, travel_interests=$3
       WHERE id=$4`,
      [
        nationality || null,
        date_of_birth || null,
        travel_interests?.length ? travel_interests.join(',') : null,
        id,
      ]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET MAP PINS — geocodes attraction names via Nominatim with in-memory cache
app.get('/api/map-pins', async (req, res) => {
  const names = (req.query.names || '')
    .split(',')
    .map(n => decodeURIComponent(n.trim()))
    .filter(Boolean)
    .slice(0, 20);

  const results = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (geocodeCache[key]) {
      results.push({ name, ...geocodeCache[key] });
      continue;
    }
    const coords = await nominatimGeocode(name);
    if (coords) {
      geocodeCache[key] = coords;
      results.push({ name, ...coords });
    }
    await new Promise(r => setTimeout(r, 1100)); // Nominatim rate limit: 1 req/sec
  }
  res.json(results);
});

// GET MAURITIUS WEATHER — Open-Meteo (free, no API key, reliable)
app.get('/api/weather', async (req, res) => {
  const https = require('https');
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=-20.2&longitude=57.5&current=temperature_2m,weathercode&timezone=Indian%2FMauritius';
  https.get(url, (apiRes) => {
    let raw = '';
    apiRes.on('data', chunk => { raw += chunk; });
    apiRes.on('end', () => {
      try {
        const data = JSON.parse(raw);
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weathercode;
        const desc = weatherCodeDesc(code);
        res.json({ temp, desc });
      } catch {
        res.status(503).json({ message: 'Weather unavailable' });
      }
    });
  }).on('error', () => res.status(503).json({ message: 'Weather unavailable' }));
});

function weatherCodeDesc(code) {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  if (code <= 82) return 'Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Cloudy';
}

// GET TRENDING ATTRACTIONS
app.get('/api/trending-attractions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, ap.photo_url
      FROM trending_attractions t
      LEFT JOIN attraction_photos ap ON LOWER(ap.attraction_name) = LOWER(t.attraction_name)
      ORDER BY t.trend_score DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET ALL ATTRACTIONS (aggregated from sentiment_reviews)
app.get('/api/attractions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        sr.attraction_name,
        sr.category,
        sr.place_type,
        ROUND(AVG(sr.stars)::numeric, 1) AS avg_stars,
        COUNT(*) AS review_count,
        (array_agg(sr.sentiment_label ORDER BY
          CASE sr.sentiment_label WHEN 'positive' THEN 1 WHEN 'neutral' THEN 2 ELSE 3 END
        ))[1] AS dominant_sentiment,
        MAX(ap.photo_url) AS photo_url
      FROM sentiment_reviews sr
      LEFT JOIN attraction_photos ap ON LOWER(ap.attraction_name) = LOWER(sr.attraction_name)
      GROUP BY sr.attraction_name, sr.category, sr.place_type
      ORDER BY avg_stars DESC NULLS LAST
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET DISTINCT PLACE TYPES (for the filter bar)
app.get('/api/attraction-types', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT place_type FROM sentiment_reviews WHERE place_type IS NOT NULL ORDER BY place_type"
    );
    res.json(result.rows.map(r => r.place_type));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single attraction details by name
app.get('/api/attractions/:name', async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  try {
    const statsResult = await pool.query(`
      SELECT
        sr.attraction_name, sr.category, sr.place_type,
        ROUND(AVG(sr.stars)::numeric, 1) AS avg_stars,
        COUNT(*) AS review_count,
        (array_agg(sr.sentiment_label ORDER BY
          CASE sr.sentiment_label WHEN 'positive' THEN 1 WHEN 'neutral' THEN 2 ELSE 3 END
        ))[1] AS dominant_sentiment,
        MAX(ap.photo_url) AS photo_url
      FROM sentiment_reviews sr
      LEFT JOIN attraction_photos ap ON LOWER(ap.attraction_name) = LOWER(sr.attraction_name)
      WHERE LOWER(sr.attraction_name) = LOWER($1)
      GROUP BY sr.attraction_name, sr.category, sr.place_type
    `, [name]);

    const aspectsResult = await pool.query(`
      SELECT
        aspect,
        aspect_sentiment_label,
        ROUND(AVG(aspect_sentiment_score)::numeric, 2) AS avg_score,
        SUM(aspect_mention_count) AS total_mentions
      FROM absa_aspect_mentions
      WHERE LOWER(attraction_name) = LOWER($1)
      GROUP BY aspect, aspect_sentiment_label
      ORDER BY total_mentions DESC
    `, [name]);

    const reviewsResult = await pool.query(`
      SELECT stars, sentiment_label, text_sample, review_date, platform
      FROM sentiment_reviews
      WHERE LOWER(attraction_name) = LOWER($1)
        AND text_sample IS NOT NULL AND text_sample != ''
      ORDER BY review_date DESC
      
    `, [name]);

    if (statsResult.rows.length === 0) {
      return res.status(404).json({ message: 'Attraction not found' });
    }

    res.json({
      ...statsResult.rows[0],
      aspects: aspectsResult.rows,
      recent_reviews: reviewsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});




// GET reviews for a specific aspect — returns all reviews sorted by relevance
// (exact keyword match first, then first word match, then remaining reviews)
app.get('/api/attractions/:name/aspect-reviews', async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const aspect = (req.query.aspect || '').replace(/_/g, ' ');
  const firstWord = aspect.split(' ')[0];
  try {
    const result = await pool.query(`
      SELECT stars, sentiment_label, text_sample, review_date, platform,
        CASE
          WHEN LOWER(text_sample) LIKE LOWER($2) THEN 1
          WHEN LOWER(text_sample) LIKE LOWER($3) THEN 2
          ELSE 3
        END AS relevance
      FROM sentiment_reviews
      WHERE LOWER(attraction_name) = LOWER($1)
        AND text_sample IS NOT NULL AND text_sample != ''
      ORDER BY relevance ASC, review_date DESC
    `, [name, `%${aspect}%`, `%${firstWord}%`]);

    res.json(result.rows.map(({ relevance, ...row }) => row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── ITINERARY / RECOMMENDATION ───────────────────────────────────────────────

// GET distinct travel types (excludes 'unknown')
app.get('/api/travel-types', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT travel_type
      FROM absa_aspect_mentions
      WHERE travel_type IS NOT NULL AND travel_type != 'unknown' AND travel_type != ''
      ORDER BY travel_type
    `);
    res.json(result.rows.map(r => r.travel_type));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST recommend — returns day-by-day itinerary based on travel_type + aspects + days
app.post('/api/recommend', async (req, res) => {
  const { travel_type, aspects, days } = req.body;
  if (!aspects || aspects.length === 0) {
    return res.status(400).json({ message: 'No interests selected' });
  }
  const numDays = Math.max(1, Math.min(parseInt(days) || 7, 60));
  const limit   = Math.min(numDays * 3, 50);

  try {
    let rows = [];

    // Try with travel_type filter first
    if (travel_type) {
      const r = await pool.query(`
        SELECT
          attraction_name, place_type,
          ROUND(AVG(stars)::numeric, 1)                                        AS avg_stars,
          ROUND(AVG(aspect_sentiment_score)::numeric, 2)                       AS avg_aspect_score,
          ROUND(((AVG(stars) / 5.0) * AVG(aspect_sentiment_score))::numeric, 3) AS score,
          COUNT(*) AS review_count
        FROM absa_aspect_mentions
        WHERE aspect = ANY($1) AND travel_type = $2
        GROUP BY attraction_name, place_type
        ORDER BY score DESC NULLS LAST
        LIMIT $3
      `, [aspects, travel_type, limit]);
      rows = r.rows;
    }

    // Fallback: drop travel_type filter if not enough results
    if (rows.length < numDays) {
      const r = await pool.query(`
        SELECT
          attraction_name, place_type,
          ROUND(AVG(stars)::numeric, 1)                                        AS avg_stars,
          ROUND(AVG(aspect_sentiment_score)::numeric, 2)                       AS avg_aspect_score,
          ROUND(((AVG(stars) / 5.0) * AVG(aspect_sentiment_score))::numeric, 3) AS score,
          COUNT(*) AS review_count
        FROM absa_aspect_mentions
        WHERE aspect = ANY($1)
        GROUP BY attraction_name, place_type
        ORDER BY score DESC NULLS LAST
        LIMIT $2
      `, [aspects, limit]);
      rows = r.rows;
    }

    // Distribute round-robin across days (2-3 per day)
    const itinerary = Array.from({ length: numDays }, (_, i) => ({ day: i + 1, attractions: [] }));
    rows.forEach((att, i) => itinerary[i % numDays].attractions.push(att));

    res.json({ itinerary, total: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET saved itineraries for a logged-in tourist
app.get('/api/itinerary/saved', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const tourist = await pool.query('SELECT id FROM tourist WHERE "Email" = $1', [email]);
    if (tourist.rows.length === 0) return res.status(404).json({ message: 'Tourist not found' });
    const result = await pool.query(
      `SELECT id, travel_type, interests, days, itinerary_data, created_at
       FROM saved_itineraries
       WHERE tourist_id = $1
       ORDER BY created_at DESC`,
      [tourist.rows[0].id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE a saved itinerary by id (only if it belongs to the tourist)
app.delete('/api/itinerary/saved/:id', async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const tourist = await pool.query('SELECT id FROM tourist WHERE "Email" = $1', [email]);
    if (tourist.rows.length === 0) return res.status(404).json({ message: 'Tourist not found' });
    await pool.query(
      'DELETE FROM saved_itineraries WHERE id = $1 AND tourist_id = $2',
      [id, tourist.rows[0].id]
    );
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST save itinerary — looks up tourist by email, saves to saved_itineraries table
// Run this once in NeonDB:
// CREATE TABLE saved_itineraries (
//   id SERIAL PRIMARY KEY, tourist_id INTEGER NOT NULL,
//   travel_type TEXT, interests TEXT[], days INTEGER,
//   itinerary_data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
// );
app.post('/api/itinerary/save', async (req, res) => {
  const { email, travel_type, interests, days, itinerary_data } = req.body;
  if (!email || !itinerary_data) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const tourist = await pool.query('SELECT id FROM tourist WHERE "Email" = $1', [email]);
    if (tourist.rows.length === 0) return res.status(404).json({ message: 'Tourist not found' });
    await pool.query(
      `INSERT INTO saved_itineraries (tourist_id, travel_type, interests, days, itinerary_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [tourist.rows[0].id, travel_type, interests || [], days, JSON.stringify(itinerary_data)]
    );
    res.json({ message: 'Itinerary saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── TOURISM DASHBOARD STATS ──────────────────────────────────────────────────

// KPI overview: total attractions, reviews, avg rating, % positive
app.get('/api/stats/overview', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT attraction_name) AS total_attractions,
        COUNT(*) AS total_reviews,
        ROUND(AVG(stars)::numeric, 1) AS avg_rating,
        ROUND(100.0 * SUM(CASE WHEN sentiment_label = 'positive' THEN 1 ELSE 0 END) / COUNT(*), 1) AS positive_pct
      FROM sentiment_reviews
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Top 10 rated attractions (min 3 reviews)
app.get('/api/stats/top-rated', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT attraction_name,
        ROUND(AVG(stars)::numeric, 1) AS avg_stars,
        COUNT(*) AS review_count
      FROM sentiment_reviews
      GROUP BY attraction_name
      HAVING COUNT(*) >= 3
      ORDER BY avg_stars DESC, review_count DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sentiment distribution (positive / neutral / negative counts)
app.get('/api/stats/sentiment', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sentiment_label, COUNT(*) AS count
      FROM sentiment_reviews
      WHERE sentiment_label IS NOT NULL
      GROUP BY sentiment_label
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Top 10 most discussed aspects
app.get('/api/stats/aspects', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT aspect, SUM(aspect_mention_count) AS total_mentions
      FROM absa_aspect_mentions
      WHERE aspect IS NOT NULL
      GROUP BY aspect
      ORDER BY total_mentions DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Place type distribution (distinct attractions per type)
app.get('/api/stats/place-types', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT place_type, COUNT(DISTINCT attraction_name) AS count
      FROM sentiment_reviews
      WHERE place_type IS NOT NULL
      GROUP BY place_type
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Traveller profile by travel_type
app.get('/api/stats/travel-types', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT travel_type, COUNT(*) AS count
      FROM absa_aspect_mentions
      WHERE travel_type IS NOT NULL AND travel_type != ''
      GROUP BY travel_type
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// CONTACT FORM SUBMISSION — sends email via Gmail, no DB table needed
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  }
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: `Island Gems Contact: ${subject || 'No subject'}`,
      html: `
        <h3>New Contact Message — Island Gems</h3>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      `,
    });
    res.json({ message: 'Message sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Monthly review volume (last 12 months displayed on frontend)
app.get('/api/stats/monthly', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(review_date, 'Mon YYYY') AS month_label,
        EXTRACT(YEAR FROM review_date) AS year,
        EXTRACT(MONTH FROM review_date) AS month_num,
        COUNT(*) AS count
      FROM sentiment_reviews
      WHERE review_date IS NOT NULL
      GROUP BY month_label, year, month_num
      ORDER BY year, month_num
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── ADMIN API ─────────────────────────────────────────────────────────────────

// System Health
app.get('/api/admin/health', adminAuth, async (req, res) => {
  try {
    const [records, absa, errors24h, lastScrape, recentRuns] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM sentiment_reviews'),
      pool.query('SELECT COUNT(*) FROM absa_aspect_mentions'),
      pool.query("SELECT COUNT(*) FROM system_logs WHERE level='error' AND created_at > NOW() - INTERVAL '24 hours'"),
      pool.query('SELECT * FROM scraping_runs ORDER BY completed_at DESC NULLS LAST LIMIT 1'),
      pool.query('SELECT * FROM scraping_runs ORDER BY started_at DESC NULLS LAST LIMIT 5'),
    ]);
    res.json({
      total_reviews:  parseInt(records.rows[0].count),
      total_absa:     parseInt(absa.rows[0].count),
      errors_24h:     parseInt(errors24h.rows[0].count),
      last_scrape:    lastScrape.rows[0] || null,
      recent_runs:    recentRuns.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DB connection ping
app.get('/api/admin/ping', adminAuth, async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

// Logs — paginated, filterable
app.get('/api/admin/logs', adminAuth, async (req, res) => {
  const { level, category, search, page = 1 } = req.query;
  const limit  = 50;
  const offset = (parseInt(page) - 1) * limit;
  const where  = [];
  const params = [];
  let   i      = 1;
  if (level)    { where.push(`level=$${i++}`);              params.push(level); }
  if (category) { where.push(`category=$${i++}`);           params.push(category); }
  if (search)   { where.push(`message ILIKE $${i++}`);      params.push(`%${search}%`); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  try {
    const [rows, total] = await Promise.all([
      pool.query(`SELECT * FROM system_logs ${clause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`, params),
      pool.query(`SELECT COUNT(*) FROM system_logs ${clause}`, params),
    ]);
    res.json({ logs: rows.rows, total: parseInt(total.rows[0].count), page: parseInt(page), limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a log entry (used externally by scraping pipeline)
app.post('/api/admin/logs', adminAuth, async (req, res) => {
  const { level, category, message, detail } = req.body;
  if (!level || !category || !message)
    return res.status(400).json({ message: 'level, category and message required' });
  await logEvent(level, category, message, detail || null);
  res.json({ message: 'Logged' });
});

// Users — list all tourists
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT id, username, "Email" AS email, first_name, last_name,
             nationality, oauth_provider, disabled, "Created_at" AS created_at
      FROM tourist
      ORDER BY id DESC
    `);
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Users — enable / disable
app.put('/api/admin/users/:id', adminAuth, async (req, res) => {
  const { disabled } = req.body;
  try {
    await pool.query('UPDATE tourist SET disabled=$1 WHERE id=$2', [disabled, req.params.id]);
    await logEvent('info', 'system', `Admin ${req.adminId} ${disabled ? 'disabled' : 'enabled'} user ${req.params.id}`);
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Users — delete
app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM tourist WHERE id=$1', [req.params.id]);
    await logEvent('info', 'system', `Admin ${req.adminId} deleted user ${req.params.id}`);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── STAKEHOLDER & AUTHORITY MIDDLEWARE ───────────────────────────────────────

async function stakeholderAuth(req, res, next) {
  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const r = await pool.query(
      "SELECT stakeholder_id FROM stakeholder_sessions WHERE token=$1 AND created_at > NOW() - INTERVAL '24 hours'",
      [token]
    );
    if (r.rows.length === 0) return res.status(401).json({ message: 'Session expired' });
    req.stakeholderId = r.rows[0].stakeholder_id;
    next();
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function authorityAuth(req, res, next) {
  const auth  = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const r = await pool.query(
      "SELECT authority_id FROM authority_sessions WHERE token=$1 AND created_at > NOW() - INTERVAL '24 hours'",
      [token]
    );
    if (r.rows.length === 0) return res.status(401).json({ message: 'Session expired' });
    req.authorityId = r.rows[0].authority_id;
    next();
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}

// ── STAKEHOLDER PUBLIC ROUTES ─────────────────────────────────────────────────

// Public: submit a "request access" form
app.post('/api/stakeholder/register', async (req, res) => {
  const { name, email, role, phone, hotel_name, message } = req.body;
  if (!name || !email || !hotel_name)
    return res.status(400).json({ message: 'Name, email and hotel name are required' });
  try {
    const existing = await pool.query('SELECT id FROM stakeholders WHERE email=$1', [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: 'This email has already submitted a request' });

    await pool.query(
      `INSERT INTO stakeholders (name, email, role, message, hotel_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, role || 'manager', message || null, hotel_name || null]
    );

    // Notify admin by email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to:   process.env.GMAIL_USER,
      subject: `Island Gems: New Partner Request from ${name}`,
      html: `
        <h3>New Hotel Partner Request</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Role:</strong> ${role || 'manager'}</p>
        <p><strong>Hotel:</strong> ${hotel_name}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong> ${message || 'No message'}</p>
        <p>Log in to the admin panel to review and approve this request.</p>
      `,
    }).catch(() => {});

    await logEvent('info', 'system', `New stakeholder request from ${email} for hotel: ${hotel_name}`);
    res.status(201).json({ message: 'Request submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: stakeholder login
app.post('/api/stakeholder/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM stakeholders WHERE email=$1', [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ message: 'Invalid email or password' });

    const s = result.rows[0];
    if (s.status !== 'approved')
      return res.status(403).json({ message: 'Your account is pending approval' });
    if (s.status === 'disabled')
      return res.status(403).json({ message: 'Your account has been disabled' });

    const match = await bcrypt.compare(password, s.password_hash);
    if (!match)
      return res.status(400).json({ message: 'Invalid email or password' });

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'INSERT INTO stakeholder_sessions (token, stakeholder_id) VALUES ($1, $2)',
      [token, s.id]
    );

    // Fetch assigned hotels
    const hotels = await pool.query(
      'SELECT hotel_name FROM stakeholder_hotels WHERE stakeholder_id=$1',
      [s.id]
    );

    await logEvent('info', 'auth', `Stakeholder login: ${s.email}`);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id:          s.id,
        name:        s.name,
        email:       s.email,
        role:        s.role,
        hotels:      hotels.rows.map(r => r.hotel_name),
        powerbi_url: s.powerbi_url || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: stakeholder logout
app.post('/api/stakeholder/logout', stakeholderAuth, async (req, res) => {
  const token = (req.headers.authorization || '').slice(7);
  await pool.query('DELETE FROM stakeholder_sessions WHERE token=$1', [token]);
  res.json({ message: 'Logged out' });
});

// ── TOURISM AUTHORITY PUBLIC ROUTES ───────────────────────────────────────────

// Public: authority login
app.post('/api/authority/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM tourism_authority WHERE email=$1', [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ message: 'Invalid email or password' });

    const a = result.rows[0];
    const match = await bcrypt.compare(password, a.password_hash);
    if (!match)
      return res.status(400).json({ message: 'Invalid email or password' });

    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'INSERT INTO authority_sessions (token, authority_id) VALUES ($1, $2)',
      [token, a.id]
    );

    await logEvent('info', 'auth', `Authority login: ${a.email}`);
    res.json({
      message: 'Login successful',
      token,
      user: { id: a.id, name: a.name, email: a.email, role: 'authority' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: authority logout
app.post('/api/authority/logout', authorityAuth, async (req, res) => {
  const token = (req.headers.authorization || '').slice(7);
  await pool.query('DELETE FROM authority_sessions WHERE token=$1', [token]);
  res.json({ message: 'Logged out' });
});

// ── ADMIN: STAKEHOLDER MANAGEMENT ────────────────────────────────────────────

// Get distinct hotel names from DB for the dropdown
app.get('/api/admin/hotels', adminAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT DISTINCT attraction_name AS hotel_name
       FROM sentiment_reviews
       WHERE place_type ILIKE '%hotel%' OR place_type ILIKE '%resort%' OR place_type ILIKE '%accommodation%'
       ORDER BY attraction_name`
    );
    // Fallback: if no hotel-typed results, return all attraction names
    if (r.rows.length === 0) {
      const all = await pool.query(
        'SELECT DISTINCT attraction_name AS hotel_name FROM sentiment_reviews ORDER BY attraction_name'
      );
      return res.json(all.rows.map(r => r.hotel_name));
    }
    res.json(r.rows.map(r => r.hotel_name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Also expose hotel list publicly for the registration form
app.get('/api/hotels', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT DISTINCT attraction_name AS hotel_name
       FROM sentiment_reviews
       WHERE place_type ILIKE '%hotel%' OR place_type ILIKE '%resort%' OR place_type ILIKE '%accommodation%'
       ORDER BY attraction_name`
    );
    if (r.rows.length === 0) {
      const all = await pool.query(
        'SELECT DISTINCT attraction_name AS hotel_name FROM sentiment_reviews ORDER BY attraction_name'
      );
      return res.json(all.rows.map(r => r.hotel_name));
    }
    res.json(r.rows.map(r => r.hotel_name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List all stakeholders with their assigned hotels
app.get('/api/admin/stakeholders', adminAuth, async (req, res) => {
  try {
    const stakeholders = await pool.query(
      'SELECT id, name, email, role, status, message, hotel_name, powerbi_url, created_at FROM stakeholders ORDER BY created_at DESC'
    );
    const hotels = await pool.query(
      'SELECT stakeholder_id, hotel_name FROM stakeholder_hotels'
    );
    const hotelMap = {};
    hotels.rows.forEach(h => {
      if (!hotelMap[h.stakeholder_id]) hotelMap[h.stakeholder_id] = [];
      hotelMap[h.stakeholder_id].push(h.hotel_name);
    });
    const result = stakeholders.rows.map(s => ({
      ...s,
      hotels: hotelMap[s.id] || [],
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin manually creates a stakeholder and sends login email
app.post('/api/admin/stakeholders', adminAuth, async (req, res) => {
  const { name, email, role, hotels, powerbi_url } = req.body;
  if (!name || !email || !hotels?.length)
    return res.status(400).json({ message: 'Name, email and at least one hotel are required' });
  try {
    const existing = await pool.query('SELECT id FROM stakeholders WHERE email=$1', [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: 'Email already exists' });

    const rawPassword = crypto.randomBytes(6).toString('hex'); // 12-char password
    const hash = await bcrypt.hash(rawPassword, 10);

    const inserted = await pool.query(
      `INSERT INTO stakeholders (name, email, password_hash, role, status, powerbi_url)
       VALUES ($1, $2, $3, $4, 'approved', $5) RETURNING id`,
      [name, email, hash, role || 'manager', powerbi_url || null]
    );
    const stakeholderId = inserted.rows[0].id;

    // Assign hotels
    for (const hotel of hotels) {
      await pool.query(
        'INSERT INTO stakeholder_hotels (stakeholder_id, hotel_name) VALUES ($1, $2)',
        [stakeholderId, hotel]
      );
    }

    // Send welcome email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to:   email,
      subject: 'Your Island Gems Partner Account is Ready',
      html: `
        <h2>Welcome to Island Gems, ${name}!</h2>
        <p>Your partner account has been created. You can now access your hotel analytics dashboard.</p>
        <p><strong>Login URL:</strong> ${FRONTEND_URL}/stakeholder-login</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${rawPassword}</p>
        <p><strong>Hotels assigned:</strong></p>
        <ul>${hotels.map(h => `<li>${h}</li>`).join('')}</ul>
        <p>Please keep your credentials safe.</p>
        <p>— Island Gems Team</p>
      `,
    });

    await logEvent('info', 'system', `Admin ${req.adminId} created stakeholder ${email} with ${hotels.length} hotel(s)`);
    res.status(201).json({ message: 'Stakeholder created and email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve a pending stakeholder request
app.put('/api/admin/stakeholders/:id/approve', adminAuth, async (req, res) => {
  const { hotels, powerbi_url } = req.body;
  if (!hotels?.length)
    return res.status(400).json({ message: 'Assign at least one hotel before approving' });
  try {
    const s = await pool.query('SELECT * FROM stakeholders WHERE id=$1', [req.params.id]);
    if (s.rows.length === 0) return res.status(404).json({ message: 'Not found' });

    const rawPassword = crypto.randomBytes(6).toString('hex');
    const hash = await bcrypt.hash(rawPassword, 10);

    await pool.query(
      "UPDATE stakeholders SET status='approved', password_hash=$1, powerbi_url=$2 WHERE id=$3",
      [hash, powerbi_url || null, req.params.id]
    );

    // Clear old hotel assignments then insert new ones
    await pool.query('DELETE FROM stakeholder_hotels WHERE stakeholder_id=$1', [req.params.id]);
    for (const hotel of hotels) {
      await pool.query(
        'INSERT INTO stakeholder_hotels (stakeholder_id, hotel_name) VALUES ($1, $2)',
        [req.params.id, hotel]
      );
    }

    // Send approval email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to:   s.rows[0].email,
      subject: 'Your Island Gems Partner Access has been Approved',
      html: `
        <h2>Welcome to Island Gems, ${s.rows[0].name}!</h2>
        <p>Your request to access the Island Gems analytics platform has been approved.</p>
        <p><strong>Login URL:</strong> ${FRONTEND_URL}/stakeholder-login</p>
        <p><strong>Email:</strong> ${s.rows[0].email}</p>
        <p><strong>Temporary Password:</strong> ${rawPassword}</p>
        <p><strong>Hotels assigned:</strong></p>
        <ul>${hotels.map(h => `<li>${h}</li>`).join('')}</ul>
        <p>— Island Gems Team</p>
      `,
    });

    await logEvent('info', 'system', `Admin ${req.adminId} approved stakeholder ${s.rows[0].email}`);
    res.json({ message: 'Approved and email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update stakeholder hotels, powerbi_url, or disable
app.put('/api/admin/stakeholders/:id', adminAuth, async (req, res) => {
  const { hotels, status, powerbi_url } = req.body;
  try {
    if (status !== undefined) {
      await pool.query('UPDATE stakeholders SET status=$1 WHERE id=$2', [status, req.params.id]);
    }
    if (powerbi_url !== undefined) {
      await pool.query('UPDATE stakeholders SET powerbi_url=$1 WHERE id=$2', [powerbi_url || null, req.params.id]);
    }
    if (hotels) {
      await pool.query('DELETE FROM stakeholder_hotels WHERE stakeholder_id=$1', [req.params.id]);
      for (const hotel of hotels) {
        await pool.query(
          'INSERT INTO stakeholder_hotels (stakeholder_id, hotel_name) VALUES ($1, $2)',
          [req.params.id, hotel]
        );
      }
    }
    await logEvent('info', 'system', `Admin ${req.adminId} updated stakeholder ${req.params.id}`);
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete stakeholder
app.delete('/api/admin/stakeholders/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM stakeholders WHERE id=$1', [req.params.id]);
    await logEvent('info', 'system', `Admin ${req.adminId} deleted stakeholder ${req.params.id}`);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── ADMIN: TOURISM AUTHORITY MANAGEMENT ──────────────────────────────────────

// List all authority accounts
app.get('/api/admin/authority', adminAuth, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, name, email, created_at FROM tourism_authority ORDER BY created_at DESC'
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin creates a tourism authority account
app.post('/api/admin/authority', adminAuth, async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email)
    return res.status(400).json({ message: 'Name and email are required' });
  try {
    const existing = await pool.query('SELECT id FROM tourism_authority WHERE email=$1', [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: 'Email already exists' });

    const rawPassword = crypto.randomBytes(6).toString('hex');
    const hash = await bcrypt.hash(rawPassword, 10);

    await pool.query(
      'INSERT INTO tourism_authority (name, email, password_hash) VALUES ($1, $2, $3)',
      [name, email, hash]
    );

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to:   email,
      subject: 'Your Island Gems Tourism Authority Account',
      html: `
        <h2>Welcome to Island Gems, ${name}!</h2>
        <p>Your Tourism Authority account has been created, giving you read-only access to all hotel analytics across Mauritius.</p>
        <p><strong>Login URL:</strong> ${FRONTEND_URL}/authority-login</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${rawPassword}</p>
        <p>— Island Gems Team</p>
      `,
    });

    await logEvent('info', 'system', `Admin ${req.adminId} created authority account for ${email}`);
    res.status(201).json({ message: 'Authority account created and email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete authority account
app.delete('/api/admin/authority/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM tourism_authority WHERE id=$1', [req.params.id]);
    await logEvent('info', 'system', `Admin ${req.adminId} deleted authority account ${req.params.id}`);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));

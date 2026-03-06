require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const contactRoute = require('./routes/contact');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Seguridad básica ──
app.use(helmet());

// ── CORS ──
app.use(cors());

// ── Parsear JSON ──
app.use(express.json());

// ── Rate limiting: máx 10 requests por IP cada 15 min ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Demasiadas solicitudes, intenta más tarde.' }
});
app.use('/api/', limiter);

// ── Rutas ──
app.use('/api/contact', contactRoute);

// ── Health check ──
app.get('/', (req, res) => {
  res.json({ status: 'ASEROSA Backend running ✓' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
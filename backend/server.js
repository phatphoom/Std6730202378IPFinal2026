require('dotenv').config();
const express = require('express');
const cors = require('cors');

const router = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Global middleware ----------
app.use(cors());
app.use(express.json());

// ---------- Routes ----------
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HR Management API Server is running',
    health: '/api/health',
  });
});

app.use('/api', router);

// ---------- 404 catch-all ----------
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ---------- Global error handler ----------
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`HR Management API running on port ${PORT}`);
});

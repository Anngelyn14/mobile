const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Performance Optimization Middleware
app.use(compression()); // Gzip compression
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files with caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d', // Cache static assets for 1 day
  etag: false
}));

// Database initialization
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Protected dashboard route
app.get('/dashboard', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// 404 handler for HTML routes - serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Access the app: http://localhost:${PORT}`);
});

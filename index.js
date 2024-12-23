const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');

// Inisialisasi file .env
console.log('Loading environment variables...');
dotenv.config();

// Validasi environment variables
if (!process.env.JWT_SECRET || !process.env.DB_HOST || !process.env.DB_USER) {
    console.error('ERROR: Missing required environment variables in .env file.');
    throw new Error('Missing required environment variables in .env file.');
}

// Inisialisasi aplikasi Express
console.log('Initializing StuMa API...');
const app = express();
const PORT = process.env.PORT || 3000;

// **CORS Configuration**
// const corsOptions = {
//     origin: '*',  // Mengizinkan semua origin (bisa diganti dengan domain yang spesifik)
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],  // Semua metode HTTP yang digunakan
//     allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],  // Header yang diizinkan
// };

// Middleware
app.use(bodyParser.json());
app.use(cors());  // Aktifkan CORS dengan konfigurasi

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
    next();
});

// Import routes
let authRoutes, profileRoutes, itemRoutes;
try {
    authRoutes = require('./routes/auth');
    profileRoutes = require('./routes/profile');
    itemRoutes = require('./routes/item');
    console.log('Routes loaded successfully.');
} catch (err) {
    console.error('ERROR: Failed to load routes:', err.message);
    process.exit(1); // Berhenti jika rute gagal dimuat
}

// Root Route
app.get('/', (req, res) => {
    res.send('StuMa API is running...');
    console.log('GET request received at /');
});

// Register routes
if (authRoutes) {
    app.use('/api/auth', authRoutes);
}
if (profileRoutes) {
    app.use('/api/profile', profileRoutes);
}
if (itemRoutes) {
    app.use('/api/items', itemRoutes);
}

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack || err.message);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message,
    });
});

// 404 Route Handling
app.use((req, res) => {
    console.warn(`404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`StuMa API is running on http://localhost:${PORT}`);
});

console.log('StuMa API initialization complete.');

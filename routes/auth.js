const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const db = require('../db/connection');

dotenv.config();
const router = express.Router();

// Middleware for validating token
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Bearer token
    if (!token) {
        return res.status(401).send({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).send({ message: 'Invalid token.' });
    }
};

// Register Route
router.post('/register', async (req, res) => {
    const { name, phone, address, email, password } = req.body;

    if (!name || !phone || !address || !email || !password) {
        return res.status(400).send({ message: 'All fields are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `INSERT INTO users (name, phone, address, email, password) VALUES (?, ?, ?, ?, ?)`;
    db.query(query, [name, phone, address, email, hashedPassword], (err, result) => {
        if (err) {
            return res.status(500).send({ message: err.message });
        }
        res.status(201).send({ message: 'User registered successfully' });
    });
});

// Login Route
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: 'Email and password are required.' });
    }

    const query = `SELECT * FROM users WHERE email = ?`;
    db.query(query, [email], async (err, result) => {
        if (err) {
            return res.status(500).send({ message: err.message });
        }
        if (result.length === 0) {
            return res.status(404).send({ message: 'User not found' });
        }

        const user = result[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).send({ message: 'Login successful', token });
    });
});

// Protected route example
router.get('/protected', authenticateToken, (req, res) => {
    res.status(200).send({ message: `Welcome user ${req.user.id}!` });
});

module.exports = router;

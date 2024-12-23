const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/connection');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Get Profile Route
router.get('/', authenticate, (req, res) => {
    const userId = req.user.id;

    const query = `SELECT id, name, phone, address, email FROM users WHERE id = ?`;
    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Database error: ' + err.message });
        }
        if (result.length === 0) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.status(200).send(result[0]);
    });
});

// Update Profile Route
router.put('/', authenticate, (req, res) => {
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    if (!name || !phone || !address) {
        return res.status(400).send({ message: 'Name, phone, and address are required.' });
    }

    const query = `UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?`;
    db.query(query, [name, phone, address, userId], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Database error: ' + err.message });
        }
        res.status(200).send({ message: 'Profile updated successfully' });
    });
});

// Change Password Route
router.post('/change-password', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).send({ message: 'Old password and new password are required.' });
    }

    const selectQuery = `SELECT password FROM users WHERE id = ?`;
    db.query(selectQuery, [userId], async (err, results) => {
        if (err) {
            return res.status(500).send({ message: 'Database error: ' + err.message });
        }
        if (results.length === 0) {
            return res.status(404).send({ message: 'User not found' });
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).send({ message: 'Old password is incorrect.' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const updateQuery = `UPDATE users SET password = ? WHERE id = ?`;
        db.query(updateQuery, [hashedNewPassword, userId], (updateErr) => {
            if (updateErr) {
                return res.status(500).send({ message: 'Failed to update password: ' + updateErr.message });
            }

            res.status(200).send({ message: 'Password updated successfully' });
        });
    });
});

module.exports = router;

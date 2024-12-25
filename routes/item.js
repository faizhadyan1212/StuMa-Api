const express = require("express");
const router = express.Router();
const db = require("../db/connection"); // Koneksi database
const authenticate = require("../middleware/authenticate"); // Middleware autentikasi
const { body, validationResult } = require("express-validator"); // Validasi input

// **1. Tambah Item Baru**
router.post(
    "/",
    authenticate,
    [
        body("items_name").notEmpty().withMessage("Items Name is required"),
        body("category").notEmpty().withMessage("Category is required"),
        body("description").notEmpty().withMessage("Description is required"),
        body("stock").isInt({ gt: 0 }).withMessage("Stock must be a positive integer"),
        body("price").isFloat({ gt: 0 }).withMessage("Price must be a positive number"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { items_name, category, description, stock, price } = req.body;
        const userId = req.user.id;

        try {
            await db.query(
                "INSERT INTO items (items_name, category, description, stock, price, user_id) VALUES (?, ?, ?, ?, ?, ?)",
                [items_name, category, description, stock, price, userId]
            );
            res.status(201).json({
                success: true,
                message: "Item added successfully",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message,
            });
        }
    }
);

// **2. Ambil Semua Item dengan Nama Pengguna**
router.get("/", authenticate, async (req, res) => {
    try {
        const query = `
        SELECT 
            items.id,
            items.items_name,
            items.category,
            items.description,
            items.stock,
            items.price,
            users.name AS seller_name
        FROM items
        INNER JOIN users ON items.user_id = users.id
        `;
        
        db.query(query, (err, rows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Server error",
                    error: err.message,
                });
            }

            if (!rows || rows.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "No items found",
                    data: [],
                });
            }

            res.status(200).json({
                success: true,
                data: rows,
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

// **3. Ambil Item Berdasarkan ID dengan Nama Pengguna**
router.get("/:id", authenticate, async (req, res) => {
    const itemId = req.params.id;

    try {
        const query = `
        SELECT 
            items.id,
            items.items_name,
            items.category,
            items.description,
            items.stock,
            items.price,
            users.name AS seller_name
        FROM items
        INNER JOIN users ON items.user_id = users.id
        WHERE items.id = ?
        `;
        
        const [rows] = await db.query(query, [itemId]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Item not found",
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0],
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

module.exports = router;


// **4. Perbarui Item Berdasarkan ID**
router.put(
    "/:id",
    authenticate,
    [
        body("items_name").notEmpty().withMessage(" Items Name is required"),
        body("category").notEmpty().withMessage("Category is required"),
        body("description").notEmpty().withMessage("Description is required"),
        body("stock").isInt({ gt: 0 }).withMessage("Stock must be a positive integer"),
        body("price").isFloat({ gt: 0 }).withMessage("Price must be a positive number"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error("DEBUG: Validation errors:", errors.array());
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const itemId = req.params.id;
        const userId = req.user.id; // Untuk memastikan user yang berhak mengedit item
        const { items_name, category, description, stock, price } = req.body;

        console.log("DEBUG: PUT /api/items/:id - Request Params:", req.params);
        console.log("DEBUG: PUT /api/items/:id - Request Body:", req.body);

        try {
            const result = await db.query(
                "UPDATE items SET items_name = ?, category = ?, description = ?, stock = ?, price = ? WHERE id = ? AND user_id = ?",
                [items_name, category, description, stock, price, itemId, userId]
            );

            if (result.affectedRows === 0) {
                console.warn("DEBUG: Item not found or not authorized");
                return res.status(404).json({
                    success: false,
                    message: "Item not found or not authorized",
                });
            }

            console.log("DEBUG: Item updated successfully");
            res.status(200).json({
                success: true,
                message: "Item updated successfully",
            });
        } catch (error) {
            console.error("DEBUG: Error updating item:", error.message);
            res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message,
            });
        }
    }
);

module.exports = router;

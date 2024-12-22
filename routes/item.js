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
        body("name").notEmpty().withMessage("Name is required"),
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

        const { name, category, description, stock, price } = req.body;
        const userId = req.user.id;

        console.log("DEBUG: POST /api/items - Request Body:", req.body);

        try {
            await db.query(
                "INSERT INTO items (name, category, description, stock, price, user_id) VALUES (?, ?, ?, ?, ?, ?)",
                [name, category, description, stock, price, userId]
            );
            console.log("DEBUG: Item added successfully");
            res.status(201).json({
                success: true,
                message: "Item added successfully",
            });
        } catch (error) {
            console.error("DEBUG: Error inserting item:", error.message);
            res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message,
            });
        }
    }
);

// **2. Ambil Semua Item Berdasarkan User ID**
router.get("/", authenticate, async (req, res) => {
    const userId = req.user.id;

    console.log("DEBUG: GET /api/items - Fetching items for User ID:", userId);

    try {
        const [rows] = await db.query("SELECT * FROM items WHERE user_id = ?", [userId]);

        if (!rows || rows.length === 0) {
            console.log("DEBUG: No items found for User ID:", userId);
            return res.status(200).json({
                success: true,
                message: "No items found",
                data: [],
            });
        }

        console.log("DEBUG: Items fetched successfully for User ID:", userId);
        res.status(200).json({
            success: true,
            data: rows,
        });
    } catch (error) {
        console.error("DEBUG: Error fetching items:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

// **3. Ambil Item Berdasarkan ID**
router.get("/:id", authenticate, async (req, res) => {
    const itemId = req.params.id;

    console.log("DEBUG: GET /api/items/:id - Fetching item with ID:", itemId);

    try {
        const [rows] = await db.query("SELECT * FROM items WHERE id = ?", [itemId]);

        if (!rows || rows.length === 0) {
            console.warn("DEBUG: Item not found for ID:", itemId);
            return res.status(404).json({
                success: false,
                message: "Item not found",
            });
        }

        console.log("DEBUG: Item fetched successfully:", rows[0]);
        res.status(200).json({
            success: true,
            data: rows[0],
        });
    } catch (error) {
        console.error("DEBUG: Error fetching item:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

// **4. Perbarui Item Berdasarkan ID**
router.put(
    "/:id",
    authenticate,
    [
        body("name").notEmpty().withMessage("Name is required"),
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
        const { name, category, description, stock, price } = req.body;

        console.log("DEBUG: PUT /api/items/:id - Request Params:", req.params);
        console.log("DEBUG: PUT /api/items/:id - Request Body:", req.body);

        try {
            const result = await db.query(
                "UPDATE items SET name = ?, category = ?, description = ?, stock = ?, price = ? WHERE id = ? AND user_id = ?",
                [name, category, description, stock, price, itemId, userId]
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

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        // Ambil header Authorization
        const authHeader = req.header("Authorization") || ""; 
        console.log("DEBUG: Authorization Header received:", authHeader);

        // Periksa apakah header ada dan dalam format yang benar
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.error("DEBUG: Authorization header missing or malformed.");
            return res.status(401).json({ 
                success: false, 
                message: "Access denied. No token provided." 
            });
        }

        // Ekstrak token dari header
        const token = authHeader.split(" ")[1];
        console.log("DEBUG: Extracted Token:", token);

        // Pastikan token tidak kosong
        if (!token) {
            console.error("DEBUG: Token missing after Bearer");
            return res.status(401).json({ 
                success: false, 
                message: "Access denied. Token missing." 
            });
        }

        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("DEBUG: Token decoded successfully:", decoded);

        // Pastikan token mengandung informasi yang benar
        if (!decoded || !decoded.id) {
            console.error("DEBUG: Token does not contain valid user ID.");
            return res.status(403).json({
                success: false,
                message: "Token does not contain valid user information."
            });
        }

        // Tambahkan informasi pengguna ke request
        req.user = decoded;
        next(); // Lanjutkan ke rute berikutnya
    } catch (err) {
        // Tangani error verifikasi token
        if (err.name === "TokenExpiredError") {
            console.error("DEBUG: Token expired:", err.message);
            return res.status(403).json({ 
                success: false, 
                message: "Token has expired. Please log in again." 
            });
        } else if (err.name === "JsonWebTokenError") {
            console.error("DEBUG: Invalid token:", err.message);
            return res.status(403).json({ 
                success: false, 
                message: "Invalid token. Please log in again." 
            });
        } else {
            console.error("DEBUG: Token verification failed:", err.message);
            return res.status(403).json({ 
                success: false, 
                message: "Token verification failed. Please try again." 
            });
        }
    }
};

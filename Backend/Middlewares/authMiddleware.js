import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({ message: "Access denied! No token provided." });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
        console.error("❌ ERROR: JWT_SECRET is not set in .env file!");
        return res.status(500).json({ message: "Server configuration error." });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        console.error("❌ ERROR in Token Verification:", error);
        res.status(401).json({ message: "Invalid token!" });
    }
};
export default authenticateToken;
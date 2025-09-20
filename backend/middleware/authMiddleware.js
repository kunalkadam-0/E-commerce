const jwt = require('jsonwebtoken');

// Export a function that accepts the JWT_SECRET from server.js
module.exports = (JWT_SECRET) => {

    // Middleware to verify JWT
    const verifyToken = (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Authentication required. Token missing or invalid.' });
            }

            const token = authHeader.split(' ')[1];

            // Use the passed-in JWT_SECRET for verification
            jwt.verify(token, JWT_SECRET, (err, decoded) => {
                if (err) {
                    console.error("JWT Verification Error:", err.message, err.name);
                    let errorMessage = 'Authentication failed. Invalid token.';
                    if (err.name === 'TokenExpiredError') {
                        errorMessage = 'Authentication failed. Token has expired.';
                    } else if (err.name === 'JsonWebTokenError') {
                        errorMessage = 'Authentication failed. Invalid token signature or format.';
                    } else {
                        errorMessage = 'Authentication failed. Unknown token error.';
                    }
                    return res.status(401).json({ message: errorMessage });
                }

                req.user = decoded;
                next();
            });
        } catch (error) {
            console.error('Authentication error (Caught by try-catch):', error);
            return res.status(500).json({ message: 'Authentication failed. Server error.' });
        }
    };

    // Middleware factory to authorize roles
    const authorizeRoles = (allowedRoles) => {
        return (req, res, next) => {
            if (!req.user || !allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Authorization failed. Access denied.' });
            }
            next();
        };
    };

    // Return the object containing the middlewares
    return {
        verifyToken,
        authorizeRoles
    };
};
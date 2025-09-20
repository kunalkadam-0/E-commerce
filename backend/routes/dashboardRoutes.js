const express = require('express');
const db = require('../config/db.config');

// Export a function that accepts the initialized authMiddleware object
module.exports = (authMiddleware) => {
    const router = express.Router();

    // GET Dashboard Data (ADMIN ONLY)
    // This route will fetch total counts for orders, users, and products
    router.get(
        '/',
        authMiddleware.verifyToken,
        authMiddleware.authorizeRoles(['admin']),
        async (req, res) => {
            try {
                // Fetch total orders count
                const [ordersResult] = await db.execute('SELECT COUNT(*) AS total_orders FROM orders');
                const totalOrders = ordersResult[0].total_orders;

                // Fetch total users count
                const [usersResult] = await db.execute('SELECT COUNT(*) AS total_users FROM users');
                const totalUsers = usersResult[0].total_users;

                // Fetch total products count
                const [productsResult] = await db.execute('SELECT COUNT(*) AS total_products FROM products');
                const totalProducts = productsResult[0].total_products;

                res.status(200).json({
                    totalOrders,
                    totalUsers,
                    totalProducts
                });

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                res.status(500).json({ message: 'Failed to fetch dashboard data.' });
            }
        }
    );

    return router;
};
// backend/server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); // Required for path.resolve

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Make JWT_SECRET globally available after dotenv loads it
const JWT_SECRET = process.env.JWT_SECRET;

// CRITICAL: Check if JWT_SECRET is loaded (for debugging)
if (!JWT_SECRET) {
    console.error('CRITICAL ERROR: JWT_SECRET is not loaded from .env file!');
    console.error('Please ensure backend/server/.env file exists and contains JWT_SECRET=YOUR_SECRET_KEY');
    process.exit(1); // Exit if secret is missing to prevent silent failures
} else {
    console.log('JWT_SECRET loaded successfully.');
}

// Initialize authMiddleware by passing the JWT_SECRET
const authMiddleware = require('../middleware/authMiddleware')(JWT_SECRET);

// Initialize all route modules, passing the initialized authMiddleware to them
const userRoutes = require('../routes/userRoutes')(JWT_SECRET); // userRoutes also needs JWT_SECRET for signing
const productRoutes = require('../routes/productRoutes')(authMiddleware);
const ordersRoutes = require('../routes/ordersRoutes')(authMiddleware);
const categoryRoutes = require('../routes/categoryRoutes')(authMiddleware);
const cartRoutes = require('../routes/cartRoutes')(authMiddleware);
const dashboardRoutes = require('../routes/dashboardRoutes')(authMiddleware);

const app = express();
const port = process.env.PORT || 5000;

// --- These are crucial for parsing form data, including JSON and URL-encoded ---
app.use(express.json()); // For parsing application/json requests
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded requests
// --- END crucial parsers ---

app.use(cors());

// Serve uploaded files - This part is correct and remains the same
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Use the initialized routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.send('E-commerce backend is running!');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

module.exports = app;
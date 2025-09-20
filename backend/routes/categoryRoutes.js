const express = require('express');
const db = require('../config/db.config');

// Export a function that accepts the initialized authMiddleware object
module.exports = (authMiddleware) => {
    const router = express.Router();

    // Get all categories (accessible by anyone)
    router.get('/', async (req, res) => {
        try {
            const [categories] = await db.execute('SELECT * FROM categories');
            res.status(200).json(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ message: 'Failed to fetch categories.' });
        }
    });

    // Get category by ID (accessible by anyone)
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [category] = await db.execute('SELECT * FROM categories WHERE category_id = ?', [id]);
            if (category.length === 0) {
                return res.status(404).json({ message: 'Category not found.' });
            }
            res.status(200).json(category[0]);
        } catch (error) {
            console.error('Error fetching category by ID:', error);
            res.status(500).json({ message: 'Failed to fetch category.' });
        }
    });

    // Add a new category (ADMIN ONLY)
    router.post('/', authMiddleware.verifyToken, authMiddleware.authorizeRoles(['admin']), async (req, res) => {
        try {
            const { name, description } = req.body;
            if (!name) {
                return res.status(400).json({ message: 'Category name is required.' });
            }
            const [result] = await db.execute(
                'INSERT INTO categories (name, description) VALUES (?, ?)',
                [name, description]
            );
            res.status(201).json({ message: 'Category added successfully!', categoryId: result.insertId });
        } catch (error) {
            console.error('Error adding category:', error);
            res.status(500).json({ message: 'Failed to add category.' });
        }
    });

    // Update a category (ADMIN ONLY)
    router.put('/:id', authMiddleware.verifyToken, authMiddleware.authorizeRoles(['admin']), async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            if (!name) {
                return res.status(400).json({ message: 'Category name is required for update.' });
            }
            const [result] = await db.execute(
                'UPDATE categories SET name = ?, description = ? WHERE category_id = ?',
                [name, description, id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Category not found or no changes made.' });
            }
            res.status(200).json({ message: 'Category updated successfully!' });
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ message: 'Failed to update category.' });
        }
    });

    // Delete a category (ADMIN ONLY)
    router.delete('/:id', authMiddleware.verifyToken, authMiddleware.authorizeRoles(['admin']), async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.execute('DELETE FROM categories WHERE category_id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Category not found.' });
            }
            res.status(200).json({ message: 'Category deleted successfully!' });
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ message: 'Failed to delete category.' });
        }
    });

    return router; // Must return the router instance
};
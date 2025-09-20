const express = require('express');
const db = require('../config/db.config');

// Export a function that accepts the initialized authMiddleware object
module.exports = (authMiddleware) => {
  const router = express.Router();

  // Add item to cart (AUTHENTICATED USERS)
  router.post('/', authMiddleware.verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { product_id, quantity, selected_size } = req.body;

      if (!product_id || !quantity || quantity <= 0 || !selected_size) {
        return res.status(400).json({ message: 'Product ID, positive quantity, and selected size are required.' });
      }

      // Check if item with same product and size already exists
      const [existingCartItem] = await db.execute(
        'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND selected_size = ?',
        [userId, product_id, selected_size]
      );

      if (existingCartItem.length > 0) {
        // Update quantity if exists
        await db.execute(
          'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ? AND selected_size = ?',
          [quantity, userId, product_id, selected_size]
        );
        res.status(200).json({ message: 'Product quantity updated in cart.' });
      } else {
        // Add new cart item
        await db.execute(
          'INSERT INTO cart_items (user_id, product_id, quantity, selected_size) VALUES (?, ?, ?, ?)',
          [userId, product_id, quantity, selected_size]
        );
        res.status(201).json({ message: 'Product added to cart.' });
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      res.status(500).json({ message: 'Failed to add item to cart.' });
    }
  });

  // Get user's cart (AUTHENTICATED USERS)
  router.get('/', authMiddleware.verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const [cartItems] = await db.execute(
        `SELECT 
            ci.cart_item_id, 
            ci.product_id, 
            ci.quantity, 
            ci.selected_size,
            p.name AS product_name, 
            p.price AS price_at_add,
            pi.image_url
        FROM 
            cart_items ci
        JOIN 
            products p ON ci.product_id = p.product_id
        LEFT JOIN 
            product_images pi ON p.product_id = pi.product_id AND pi.is_thumbnail = 1
        WHERE 
            ci.user_id = ?
        ORDER BY ci.cart_item_id DESC`,
        [userId]
      );
      res.status(200).json(cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ message: 'Failed to fetch cart.' });
    }
  });

  // Update item quantity (AUTHENTICATED USERS)
  router.put('/:cart_item_id', authMiddleware.verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { cart_item_id } = req.params;
      const { quantity } = req.body;

      if (quantity === undefined || quantity < 0) {
        return res.status(400).json({ message: 'Quantity is required and must be a non-negative number.' });
      }

      if (quantity === 0) {
        // Delete item
        const [result] = await db.execute(
          'DELETE FROM cart_items WHERE cart_item_id = ? AND user_id = ?',
          [cart_item_id, userId]
        );
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Cart item not found.' });
        }
        return res.status(200).json({ message: 'Product removed from cart.' });
      } else {
        // Update quantity
        const [result] = await db.execute(
          'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ? AND user_id = ?',
          [quantity, cart_item_id, userId]
        );
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Cart item not found.' });
        }
        return res.status(200).json({ message: 'Product quantity updated.' });
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ message: 'Failed to update cart item.' });
    }
  });

  // Remove an item (AUTHENTICATED USERS)
  router.delete('/:cart_item_id', authMiddleware.verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { cart_item_id } = req.params;

      const [result] = await db.execute(
        'DELETE FROM cart_items WHERE cart_item_id = ? AND user_id = ?',
        [cart_item_id, userId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Cart item not found.' });
      }
      res.status(200).json({ message: 'Product removed from cart.' });
    } catch (error) {
      console.error('Error removing item:', error);
      res.status(500).json({ message: 'Failed to remove item from cart.' });
    }
  });

  // Clear entire cart
  router.delete('/', authMiddleware.verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const [result] = await db.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);

      res.status(200).json({ message: 'Cart cleared successfully.' });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ message: 'Failed to clear cart.' });
    }
  });

  return router;
};

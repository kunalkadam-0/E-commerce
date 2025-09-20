const express = require('express');
const db = require('../config/db.config');

module.exports = (authMiddleware) => {
  const router = express.Router();

  // ============================================
  // PLACE ORDER
  // ============================================
  router.post('/', authMiddleware.verifyToken, async (req, res) => {
    const userId = req.user.id;
    const {
      total_amount,
      shipping_address,
      billing_address,
      order_items,
      payment_method,
      order_status = 'pending',
      order_from_cart = false
    } = req.body;

    if (!total_amount || !shipping_address || !order_items || !payment_method || !Array.isArray(order_items) || order_items.length === 0) {
      return res.status(400).json({ message: 'Missing order details.' });
    }

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Create order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (user_id, order_date, shipping_address, billing_address, total_amount, payment_method, payment_status, order_status)
         VALUES (?, NOW(), ?, ?, ?, ?, ?, ?)`,
        [userId, shipping_address, billing_address, total_amount, payment_method, payment_method === 'card' ? 'paid' : 'cod_pending', order_status]
      );

      const orderId = orderResult.insertId;

      // Insert order items
      for (const item of order_items) {
        if (!item.product_id || !item.quantity || !item.price_at_order || !item.selected_size) {
          await connection.rollback();
          return res.status(400).json({ message: 'Invalid order item details.' });
        }

        // Check stock
        const [productRows] = await connection.execute('SELECT stock_quantity FROM products WHERE product_id = ?', [item.product_id]);
        if (productRows.length === 0 || productRows[0].stock_quantity < item.quantity) {
          await connection.rollback();
          return res.status(400).json({ message: `Not enough stock for product ID: ${item.product_id}.` });
        }

        // Insert order item
        await connection.execute(
          'INSERT INTO order_items (order_id, product_id, quantity, selected_size, price_at_order) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.selected_size, item.price_at_order]
        );

        // Update stock
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Optionally clear cart
      if (order_from_cart) {
        await connection.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
      }

      await connection.commit();
      res.status(201).json({ message: 'Order placed successfully!', orderId });

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error placing order:', error);
      res.status(500).json({ message: 'Failed to place order.' });
    } finally {
      if (connection) connection.release();
    }
  });

  // ============================================
  // GET USER ORDERS
  // ============================================
  router.get('/myorders', authMiddleware.verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const [orders] = await db.execute(
        `SELECT order_id, user_id, order_date, shipping_address, billing_address, total_amount, payment_method, transaction_id, payment_status, order_status 
         FROM orders WHERE user_id = ? ORDER BY order_date DESC`,
        [userId]
      );

      for (let order of orders) {
        const [items] = await db.execute(
          `SELECT 
            oi.order_item_id, 
            oi.product_id, 
            oi.quantity, 
            oi.selected_size,
            oi.price_at_order,
            p.name AS product_name,
            p.image_url
          FROM 
            order_items oi
          JOIN 
            products p ON oi.product_id = p.product_id
          WHERE oi.order_id = ?`,
          [order.order_id]
        );
        order.items = items;
      }

      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({ message: 'Failed to fetch user orders.' });
    }
  });

  // ============================================
  // GET SINGLE ORDER BY ID (For user)
  // ============================================
  router.get('/myorders/:order_id', authMiddleware.verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { order_id } = req.params;

      const [orders] = await db.execute(
        `SELECT order_id, user_id, order_date, shipping_address, billing_address, total_amount, payment_method, transaction_id, payment_status, order_status 
         FROM orders WHERE order_id = ? AND user_id = ?`,
        [order_id, userId]
      );

      if (orders.length === 0) {
        return res.status(404).json({ message: 'Order not found or access denied.' });
      }

      const order = orders[0];

      const [items] = await db.execute(
        `SELECT 
          oi.order_item_id, 
          oi.product_id, 
          oi.quantity, 
          oi.selected_size,
          oi.price_at_order,
          p.name AS product_name,
          p.image_url
        FROM 
          order_items oi
        JOIN 
          products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?`,
        [order.order_id]
      );

      order.items = items;
      res.status(200).json(order);
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      res.status(500).json({ message: 'Failed to fetch order.' });
    }
  });

  // ============================================
  // ADMIN — GET ALL ORDERS
  // ============================================
  router.get('/', authMiddleware.verifyToken, authMiddleware.authorizeRoles(['admin']), async (req, res) => {
    try {
      const [orders] = await db.execute(
        `SELECT
          o.order_id,
          o.user_id,
          u.first_name,
          u.last_name,
          o.order_date,
          o.total_amount,
          o.shipping_address,
          o.billing_address,
          o.payment_method,
          o.transaction_id,
          o.payment_status,
          o.order_status
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        ORDER BY o.order_date DESC`
      );
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching all orders (admin):', error);
      res.status(500).json({ message: 'Failed to fetch orders.' });
    }
  });

  // ============================================
  // ADMIN — UPDATE ORDER STATUS + auto-update payment_status if delivered
  // ============================================
  router.put('/:order_id/order-status', authMiddleware.verifyToken, authMiddleware.authorizeRoles(['admin']), async (req, res) => {
    try {
      const { order_id } = req.params;
      const { order_status } = req.body;

      const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!allowedStatuses.includes(order_status)) {
        return res.status(400).json({ message: 'Invalid order status.' });
      }

      // Update order status
      const [result] = await db.execute('UPDATE orders SET order_status = ? WHERE order_id = ?', [order_status, order_id]);
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Order not found.' });

      // If status = 'delivered' — auto update payment_status to 'paid'
      if (order_status === 'delivered') {
        await db.execute('UPDATE orders SET payment_status = ? WHERE order_id = ?', ['paid', order_id]);
      }

      res.status(200).json({ message: 'Order status updated successfully.' });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Failed to update order status.' });
    }
  });

  // ============================================
  // ADMIN — UPDATE PAYMENT STATUS
  // ============================================
  router.put('/:order_id/payment-status', authMiddleware.verifyToken, authMiddleware.authorizeRoles(['admin']), async (req, res) => {
    try {
      const { order_id } = req.params;
      const { payment_status } = req.body;

      const allowedStatuses = ['paid', 'failed', 'refunded', 'cod_pending'];
      if (!allowedStatuses.includes(payment_status)) {
        return res.status(400).json({ message: 'Invalid payment status.' });
      }

      const [result] = await db.execute('UPDATE orders SET payment_status = ? WHERE order_id = ?', [payment_status, order_id]);
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Order not found.' });

      res.status(200).json({ message: 'Order payment status updated successfully.' });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ message: 'Failed to update payment status.' });
    }
  });

  return router;
};

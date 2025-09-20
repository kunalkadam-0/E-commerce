// backend/controllers/ordersController.js

const connection = require('../config/db.config');
const { getOrCreateCart } = require('./cartController');

// Create an order
exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { shipping_address, billing_address, payment_method, transaction_id, items } = req.body;

  if (!shipping_address || !billing_address || !payment_method) {
    return res.status(400).json({ message: 'Shipping address, billing address, and payment method are required.' });
  }

  let productsToOrder = [];
  let totalAmount = 0;
  let orderPlacedFromCart = false;

  try {
    if (items && items.length > 0) {
      // Buy Now flow
      productsToOrder = items;
    } else {
      // Checkout from Cart flow
      orderPlacedFromCart = true;
      const cartId = await getOrCreateCart(userId);

      const [cartItemsRows] = await connection.promise().query(
        `SELECT ci.product_id, ci.quantity, ci.selected_size, p.price, p.stock_quantity
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.product_id
         WHERE ci.cart_id = ?`,
        [cartId]
      );

      if (cartItemsRows.length === 0) {
        return res.status(400).json({ message: 'Your cart is empty. Cannot place an order.' });
      }

      productsToOrder = cartItemsRows;
    }

    // Validate stock + calculate total
    for (const item of productsToOrder) {
      const [productRows] = await connection.promise().query(
        'SELECT price, stock_quantity FROM products WHERE product_id = ?',
        [item.product_id]
      );

      if (productRows.length === 0) {
        return res.status(404).json({ message: `Product with ID ${item.product_id} not found.` });
      }

      const product = productRows[0];
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ID ${item.product_id}. Available: ${product.stock_quantity}` });
      }

      totalAmount += parseFloat(product.price) * item.quantity;
      item.unit_price = product.price;
    }

    // Create Order
    const [orderResult] = await connection.promise().query(
      'INSERT INTO orders (user_id, shipping_address, billing_address, total_amount, payment_method, transaction_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, shipping_address, billing_address, totalAmount.toFixed(2), payment_method, transaction_id || null]
    );
    const orderId = orderResult.insertId;

    // Insert order_items with selected size
    const orderItemsValues = productsToOrder.map(item => [
      orderId,
      item.product_id,
      item.quantity,
      item.selected_size, // 💡 new field here
      item.unit_price
    ]);

    await connection.promise().query(
      'INSERT INTO order_items (order_id, product_id, quantity, selected_size, unit_price) VALUES ?',
      [orderItemsValues]
    );

    // Update product stock
    for (const item of productsToOrder) {
      await connection.promise().query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart if checkout from cart
    if (orderPlacedFromCart) {
      const cartId = await getOrCreateCart(userId);
      await connection.promise().query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    }

    res.status(201).json({ message: 'Order placed successfully!', orderId });

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Internal server error while placing order.' });
  }
};

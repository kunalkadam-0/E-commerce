// // backend/controllers/cartController.js

// const connection = require('../config/db.config');

// // Helper function to get or create a cart for a user
// const getOrCreateCart = (userId) => {
//   return new Promise((resolve, reject) => {
//     connection.query(
//       'SELECT cart_id FROM carts WHERE user_id = ?',
//       [userId],
//       (error, results) => {
//         if (error) return reject(error);
//         if (results.length > 0) resolve(results[0].cart_id);
//         else {
//           connection.query(
//             'INSERT INTO carts (user_id) VALUES (?)',
//             [userId],
//             (insertErr, insertResults) => {
//               if (insertErr) return reject(insertErr);
//               resolve(insertResults.insertId);
//             }
//           );
//         }
//       }
//     );
//   });
// };

// // ✅ Add product to cart (with size)
// exports.addToCart = async (req, res) => {
//   const userId = req.user.id;
//   const { productId, quantity, size } = req.body;

//   if (!productId || !quantity || quantity <= 0) {
//     return res.status(400).json({ message: 'Product ID and positive quantity are required.' });
//   }

//   try {
//     const cartId = await getOrCreateCart(userId);
//     const selectedSize = size || 'Free Size';

//     // Check if product with same size exists in cart
//     connection.query(
//       'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND size = ?',
//       [cartId, productId, selectedSize],
//       (error, results) => {
//         if (error) {
//           console.error('Error checking cart item:', error);
//           return res.status(500).json({ message: 'Error checking cart item.' });
//         }

//         if (results.length > 0) {
//           // Product exists — update quantity
//           connection.query(
//             'UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ? AND size = ?',
//             [quantity, cartId, productId, selectedSize],
//             (updateErr) => {
//               if (updateErr) {
//                 console.error('Error updating quantity:', updateErr);
//                 return res.status(500).json({ message: 'Error updating cart item.' });
//               }
//               res.status(200).json({ message: 'Product quantity updated in cart.' });
//             }
//           );
//         } else {
//           // Product does not exist — insert new
//           connection.query(
//             'INSERT INTO cart_items (cart_id, product_id, quantity, size) VALUES (?, ?, ?, ?)',
//             [cartId, productId, quantity, selectedSize],
//             (insertErr) => {
//               if (insertErr) {
//                 console.error('Error adding product:', insertErr);
//                 return res.status(500).json({ message: 'Error adding product to cart.' });
//               }
//               res.status(201).json({ message: 'Product added to cart.' });
//             }
//           );
//         }
//       }
//     );
//   } catch (error) {
//     console.error('Error in addToCart:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };

// // ✅ Get all items in cart (with size)
// exports.getCart = async (req, res) => {
//   const userId = req.user.id;

//   try {
//     const cartId = await getOrCreateCart(userId);
//     connection.query(
//       `SELECT ci.cart_item_id, ci.product_id, ci.quantity, ci.size, p.name, p.price, p.image_url
//        FROM cart_items ci
//        JOIN products p ON ci.product_id = p.product_id
//        WHERE ci.cart_id = ?`,
//       [cartId],
//       (error, results) => {
//         if (error) {
//           console.error('Error fetching cart:', error);
//           return res.status(500).json({ message: 'Error fetching cart.' });
//         }
//         res.status(200).json(results);
//       }
//     );
//   } catch (error) {
//     console.error('Error in getCart:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };

// // ✅ Update cart item quantity (quantity only — size remains same)
// exports.updateCartItemQuantity = async (req, res) => {
//   const userId = req.user.id;
//   const { cart_item_id } = req.params;
//   const { quantity } = req.body;

//   if (quantity === undefined || quantity < 0) {
//     return res.status(400).json({ message: 'Quantity must be a non-negative number.' });
//   }

//   try {
//     if (quantity === 0) {
//       connection.query(
//         'DELETE FROM cart_items WHERE cart_item_id = ?',
//         [cart_item_id],
//         (err, result) => {
//           if (err) return res.status(500).json({ message: 'Error deleting item.' });
//           if (result.affectedRows === 0) return res.status(404).json({ message: 'Item not found.' });
//           res.status(200).json({ message: 'Product removed from cart.' });
//         }
//       );
//     } else {
//       connection.query(
//         'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?',
//         [quantity, cart_item_id],
//         (err, result) => {
//           if (err) return res.status(500).json({ message: 'Error updating quantity.' });
//           if (result.affectedRows === 0) return res.status(404).json({ message: 'Item not found.' });
//           res.status(200).json({ message: 'Quantity updated.' });
//         }
//       );
//     }
//   } catch (error) {
//     console.error('Error updating quantity:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };

// // ✅ Remove item from cart
// exports.removeFromCart = async (req, res) => {
//   const userId = req.user.id;
//   const { cart_item_id } = req.params;

//   try {
//     connection.query(
//       'DELETE FROM cart_items WHERE cart_item_id = ?',
//       [cart_item_id],
//       (err, result) => {
//         if (err) return res.status(500).json({ message: 'Error removing item.' });
//         if (result.affectedRows === 0) return res.status(404).json({ message: 'Item not found.' });
//         res.status(200).json({ message: 'Item removed from cart.' });
//       }
//     );
//   } catch (error) {
//     console.error('Error in removeFromCart:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };

// exports.getOrCreateCart = getOrCreateCart;

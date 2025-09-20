const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db.config');

module.exports = (JWT_SECRET) => {
  const authMiddleware = require('../middleware/authMiddleware')(JWT_SECRET);
  const router = express.Router();

  // ================== User Registration ==================
  router.post('/register', async (req, res) => {
    try {
      const { first_name, last_name, email, password, phone_number } = req.body;

      if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ message: 'First name, last name, email, and password are required.' });
      }

      const [existingUser] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
        return res.status(409).json({ message: 'User with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await db.execute(
        'INSERT INTO users (first_name, last_name, email, password, phone_number, role) VALUES (?, ?, ?, ?, ?, ?)',
        [first_name, last_name, email, hashedPassword, phone_number, 'customer']
      );

      res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Failed to register user.' });
    }
  });

  // ================== User Login ==================
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const [userRows] = await db.execute(
        'SELECT user_id, password, role, email, first_name, last_name FROM users WHERE email = ?',
        [email]
      );
      if (userRows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const user = userRows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        {
          id: user.user_id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        message: 'Login successful!',
        token,
        userId: user.user_id,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Failed to login.' });
    }
  });

  // ================== Forgot Password ==================
  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    try {
      const [userRows] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
      if (userRows.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await db.execute(
        'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
        [token, expires, email]
      );

      // 🔵 Return dummy link in response (since no real email sending)
      res.status(200).json({
        message: 'Password reset link generated.',
        resetLink: `http://localhost:3000/reset-password/${token}`
      });

    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ message: 'Failed to initiate password reset.' });
    }
  });

  // =================== Reset Password =================== //

  router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    try {
      const [userRows] = await db.execute(
        'SELECT user_id, reset_token_expires FROM users WHERE reset_token = ?',
        [token]
      );

      if (userRows.length === 0) {
        return res.status(400).json({ message: 'Invalid or expired reset token.' });
      }

      const user = userRows[0];
      if (new Date() > new Date(user.reset_token_expires)) {
        return res.status(400).json({ message: 'Reset token has expired.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.execute(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?',
        [hashedPassword, user.user_id]
      );

      res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ message: 'Failed to reset password.' });
    }
  });

  // ================== User Profile ==================
  router.get('/profile', authMiddleware.verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const [userRows] = await db.execute(
        'SELECT user_id, first_name, last_name, email, phone_number, role, created_at FROM users WHERE user_id = ?',
        [userId]
      );
      if (userRows.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      res.status(200).json(userRows[0]);
    } catch (err) {
      console.error('Profile fetch error:', err);
      res.status(500).json({ message: 'Failed to fetch user profile.' });
    }
  });

  // ================== Update User Profile ==================
  router.put('/profile', authMiddleware.verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { first_name, last_name, email, phone_number } = req.body;

      const [result] = await db.execute(
        'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ? WHERE user_id = ?',
        [first_name, last_name, email, phone_number, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found or no changes made.' });
      }

      res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (err) {
      console.error('Profile update error:', err);
      res.status(500).json({ message: 'Failed to update profile.' });
    }
  });

  // ================== Admin: Get All Users ==================
  router.get('/', authMiddleware.verifyToken, authMiddleware.authorizeRoles(['admin']), async (req, res) => {
    try {
      const [users] = await db.execute(
        'SELECT user_id, first_name, last_name, email, phone_number, role, created_at FROM users'
      );
      res.status(200).json(users);
    } catch (err) {
      console.error('Fetch all users error:', err);
      res.status(500).json({ message: 'Failed to fetch users.' });
    }
  });

  // ================== Admin: Update User Role ==================
  router.put('/:user_id/role', authMiddleware.verifyToken, authMiddleware.authorizeRoles(['admin']), async (req, res) => {
    try {
      const { user_id } = req.params;
      const { role } = req.body;

      const allowedRoles = ['admin', 'customer'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role.' });
      }

      const [result] = await db.execute(
        'UPDATE users SET role = ? WHERE user_id = ?',
        [role, user_id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }

      res.status(200).json({ message: 'User role updated.' });
    } catch (err) {
      console.error('Role update error:', err);
      res.status(500).json({ message: 'Failed to update user role.' });
    }
  });

  // ================== Admin: Delete User ==================
  router.delete('/:user_id', authMiddleware.verifyToken, authMiddleware.authorizeRoles(['admin']), async (req, res) => {
    try {
      const { user_id } = req.params;
      const [result] = await db.execute('DELETE FROM users WHERE user_id = ?', [user_id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      res.status(200).json({ message: 'User deleted.' });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ message: 'Failed to delete user.' });
    }
  });

  return router;
};

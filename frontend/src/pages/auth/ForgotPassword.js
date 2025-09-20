import React, { useState } from 'react';
import axios from 'axios';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setResetLink('');

    try {
      const response = await axios.post('http://localhost:5000/api/users/forgot-password', { email });
      setMessage(response.data.message);
      setResetLink(response.data.resetLink);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to send reset link.');
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '400px' }}>
      <h3 className="mb-4">Forgot Password</h3>
      <form onSubmit={handleSubmit}>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label className="form-label">Enter your registered email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Get Reset Link</button>
      </form>

      {resetLink && (
        <div className="mt-3">
          <p className="text-success">Reset link (for testing):</p>
          <a href={resetLink}>{resetLink}</a>
        </div>
      )}
    </div>
  );
}

export default ForgotPassword;

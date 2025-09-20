import React, { useEffect, useState, useCallback } from 'react'; // ADDED useCallback import
import { getAllUsers, updateUserRole, deleteUser } from '../../services/api';
import Sidebar from '../../components/admin/Sidebar';
import { useNavigate, Link } from 'react-router-dom';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  // Define fetchUsers using useCallback to memoize the function.
  // This prevents it from being recreated on every render unless 'navigate' changes.
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFeedbackMessage(''); // Clear previous feedback
    try {
      const response = await getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        setFeedbackMessage('You are not authorized to view this page. Please log in as an admin.');
        // Use a timeout before navigating to allow the user to read the message
        setTimeout(() => navigate('/login'), 2000); 
      } else {
        setFeedbackMessage('Error fetching users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]); // 'navigate' is a stable dependency provided by react-router-dom

  // useEffect hook to call fetchUsers when the component mounts or when fetchUsers callback changes.
  // Since fetchUsers is memoized with useCallback, this useEffect will only run once on mount
  // and re-run if 'navigate' (its dependency) changes, which is rare.
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // Now 'fetchUsers' is a stable dependency, resolving the warning

  // Handle role update
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setFeedbackMessage('User role updated successfully.');
      fetchUsers(); // Refresh the users list after update
    } catch (error) {
      console.error('Error updating role:', error);
      setFeedbackMessage(error.response?.data?.message || 'Failed to update role.');
    }
  };

  // Open delete confirmation modal
  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.user_id);
      setFeedbackMessage(`User ${userToDelete.email} deleted successfully.`);
      cancelDelete(); // Close modal after successful deletion
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error deleting user:', error);
      setFeedbackMessage(error.response?.data?.message || 'Failed to delete user.');
      cancelDelete(); // Close modal even on error
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: '250px' }}>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/admin/users">Admin Users Management</Link>
            <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        <div className="container-fluid p-4 flex-grow-1">
          <h2 className="mb-3">Manage Users</h2>
          {feedbackMessage && (
            <div className={`alert ${feedbackMessage.includes('successfully') ? 'alert-success' : 'alert-danger'} mb-3`} role="alert">
              {feedbackMessage}
            </div>
          )}
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Change Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.user_id}>
                      <td>{user.user_id}</td>
                      <td>{user.first_name} {user.last_name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone_number}</td>
                      <td>{user.role}</td>
                      <td>
                        <select
                          className="form-select"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                        >
                          <option value="admin">Admin</option>
                          <option value="customer">Customer</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => confirmDelete(user)}
                          disabled={user.role === 'admin'} // Disable delete for admin users (optional)
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="bg-dark text-white text-center py-3 w-100">
          <p className="mb-0">&copy; Admin Panel 2024</p>
        </footer>
      </div>

      {/* Delete Confirmation Modal (Bootstrap Modal) */}
      {showDeleteModal && userToDelete && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">Confirm Deletion</h5>
                {/* Use a proper button for closing modal for accessibility */}
                <button type="button" className="btn-close" aria-label="Close" onClick={cancelDelete}></button>
              </div>
              <div className="modal-body">
                Are you sure you want to delete user: <strong>{userToDelete.first_name} {userToDelete.last_name} ({userToDelete.email})</strong>?
                This action cannot be undone.
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cancelDelete}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteUser}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
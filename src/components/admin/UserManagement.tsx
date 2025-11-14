import React from 'react';

export const UserManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">User Management</h2>
        <p className="text-gray-600">Manage users, roles, and permissions.</p>
      </div>
    </div>
  );
};

export default UserManagement;
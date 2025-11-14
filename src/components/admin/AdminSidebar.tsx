import React from 'react';

export const AdminSidebar: React.FC = () => {
  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>
      <nav className="mt-4">
        <a href="#" className="block px-4 py-2 hover:bg-gray-700">Overview</a>
        <a href="#" className="block px-4 py-2 hover:bg-gray-700">Users</a>
        <a href="#" className="block px-4 py-2 hover:bg-gray-700">Settings</a>
        <a href="#" className="block px-4 py-2 hover:bg-gray-700">Analytics</a>
      </nav>
    </div>
  );
};

export default AdminSidebar;
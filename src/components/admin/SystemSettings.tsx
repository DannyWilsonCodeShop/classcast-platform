import React from 'react';

export const SystemSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
        <p className="text-gray-600">Configure system-wide settings and preferences.</p>
      </div>
    </div>
  );
};

export default SystemSettings;
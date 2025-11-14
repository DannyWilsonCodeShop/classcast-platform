'use client';

import React, { useState, useEffect } from 'react';
import { awsConnectionChecker } from '@/lib/aws-config';

interface ConnectionStatus {
  cognito: boolean;
  apiGateway: boolean;
  dynamodb: boolean;
  s3: boolean;
  overall: boolean;
}

interface PortalStatus {
  instructor: boolean;
  student: boolean;
  shared: boolean;
}

export const AWSConnectionStatus: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [portalStatus, setPortalStatus] = useState<PortalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      setLoading(true);
      setError(null);

      const [connections, portals] = await Promise.all([
        awsConnectionChecker.checkAllConnections(),
        awsConnectionChecker.getPortalConnectionStatus(),
      ]);

      setConnectionStatus(connections);
      setPortalStatus(portals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-600">Checking AWS connections...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow-md p-4 border border-red-200">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="text-sm text-red-600">Connection check failed: {error}</span>
        </div>
      </div>
    );
  }

  if (!connectionStatus || !portalStatus) {
    return null;
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
    ) : (
      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
    );
  };

  const getStatusText = (status: boolean) => {
    return status ? 'Connected' : 'Disconnected';
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">AWS Backend Status</h3>
        <button
          onClick={checkConnections}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {/* AWS Services */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">AWS Services</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.cognito)}
              <span className="text-sm text-gray-600">Cognito</span>
              <span className={`text-xs ${getStatusColor(connectionStatus.cognito)}`}>
                {getStatusText(connectionStatus.cognito)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.apiGateway)}
              <span className="text-sm text-gray-600">API Gateway</span>
              <span className={`text-xs ${getStatusColor(connectionStatus.apiGateway)}`}>
                {getStatusText(connectionStatus.apiGateway)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.dynamodb)}
              <span className="text-sm text-gray-600">DynamoDB</span>
              <span className={`text-xs ${getStatusColor(connectionStatus.dynamodb)}`}>
                {getStatusText(connectionStatus.dynamodb)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.s3)}
              <span className="text-sm text-gray-600">S3</span>
              <span className={`text-xs ${getStatusColor(connectionStatus.s3)}`}>
                {getStatusText(connectionStatus.s3)}
              </span>
            </div>
          </div>
        </div>

        {/* Portal Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Portal Connectivity</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {getStatusIcon(portalStatus.instructor)}
              <span className="text-sm text-gray-600">Instructor Portal</span>
              <span className={`text-xs ${getStatusColor(portalStatus.instructor)}`}>
                {getStatusText(portalStatus.instructor)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(portalStatus.student)}
              <span className="text-sm text-gray-600">Student Portal</span>
              <span className={`text-xs ${getStatusColor(portalStatus.student)}`}>
                {getStatusText(portalStatus.student)}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Status */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Overall Status</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.overall)}
              <span className={`text-sm font-medium ${getStatusColor(connectionStatus.overall)}`}>
                {connectionStatus.overall ? 'All Systems Operational' : 'Issues Detected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AWSConnectionStatus;

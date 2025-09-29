'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  ServerIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: string;
  responseTime: number;
}

interface MetricData {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface MonitoringDashboardProps {
  isAdmin?: boolean;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ isAdmin = false }) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchHealthData();
    fetchMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealthData();
      fetchMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching health data:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      // In a real implementation, this would fetch from your metrics API
      // For now, we'll simulate some metrics
      const mockMetrics: MetricData[] = [
        {
          name: 'API Requests/min',
          value: 245,
          unit: 'requests',
          trend: 'up',
          change: 12.5
        },
        {
          name: 'Response Time',
          value: 180,
          unit: 'ms',
          trend: 'down',
          change: -8.2
        },
        {
          name: 'Error Rate',
          value: 0.8,
          unit: '%',
          trend: 'stable',
          change: 0.1
        },
        {
          name: 'Active Users',
          value: 1247,
          unit: 'users',
          trend: 'up',
          change: 15.3
        },
        {
          name: 'Database Connections',
          value: 23,
          unit: 'connections',
          trend: 'stable',
          change: 0
        },
        {
          name: 'Memory Usage',
          value: 68,
          unit: '%',
          trend: 'up',
          change: 3.2
        }
      ];
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'unhealthy':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
        return '→';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">Access denied. Admin privileges required.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600">
            Real-time system health and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={() => {
              setIsLoading(true);
              fetchHealthData();
              fetchMetrics();
            }}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Health Status */}
      {healthStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(healthStatus.status)}`}>
              {getStatusIcon(healthStatus.status)}
              <span className="capitalize">{healthStatus.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {healthStatus.responseTime}ms
              </div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Object.values(healthStatus.checks).filter(Boolean).length}
              </div>
              <div className="text-sm text-gray-600">Healthy Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Object.keys(healthStatus.checks).length}
              </div>
              <div className="text-sm text-gray-600">Total Services</div>
            </div>
          </div>

          {/* Service Status */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Service Status</h3>
            <div className="space-y-2">
              {Object.entries(healthStatus.checks).map(([service, healthy]) => (
                <div key={service} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ServerIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 capitalize">
                      {service.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    healthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {healthy ? 'Healthy' : 'Unhealthy'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">{metric.name}</h3>
              <div className={`text-sm ${getTrendColor(metric.trend)}`}>
                {getTrendIcon(metric.trend)} {metric.change > 0 ? '+' : ''}{metric.change}%
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {metric.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">{metric.unit}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="w-6 h-6 text-indigo-600" />
              <div>
                <div className="font-medium text-gray-900">View Logs</div>
                <div className="text-sm text-gray-600">Check system logs</div>
              </div>
            </div>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">User Activity</div>
                <div className="text-sm text-gray-600">Monitor user sessions</div>
              </div>
            </div>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center space-x-3">
              <ServerIcon className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Database</div>
                <div className="text-sm text-gray-600">Check DB performance</div>
              </div>
            </div>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <div>
                <div className="font-medium text-gray-900">Alerts</div>
                <div className="text-sm text-gray-600">View system alerts</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;

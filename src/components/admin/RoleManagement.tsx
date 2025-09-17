'use client';

import React, { useState, useEffect } from 'react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  useEffect(() => {
    loadRolesAndPermissions();
  }, []);

  const loadRolesAndPermissions = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockRoles: Role[] = [
        {
          id: 'admin',
          name: 'Administrator',
          description: 'Full system access and control',
          permissions: ['all'],
          userCount: 3,
          isSystem: true
        },
        {
          id: 'instructor',
          name: 'Instructor',
          description: 'Can create courses, assignments, and grade submissions',
          permissions: [
            'create_assignment',
            'edit_assignment',
            'delete_assignment',
            'grade_submission',
            'view_all_submissions',
            'manage_courses',
            'view_analytics'
          ],
          userCount: 15,
          isSystem: true
        },
        {
          id: 'student',
          name: 'Student',
          description: 'Can view assignments and submit work',
          permissions: [
            'submit_assignment',
            'view_own_submissions',
            'view_own_grades',
            'view_courses'
          ],
          userCount: 250,
          isSystem: true
        },
        {
          id: 'ta',
          name: 'Teaching Assistant',
          description: 'Can assist with grading and course management',
          permissions: [
            'grade_submission',
            'view_all_submissions',
            'view_analytics',
            'manage_courses'
          ],
          userCount: 8,
          isSystem: false
        }
      ];

      const mockPermissions: Permission[] = [
        // User Management
        { id: 'manage_users', name: 'Manage Users', description: 'Create, edit, and delete user accounts', category: 'User Management' },
        { id: 'view_users', name: 'View Users', description: 'View user information and profiles', category: 'User Management' },
        { id: 'assign_roles', name: 'Assign Roles', description: 'Assign and modify user roles', category: 'User Management' },
        
        // Assignment Management
        { id: 'create_assignment', name: 'Create Assignment', description: 'Create new assignments', category: 'Assignment Management' },
        { id: 'edit_assignment', name: 'Edit Assignment', description: 'Modify existing assignments', category: 'Assignment Management' },
        { id: 'delete_assignment', name: 'Delete Assignment', description: 'Remove assignments', category: 'Assignment Management' },
        { id: 'view_assignments', name: 'View Assignments', description: 'View assignment details', category: 'Assignment Management' },
        
        // Submission Management
        { id: 'grade_submission', name: 'Grade Submission', description: 'Grade student submissions', category: 'Submission Management' },
        { id: 'view_all_submissions', name: 'View All Submissions', description: 'View all student submissions', category: 'Submission Management' },
        { id: 'view_own_submissions', name: 'View Own Submissions', description: 'View own submissions only', category: 'Submission Management' },
        { id: 'submit_assignment', name: 'Submit Assignment', description: 'Submit assignments for grading', category: 'Submission Management' },
        
        // Course Management
        { id: 'manage_courses', name: 'Manage Courses', description: 'Create and manage courses', category: 'Course Management' },
        { id: 'view_courses', name: 'View Courses', description: 'View course information', category: 'Course Management' },
        { id: 'enroll_students', name: 'Enroll Students', description: 'Enroll students in courses', category: 'Course Management' },
        
        // System Administration
        { id: 'system_settings', name: 'System Settings', description: 'Configure system settings', category: 'System Administration' },
        { id: 'view_analytics', name: 'View Analytics', description: 'Access system analytics and reports', category: 'System Administration' },
        { id: 'manage_roles', name: 'Manage Roles', description: 'Create and modify user roles', category: 'System Administration' },
        { id: 'view_logs', name: 'View Logs', description: 'Access system logs and audit trails', category: 'System Administration' }
      ];
      
      setRoles(mockRoles);
      setPermissions(mockPermissions);
    } catch (error) {
      console.error('Error loading roles and permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (roleData: Partial<Role>) => {
    try {
      // TODO: Implement create role API call
      console.log('Creating role:', roleData);
      await loadRolesAndPermissions();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleEditRole = async (roleData: Partial<Role>) => {
    try {
      // TODO: Implement edit role API call
      console.log('Editing role:', roleData);
      await loadRolesAndPermissions();
      setShowEditModal(false);
      setEditingRole(null);
    } catch (error) {
      console.error('Error editing role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        // TODO: Implement delete role API call
        console.log('Deleting role:', roleId);
        await loadRolesAndPermissions();
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const getPermissionCategory = (category: string) => {
    const categoryColors = {
      'User Management': 'bg-blue-100 text-blue-800',
      'Assignment Management': 'bg-green-100 text-green-800',
      'Submission Management': 'bg-purple-100 text-purple-800',
      'Course Management': 'bg-orange-100 text-orange-800',
      'System Administration': 'bg-red-100 text-red-800'
    };
    return categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure user roles and permissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Create New Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{role.description}</p>
              </div>
              {role.isSystem && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  System
                </span>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Users with this role</span>
                <span className="font-medium">{role.userCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Permissions</span>
                <span className="font-medium">
                  {role.permissions.includes('all') ? 'All' : role.permissions.length}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setEditingRole(role);
                  setShowEditModal(true);
                }}
                className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Edit
              </button>
              {!role.isSystem && (
                <button
                  onClick={() => handleDeleteRole(role.id)}
                  className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Reference */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Available Permissions</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {Object.entries(
              permissions.reduce((acc, permission) => {
                if (!acc[permission.category]) {
                  acc[permission.category] = [];
                }
                acc[permission.category].push(permission);
                return acc;
              }, {} as Record<string, Permission[]>)
            ).map(([category, categoryPermissions]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-900 mb-3">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionCategory(permission.category)}`}>
                          {permission.name}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function UpdateAssignmentPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Load assignments on component mount
  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assignments', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAssignments(data.assignments || []);
          
          // Find piecewise assignment
          const piecewiseAssignment = data.assignments.find(a => 
            a.title && a.title.toLowerCase().includes('piecewise')
          );
          
          if (piecewiseAssignment) {
            setSelectedAssignment(piecewiseAssignment);
            setMessage(`Found assignment: "${piecewiseAssignment.title}"`);
          } else {
            setMessage('No assignment containing "piecewise" found');
          }
        }
      } else {
        setMessage('Failed to load assignments');
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      setMessage('Error loading assignments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePiecewiseAssignment = async () => {
    if (!selectedAssignment) {
      setMessage('No assignment selected');
      return;
    }

    try {
      setUpdating(true);
      setMessage('Updating assignment...');

      // Prepare the new resource
      const newResource = {
        resourceId: `resource-${Date.now()}`,
        title: 'Student problem sheet',
        type: 'link',
        url: 'https://docs.google.com/spreadsheets/d/1ZTkpE6zv2zMwQAhqKUcNtpZkM71gFleBm8Vcx8Zvsi0/edit?usp=sharing',
        description: 'Google Sheets document with practice problems for graphing piecewise functions',
        addedAt: new Date().toISOString(),
        isRequired: false,
        order: (selectedAssignment.resources?.length || 0) + 1
      };

      // Get existing resources
      const existingResources = selectedAssignment.resources || [];
      
      // Check if resource already exists
      const resourceExists = existingResources.some(resource => 
        resource.title === 'Student problem sheet' || 
        resource.url === newResource.url
      );

      // Prepare updated assignment
      const updatedAssignment = {
        ...selectedAssignment,
        title: 'Graphing Piecewise Functions',
        resources: resourceExists ? existingResources : [...existingResources, newResource],
        updatedAt: new Date().toISOString()
      };

      // Update via API
      const response = await fetch(`/api/assignments/${selectedAssignment.assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedAssignment)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMessage(`✅ Assignment updated successfully!
          
New Title: ${updatedAssignment.title}
Resources: ${updatedAssignment.resources.length}
${resourceExists ? 'Resource already existed' : 'Added new resource: Student problem sheet'}`);
          
          // Reload assignments to show updated data
          await loadAssignments();
        } else {
          setMessage('❌ Update failed: ' + (result.error || 'Unknown error'));
        }
      } else {
        const errorText = await response.text();
        setMessage(`❌ Update failed: ${response.status} ${response.statusText}\n${errorText}`);
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      setMessage('❌ Error updating assignment: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access this admin page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Update Piecewise Functions Assignment
          </h1>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading assignments...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Assignment Selection */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Select Assignment to Update</h2>
                <div className="space-y-2">
                  {assignments
                    .filter(a => a.title && a.title.toLowerCase().includes('piecewise'))
                    .map(assignment => (
                      <div
                        key={assignment.assignmentId}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAssignment?.assignmentId === assignment.assignmentId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAssignment(assignment)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{assignment.title}</h3>
                            <p className="text-sm text-gray-600">ID: {assignment.assignmentId}</p>
                            <p className="text-sm text-gray-600">
                              Resources: {assignment.resources?.length || 0}
                            </p>
                          </div>
                          {selectedAssignment?.assignmentId === assignment.assignmentId && (
                            <span className="text-blue-600 text-sm font-medium">Selected</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Update Details */}
              {selectedAssignment && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Update Details</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Current Title:</strong> {selectedAssignment.title}
                    </div>
                    <div>
                      <strong>New Title:</strong> Graphing Piecewise Functions
                    </div>
                    <div>
                      <strong>Resource to Add:</strong> Student problem sheet
                    </div>
                    <div>
                      <strong>Resource URL:</strong> 
                      <a 
                        href="https://docs.google.com/spreadsheets/d/1ZTkpE6zv2zMwQAhqKUcNtpZkM71gFleBm8Vcx8Zvsi0/edit?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-1"
                      >
                        Google Sheets Link
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Update Button */}
              <div className="flex space-x-4">
                <button
                  onClick={updatePiecewiseAssignment}
                  disabled={!selectedAssignment || updating}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    !selectedAssignment || updating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {updating ? 'Updating...' : 'Update Assignment'}
                </button>

                <button
                  onClick={loadAssignments}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  Refresh
                </button>
              </div>

              {/* Status Message */}
              {message && (
                <div className={`p-4 rounded-lg ${
                  message.includes('✅') 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : message.includes('❌')
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  <pre className="whitespace-pre-wrap text-sm">{message}</pre>
                </div>
              )}

              {/* All Assignments List */}
              <div>
                <h3 className="font-semibold mb-3">All Assignments ({assignments.length})</h3>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {assignments.map((assignment, index) => (
                    <div key={assignment.assignmentId} className="text-sm p-2 bg-gray-50 rounded">
                      <span className="font-medium">{index + 1}.</span> {assignment.title}
                      <span className="text-gray-500 ml-2">
                        ({assignment.resources?.length || 0} resources)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
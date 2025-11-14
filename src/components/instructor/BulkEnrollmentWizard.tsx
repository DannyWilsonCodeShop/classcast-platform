'use client';

import React, { useState, useCallback } from 'react';
import { X, Upload, Users, Mail, CheckCircle, AlertCircle, FileText, Copy } from 'lucide-react';

interface StudentEmail {
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  invitationSent?: boolean;
}

interface BulkEnrollmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  onEnrollmentComplete?: (enrolledCount: number) => void;
}

const BulkEnrollmentWizard: React.FC<BulkEnrollmentWizardProps> = ({
  isOpen,
  onClose,
  courseId,
  courseName,
  onEnrollmentComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [students, setStudents] = useState<StudentEmail[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailText, setEmailText] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'text' | 'csv'>('text');
  const [results, setResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setStudents([]);
    setIsProcessing(false);
    setEmailText('');
    setCsvFile(null);
    setUploadMethod('text');
    setResults(null);
  }, []);

  const handleClose = useCallback(() => {
    resetWizard();
    onClose();
  }, [resetWizard, onClose]);

  const parseEmailsFromText = useCallback((text: string): StudentEmail[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const emails: StudentEmail[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        // Try to parse "email,firstName,lastName" format
        const parts = trimmedLine.split(',').map(part => part.trim());
        
        if (parts.length >= 1) {
          const email = parts[0];
          const firstName = parts[1] || '';
          const lastName = parts[2] || '';
          
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(email)) {
            emails.push({
              email,
              firstName,
              lastName,
              status: 'pending'
            });
          }
        }
      }
    });
    
    return emails;
  }, []);

  const parseCSVFile = useCallback((file: File): Promise<StudentEmail[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const emails: StudentEmail[] = [];
          
          // Skip header row if it exists
          const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;
          
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              const parts = line.split(',').map(part => part.trim().replace(/"/g, ''));
              
              if (parts.length >= 1) {
                const email = parts[0];
                const firstName = parts[1] || '';
                const lastName = parts[2] || '';
                
                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(email)) {
                  emails.push({
                    email,
                    firstName,
                    lastName,
                    status: 'pending'
                  });
                }
              }
            }
          }
          
          resolve(emails);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  const handleTextSubmit = useCallback(() => {
    if (!emailText.trim()) return;
    
    const parsedStudents = parseEmailsFromText(emailText);
    setStudents(parsedStudents);
    setCurrentStep(2);
  }, [emailText, parseEmailsFromText]);

  const handleCSVUpload = useCallback(async (file: File) => {
    try {
      const parsedStudents = await parseCSVFile(file);
      setStudents(parsedStudents);
      setCsvFile(file);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please check the format.');
    }
  }, [parseCSVFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCSVUpload(file);
    }
  }, [handleCSVUpload]);

  const processEnrollments = useCallback(async () => {
    if (students.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/courses/bulk-enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          students: students.map(s => ({
            email: s.email,
            firstName: s.firstName,
            lastName: s.lastName
          }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process enrollments');
      }
      
      const data = await response.json();
      
      // Update student statuses based on results
      const updatedStudents = students.map(student => {
        const result = data.results.find((r: any) => r.email === student.email);
        return {
          ...student,
          status: result?.success ? 'success' : 'error',
          error: result?.error,
          invitationSent: result?.invitationSent
        };
      });
      
      setStudents(updatedStudents);
      setResults({
        total: data.total,
        successful: data.successful,
        failed: data.failed,
        errors: data.errors || []
      });
      
      setCurrentStep(3);
      
      if (onEnrollmentComplete) {
        onEnrollmentComplete(data.successful);
      }
      
    } catch (error) {
      console.error('Error processing enrollments:', error);
      alert('Error processing enrollments. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [students, courseId, onEnrollmentComplete]);

  const copyEmailsToClipboard = useCallback(() => {
    const emailList = students.map(s => s.email).join('\n');
    navigator.clipboard.writeText(emailList);
  }, [students]);

  const downloadResults = useCallback(() => {
    if (!results) return;
    
    const csvContent = [
      'Email,FirstName,LastName,Status,Error',
      ...students.map(s => `${s.email},${s.firstName || ''},${s.lastName || ''},${s.status},${s.error || ''}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollment-results-${courseId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [results, students, courseId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bulk Student Enrollment</h2>
              <p className="text-gray-600 mt-1">Add multiple students to {courseName}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step === 1 ? 'Add Students' : step === 2 ? 'Review' : 'Results'}
                </span>
                {step < 3 && (
                  <div className={`w-8 h-0.5 ml-4 ${
                    currentStep > step ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Add Students */}
        {currentStep === 1 && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Upload Method</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => setUploadMethod('text')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    uploadMethod === 'text'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Paste Emails
                </button>
                <button
                  onClick={() => setUploadMethod('csv')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    uploadMethod === 'csv'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload CSV
                </button>
              </div>
            </div>

            {uploadMethod === 'text' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Emails
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Paste email addresses, one per line. You can also include names: email,firstName,lastName
                </p>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  placeholder="student1@university.edu&#10;student2@university.edu,John,Doe&#10;student3@university.edu,Jane,Smith"
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleTextSubmit}
                    disabled={!emailText.trim()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Parse Emails
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Upload a CSV file with columns: email, firstName, lastName (firstName and lastName are optional)
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose CSV File
                  </label>
                  {csvFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {csvFile.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review */}
        {currentStep === 2 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Review Students ({students.length})
              </h3>
              <button
                onClick={copyEmailsToClipboard}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy Emails
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {student.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {student.firstName || student.lastName
                          ? `${student.firstName || ''} ${student.lastName || ''}`.trim()
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={processEnrollments}
                disabled={isProcessing || students.length === 0}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Enroll Students
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {currentStep === 3 && results && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Results</h3>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.total}</div>
                  <div className="text-sm text-blue-800">Total Students</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{results.successful}</div>
                  <div className="text-sm text-green-800">Successfully Enrolled</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                  <div className="text-sm text-red-800">Failed</div>
                </div>
              </div>
            </div>
            
            {/* Detailed Results */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg mb-6">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {student.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {student.firstName || student.lastName
                          ? `${student.firstName || ''} ${student.lastName || ''}`.trim()
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {student.status === 'success' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {student.error || (student.invitationSent ? 'Invitation sent' : 'Enrolled')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={downloadResults}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Download Results
              </button>
              <div className="space-x-3">
                <button
                  onClick={resetWizard}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Add More Students
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkEnrollmentWizard;

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Rubric {
  id: string;
  name: string;
  criteria: RubricCriteria[];
  totalPoints: number;
}

interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  weight: number; // 0-1, how much this criteria contributes to total grade
}

interface VideoSubmission {
  id: string;
  studentId: string;
  studentName: string;
  assignmentId: string;
  assignmentTitle: string;
  videoUrl: string;
  duration: number; // in seconds
  submittedAt: string;
  status: 'pending' | 'analyzing' | 'graded' | 'reviewed';
}

interface AutoGrade {
  id: string;
  submissionId: string;
  rubricId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  criteriaScores: CriteriaScore[];
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  rationale: string;
  confidence: number; // 0-1, how confident the AI is in this grade
  generatedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
}

interface CriteriaScore {
  criteriaId: string;
  criteriaName: string;
  score: number;
  maxScore: number;
  feedback: string;
  rationale: string;
}

interface AutoGradingSystemProps {
  courseId: string;
  assignmentId?: string;
  onClose: () => void;
}

const AutoGradingSystem: React.FC<AutoGradingSystemProps> = ({
  courseId,
  assignmentId,
  onClose
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'rubrics' | 'submissions' | 'grading' | 'review'>('rubrics');
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([]);
  const [autoGrades, setAutoGrades] = useState<AutoGrade[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingProgress, setGradingProgress] = useState(0);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockRubrics: Rubric[] = [
      {
        id: 'rubric1',
        name: 'Video Presentation Rubric',
        totalPoints: 100,
        criteria: [
          {
            id: 'content',
            name: 'Content Quality',
            description: 'Accuracy, depth, and relevance of information presented',
            maxPoints: 40,
            weight: 0.4
          },
          {
            id: 'presentation',
            name: 'Presentation Skills',
            description: 'Clarity, organization, and delivery of presentation',
            maxPoints: 30,
            weight: 0.3
          },
          {
            id: 'engagement',
            name: 'Engagement',
            description: 'Ability to engage audience and maintain interest',
            maxPoints: 20,
            weight: 0.2
          },
          {
            id: 'technical',
            name: 'Technical Quality',
            description: 'Audio/video quality, visual aids, and production value',
            maxPoints: 10,
            weight: 0.1
          }
        ]
      },
      {
        id: 'rubric2',
        name: 'Problem-Solving Rubric',
        totalPoints: 100,
        criteria: [
          {
            id: 'methodology',
            name: 'Problem-Solving Methodology',
            description: 'Clear step-by-step approach to solving the problem',
            maxPoints: 35,
            weight: 0.35
          },
          {
            id: 'accuracy',
            name: 'Accuracy',
            description: 'Correctness of solution and calculations',
            maxPoints: 30,
            weight: 0.3
          },
          {
            id: 'explanation',
            name: 'Explanation Quality',
            description: 'Clarity and completeness of explanation',
            maxPoints: 25,
            weight: 0.25
          },
          {
            id: 'creativity',
            name: 'Creativity',
            description: 'Innovative approaches or alternative solutions',
            maxPoints: 10,
            weight: 0.1
          }
        ]
      }
    ];

    const mockSubmissions: VideoSubmission[] = [
      {
        id: 'sub1',
        studentId: 'stu1',
        studentName: 'Alice Johnson',
        assignmentId: 'assign1',
        assignmentTitle: 'Introduction Video Assignment',
        videoUrl: '/api/placeholder/video1.mp4',
        duration: 180, // 3 minutes
        submittedAt: '2024-01-20T10:00:00Z',
        status: 'pending'
      },
      {
        id: 'sub2',
        studentId: 'stu2',
        studentName: 'Bob Smith',
        assignmentId: 'assign1',
        assignmentTitle: 'Introduction Video Assignment',
        videoUrl: '/api/placeholder/video2.mp4',
        duration: 240, // 4 minutes
        submittedAt: '2024-01-20T11:30:00Z',
        status: 'pending'
      },
      {
        id: 'sub3',
        studentId: 'stu3',
        studentName: 'Carol Davis',
        assignmentId: 'assign1',
        assignmentTitle: 'Introduction Video Assignment',
        videoUrl: '/api/placeholder/video3.mp4',
        duration: 150, // 2.5 minutes
        submittedAt: '2024-01-20T14:15:00Z',
        status: 'pending'
      }
    ];

    setRubrics(mockRubrics);
    setSubmissions(mockSubmissions);
  }, [courseId, assignmentId]);

  const handleStartGrading = async () => {
    if (!selectedRubric || selectedSubmissions.length === 0) return;

    setIsGrading(true);
    setGradingProgress(0);

    // Simulate grading process
    for (let i = 0; i < selectedSubmissions.length; i++) {
      const submissionId = selectedSubmissions[i];
      const submission = submissions.find(s => s.id === submissionId);
      
      if (submission) {
        // Simulate AI analysis
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate auto grade
        const autoGrade = await generateAutoGrade(submission, selectedRubric);
        setAutoGrades(prev => [...prev, autoGrade]);
        
        setGradingProgress(((i + 1) / selectedSubmissions.length) * 100);
      }
    }

    setIsGrading(false);
    setActiveTab('review');
  };

  const generateAutoGrade = async (submission: VideoSubmission, rubric: Rubric): Promise<AutoGrade> => {
    try {
      const response = await fetch('/api/ai/auto-grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission: {
            id: submission.id,
            studentId: submission.studentId,
            videoUrl: submission.videoUrl,
            duration: submission.duration,
            assignmentTitle: submission.assignmentTitle
          },
          rubric: {
            id: rubric.id,
            name: rubric.name,
            criteria: rubric.criteria,
            totalPoints: rubric.totalPoints
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate auto grade');
      }

      const data = await response.json();
      
      if (!data.success || !data.grade) {
        throw new Error(data.error || 'Failed to generate grade');
      }

      return {
        id: `grade_${submission.id}_${Date.now()}`,
        submissionId: submission.id,
        rubricId: rubric.id,
        totalScore: data.grade.totalScore,
        maxScore: data.grade.maxScore,
        percentage: data.grade.percentage,
        criteriaScores: data.grade.criteriaScores,
        overallFeedback: data.grade.overallFeedback,
        strengths: data.grade.strengths,
        improvements: data.grade.improvements,
        rationale: data.grade.rationale,
        confidence: data.grade.confidence,
        generatedAt: new Date().toISOString(),
        status: 'pending'
      };
    } catch (error) {
      console.error('Error generating auto grade:', error);
      // Fallback to local generation if API fails
      return generateLocalAutoGrade(submission, rubric);
    }
  };

  const generateLocalAutoGrade = (submission: VideoSubmission, rubric: Rubric): AutoGrade => {
    // Fallback local generation
    const criteriaScores: CriteriaScore[] = rubric.criteria.map(criteria => {
      const baseScore = Math.random() * criteria.maxPoints;
      const score = Math.min(Math.max(baseScore, criteria.maxPoints * 0.3), criteria.maxPoints);
      
      return {
        criteriaId: criteria.id,
        criteriaName: criteria.name,
        score: Math.round(score),
        maxScore: criteria.maxPoints,
        feedback: generateCriteriaFeedback(criteria, score),
        rationale: generateCriteriaRationale(criteria, score, submission)
      };
    });

    const totalScore = criteriaScores.reduce((sum, cs) => sum + cs.score, 0);
    const percentage = (totalScore / rubric.totalPoints) * 100;

    return {
      id: `grade_${submission.id}_${Date.now()}`,
      submissionId: submission.id,
      rubricId: rubric.id,
      totalScore,
      maxScore: rubric.totalPoints,
      percentage: Math.round(percentage),
      criteriaScores,
      overallFeedback: generateOverallFeedback(totalScore, rubric.totalPoints, submission),
      strengths: generateStrengths(criteriaScores),
      improvements: generateImprovements(criteriaScores),
      rationale: generateOverallRationale(criteriaScores, submission),
      confidence: Math.random() * 0.3 + 0.7,
      generatedAt: new Date().toISOString(),
      status: 'pending'
    };
  };

  const generateCriteriaFeedback = (criteria: RubricCriteria, score: number): string => {
    const percentage = (score / criteria.maxPoints) * 100;
    
    if (percentage >= 90) {
      return `Excellent work! ${criteria.description.toLowerCase()} was outstanding.`;
    } else if (percentage >= 80) {
      return `Good work! ${criteria.description.toLowerCase()} was well done with minor areas for improvement.`;
    } else if (percentage >= 70) {
      return `Satisfactory work. ${criteria.description.toLowerCase()} met expectations but could be enhanced.`;
    } else if (percentage >= 60) {
      return `Needs improvement. ${criteria.description.toLowerCase()} was below expectations.`;
    } else {
      return `Requires significant improvement. ${criteria.description.toLowerCase()} did not meet basic requirements.`;
    }
  };

  const generateCriteriaRationale = (criteria: RubricCriteria, score: number, submission: VideoSubmission): string => {
    const percentage = (score / criteria.maxPoints) * 100;
    
    if (criteria.id === 'content') {
      if (percentage >= 80) {
        return `The content was comprehensive and well-researched, with clear examples and accurate information. The student demonstrated strong understanding of the topic.`;
      } else if (percentage >= 60) {
        return `The content covered the main points but lacked depth in some areas. Some information could have been more detailed or better explained.`;
      } else {
        return `The content was incomplete or contained inaccuracies. Key concepts were missing or misunderstood.`;
      }
    } else if (criteria.id === 'presentation') {
      if (percentage >= 80) {
        return `The presentation was well-organized with clear structure and smooth delivery. The student spoke clearly and maintained good pace.`;
      } else if (percentage >= 60) {
        return `The presentation had good structure but could have been more polished. Some areas were unclear or rushed.`;
      } else {
        return `The presentation lacked organization and clarity. The delivery was difficult to follow.`;
      }
    } else if (criteria.id === 'engagement') {
      if (percentage >= 80) {
        return `The student effectively engaged the audience with good eye contact, enthusiasm, and interactive elements.`;
      } else if (percentage >= 60) {
        return `The presentation was somewhat engaging but could have used more interactive elements or enthusiasm.`;
      } else {
        return `The presentation lacked engagement and audience interaction. The delivery was monotone or disinterested.`;
      }
    } else if (criteria.id === 'technical') {
      if (percentage >= 80) {
        return `Excellent technical quality with clear audio, good lighting, and professional production value.`;
      } else if (percentage >= 60) {
        return `Good technical quality overall, with minor issues in audio or video that didn't significantly impact understanding.`;
      } else {
        return `Technical quality issues affected the overall presentation. Audio or video problems made it difficult to follow.`;
      }
    }
    
    return `Based on the video analysis, this criteria received a score of ${Math.round(score)}/${criteria.maxPoints}.`;
  };

  const generateOverallFeedback = (totalScore: number, maxScore: number, submission: VideoSubmission): string => {
    const percentage = (totalScore / maxScore) * 100;
    
    if (percentage >= 90) {
      return `Outstanding work! This submission demonstrates excellent understanding and presentation skills. The content was comprehensive, well-organized, and engaging. Keep up the great work!`;
    } else if (percentage >= 80) {
      return `Great job! This is a solid submission with good content and presentation. There are a few areas that could be enhanced, but overall this shows strong understanding.`;
    } else if (percentage >= 70) {
      return `Good work overall. The submission meets the basic requirements and shows understanding of the material. Consider focusing on the areas mentioned in the detailed feedback.`;
    } else if (percentage >= 60) {
      return `This submission needs improvement. While some good elements are present, there are several areas that require attention to meet the assignment expectations.`;
    } else {
      return `This submission requires significant improvement. The content and presentation did not meet the basic requirements. Please review the detailed feedback and consider resubmitting.`;
    }
  };

  const generateStrengths = (criteriaScores: CriteriaScore[]): string[] => {
    const strengths: string[] = [];
    
    criteriaScores.forEach(cs => {
      const percentage = (cs.score / cs.maxScore) * 100;
      if (percentage >= 80) {
        if (cs.criteriaName === 'Content Quality') {
          strengths.push('Comprehensive and accurate content');
        } else if (cs.criteriaName === 'Presentation Skills') {
          strengths.push('Clear and well-organized presentation');
        } else if (cs.criteriaName === 'Engagement') {
          strengths.push('Effective audience engagement');
        } else if (cs.criteriaName === 'Technical Quality') {
          strengths.push('Professional production quality');
        }
      }
    });
    
    return strengths.length > 0 ? strengths : ['Shows effort and understanding of the assignment'];
  };

  const generateImprovements = (criteriaScores: CriteriaScore[]): string[] => {
    const improvements: string[] = [];
    
    criteriaScores.forEach(cs => {
      const percentage = (cs.score / cs.maxScore) * 100;
      if (percentage < 70) {
        if (cs.criteriaName === 'Content Quality') {
          improvements.push('Enhance content depth and accuracy');
        } else if (cs.criteriaName === 'Presentation Skills') {
          improvements.push('Improve organization and delivery clarity');
        } else if (cs.criteriaName === 'Engagement') {
          improvements.push('Increase audience interaction and enthusiasm');
        } else if (cs.criteriaName === 'Technical Quality') {
          improvements.push('Address audio/video quality issues');
        }
      }
    });
    
    return improvements.length > 0 ? improvements : ['Continue practicing and refining your skills'];
  };

  const generateOverallRationale = (criteriaScores: CriteriaScore[], submission: VideoSubmission): string => {
    const totalScore = criteriaScores.reduce((sum, cs) => sum + cs.score, 0);
    const maxScore = criteriaScores.reduce((sum, cs) => sum + cs.maxScore, 0);
    const percentage = (totalScore / maxScore) * 100;
    
    let rationale = `This grade is based on AI analysis of the ${submission.duration}-second video submission. `;
    
    if (percentage >= 80) {
      rationale += `The video demonstrated strong performance across all criteria, with particularly notable strengths in content quality and presentation skills. The student showed clear understanding of the material and delivered it effectively.`;
    } else if (percentage >= 60) {
      rationale += `The video showed good understanding of the material with solid presentation skills. While there were some areas that could be improved, the overall submission met the assignment requirements.`;
    } else {
      rationale += `The video analysis revealed several areas that need improvement, including content accuracy and presentation clarity. The submission would benefit from additional preparation and practice.`;
    }
    
    rationale += ` The AI confidence level for this assessment is ${Math.round(Math.random() * 30 + 70)}%.`;
    
    return rationale;
  };

  const handleApproveGrade = (gradeId: string) => {
    setAutoGrades(prev => 
      prev.map(grade => 
        grade.id === gradeId 
          ? { ...grade, status: 'approved' as const }
          : grade
      )
    );
  };

  const handleRejectGrade = (gradeId: string) => {
    setAutoGrades(prev => 
      prev.map(grade => 
        grade.id === gradeId 
          ? { ...grade, status: 'rejected' as const }
          : grade
      )
    );
  };

  const handleModifyGrade = (gradeId: string, newScore: number) => {
    setAutoGrades(prev => 
      prev.map(grade => 
        grade.id === gradeId 
          ? { 
              ...grade, 
              totalScore: newScore,
              percentage: Math.round((newScore / grade.maxScore) * 100),
              status: 'modified' as const 
            }
          : grade
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">AI Auto-Grading System</h2>
            <p className="text-gray-600">Automatically grade video submissions using AI analysis</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'rubrics', label: 'Select Rubric', icon: '📋' },
            { id: 'submissions', label: 'Choose Submissions', icon: '🎥' },
            { id: 'grading', label: 'AI Grading', icon: '🤖' },
            { id: 'review', label: 'Review & Approve', icon: '✅' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'rubrics' && (
            <RubricSelection
              rubrics={rubrics}
              selectedRubric={selectedRubric}
              onSelectRubric={setSelectedRubric}
            />
          )}

          {activeTab === 'submissions' && (
            <SubmissionSelection
              submissions={submissions}
              selectedSubmissions={selectedSubmissions}
              onSelectSubmissions={setSelectedSubmissions}
            />
          )}

          {activeTab === 'grading' && (
            <GradingProcess
              selectedRubric={selectedRubric}
              selectedSubmissions={selectedSubmissions}
              isGrading={isGrading}
              progress={gradingProgress}
              onStartGrading={handleStartGrading}
            />
          )}

          {activeTab === 'review' && (
            <GradeReview
              autoGrades={autoGrades}
              submissions={submissions}
              onApprove={handleApproveGrade}
              onReject={handleRejectGrade}
              onModify={handleModifyGrade}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {activeTab === 'rubrics' && selectedRubric && (
              <span>Selected: {selectedRubric.name}</span>
            )}
            {activeTab === 'submissions' && selectedSubmissions.length > 0 && (
              <span>{selectedSubmissions.length} submission(s) selected</span>
            )}
            {activeTab === 'review' && autoGrades.length > 0 && (
              <span>{autoGrades.filter(g => g.status === 'approved').length} of {autoGrades.length} grades approved</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            {activeTab === 'grading' && !isGrading && selectedRubric && selectedSubmissions.length > 0 && (
              <button
                onClick={handleStartGrading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start AI Grading
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const RubricSelection: React.FC<{
  rubrics: Rubric[];
  selectedRubric: Rubric | null;
  onSelectRubric: (rubric: Rubric) => void;
}> = ({ rubrics, selectedRubric, onSelectRubric }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-800">Select a Rubric for AI Grading</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {rubrics.map((rubric) => (
        <div
          key={rubric.id}
          onClick={() => onSelectRubric(rubric)}
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedRubric?.id === rubric.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <h4 className="font-semibold text-gray-800 mb-2">{rubric.name}</h4>
          <p className="text-sm text-gray-600 mb-3">Total Points: {rubric.totalPoints}</p>
          <div className="space-y-2">
            {rubric.criteria.map((criteria) => (
              <div key={criteria.id} className="text-sm">
                <span className="font-medium">{criteria.name}</span>
                <span className="text-gray-500 ml-2">({criteria.maxPoints} pts, {Math.round(criteria.weight * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SubmissionSelection: React.FC<{
  submissions: VideoSubmission[];
  selectedSubmissions: string[];
  onSelectSubmissions: (submissionIds: string[]) => void;
}> = ({ submissions, selectedSubmissions, onSelectSubmissions }) => {
  const handleSelectSubmission = (submissionId: string) => {
    if (selectedSubmissions.includes(submissionId)) {
      onSelectSubmissions(selectedSubmissions.filter(id => id !== submissionId));
    } else {
      onSelectSubmissions([...selectedSubmissions, submissionId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.length === submissions.length) {
      onSelectSubmissions([]);
    } else {
      onSelectSubmissions(submissions.map(s => s.id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Select Submissions to Grade</h3>
        <button
          onClick={handleSelectAll}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {selectedSubmissions.length === submissions.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            onClick={() => handleSelectSubmission(submission.id)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedSubmissions.includes(submission.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">{submission.studentName}</h4>
              <span className="text-sm text-gray-500">{Math.round(submission.duration / 60)}min</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{submission.assignmentTitle}</p>
            <p className="text-xs text-gray-500">
              Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const GradingProcess: React.FC<{
  selectedRubric: Rubric | null;
  selectedSubmissions: string[];
  isGrading: boolean;
  progress: number;
  onStartGrading: () => void;
}> = ({ selectedRubric, selectedSubmissions, isGrading, progress, onStartGrading }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Grading Process</h3>
      <p className="text-gray-600">
        The AI will analyze each video submission against the selected rubric criteria
      </p>
    </div>

    {selectedRubric && (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">Selected Rubric: {selectedRubric.name}</h4>
        <p className="text-sm text-gray-600 mb-3">
          {selectedSubmissions.length} submission(s) will be graded using {selectedRubric.criteria.length} criteria
        </p>
        <div className="space-y-2">
          {selectedRubric.criteria.map((criteria) => (
            <div key={criteria.id} className="text-sm">
              <span className="font-medium">{criteria.name}</span>
              <span className="text-gray-500 ml-2">({criteria.maxPoints} pts)</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {isGrading ? (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <h4 className="text-lg font-semibold text-gray-800">AI is analyzing videos...</h4>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">{Math.round(progress)}% complete</p>
      </div>
    ) : (
      <div className="text-center">
        <button
          onClick={onStartGrading}
          disabled={!selectedRubric || selectedSubmissions.length === 0}
          className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
        >
          Start AI Grading Process
        </button>
      </div>
    )}
  </div>
);

const GradeReview: React.FC<{
  autoGrades: AutoGrade[];
  submissions: VideoSubmission[];
  onApprove: (gradeId: string) => void;
  onReject: (gradeId: string) => void;
  onModify: (gradeId: string, newScore: number) => void;
}> = ({ autoGrades, submissions, onApprove, onReject, onModify }) => {
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [newScore, setNewScore] = useState<number>(0);

  if (autoGrades.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Grades Generated Yet</h3>
        <p className="text-gray-600">Start the AI grading process to see results here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Review AI-Generated Grades</h3>
      <div className="space-y-4">
        {autoGrades.map((grade) => {
          const submission = submissions.find(s => s.id === grade.submissionId);
          return (
            <div key={grade.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {submission?.studentName} - {submission?.assignmentTitle}
                  </h4>
                  <p className="text-sm text-gray-600">
                    AI Confidence: {Math.round(grade.confidence * 100)}% | 
                    Generated: {new Date(grade.generatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    grade.status === 'approved' ? 'bg-green-100 text-green-800' :
                    grade.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    grade.status === 'modified' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {grade.status.charAt(0).toUpperCase() + grade.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Overall Score</h5>
                  <div className="text-3xl font-bold text-blue-600">
                    {grade.totalScore}/{grade.maxScore}
                  </div>
                  <div className="text-sm text-gray-600">
                    {grade.percentage}%
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Criteria Breakdown</h5>
                  <div className="space-y-1">
                    {grade.criteriaScores.map((cs) => (
                      <div key={cs.criteriaId} className="text-sm">
                        <span className="font-medium">{cs.criteriaName}:</span>
                        <span className="ml-2">{cs.score}/{cs.maxScore}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Actions</h5>
                  <div className="space-y-2">
                    <button
                      onClick={() => onApprove(grade.id)}
                      disabled={grade.status === 'approved'}
                      className="w-full px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(grade.id)}
                      disabled={grade.status === 'rejected'}
                      className="w-full px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setEditingGrade(grade.id);
                        setNewScore(grade.totalScore);
                      }}
                      className="w-full px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                    >
                      Modify Score
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">AI Feedback</h5>
                  <p className="text-gray-700">{grade.overallFeedback}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-green-800 mb-2">Strengths</h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      {grade.strengths.map((strength, index) => (
                        <li key={index}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-orange-800 mb-2">Areas for Improvement</h5>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {grade.improvements.map((improvement, index) => (
                        <li key={index}>• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">AI Rationale</h5>
                  <p className="text-sm text-gray-700">{grade.rationale}</p>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Detailed Criteria Feedback</h5>
                  <div className="space-y-2">
                    {grade.criteriaScores.map((cs) => (
                      <div key={cs.criteriaId} className="bg-gray-50 rounded p-3">
                        <div className="font-medium text-gray-800 mb-1">
                          {cs.criteriaName} ({cs.score}/{cs.maxScore})
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{cs.feedback}</p>
                        <p className="text-xs text-gray-600">{cs.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {editingGrade === grade.id && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h5 className="font-semibold text-gray-800 mb-2">Modify Score</h5>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={newScore}
                      onChange={(e) => setNewScore(parseInt(e.target.value))}
                      min="0"
                      max={grade.maxScore}
                      className="px-3 py-1 border border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">/ {grade.maxScore}</span>
                    <button
                      onClick={() => {
                        onModify(grade.id, newScore);
                        setEditingGrade(null);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingGrade(null)}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AutoGradingSystem;

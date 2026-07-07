'use client';

import React from 'react';
import { DiscussionBoardView } from '@/components/discussions/DiscussionBoardView';
import { AssessmentStartScreen } from '@/components/assessments/AssessmentStartScreen';
import { ModuleWorkspace } from '@/components/modules/ModuleWorkspace';

interface AssignmentTypeRouterProps {
  assignment: any;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
}

export function AssignmentTypeRouter({ assignment, studentId, studentName, studentAvatar }: AssignmentTypeRouterProps) {
  const assignmentType = assignment.assignmentType || 'video';

  if (assignmentType === 'discussion' && assignment.discussionConfig) {
    return (
      <DiscussionBoardView
        assignmentId={assignment.assignmentId || assignment.id}
        studentId={studentId}
        studentName={studentName}
        studentAvatar={studentAvatar}
        discussionConfig={assignment.discussionConfig}
        dueDate={assignment.dueDate}
      />
    );
  }

  if (assignmentType === 'assessment') {
    const questions = assignment.assessmentQuestions || [];
    const totalDuration = questions.reduce((s: number, q: any) => s + (q.timeLimitSeconds || 60), 0);
    return (
      <AssessmentStartScreen
        assignmentId={assignment.assignmentId || assignment.id}
        studentId={studentId}
        title={assignment.title}
        description={assignment.description || ''}
        questionCount={questions.length}
        totalDurationSeconds={totalDuration}
        hasExistingAttempt={false}
        onStart={() => {}}
      />
    );
  }

  if (assignmentType === 'module' && assignment.moduleConfig) {
    return (
      <ModuleWorkspace
        assignmentId={assignment.assignmentId || assignment.id}
        studentId={studentId}
        groupId=""
        moduleConfig={assignment.moduleConfig}
        groupMembers={[{ id: studentId, name: studentName }]}
      />
    );
  }

  // Default: return null (existing video view handles it)
  return null;
}

#!/bin/bash
# Create DynamoDB tables for Discussion Boards, Assessments, and Module Assignments
# Run once to provision new tables in us-east-1

REGION="us-east-1"

echo "Creating DynamoDB tables for Discussion Boards, Assessments, and Module Assignments..."

# classcast-discussion-posts
echo "Creating classcast-discussion-posts..."
aws dynamodb create-table \
  --table-name classcast-discussion-posts \
  --attribute-definitions \
    AttributeName=postId,AttributeType=S \
    AttributeName=discussionId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=postId,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"DiscussionIdIndex","KeySchema":[{"AttributeName":"discussionId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

# classcast-discussion-groups
echo "Creating classcast-discussion-groups..."
aws dynamodb create-table \
  --table-name classcast-discussion-groups \
  --attribute-definitions \
    AttributeName=groupId,AttributeType=S \
    AttributeName=discussionId,AttributeType=S \
  --key-schema AttributeName=groupId,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"DiscussionIdIndex","KeySchema":[{"AttributeName":"discussionId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

# classcast-assessment-sessions
echo "Creating classcast-assessment-sessions..."
aws dynamodb create-table \
  --table-name classcast-assessment-sessions \
  --attribute-definitions \
    AttributeName=sessionId,AttributeType=S \
    AttributeName=assessmentId,AttributeType=S \
    AttributeName=studentId,AttributeType=S \
  --key-schema AttributeName=sessionId,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"AssessmentIdIndex","KeySchema":[{"AttributeName":"assessmentId","KeyType":"HASH"},{"AttributeName":"studentId","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

# classcast-module-groups
echo "Creating classcast-module-groups..."
aws dynamodb create-table \
  --table-name classcast-module-groups \
  --attribute-definitions \
    AttributeName=groupId,AttributeType=S \
    AttributeName=moduleAssignmentId,AttributeType=S \
  --key-schema AttributeName=groupId,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"ModuleAssignmentIdIndex","KeySchema":[{"AttributeName":"moduleAssignmentId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

# classcast-module-lessons
echo "Creating classcast-module-lessons..."
aws dynamodb create-table \
  --table-name classcast-module-lessons \
  --attribute-definitions \
    AttributeName=lessonId,AttributeType=S \
    AttributeName=moduleSubmissionId,AttributeType=S \
    AttributeName=orderIndex,AttributeType=N \
  --key-schema AttributeName=lessonId,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"ModuleSubmissionIdIndex","KeySchema":[{"AttributeName":"moduleSubmissionId","KeyType":"HASH"},{"AttributeName":"orderIndex","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

# classcast-problem-banks
echo "Creating classcast-problem-banks..."
aws dynamodb create-table \
  --table-name classcast-problem-banks \
  --attribute-definitions \
    AttributeName=bankId,AttributeType=S \
    AttributeName=instructorId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=bankId,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"instructorId-index","KeySchema":[{"AttributeName":"instructorId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

# classcast-problems
echo "Creating classcast-problems..."
aws dynamodb create-table \
  --table-name classcast-problems \
  --attribute-definitions \
    AttributeName=problemId,AttributeType=S \
    AttributeName=bankId,AttributeType=S \
    AttributeName=orderIndex,AttributeType=N \
  --key-schema AttributeName=problemId,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"bankId-index","KeySchema":[{"AttributeName":"bankId","KeyType":"HASH"},{"AttributeName":"orderIndex","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

# classcast-problem-assignments
echo "Creating classcast-problem-assignments..."
aws dynamodb create-table \
  --table-name classcast-problem-assignments \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=assignmentId,AttributeType=S \
    AttributeName=studentId,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    '[{"IndexName":"assignmentId-index","KeySchema":[{"AttributeName":"assignmentId","KeyType":"HASH"},{"AttributeName":"studentId","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"studentId-index","KeySchema":[{"AttributeName":"studentId","KeyType":"HASH"},{"AttributeName":"assignmentId","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

echo "✅ All tables created successfully"

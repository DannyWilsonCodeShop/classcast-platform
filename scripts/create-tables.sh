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

echo "✅ All tables created successfully"

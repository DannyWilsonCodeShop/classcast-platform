const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

function generateRubric(maxScore) {
  // If 100 points, use 30 as the rubric total
  const total = maxScore === 100 ? 30 : (maxScore || 30);
  
  // Distribute points across 5 categories
  const categories = [
    { name: 'Content & Understanding', description: 'Demonstrates clear understanding of the topic and covers key concepts accurately' },
    { name: 'Communication & Clarity', description: 'Speaks clearly, organized thoughts logically, and presents ideas in a way that is easy to follow' },
    { name: 'Creativity & Engagement', description: 'Uses creative approaches to make the video engaging, interesting, and memorable' },
    { name: 'Production Quality', description: 'Good video/audio quality, appropriate length, proper framing and lighting' },
    { name: 'Effort & Completeness', description: 'Shows genuine effort, meets all requirements, and delivers a complete response' },
  ];

  // Distribute points: roughly equal, adjust for rounding
  const basePoints = Math.floor(total / 5);
  const remainder = total - (basePoints * 5);
  
  const rubric = categories.map((cat, i) => ({
    id: `rubric_${i + 1}`,
    name: cat.name,
    description: cat.description,
    maxPoints: basePoints + (i < remainder ? 1 : 0),
  }));

  return rubric;
}

async function main() {
  console.log('Fetching all assignments...');
  
  const result = await docClient.send(new ScanCommand({
    TableName: 'classcast-assignments',
  }));

  const assignments = result.Items || [];
  console.log(`Found ${assignments.length} assignments`);

  let updated = 0;
  for (const assignment of assignments) {
    const maxScore = assignment.maxScore || 100;
    const rubric = generateRubric(maxScore);
    const rubricTotal = rubric.reduce((sum, r) => sum + r.maxPoints, 0);

    console.log(`  ${assignment.title} (${maxScore} pts) → rubric total: ${rubricTotal} pts across ${rubric.length} categories`);

    await docClient.send(new UpdateCommand({
      TableName: 'classcast-assignments',
      Key: { assignmentId: assignment.assignmentId },
      UpdateExpression: 'SET rubric = :rubric, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':rubric': rubric,
        ':updatedAt': new Date().toISOString(),
      },
    }));

    updated++;
  }

  console.log(`\n✅ Done! Updated ${updated} assignments with rubric data.`);
}

main().catch(console.error);

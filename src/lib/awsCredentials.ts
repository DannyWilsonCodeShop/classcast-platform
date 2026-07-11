/**
 * Shared AWS credential configuration.
 * Supports both standard AWS_ env vars (local dev) and CLASSCAST_ prefixed vars (Amplify production).
 * Falls back to default credential chain (IAM role) if neither is set.
 */
export function getAwsConfig() {
  const region = process.env.AWS_REGION || process.env.CLASSCAST_AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.CLASSCAST_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.CLASSCAST_SECRET_ACCESS_KEY;

  const config: any = { region };

  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey };
  }

  return config;
}

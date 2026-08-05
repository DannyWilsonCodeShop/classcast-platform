/**
 * Shared AWS credential configuration.
 * Uses the default credential provider chain (Amplify service role in production, local credentials in dev).
 * No longer uses explicit CLASSCAST_ keys — service role handles permissions.
 */
export function getAwsConfig() {
  const region = process.env.AWS_REGION || process.env.CLASSCAST_AWS_REGION || 'us-east-1';
  return { region };
}

// Reads required environment variables and fails loudly when one is missing,
// instead of letting the app run half-configured. Secrets live in .env locally
// and in Railway's variables in production, never in the code.

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See .env.example.`);
  }
  return value;
}

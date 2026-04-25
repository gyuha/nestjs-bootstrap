export type RuntimeEnv = "local" | "test" | "staging" | "production";

export type MigrationPolicyInput = {
  env: RuntimeEnv;
  runMigrationsOnStartup: boolean;
};

export function shouldRunMigrationsOnStartup(input: MigrationPolicyInput): boolean {
  if (input.env === "staging" || input.env === "production") {
    return false;
  }

  return input.runMigrationsOnStartup;
}

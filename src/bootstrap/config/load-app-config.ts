import { appConfigSchema } from './app-config.schema';

export const loadAppConfig = () => {
  const parsed = appConfigSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${parsed.error.message}`,
    );
  }

  return parsed.data;
};

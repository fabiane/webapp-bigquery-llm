interface EnvConfig {
  OPENAI_API_KEY: string;
}

export const getEnvConfig = (): EnvConfig => {
  const requiredEnvVars = [
    'OPENAI_API_KEY'
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !import.meta.env[`VITE_${envVar}`]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }

  return {
    OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY
  };
};
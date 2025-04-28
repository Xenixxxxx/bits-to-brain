const ENV = {
  DEV: {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  },
  PROD: {
    BASE_URL: import.meta.env.VITE_API_URL,
  }
};

const getEnvConfig = () => {
  const env = import.meta.env.VITE_APP_ENV || 'DEV';
  return ENV[env];
};

export const config = getEnvConfig();
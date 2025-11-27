import { configType } from "../type";

const getRequired = (name: string) => {
  const v = process.env[name];

  if (!v) {
    throw new Error(`Missing env var: ${name}`);
  } 

  return v;
};

const REFRESH_TOKEN_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);

export const CONFIG: configType = {
    JWT_REFRESH_SECRET: getRequired('JWT_REFRESH_SECRET'),
    JWT_SECRET: getRequired('JWT_SECRET'),
    COSMOS_ENDPOINT: getRequired('COSMOS_ENDPOINT'),
    COSMOS_KEY: getRequired('COSMOS_KEY'),
    PORT: Number(process.env.AUTH_PORT || 3001),
    ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES ?? '15m',
    REFRESH_TOKEN_EXPIRES_DAYS,
    REFRESH_TOKEN_TTL_SECONDS: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60,
    BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
};

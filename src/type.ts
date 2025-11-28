import type { Container } from "@azure/cosmos";


export type containersType = {
    usersContainer: Container,
    refreshTokensContainer: Container
}

export interface configType {
    JWT_REFRESH_SECRET: string,
    JWT_SECRET: string,
    COSMOS_ENDPOINT: string,
    COSMOS_KEY: string,
    PORT: number,
    ACCESS_TOKEN_EXPIRES: string,
    REFRESH_TOKEN_EXPIRES_DAYS: number,
    REFRESH_TOKEN_TTL_SECONDS: number | undefined,
    BCRYPT_SALT_ROUNDS: number,
}

export type User = {
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    password?: string,
    role: "admin" | "user",
    createdAt: string,
    updatedAt: string,
    microsoftId?: string
}

export type JWTPayload = {
    userId: string,
    email: string,
    role: "admin" | "user"
}

export type RefreshToken = {
    id: string,
    userId: string,
    token: string,
    expiresAt: string,
    createdAt: string
}

export type RegisterReqBody = {
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
}

export type RegisterResBody = {
    user: User,
    accessToken: string,
    refreshToken: string
}
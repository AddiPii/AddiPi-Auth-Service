import { CONFIG } from "../config/config";
import getLocalISO from "../helpers/getLocalISO";
import type { JWTPayload, RefreshToken, User } from "../type";
import jwt from 'jsonwebtoken'
import { refreshTokensContainer } from "./containers";


function generateAccessToken(user: User): string{
    const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
    };
    return jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn: '15m' })
}

function generateRefreshToken(user: User): string {
    return jwt.sign({userId: user.id}, CONFIG.JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

async function storeRefreshToken(userId:string, token: string): Promise<void> {
    const refreshToken: RefreshToken = {
        id: `${userId}_${Date.now()}`,
        userId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: getLocalISO()
    }
    await refreshTokensContainer.items.create(refreshToken)
}

async function validateRefreshToken(token: string): Promise<string | null> {
    try {
        const decoded = jwt.verify(token, CONFIG.JWT_REFRESH_SECRET) as { userId: string }
        const query = `SELECT * FROM c WHERE c.token = @token AND c.userId = @userId AND c.expiresAt > @now`
        const { resources } = await refreshTokensContainer.items.query({
            query,
            parameters: [
                { name: '@token', value: token },
                { name: '@userId', value: decoded.userId },
                { name: '@now', value: new Date().toISOString() }
            ]
        }).fetchAll()

        return resources.length > 0 ? decoded.userId : null
    } catch (err) {
        return null
    }
}

async function revokeRefreshToken(token: string): Promise<void> {
    const query = `SELECT * FROM c WHERE c.token = @token`
    const { resources } = await refreshTokensContainer.items.query({
        query,
        parameters: [{ name: '@token', value: token }]
    }).fetchAll()

    if (resources.length > 0){
        await refreshTokensContainer.item(resources[0].id, resources[0].userId).delete()
    }
}

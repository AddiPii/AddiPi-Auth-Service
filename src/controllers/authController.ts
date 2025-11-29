import type { Request, Response } from "express"
import { JWTPayload, RegisterReqBody, RegisterResBody, User } from "../type"
import { usersContainer } from "../services/containers"
import bcrypt from 'bcryptjs'
import validator from 'validator'
import getLocalISO from "../helpers/getLocalISO"
import { generateAccessToken, generateRefreshToken, revokeRefreshToken, storeRefreshToken, validateRefreshToken } from "../services/token-service"
import jwt from 'jsonwebtoken'
import { CONFIG } from "../config/config"

export const registerUser = async (
    req: Request<{}, unknown, RegisterReqBody>, 
    res: Response<RegisterResBody | {error: string}>
): Promise<void | Response<{error: string}>> => {
    try {
        let { email, password, firstName, lastName } = req.body
        
        if( !email || !password || !firstName || !lastName ){
            return res.status(400).json({error: 'All fields are required'})
        }
        email = email.toLowerCase().trim()
        firstName.trim()
        lastName.trim()

        if(!validator.isEmail(email)){
            return res.status(400).json({error: 'Bad format of e-mail'})
        }

        const emailDomain: string = email.slice(-11)
        
        if(emailDomain != '@uwr.edu.pl'){
            return res.status(400).json({error: 'Only Univeristy of Wroclaw members can use this service'})
        }

        const query: string = `SELECT * FROM c WHERE c.email = @email`
        const { resources } = await usersContainer.items.query({
            query,
            parameters: [{ name: '@email', value: email.toLowerCase() }]
        }).fetchAll()

        if (resources.length > 0) {
            return res.status(409).json({error: 'User already exists'})
        }

        const hashed: string = await bcrypt.hash(password, 10)

        const user: User = {
            id: `user_${Date.now()}`,
            email,
            firstName,
            lastName,
            password: hashed,
            role: 'user',
            createdAt: getLocalISO(),
            updatedAt: getLocalISO(),
        }

        await usersContainer.items.create(user)

        const accessToken: string = generateAccessToken(user)
        const refreshToken: string = generateRefreshToken(user)
        await storeRefreshToken(user.id, refreshToken)

        const { password: _, ...userWithoutPassword }: User = user

        res.status(201).json({
            user: userWithoutPassword,
            accessToken,
            refreshToken
        })
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const loginUser = async (
    req:Request<{}, unknown, Pick<User, 'email' | 'password'>>, 
    res: Response<RegisterResBody | {error: string}>
): Promise<void | Response<{error: string}>> => {
    try {
        let { email, password }: Pick<User, 'email' | 'password'> = req.body

        if (!email || !password){
            return res.status(400).json({error: 'All fields are required'})
        }

        email = email.trim().toLowerCase()

        const query = `SELECT * FROM c WHERE c.email = @email`
        const { resources } = await usersContainer.items.query({
            query,
            parameters: [{name: '@email', value: email}]
        }).fetchAll()

        if (resources.length === 0){
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user: User = resources[0]

        if (!user.password){
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid: boolean = await bcrypt.compare(password, user.password)

        if (!isValid){
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken: string = generateAccessToken(user)
        const refreshToken: string = generateRefreshToken(user)
        await storeRefreshToken(user.id, refreshToken)

        const { password: _, ...userWithoutPassword }: User = user

        res.json({
            user: userWithoutPassword,
            accessToken,
            refreshToken
        })

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export const refreshToken = async (
    req: Request<{}, unknown, { refreshToken: string }>,
    res: Response<{accessToken: string, refreshToken: string} | {error: string}>
):Promise<void | Response<{error: string}>> => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken){
            return res.status(400).json({error: 'Missing refresh token'})
        }

        const userId: string | null = await validateRefreshToken(refreshToken)

        if(!userId){
             return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const { resource: user } = await usersContainer.item(userId, userId).read<User>()
        if (!user){
            return res.status(401).json({ error: 'User not found' });
        }

        await revokeRefreshToken(refreshToken)
        const newAccessToken: string = generateAccessToken(user)
        const newRefreshToken: string = generateRefreshToken(user)
        await storeRefreshToken(user.id, refreshToken)

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    } catch (err) {
        console.error('Refresh token error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const logoutUser = async (
    req: Request<{}, unknown, { refreshToken: string }>,
    res: Response<{message: string} | {error: string}>
): Promise<void> => {
    try {
        const { refreshToken } = req.body

        if (refreshToken) {
            await revokeRefreshToken(refreshToken)
        }

        res.json({message: 'Logged out successfully'})
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const verifyUser = async (
    req:Request,
    res:Response
) => {
    try {
        const token = req.headers.authorization?.replace('Bearer', '')

        if(!token){
            return res.status(401).json({error: 'Missing token'})
        }

        const decoded: JWTPayload = jwt.verify(token, CONFIG.JWT_SECRET) as JWTPayload
        res.json({ valid: true, user: decoded })
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });  
    }
}

import type { CookieOptions, Request, Response } from "express"
import { JWTPayload, LoginResBody, RefreshResBody, RegisterReqBody, RegisterResBody, User } from "../type"
import { usersContainer } from "../services/containers"
import bcrypt from 'bcryptjs'
import validator from 'validator'
import getLocalISO from "../helpers/getLocalISO"
import { generateAccessToken, generateRefreshToken, revokeRefreshToken, storeRefreshToken, validateRefreshToken } from "../services/token-service"
import jwt from 'jsonwebtoken'
import { CONFIG } from "../config/config"
import { genVerificationToken, sendVerificationEmail } from "../services/mailVerificationService"

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const REFRESH_TOKEN_COOKIE_MAX_AGE = (CONFIG.REFRESH_TOKEN_TTL_SECONDS ?? 7 * 24 * 60 * 60) * 1000

const refreshTokenCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'none' : 'lax',
    path: '/auth',
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
}

const parseCookies = (cookieHeader?: string): Record<string, string> => {
    if (!cookieHeader) {
        return {}
    }

    return cookieHeader.split(';').reduce<Record<string, string>>((cookies, part) => {
        const [rawKey, ...rawValue] = part.split('=')
        const key = rawKey.trim()

        if (!key) {
            return cookies
        }

        cookies[key] = decodeURIComponent(rawValue.join('=').trim())
        return cookies
    }, {})
}

const getRefreshTokenFromRequest = (req: Request): string | undefined => {
    return parseCookies(req.headers.cookie)[REFRESH_TOKEN_COOKIE_NAME]
}

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

        const { 
            verificationToken, 
            verificationTokenExpiry
        }: {
            verificationToken: string,
            verificationTokenExpiry: string
        }= genVerificationToken()

        const user: User = {
            id: `user_${Date.now()}`,
            email,
            firstName,
            lastName,
            password: hashed,
            role: 'user',
            isVerified: false,
            verificationToken,
            verificationTokenExpiry,
            createdAt: getLocalISO(),
            updatedAt: getLocalISO(),
        }

        await usersContainer.items.create(user)

        await sendVerificationEmail(email, verificationToken, firstName)

        const { password: _, ...userWithoutPassword }: User = user

        res.status(201).json({
            user: userWithoutPassword,
            message: 'Registration successful. Please check your email to verify your account.'
        })
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const loginUser = async (
    req:Request<{}, unknown, Pick<User, 'email' | 'password'>>, 
    res: Response<LoginResBody | {error: string}>
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

        if (!user.isVerified){
            return res.status(403).json({error: 'Please verify your email before logging in'})
        }

        const accessToken: string = generateAccessToken(user)
        const refreshToken: string = generateRefreshToken(user)
        await storeRefreshToken(user.id, refreshToken)

        const { password: _, ...userWithoutPassword }: User = user

        res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, refreshTokenCookieOptions)

        res.json({
            user: userWithoutPassword,
            accessToken
        })

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export const refreshToken = async (
    req: Request,
    res: Response<RefreshResBody | {error: string}>
):Promise<void | Response<{error: string}>> => {
    try {
        const refreshToken = getRefreshTokenFromRequest(req)

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
        await storeRefreshToken(user.id, newRefreshToken)

        res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, refreshTokenCookieOptions)

        res.json({
            accessToken: newAccessToken
        })
    } catch (err) {
        console.error('Refresh token error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const logoutUser = async (
    req: Request,
    res: Response<{message: string} | {error: string}>
): Promise<void> => {
    try {
        const refreshToken = getRefreshTokenFromRequest(req)

        if (refreshToken) {
            await revokeRefreshToken(refreshToken)
        }

        res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, refreshTokenCookieOptions)
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
        let token = req.headers.authorization?.replace('Bearer ', '').trim()
        console.log(token)
        if(!token){
            console.log('Missing t')
            return res.status(401).json({error: 'Missing token'})
        }
        token.trim()

        const decoded: JWTPayload = jwt.verify(token, CONFIG.JWT_SECRET) as JWTPayload
        console.log(decoded)
        res.json({ valid: true, user: decoded })
    } catch (err) {
        console.log('Invalid t')
        res.status(401).json({ error: 'Invalid token:', err });  
    }
}

export const verifyEmail = async (
    req: Request<{}, unknown, { token: string }, { token: string }>,
    res: Response
): Promise<void | Response<{error: string}>> => {
    try {
            const tokenFromQuery = (req.query && (req.query as any).token) as string | undefined
            const tokenFromBody = (req.body && (req.body as any).token) as string | undefined
            const token: string | undefined = tokenFromQuery || tokenFromBody

            if(!token){
                return res.status(400).json({error: 'Verification token is required'})
            }

            // Only allow verification through POST to avoid email client prefetch auto-confirming accounts
            if (req.method !== 'POST') {
                return res.status(200).json({ message: 'Open the verification page and click the confirm button to verify your email.' });
            }

        const query =  `SELECT * FROM c WHERE c.verificationToken = @token`
        const { resources } = await usersContainer.items.query({
            query,
            parameters: [{ name: '@token', value: token }]
        }).fetchAll()

        if(resources.length === 0){
            return res.status(400).json({error: 'Invalid verification token'})
        }

        const user: User = resources[0]

        if(new Date() > new Date(user.verificationTokenExpiry!)) {
            return res.status(400).json({error: 'Verification token has expired'})
        }

        const updatedUser: User = {
            ...user,
            isVerified: true,
            verificationToken: undefined,
            verificationTokenExpiry: undefined,
            updatedAt: getLocalISO()
        }

        await usersContainer.item(user.id, user.id).replace(updatedUser)

        const accessToken: string = generateAccessToken(updatedUser)
        const refreshToken: string = generateRefreshToken(updatedUser)
        await storeRefreshToken(updatedUser.id, refreshToken)

        const { password: _, ...userWithoutPassword } = updatedUser

        // res.json({
        //     message: 'Email verified successfully',
        //     user: userWithoutPassword,
        //     accessToken,
        //     refreshToken
        // })

        // Redirect back to frontend indicating success. Frontend may handle token if needed.
        res.redirect(`https://addipi.vercel.app/?verification_success=true&token=${token}`);
    } catch (err) {
        console.error('Verification error:', err)
        res.status(500).json({ error: 'Internal server error' })
    }
}


export const resendVerification = async (
    req: Request,
    res: Response
): Promise<void | Response<{error: string}>> => {
    try{
        const { email } = req.body

        if(!email){
            return res.status(400).json({error: 'Email is required'})
        }

        const query = `SELECT * FROM c WHERE c.email = @email`
        const { resources } = await usersContainer.items.query({
            query,
            parameters: [{name: '@email', value: email.toLowerCase().trim()}]
        }).fetchAll()

        if (resources.length === 0) {
            return res.status(404).json({error: 'User not found'})
        }

        const user: User = resources[0]

        if (user.isVerified) {
            return res.status(400).json({error: 'Email already verified'});
        }

        const { verificationToken, verificationTokenExpiry } = genVerificationToken();

        const updatedUser = {
            ...user,
            verificationToken,
            verificationTokenExpiry,
            updatedAt: getLocalISO()
        };

        await usersContainer.item(user.id, user.id).replace(updatedUser);
        await sendVerificationEmail(user.email, verificationToken, user.firstName);

        res.json({ message: 'Verification email sent successfully' });
    } catch(err){
        console.error('Resend verification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

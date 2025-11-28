import type { Request, Response } from "express"
import { RegisterReqBody, RegisterResBody, User } from "../type"
import { usersContainer } from "../services/containers"
import bcrypt from 'bcryptjs'
import validator from 'validator'
import getLocalISO from "../helpers/getLocalISO"
import { generateAccessToken, generateRefreshToken, storeRefreshToken } from "../services/token-service"

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

export const loginUser = async(
    req:Request, 
    res: Response
): Promise<void | Response<{error: string}>> => {
    
}
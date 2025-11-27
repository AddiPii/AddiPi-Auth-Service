import type { Request, Response } from "express"
import { RegisterReqBody } from "../type"
import { usersContainer } from "../services/containers"
import bcrypt from 'bcryptjs'

export const registerUser = async (
    req: Request<{}, unknown, RegisterReqBody>, 
    res: Response
): Promise<void | Response<{error: string}>> => {
    try {
        const { email, password, firstName, lastName } = req.body
        
        if( !email || !password || !firstName || !lastName ){
            return res.status(400).json({error: 'All fields are required'})
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

        
    } catch (err) {

    }
}
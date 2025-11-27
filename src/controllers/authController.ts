import type { Request, Response } from "express"
import { RegisterReqBody } from "../type"

export const registerUser = async (
    req: Request<{}, unknown, RegisterReqBody>, 
    res: Response
): Promise<void | {error: string}> => {
    try {
        const { email, password, firstName, lastName } = req.body
        
        
    } catch (err) {

    }
}
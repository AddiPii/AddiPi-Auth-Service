import express from 'express'
import type { Router } from 'express'
import { loginUser, registerUser } from '../controllers/authController'


export const authRouter: Router = express.Router()

authRouter.post('/register', registerUser)

authRouter.post('/login', loginUser)
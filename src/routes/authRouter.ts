import express from 'express'
import type { Router } from 'express'
import { loginUser, logoutUser, refreshToken, registerUser } from '../controllers/authController'


export const authRouter: Router = express.Router()

authRouter.post('/register', registerUser)

authRouter.post('/login', loginUser)

authRouter.post('/refresh', refreshToken)

authRouter.post('/logout', logoutUser)
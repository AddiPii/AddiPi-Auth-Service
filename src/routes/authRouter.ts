import express from 'express'
import type { Router } from 'express'
import { loginUser, logoutUser, refreshToken, registerUser, resendVerification, verifyEmail, verifyUser } from '../controllers/authController'


export const authRouter: Router = express.Router()

authRouter.post('/register', registerUser)

authRouter.post('/login', loginUser)

authRouter.patch('/refresh', refreshToken)

authRouter.post('/logout', logoutUser)

authRouter.post('/verify', verifyUser)

authRouter.get('/verify-email', verifyEmail)

authRouter.post('/resend-verification', resendVerification)
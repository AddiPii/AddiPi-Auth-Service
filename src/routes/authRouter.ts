import express from 'express'
import type { Router } from 'express'
import { registerUser } from '../controllers/authController'


export const authRouter: Router = express.Router()

authRouter.post('/register', registerUser)
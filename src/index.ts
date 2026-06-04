//AddiPi-Auth-Service
import express from 'express'
import type { Express, Request, Response } from 'express'
import type { allowedOriginsType } from './type'
import cors from 'cors'
import { CONFIG } from './config/config'
import { authRouter } from './routes/authRouter'


const PORT = CONFIG.PORT

const ALLOWED_ORIGINS: allowedOriginsType = [
    CONFIG.FRONTEND_URL,
    'http://localhost:5173'
]

const app: Express = express()

// let usersContainer: Container;
// let refreshTokensContainer: Container;


app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}))

app.use('/auth', authRouter)

app.get('/health', (req: Request, res: Response<{ok: boolean}>): void => {
    res.json({ok: true})
})

app.listen(PORT, (): void => {
    console.log(`AddiPi Auth Service działa na porcie ${PORT}`)
})

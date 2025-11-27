//AddiPi-Auth-Service
import express from 'express'
import type { Express, Request, Response } from 'express'
import cors from 'cors'
import { CONFIG } from './config/config'

const PORT = CONFIG.PORT

const app: Express = express()

// let usersContainer: Container;
// let refreshTokensContainer: Container;


app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.use(cors)

app.get('/health', (req: Request, res: Response<{ok: boolean}>): void => {
    res.json({ok: true})
})

app.listen(PORT, (): void => {
    console.log(`AddiPi Auth Service działa na porcie ${PORT}`)
})
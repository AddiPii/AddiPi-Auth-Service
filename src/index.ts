//AddiPi-Auth-Service
import express from 'express'
import type { Express, Request, Response } from 'express'
import cors from 'cors'
import { Container, CosmosClient } from '@azure/cosmos'
import { containersType, cosmosConnect } from './db/cosmosConnect'

const app: Express = express()

const PORT: string = process.env.AUTH_PORT || "3001"
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

const missing: string[] = [];
if (!JWT_SECRET) missing.push('JWT_SECRET');
if (!JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');

if (missing.length) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
}

// let usersContainer: Container;
// let refreshTokensContainer: Container;
let { usersContainer, refreshTokensContainer }: containersType = cosmosConnect()


app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.use(cors)

app.get('/health', (req: Request, res: Response<{ok: boolean}>): void => {
    res.json({ok: true})
})

app.listen(parseInt(PORT), (): void => {
    console.log(`AddiPi Auth Service działa na porcie ${PORT}`)
})
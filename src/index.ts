//AddiPi-Auth-Service
import express from 'express'
import type { Express, Request, Response } from 'express'
import cors from 'cors'
import { Container, CosmosClient } from '@azure/cosmos'
import { containersType, cosmosConnect } from './db/cosmosConnect'
import { PORT } from './config/config'

const app: Express = express()

// let usersContainer: Container;
// let refreshTokensContainer: Container;
let { usersContainer, refreshTokensContainer }: containersType = cosmosConnect()

type User = {
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    password?: string,
    role: "admin" | "user",
    createdAt: string,
    microsoftId?: string
}

type JWTPayload = {
    userId: string,
    email: string,
    role: "admin" | "user"
}

type refteshToken = {
    id: string,
    userId: string,
    token: string,
    expiresAt: string,
    createdAt: string
}



app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.use(cors)

app.get('/health', (req: Request, res: Response<{ok: boolean}>): void => {
    res.json({ok: true})
})

app.listen(PORT, (): void => {
    console.log(`AddiPi Auth Service działa na porcie ${PORT}`)
})
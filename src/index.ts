//AddiPi-Auth-Service
import express from 'express'
import type { Express } from 'express'

const app: Express = express()

const PORT: string = process.env.AUTH_PORT || "3001"

app.listen(parseInt(PORT), (): void => {
    console.log(`Addipi Auth Service działa na porcie ${PORT}`)
})
//AddiPi-Auth-Service
import express from 'express'
import type { Express } from 'express'
import cors from 'cors'

const app: Express = express()

const PORT: string = process.env.AUTH_PORT || "3001"

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.use(cors)



app.listen(parseInt(PORT), (): void => {
    console.log(`AddiPi Auth Service działa na porcie ${PORT}`)
})
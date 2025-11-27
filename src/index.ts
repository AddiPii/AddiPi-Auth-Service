//AddiPi-Auth-Service
import express from 'express'

const app = express()

const PORT: string = process.env.AUTH_PORT || "3001"

app.listen(parseInt(PORT), () => {
    console.log(`Addipi Auth Service działa na porcie ${PORT}`)
})
import express from 'express'
import overview from './database.js'
import dotenv from 'dotenv'
import cors from 'cors'
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
const PORT = process.env.MY_PORT || 8005

app.get('/', (req, res) => {
    res.json(overview())
})

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})
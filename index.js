import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import mysql2 from 'mysql2';
import bcrypt from 'bcrypt';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import validator from 'validator';

dotenv.config()

const app = express()
app.use(cors())

// Use middleware to parse request bodies and cookies
app.use(express.json())
app.use(cookieParser());

const PORT = process.env.MY_PORT || 8005
// Set up the database connection
let fitnessRetries = 0;
const maxRetries = 5;
var retryInterval = 1000; // 1 second

const connection = mysql2.createConnection({
    host: process.env.MY_HOST,
    user: process.env.MY_USER,
    password: process.env.MY_PASSWORD,
    database: process.env.MY_DATABASE_FITNESS,
});
function attemptFitnessConnection() {
    connection.connect((error) => {
        if (error) {
            console.error(error);
            if (fitnessRetries >= maxRetries) {
                console.error(`Maximum number of retries (${maxRetries}) reached.`);
            } else {
                retryInterval = (retryInterval * 1.25)
                console.log(`Retrying connection in ${retryInterval}ms...`);
                setTimeout(() => {
                    fitnessRetries += 1;
                    attemptFitnessConnection();
                }, retryInterval);
            }
        } else {
            console.log('Connection to Fitness database successful.');
        }
    });
}
attemptFitnessConnection();

connection.connect((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the fitness database.');
});

// Set up session middleware
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${PORT}`);
});


// connection.query(`CREATE TABLE IF NOT EXISTS users (
//     id INTEGER PRIMARY KEY AUTO_INCREMENT,
//     username VARCHAR(255) NOT NULL UNIQUE,
//     password VARCHAR(255) NOT NULL,
//     is_master TINYINT(1) NOT NULL DEFAULT 0
//   )`, (err, results, fields) => {
//     if (err) {
//         console.error(err.message);
//     }
// });

app.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    const isEmailValid = validator.isEmail(email);
    if (!isEmailValid) {
        return res.status(401).json({ error: 'Invalid email address' });
    }
    if (username.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
    if (password.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
    // Hash the password using bcrypt
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert the new user into the database
    connection.query(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, hashedPassword], (err, results, fields) => {
        if (err) {
            return res.status(500).json({ error: 'Error creating user' });
        }
        res.json({ message: 'User created successfully' });
    });
});

app.post('/login', (req, res) => {
    const { username, password, email } = req.body;
    const isEmailValid = validator.isEmail(email);
    if (!isEmailValid) {
        return res.status(401).json({ error: 'Invalid email address' });
    }
    // Find the user in the database
    connection.query(`SELECT * FROM users WHERE username = ?`, [username], (err, results, fields) => {
        if (err) {
            return res.status(500).json({ error: 'Error logging in' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Compare the password using bcrypt
        const match = bcrypt.compareSync(password, results[0].password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Set the user's ID in the session cookie
        req.session.userId = results[0].id;
        res.json({ message: 'Logged in successfully' });
    });
});


app.get('/protected-route', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the user's data from the database
    connection.query(`SELECT * FROM users WHERE id = ?`, [req.session.userId], (err, results, fields) => {
        if (err) {
            return res.status(500).json({ error: 'Error accessing data' });
        }
        if (results[0].is_master === 1) {
            // The user is a master user, so allow them to access the data
            return res.json({ data: 'This is the protected data' });
        } else {
            // The user is not a master user, so restrict their access
            return res.status(403).json({ error: 'Forbidden' });
        }
    });
});

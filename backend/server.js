require('dotenv/config');
const cors =require ('cors');
const mysql = require('mysql2');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const port = 5000;


const app = express();
app.use(cors());
app.use(express.json({limit: '30mb'}));
app.use(express.urlencoded({limit: '30mb', extended: true}))


// Database connection

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD

});
db.connect((err) =>{
    if (err) {
        return console.log("Error connecting to database: ", err);
    }
    console.log("database connected successfully");

    db.query(`CREATE DATABASE IF NOT EXISTS Expense_Tracker; `, (err) =>{
        if (err) {
            return console.log("Error creating database: ", err);
        }
        console.log("Database created successfully");

        // selecting the database
        db.changeUser({database: 'Expense_Tracker'}, (err) =>{
            if (err){ 
                return console.log("Error Changing database: ", err);
            }
            console.log("Changed to Expense_Tracker database");
             

            //create users table
            const createUsersTable =   `
            CREATE TABLE IF NOT EXISTS users(
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                username VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL
                );
            `;
            db.query(createUsersTable, (err) => {

                if(err) {
                    return console.log("Error creating users table:", err);

                }
                console.log("Users table already exists");
            });

            //Expenses table

            const createExpensesTable = `
            CREATE TABLE IF NOT EXISTS expense (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            amount DECIMAL(10, 2) NOT NULL, 
            transaction_date DATE NOT NULL, 
            category VARCHAR(50) NOT NULL,
            description TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
            );

            `;
            db.query(createExpensesTable, (err) => {
                if(err) {
                    return console.log("Error creating Expenses Table: ", err);

                }
                console.log("Expenses table already exists");

            });

       });
    });
});

// Middleware for authentication

const authenticate = (req, res, next) =>{
     const token = req.headers.authorization?.split(' ')
     [1]; 
     if(!token) {
        return res.status(401).json({message: 'Unauthorized'});
     }
     try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        req.userId = decoded.id;
        next();
     } catch (error) {
        return res.status(401).json({message: 'Invalid Token'});
        
     }
};

// User registration route
app.post('/api/register', async (req, res) => {
    try {
        const {email, username, password} = req.body;
        // Check if any input is empty
        if (!email || !username || !password) return res.status(400).json({message: 'All fields are required'})
        // Check if user already exists
        const UsersQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(UsersQuery, [email], async (err, data) => {
            if (err) {
                return res.status(500).json({message: 'Error checking user existence'});
            }
            if (data.length) {
                return res.status(409).json({message: 'User already exists'});
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert the new user
            const newUserQuery = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`;
            db.query(newUserQuery, [email, username, hashedPassword], (err) => {
                if (err) {
                    return res.status(500).json({message: 'Error inserting new user'});
                }
                return res.status(200).json({message: 'User created successfully'});
            });

        });
    } catch (err) {
        res.status(500).json({message: 'Internal server error', error: err.message});
    }
});
 

//login route
app.post('/api/login', async (req, res) => {
    try {
        const {username, password} = req.body;
        // Fetch user by username
        const query = `SELECT * FROM users WHERE username = ?`;
        db.query(query, [username], async (err, result) => {
            if (err) {
                return res.status(500).json({message: 'Database query error'});
            }
            // Check if user exists
            if (result.length === 0) {
                return res.status(401).json({message: 'Invalid credentials'});
            }
            const user = result[0];
            // Compare the provided password with hashed password
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(401).json({message: 'Invalid details'});
            }
            return res.status(200).json({message: 'Access granted', token: jwt.sign(JSON.stringify({username: user.username, id: user.id}), process.env.JWT_SECRET)});
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({message: 'Internal server error'});
    }
});
// Route to add expense 
app.post('/api/expenses', authenticate, async (req, res) => {
    try {
        console.log('Request Body:', req.body);
        const { amount, transaction_date, category, description } = req.body;
        const userId = req.userId;

        if (!amount || !transaction_date || !category || !description) {
            return res.status(400).json({message: 'All fields are required'});
        }
        const insertExpenseQuery = 'INSERT INTO expense(user_id, amount, transaction_date, category, description) VALUES (?, ?, ?, ?, ?)';
        db.query(insertExpenseQuery, [userId, amount, transaction_date, category, description], (err) => {
            if (err) {
                return res.status(500).json({message: 'Error inserting expense', error: err});
            }
            return res.status(201).json({message: 'Expense added successfully'});
        });
    } catch ({message}) {
        return res.status(400).json({message}); // return error
    }
});

// Route to fetch expenses for specific user
app.get('/api/expenses', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const selectExpenseQuery = 'SELECT * FROM expense WHERE user_id = ?';
        db.query(selectExpenseQuery, [userId], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Error fetching expenses', error: err});
            }
            return res.status(200).json(results);
        });
    } catch ({message}) {
        return res.status(400).json({message}); // return error
    }
});

app.delete('/api/expenses/:id', authenticate, async(req, res) => {
    const expenseId = req.params.id;
    const userId = req.userId;

    const deleteExpenseQuery = 'DELETE FROM expense WHERE id = ? AND user_id = ?';

    db.query(deleteExpenseQuery, [expenseId, userId], (err, results) => {
        if(err) {
            return res.status(500).json({message: 'Error Deleting expense', error: err});
        }

        if (results.affectedRows === 0){
            return res.status(404).json({ message: 'Expense not found'})
        }

        return res.status(200).json({ message: 'Expense Deleted successfully'})
    });
});

app.put('/api/expenses/:id', authenticate, async (req, res) => {
    try {
        const { amount, transaction_date, category, description } = req.body;
        const userId = req.userId;
        const expenseId = req.params.id;

        if (!amount || !transaction_date || !category || !description) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const updateExpenseQuery = `
            UPDATE expense
            SET amount = ?, transaction_date = ?, category = ?, description = ?
            WHERE id = ? AND user_id = ?`;

        db.query(updateExpenseQuery, [amount, transaction_date, category, description, expenseId, userId], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Error updating expense', error: err });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Expense not found' });
            }

            return res.status(200).json({ message: 'Expense updated successfully' });
        });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error', error });
    }
});


app.get('/api/transactions/history', authenticate, (req, res) => {
    try {
        const userId = req.userId; // Get the user ID from the authenticated user

        const getHistoryQuery = 'SELECT transaction_date AS date, category, amount, description FROM expense WHERE user_id = ? ORDER BY transaction_date DESC';

        db.query(getHistoryQuery, [userId], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Error fetching transaction history', error: err });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'No transactions found' });
            }

            return res.status(200).json(results); // Send transaction history as JSON
        });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error', error });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
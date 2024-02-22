const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 1000; // Use the port specified in environment variable or default to 1000

// Connect to in-memory SQLite database
const db = new sqlite3.Database(':memory:', sqlite3.OPEN_READWRITE, err => {
    if (err) {
        console.error('Error connecting to SQLite:', err.message);
    } else {
        console.log('Connected to SQLite (in-memory)');

        // Create table
        db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY,
        firstName TEXT,
        lastName TEXT,
        salutation TEXT,
        profileColor TEXT,
        gender TEXT,
        fullName TEXT,
        grossSalary TEXT
    )`, err => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('Table created successfully');

                // Insert initial data into the table
                const data = [
                    { id: 1, firstName: "John", lastName: "Doe", salutation: "Mr.", profileColor: "Blue", gender: "Male", fullName: "John Doe", grossSalary: "50 000" },
                    { id: 2, firstName: "Jane", lastName: "Smith", salutation: "Ms.", profileColor: "Green", gender: "Female", fullName: "Jane Smith", grossSalary: "55 000" },
                    { id: 3, firstName: "Bob", lastName: "Johnson", salutation: "Dr.", profileColor: "Red", gender: "Male", fullName: "Bob Johnson", grossSalary: "60 000" }
                ];

                const placeholders = data.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');

                const values = data.reduce((acc, curr) => {
                    acc.push(curr.id, curr.firstName, curr.lastName, curr.salutation, curr.profileColor, curr.gender, curr.fullName, curr.grossSalary);
                    return acc;
                }, []);

                db.run(`INSERT INTO employees (id, firstName, lastName, salutation, profileColor, gender, fullName, grossSalary) VALUES ${placeholders}`, values, function (err) {
                    if (err) {
                        console.error('Error inserting data into SQLite:', err.message);
                    } else {
                        console.log(`Inserted ${this.changes} rows into the table`);
                    }
                });
            }
        });
    }
});

// Example route to fetch data from SQLite
app.get('/employees', (req, res) => {
    db.all('SELECT * FROM employees', (err, rows) => {
        if (err) {
            console.error('Error fetching data from SQLite:', err.message);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(rows);
        }
    });
});

app.post('/employees', (req, res) => {
    const employee = req.body;
    const { id, ...rest } = employee;
    const sql = id
        ? `UPDATE employees SET firstName = ?, lastName = ?, salutation = ?, profileColor = ?, gender = ?, fullName = ?, grossSalary = ? WHERE id = ?`
        : `INSERT INTO employees (firstName, lastName, salutation, profileColor, gender, fullName, grossSalary) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const params = id
        ? [rest.firstName, rest.lastName, rest.salutation, rest.profileColor, rest.gender, rest.fullName, rest.grossSalary, id]
        : [employee.firstName, employee.lastName, employee.salutation, employee.profileColor, employee.gender, employee.fullName, employee.grossSalary];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error inserting/updating data into SQLite:', err.message);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            if (id) {
                console.log(`Updated employee with ID ${id}`);
                res.status(200).json({ id, ...employee });
            } else {
                console.log(`Inserted employee with ID ${this.lastID}`);
                res.status(201).json({ id: this.lastID, ...employee });
            }
        }
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

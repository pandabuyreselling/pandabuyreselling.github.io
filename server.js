const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const fetch = require('node-fetch'); // You might need to install node-fetch if you haven't already
const db = new sqlite3.Database('./db/main.db');

const app = express();
app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow these HTTP methods
    origin: 'http://127.0.0.1:5500' // Client origin
}));

app.use(express.json()); // Middleware to parse JSON bodies

// Endpoint to get orders
app.get('/orders', (req, res) => {
    db.all('SELECT * FROM orders', [], (err, rows) => {
        if (err) {
            sendSlackNotification(`Failed to GET orders (Server Error) (ID: ${orderId})`);
            return console.error(err.message);
        }
        sendSlackNotification(`Orders Retrieved!`);
        res.json({ orders: rows });
    });
});

app.get('/orders/:orderId', (req, res) => {
    const { orderId } = req.params;
    // Logic to fetch order by orderId from your database
    // For demonstration purposes:
    db.get("SELECT * FROM orders WHERE id = ?", [orderId], (err, row) => {
        if (err) {
            sendSlackNotification(`Order Not Served (Server Error) (ID: ${orderId})`);
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            sendSlackNotification(`Order Found! (ID: ${orderId})`);
            res.json(row);
        } else {
            sendSlackNotification(`Order Not Found (404) (ID: ${orderId})`);
            res.status(404).json({ error: "Order not found" });
        }
    });
});

app.put('/orders/:orderId', (req, res) => {
    const { orderId } = req.params; // Extracting the order ID from the URL
    const { description, price, weight, status, image, note } = req.body; // Extracting updated order details from the request body

    // SQL query to update order in the database
    const sql = `UPDATE orders SET description = ?, price = ?, weight = ?, status = ?, image = ?, note = ? WHERE id = ?`;

    // Execute SQL query
    db.run(sql, [description, price, weight, status, image, note, orderId], function(err) {
        if (err) {
            // If an error occurs, log it and send a 500 status code
            console.error(err.message);
            sendSlackNotification(`Order Update Failed (Server Error) (ID: ${orderId})`);
            res.status(500).json({ error: 'Failed to update order' });
        } else {
            // If the update is successful, send back a success response
            sendSlackNotification(`Order Updated! (Name: ${description} - ID_${orderId})`);
            res.json({ message: 'Order updated successfully', orderId: orderId });
        }
    });
});


// Change Paid/Unpaid
app.put('/orders/:orderId/status', (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body; // Assuming the new status is sent in the request body
    
    // Database update logic here...
    // For demonstration, replace it with your actual database update logic

    db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, orderId], function(err) {
        if (err) {
            sendSlackNotification(`Order Update Failed (Server Error) (ID: ${orderId})`);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            sendSlackNotification(`Order Update Failed (404) (ID: ${orderId})`);
            return res.status(404).json({ error: 'Order not found' });
        }
        sendSlackNotification(`Order State Updated (ID: ${orderId})`);
        res.json({ message: 'Status updated successfully' });
    });
});

// Endpoint to add an order
app.post('/orders', (req, res) => {
    const { description, price, weight, status, image, note } = req.body;
    const sql = `INSERT INTO orders (description, price, weight, status, image, note) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [description, price, weight, status, image, note], function(err) {
        if (err) {
            sendSlackNotification(`Order Addition Error (Name: ${description})`);
            return console.error(err.message);
        }
        sendSlackNotification(`Order Added (Name: ${description})`);
        res.status(201).json({ id: this.lastID });
    });
});

app.delete('/orders/:orderId', (req, res) => {
    const { orderId } = req.params;

    const sql = `DELETE FROM orders WHERE id = ?`;
    db.run(sql, orderId, function(err) {
        if (err) {
            console.error(err.message);
            sendSlackNotification(`Order Deletion Failed (Server Error) (ID: ${orderId})`);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        if (this.changes === 0) {
            sendSlackNotification(`Order Deletion Failed (No Exist) (ID: ${orderId})`);
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        sendSlackNotification(`Order Deleted (ID: ${orderId})`);
        res.json({ success: true, message: 'Order deleted' });
    });
});

app.put('/orders/:orderId', (req, res) => {
    const { orderId } = req.params;
    const { description, price, weight, image, note } = req.body; // Add 'status' if it's part of your order model
    const sql = `UPDATE orders SET description = ?, price = ?, weight = ?, image = ?, note = ? WHERE id = ?`;

    db.run(sql, [description, price, weight, image, note, orderId], function(err) {
        if (err) {
            console.error(err.message);
            sendSlackNotification("Order failed to update");
            return res.status(500).send('Error updating order');
        }
        sendSlackNotification(`Order updated successfully (Order Name: ${description} - ID_${orderId})`);
        res.json({ success: true, message: 'Order updated', id: this.lastID });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            console.error(err.message);
            sendSlackNotification(`Server error while ${username} tried to login.`);
            return res.status(500).send('Error on the server.');
        }
        if (!user) {
            sendSlackNotification(`Login attempt failed. Invalid username  (tried: ${username})`);
            return res.status(404).send('No user found.');
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            sendSlackNotification(`Login attempt failed. Incorrect password for username: ${username}.`);
            return res.status(401).send('Password is not valid.');
        }

        sendSlackNotification(`User ${username} successfully logged in.`);
        res.send('Login successful!');
    });
});

app.get('/settings', (req, res) => {
    // Fetch all settings from the database
    db.all('SELECT setting_key, setting_value FROM settings', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Failed to fetch settings' });
            return;
        }

        // Convert the rows array to an object for easier client-side use
        const settings = rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});

        res.json(settings);
    });
});

app.put('/settings', (req, res) => {
    const settings = req.body; // The updated settings from the client

    // Wrap db.run in a promise
    const updateSetting = (key, value) => {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE settings SET setting_value = ? WHERE setting_key = ?`;
            db.run(sql, [value, key], function(err) {
                if (err) {
                    console.error(err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    // Use Promise.all to wait for all updates to complete
    const updatePromises = Object.entries(settings).map(([key, value]) => updateSetting(key, value));

    Promise.all(updatePromises)
        .then(() => {
            sendSlackNotification("Settings updated successfully");
            res.json({ message: 'Settings updated successfully' });
        })
        .catch((error) => {
            sendSlackNotification("Settings failed to update");
            res.status(500).json({ error: 'Failed to update settings' });
        });
});

function sendSlackNotification(message) {
    const webhookUrl = 'https://hooks.slack.com/services/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';

    const data = {
        text: message, // Your notification message
    };

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then((response) => console.log(`Notification sent: ${message}`))
    .catch((error) => console.error(`Failed to send notification: ${error}`));
}


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server now live. Port: ${PORT}`);
    sendSlackNotification("Server now running.");
});
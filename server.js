const express = require("express");
const mysql = require("mysql");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL Pool - ตรวจสอบว่าใน .env ตั้งค่า DB_NAME=shirt
const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shirt' 
});

// Promise wrapper
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// Root
app.get('/', (req, res) => {
    res.send('Successfully connected to the Shirt Order server!');
});

// ดึงข้อมูลรายการสั่งเสื้อทั้งหมด
app.get('/api/Shirt', async (req, res) => {
    try {
        const orders = await query('SELECT * FROM shirt');
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// เพิ่มรายการสั่งเสื้อใหม่
app.post('/api/Shirt', async (req, res) => {
    const { customer_name, shirt_type, shirt_size, total_price } = req.body;
    
    if (!customer_name || !shirt_type || !shirt_size || total_price === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const sql = 'INSERT INTO shirt (customer_name, shirt_type, shirt_size, total_price) VALUES (?, ?, ?, ?)';
        const result = await query(sql, [customer_name, shirt_type, shirt_size, total_price]);
        
        res.status(201).json({ 
            id: result.insertId, 
            customer_name, 
            shirt_type, 
            shirt_size, 
            total_price 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ลบรายการสั่งเสื้อ
app.delete('/api/Shirt/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM shirt WHERE id = ?', [id]);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

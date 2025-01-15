const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');

app.set('view engine', 'ejs');

// กำหนดโฟลเดอร์ views
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// เส้นทางไปยังหน้าหลัก
app.get('/', (req, res) => {
    const data = { title: 'หน้าหลัก', welcomeMessage: 'ยินดีต้อนรับสู่หน้าหลักของเรา!' };
    res.render('home', data);
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// สร้างการเชื่อมต่อ
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'non1150',
    database: 'phayaoplace'
});

// เชื่อมต่อ
connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL database!');
});

// ตัวอย่างการ query
connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
        console.error('Error executing query:', err.message);
        return;
    }
    console.log('Query results:', results);
});

// ปิดการเชื่อมต่อเมื่อเสร็จสิ้น
connection.end();

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// เส้นทางตรวจสอบ Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    
    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.message);
            res.render('login', { error: 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง' });
            return;
        }
        if (results.length > 0) {
            req.session.user = results[0];
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
    });
});

// เส้นทาง Dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('dashboard', { user: req.session.user });
});

// เส้นทางสำหรับแสดงหน้า newpassword
app.get('/newpassword', (req, res) => {
    res.render('newpassword', { error: null });
});

// เส้นทางสำหรับบันทึกรหัสผ่านใหม่
app.post('/newpassword', (req, res) => {
    const { email, newPassword } = req.body;

    // ตรวจสอบว่ามีอีเมลในฐานข้อมูลหรือไม่
    const queryCheck = 'SELECT * FROM users WHERE email = ?';
    connection.query(queryCheck, [email], (err, results) => {
        if (err) {
            console.error('Error checking email:', err.message);
            res.render('newpassword', { error: 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง' });
            return;
        }

        if (results.length === 0) {
            // หากไม่พบอีเมล
            res.render('newpassword', { error: 'ไม่พบอีเมลในระบบ' });
        } else {
            // อัปเดตรหัสผ่านใหม่
            const queryUpdate = 'UPDATE users SET password = ? WHERE email = ?';
            connection.query(queryUpdate, [newPassword, email], (err) => {
                if (err) {
                    console.error('Error updating password:', err.message);
                    res.render('newpassword', { error: 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง' });
                    return;
                }
                res.send('เปลี่ยนรหัสผ่านสำเร็จ! <a href="/login">เข้าสู่ระบบ</a>');
            });
        }
    });
});

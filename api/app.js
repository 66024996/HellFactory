const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;
const mysql = require('mysql2/promise');
const cors = require("cors");
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require("bcrypt");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const Stripe = require('stripe');
const router = express.Router();
const QRCode = require("qrcode");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
// const AppleStrategy = require('passport-apple').Strategy;
const passport = require("passport");
   
app.set("view engine", "ejs");

// กำหนดโฟลเดอร์ views
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());  
app.use(express.json()); //  รองรับ JSON
app.use(express.urlencoded({ extended: true })); //  รองรับ x-www-form-urlencoded
const uploadDir = path.join(__dirname, "public", "uploads");

// ตรวจสอบว่ามีโฟลเดอร์นี้หรือไม่ ถ้าไม่มีให้สร้างขึ้นมา
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });

}
// require('dotenv').config();
// const SECRET_KEY = process.env.SECRET_KEY;
// const FRONTEND_URL = process.env.FRONTEND_URL;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: 'staythenon@gmail.com',   // ✨ เปลี่ยนเป็นอีเมลของคุณ
      pass: 'vhjx jccc hlyz bxej'     // ✨ ใส่รหัสผ่าน (หรือ App Password ของ Gmail)
  }
});

// เส้นทางไปยังหน้าหลัก
app.get("/", (req, res) => {
  const data = {
    title: "หน้าหลัก",
    welcomeMessage: "ยินดีต้อนรับสู่หน้าหลักของเรา!",
  };
  res.render("home", data);
});

// เริ่มต้นเซิร์ฟเวอร์
app.get("/", (req, res) => {
    res.send("Hello from Vercel using Express.js!");
});
  
// app.get("/about", (req, res) => {
//     res.send("This is the about page.");
// });
  
module.exports = app;

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "non1150",
  database: "phayaoplace",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function fetchUsers() {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    console.log("✅ Query results:", rows);
  } catch (err) {
    console.error("❌ Error executing query:", err.message);
  }
}

fetchUsers();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "public/uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      if (err) return cb(err);
      cb(null, uploadPath);
    }
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `user-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// ใช้ Stripe Secret Key
const stripe = Stripe('sk_test_51QkNFP07aI9JylI3vxG5J5aEIGGu3mk7aK43gXKD3yQjRp77XFvQEwYYi57t5xgDRjx8Hw9rjiwMXqNe7r1AzQyT00DVQZuBhe');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// ใช้ express-session สำหรับจัดการ session
require("dotenv").config();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultSecretKey", 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 },
  })
);


app.use(passport.initialize());
app.use(passport.session());

// กำหนด serialize/deserialize ผู้ใช้
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ตั้งค่า Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID:
        "322087221561-riig9c1ev7muo8smehl34m71em4epngc.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // ใช้ profile.id เพื่อค้นหาหรือสร้างบัญชีในฐานข้อมูล
      return done(null, profile);
    }
  )
);

// ตั้งค่า Facebook Strategy
// passport.use(new FacebookStrategy({
//     clientID: '2648073985384681',
//     clientSecret: 'f2be80ee1139a473ab0903bf64c0ac6a',
//     callbackURL: '/auth/facebook/callback',
//     profileFields: ['id', 'displayName', 'email']
//     scope: ['email', 'public_profile']
// }, (accessToken, refreshToken, profile, done) => {
//     return done(null, profile);
// }));

// app.post('/data-deletion', (req, res) => {
//     const { signed_request } = req.body;

//     if (!signed_request) {
//         return res.status(400).json({ error: 'Missing signed_request' });
//     }

//     // แปลง signed_request เป็นข้อมูล JSON
//     const userData = parseSignedRequest(signed_request);

//     if (!userData) {
//         return res.status(400).json({ error: 'Invalid signed_request' });
//     }

//     const userId = userData.user_id;

//     // ลบข้อมูลผู้ใช้จากระบบของคุณ
//     deleteUserData(userId)
//         .then(() => {
//             res.json({
//                 status: 'success',
//                 message: 'User data deleted successfully',
//                 confirmation_code: '12345' // รหัสยืนยัน (ถ้ามี)
//             });
//         })
//         .catch((err) => {
//             console.error(err);
//             res.status(500).json({
//                 status: 'error',
//                 message: 'Failed to delete user data'
//             });
//         });
// });

// function parseSignedRequest(signedRequest) {
//     const [encodedSig, payload] = signedRequest.split('.');
//     const data = JSON.parse(Buffer.from(payload, 'base64').toString());
//     return data;
// }

// // ฟังก์ชันตัวอย่างสำหรับลบข้อมูล
// function deleteUserData(userId) {
//     return new Promise((resolve, reject) => {
//         console.log(`Deleting data for user: ${userId}`);
//         // ใส่โค้ดลบข้อมูลจริงในระบบของคุณ
//         resolve();
//     });
// }

// ตั้งค่า Apple Strategy
// passport.use(new AppleStrategy({
//     clientID: '',
//     teamID: '',
//     keyID: '',
//     privateKey: 'Y',
//     callbackURL: '/auth/apple/callback',
// }, (accessToken, refreshToken, profile, done) => {
//     return done(null, profile);
// }));

//  เส้นทางสำหรับ Google OAuth
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/home");
  }
);

// เส้นทางสำหรับ Facebook OAuth
app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  (req, res) => {
    res.send("Logged in with Facebook: " + JSON.stringify(req.user));
  }
);

// เส้นทางสำหรับ Apple OAuth
app.get(
  "/auth/apple",
  passport.authenticate("apple", { scope: ["name", "email"] })
);

app.get(
  "/auth/apple/callback",
  passport.authenticate("apple", { failureRedirect: "/" }),
  (req, res) => {
    res.send("Logged in with Apple: " + JSON.stringify(req.user));
  }
);

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// เส้นทางตรวจสอบ Login
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.get("/session-check", (req, res) => {
  res.send("Session User ID: " + req.session.userId);
});


// เส้นทางตรวจสอบ Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("🔍 Login attempt for:", username);

    const [rows] = await pool.query(
      "SELECT id, password, role FROM users WHERE LOWER(username) = LOWER(?)", 
      [username]
    );

    if (rows.length === 0) {
      console.warn("⚠️ No user found");
      return res.status(401).json({ success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = rows[0];
    console.log("🔍 User Found:", user);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn("⚠️ Password mismatch");
      return res.status(401).json({ success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    // 🔹 ตั้งค่า role
    const role = user.role && user.role.trim() === "admin" ? "admin" : "user";

    // 🔹 เซ็ต session
    req.session.userId = user.id;
    req.session.userRole = role;
    await req.session.save();

    console.log("✅ Session Set:", req.session);

    // 🔹 ส่งข้อมูลกลับไปให้ Frontend ใช้ Redirect
    return res.status(200).json({ success: true, userId: user.id, role });

  } catch (error) {
    console.error("❌ Login Error:", error);
    return res.status(500).json({ success: false, error: "เกิดข้อผิดพลาด โปรดลองอีกครั้ง" });
  }
});

// เส้นทางสำหรับแสดงหน้า newpassword
app.get("/newpassword", (req, res) => {
  res.render("newpassword", { error: null });
});

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("home", { user: req.user });
  } else {
    res.redirect("/login"); // ไปหน้าล็อกอินหากผู้ใช้ยังไม่ได้เข้าสู่ระบบ
  }
});

// เส้นทางสำหรับบันทึกรหัสผ่านใหม่
app.post("/newpassword", (req, res) => {
  const { email, newPassword } = req.body;

  // ตรวจสอบว่ามีอีเมลในฐานข้อมูลหรือไม่
  const queryCheck = "SELECT * FROM users WHERE email = ?";
  connection.query(queryCheck, [email], (err, results) => {
    if (err) {
      console.error("Error checking email:", err.message);
      res.render("newpassword", { error: "เกิดข้อผิดพลาด โปรดลองอีกครั้ง" });
      return;
    }

    if (results.length === 0) {
      // หากไม่พบอีเมล
      res.render("newpassword", { error: "ไม่พบอีเมลในระบบ" });
    } else {
      // อัปเดตรหัสผ่านใหม่
      const queryUpdate = "UPDATE users SET password = ? WHERE email = ?";
      connection.query(queryUpdate, [newPassword, email], (err) => {
        if (err) {
          console.error("Error updating password:", err.message);
          res.render("newpassword", {
            error: "เกิดข้อผิดพลาด โปรดลองอีกครั้ง",
          });
          return;
        }
        res.send('เปลี่ยนรหัสผ่านสำเร็จ! <a href="/login">เข้าสู่ระบบ</a>');
      });
    }
  });
});

// เส้นทางสำหรับแสดงหน้า createaccount
app.get("/createaccount", (req, res) => {
  res.render("createaccount", { error: null, success: null });
});

app.post("/createaccount", async (req, res) => {
  try {
    const { username, first_name, last_name, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน!" });
    }

    // ✅ ตรวจสอบว่า email หรือ username มีอยู่แล้วหรือไม่
    const checkUserSQL = "SELECT id FROM users WHERE email = ? OR username = ?";
    const [existingUser] = await pool.query(checkUserSQL, [email, username]);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว!" });
    }

    // ✅ เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ สร้างบัญชีใหม่ (is_verified = false)
    const insertSQL = `
      INSERT INTO users (username, first_name, last_name, email, password, is_verified) 
      VALUES (?, ?, ?, ?, ?, 0)`;
    const [result] = await pool.query(insertSQL, [
      username,
      first_name,
      last_name,
      email,
      hashedPassword,
    ]);

    const userId = result.insertId;

    // ✅ สร้างโทเค็นสำหรับการยืนยัน
    const verificationToken = jwt.sign({ userId, email }, SECRET_KEY, { expiresIn: "1d" });

    // ✅ ส่งอีเมลยืนยัน
    const verificationLink = `${FRONTEND_URL}/verify?token=${verificationToken}`;
    await sendVerificationEmail(email, verificationLink);

    res.json({
      message: `บัญชีของ ${username} ถูกสร้างเรียบร้อยแล้ว! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี`,
      user_id: userId,
    });
  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด!", error: error.message });
  }
});

// ✅ ฟังก์ชันส่งอีเมล
async function sendVerificationEmail(toEmail, link) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "staythenon@gmail.com", // เปลี่ยนเป็นอีเมลของคุณ
      pass: "0955784172zx", // เปลี่ยนเป็นรหัสผ่านของคุณ
    },
  });

  await transporter.sendMail({
    from: '"Phayao Place" <staythenon@gmail.com>',
    to: toEmail,
    subject: "ยืนยันบัญชีของคุณ",
    html: `<p>คลิกลิงก์นี้เพื่อยืนยันบัญชีของคุณ:</p>
           <a href="${link}">${link}</a>`,
  });
}

// ✅ API ยืนยันบัญชี
app.get("/verify", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token ไม่ถูกต้อง" });
    }

    // ✅ ตรวจสอบโทเค็น
    const { userId } = jwt.verify(token, SECRET_KEY);

    // ✅ อัปเดตฐานข้อมูลให้ is_verified = true
    const updateSQL = "UPDATE users SET is_verified = 1 WHERE id = ?";
    await pool.query(updateSQL, [userId]);

    res.json({ message: "บัญชีของคุณได้รับการยืนยันแล้ว!" });
  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(400).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ!" });
  }
});

app.get("/profile/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const sql = "SELECT * FROM users WHERE id = ?";
    const [rows] = await pool.query(sql, [userId]);

    if (rows.length === 0) {
      return res.status(404).send("ไม่พบข้อมูลผู้ใช้");
    }

    console.log("User data:", rows[0]); 
    res.render("profile", { user: rows[0] });  // 🔄 เปลี่ยนไปหน้าแดชบอร์ด
  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
});

app.post("/update-profile/:id", async (req, res) => {
  try {
    console.log("req.params.id:", req.params.id);
    console.log("req.body:", req.body);

    const userId = req.params.id;
    const { first_name, last_name, phone } = req.body;

    if (!userId) {
      return res.status(400).send("❌ User ID ไม่ถูกต้อง");
    }

    const sql = "UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?";
    await pool.query(sql, [first_name, last_name, phone, userId]);

    res.redirect(`/profile/${userId}`);
  } catch (error) {
    console.error("❌ Update Error:", error);
    res.status(500).send("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
  }
});


app.post("/upload-profile", upload.single("profilePic"), async (req, res) => {
  try {
    console.log("req.body:", req.body);  // ✅ ตรวจสอบค่าที่ส่งมา

    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).send("❌ User ID ไม่ถูกต้อง");
    }

    const profilePicPath = `/uploads/${req.file.filename}`;
    const sql = "UPDATE users SET profile_picture = ? WHERE id = ?";
    await pool.query(sql, [profilePicPath, userId]);

    res.redirect(`/profile/${userId}`);
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).send("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
  }
});


app.get("/about", async (req, res) => {
  console.log("Session UserID:", req.session.userId);
  const userId = req.session.userId;

  let user = null;
  if (userId) {
    try {
      const sql = "SELECT id, username, profile_picture FROM users WHERE id = ?";
      const [rows] = await pool.query(sql, [userId]);
      if (rows.length > 0) {
        user = rows[0];
        console.log("✅ User Data:", user); // ตรวจสอบข้อมูล user
      }
    } catch (error) {
      console.error("❌ Database Error:", error);
    }
  }

  res.render("about", { user });
});

app.get("/Facilities", async (req, res) => {
  console.log("Session UserID:", req.session.userId);
  const userId = req.session.userId;

  let user = null;
  if (userId) {
    try {
      const sql = "SELECT id, username, profile_picture FROM users WHERE id = ?";
      const [rows] = await pool.query(sql, [userId]);
      if (rows.length > 0) {
        user = rows[0];
        console.log("✅ User Data:", user); // ตรวจสอบข้อมูล user
      }
    } catch (error) {
      console.error("❌ Database Error:", error);
    }
  }

  res.render("Facilities", { user });
});

app.get("/Dining", async (req, res) => {
  console.log("Session UserID:", req.session.userId);
  const userId = req.session.userId;

  let user = null;
  if (userId) {
    try {
      const sql = "SELECT id, username, profile_picture FROM users WHERE id = ?";
      const [rows] = await pool.query(sql, [userId]);
      if (rows.length > 0) {
        user = rows[0];
        console.log("✅ User Data:", user); // ตรวจสอบข้อมูล user
      }
    } catch (error) {
      console.error("❌ Database Error:", error);
    }
  }

  res.render("Dining", { user });
});

app.get("/Events", (req, res) => {
  res.render("Events.ejs");
});

app.get('/payment', (req, res) => {
    res.render('payment', { message: null }); // Pass a default message
});

app.post('/payment', (req, res) => {
  const { amount, method } = req.body;
  if (!amount || !method) {
      return res.json({ success: false, message: 'กรุณากรอกจำนวนเงินและวิธีการชำระเงิน' });
  }
  console.log(`ได้รับการชำระเงิน: ${amount} ผ่าน ${method}`);
  res.json({ success: true, message: 'การชำระเงินสำเร็จ!' });
});

// อัปโหลดสลิป
app.post('/upload-slip', upload.single('slip'), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ success: false, message: "❌ กรุณาอัปโหลดไฟล์" });
  }

  try {
      const connection = await pool.getConnection();

      // ✅ ตรวจสอบว่า referenceId มีอยู่หรือไม่
      const [rows] = await connection.execute(
          'SELECT id FROM payments WHERE id = ?',
          [req.body.referenceId]
      );

      if (rows.length === 0) {
          connection.release();
          return res.status(404).json({ success: false, message: "❌ ไม่พบ referenceId" });
      }

      // ✅ บันทึกชื่อไฟล์ลงในฐานข้อมูล
      await connection.execute(
          'UPDATE payments SET slip_file = ? WHERE id = ?',
          [req.file.filename, req.body.referenceId]
      );

      connection.release();
      res.json({ success: true, message: "✅ อัปโหลดสลิปสำเร็จ!" });

  } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
      res.status(500).json({ success: false, message: "❌ เกิดข้อผิดพลาด" });
  }
});

// API ตรวจสอบสถานะการชำระเงิน
app.get('/check-payment/:referenceId', async (req, res) => {
  try {
      console.log("🔍 ตรวจสอบ referenceId:", req.params.referenceId);
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(
          'SELECT email, status FROM payments WHERE referenceId = ?', 
          [req.params.referenceId]
      );
      connection.release();

      if (rows.length === 0) {
          return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการชำระเงิน' });
      }

      const { email, status } = rows[0];

      if (!email) {
          return res.status(400).json({ success: false, message: 'ไม่มีอีเมลในระบบ ไม่สามารถส่งอีเมลแจ้งเตือนได้' });
      }

      // ✅ **ส่งอีเมลแจ้งเตือน**
      const mailOptions = {
          from: 'staythenon@gmail.com',
          to: email,  // ✨ ใช้อีเมลจากฐานข้อมูล
          subject: 'แจ้งผลการตรวจสอบชำระเงิน',
          text: `สถานะการชำระเงินของคุณ: ${status}\n\nขอบคุณที่ใช้บริการ!`
      };

      try {
          const info = await transporter.sendMail(mailOptions);
          console.log('📧 อีเมลถูกส่งไปที่:', info.response);
      } catch (error) {
          console.error('❌ ส่งอีเมลล้มเหลว:', error);
      }

      res.json({ 
          success: true, 
          status, 
          message: 'ตรวจสอบการชำระเงินเสร็จสิ้น และส่งอีเมลแจ้งเตือนเรียบร้อย' 
      });

  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error });
  }
});

// ✅ **API อัปเดตสถานะการชำระเงิน (สำหรับ Admin)**
app.put('/update-payment/:id', async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
  }

  try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(
          'UPDATE payments SET status = ? WHERE id = ?', 
          [status, req.params.id]
      );
      connection.release();

      if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการชำระเงิน' });
      }

      res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' });

  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error });
  }
});

app.listen(PORT, () => {
  console.log("server is running on port " + PORT)
})

app.get("/reservation", async (req, res) => {
  console.log("Session UserID:", req.session.userId);
  const userId = req.session.userId;

  let user = null;
  if (userId) {
    try {
      const sql = "SELECT id, username, profile_picture FROM users WHERE id = ?";
      const [rows] = await pool.query(sql, [userId]);
      if (rows.length > 0) {
        user = rows[0];
        console.log("✅ User Data:", user); // ตรวจสอบข้อมูล user
      }
    } catch (error) {
      console.error("❌ Database Error:", error);
    }
  }

  res.render("reservation", { user });
});

app.get("/rooms", async (req, res) => {
  console.log("Session UserID:", req.session.userId);
  const userId = req.session.userId;

  let user = null;
  if (userId) {
    try {
      const sql = "SELECT id, username, profile_picture FROM users WHERE id = ?";
      const [rows] = await pool.query(sql, [userId]);
      if (rows.length > 0) {
        user = rows[0];
        console.log("✅ User Data:", user); // ตรวจสอบข้อมูล user
      }
    } catch (error) {
      console.error("❌ Database Error:", error);
    }
  }

  res.render("rooms", { user });
});

// app.get("/stat", async (req, res) => {
//   console.log("📡 Session UserID:", req.session.userId);
//   const userId = req.session.userId;
//   const userRole = req.session.userRole;

//   // 🔹 ถ้าผู้ใช้ไม่ได้ล็อกอิน → ส่ง error 401 Unauthorized
//   if (!userId) {
//     console.warn("⚠️ Unauthorized access to /stat");
//     return res.status(401).json({ error: "Unauthorized" });
//   }

//   // 🔹 อนุญาตให้เฉพาะ Admin เข้าถึงหน้านี้
//   if (userRole !== "admin") {
//     console.warn("⚠️ Access denied: User is not an admin");
//     return res.status(403).json({ error: "Access denied" });
//   }

//   try {
//     // 📌 ดึงข้อมูลผู้ใช้จากตาราง `users`
//     const userSql = "SELECT id, username, profile-picture FROM users WHERE id = ?";
//     const [userRows] = await pool.query(userSql, [userId]);

//     if (userRows.length === 0) {
//       console.warn("⚠️ No user found for this session");
//       return res.status(404).json({ error: "User not found" });
//     }

//     const user = userRows[0]; // ✅ ข้อมูลผู้ใช้
//     console.log("✅ User Data:", user);

//     // 📌 ดึงข้อมูลสถิติจากตาราง `statistics`
//     const statSql = `
//         SELECT 
//             CASE 
//                 WHEN month REGEXP '^[0-9]+$' THEN 
//                     CASE month 
//                         WHEN '1' THEN 'January' WHEN '2' THEN 'February' 
//                         WHEN '3' THEN 'March' WHEN '4' THEN 'April' 
//                         WHEN '5' THEN 'May' WHEN '6' THEN 'June' 
//                         WHEN '7' THEN 'July' WHEN '8' THEN 'August' 
//                         WHEN '9' THEN 'September' WHEN '10' THEN 'October' 
//                         WHEN '11' THEN 'November' WHEN '12' THEN 'December' 
//                     END
//                 ELSE month 
//             END AS month,
//             SUM(guests) AS guests, 
//             SUM(revenue) AS revenue  
//         FROM statistics  
//         GROUP BY month  
//         ORDER BY FIELD(
//             month, 'January', 'February', 'March', 'April', 'May', 'June', 
//             'July', 'August', 'September', 'October', 'November', 'December'
//         );
//     `;

//     const [statsRows] = await pool.query(statSql);
//     console.log("✅ Statistics Data:", statsRows);

//     // ✅ ส่งข้อมูลผู้ใช้ + สถิติกลับไปเป็น JSON
//     res.json({ user, statistics: statsRows });

//   } catch (error) {
//     console.error("❌ Database Error:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.get("/stat", async (req, res) => {
  try {
      const statSql = `
          SELECT 
              CASE 
                  WHEN month REGEXP '^[0-9]+$' THEN 
                      CASE month 
                          WHEN '1' THEN 'January' WHEN '2' THEN 'February' 
                          WHEN '3' THEN 'March' WHEN '4' THEN 'April' 
                          WHEN '5' THEN 'May' WHEN '6' THEN 'June' 
                          WHEN '7' THEN 'July' WHEN '8' THEN 'August' 
                          WHEN '9' THEN 'September' WHEN '10' THEN 'October' 
                          WHEN '11' THEN 'November' WHEN '12' THEN 'December' 
                      END
                  ELSE month 
              END AS month,
              SUM(guests) AS guests, 
              SUM(revenue) AS revenue  
          FROM statistics  
          GROUP BY month  
          ORDER BY FIELD(
              month, 'January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December'
          );
      `;

      // ✅ ดึงข้อมูลจาก Database
      const [statsRows] = await pool.query(statSql);

      // ✅ แปลงค่าที่เป็น string ให้เป็นตัวเลข
      const formattedStats = statsRows.map(stat => ({
          month: stat.month,
          guests: Number(stat.guests),   // 🔹 แปลง guests เป็น number
          revenue: Number(stat.revenue)  // 🔹 แปลง revenue เป็น number
      }));

      console.log("✅ Statistics Data:", formattedStats);

      res.json({ statistics: formattedStats });

  } catch (error) {
      console.error("❌ Database Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});


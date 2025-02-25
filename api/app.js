const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;
const mysql = require('mysql2/promise');
const cors = require("cors");
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require("bcrypt");
const Stripe = require('stripe');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
// const AppleStrategy = require('passport-apple').Strategy;
const passport = require("passport");
   
app.set("view engine", "ejs");

// กำหนดโฟลเดอร์ views
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());  
app.use(express.json()); // ✅ รองรับ JSON
app.use(express.urlencoded({ extended: true })); // ✅ รองรับ x-www-form-urlencoded

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



// ใช้ Stripe Secret Key
const stripe = Stripe('sk_test_51QkNFP07aI9JylI3vxG5J5aEIGGu3mk7aK43gXKD3yQjRp77XFvQEwYYi57t5xgDRjx8Hw9rjiwMXqNe7r1AzQyT00DVQZuBhe');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// ใช้ express-session สำหรับจัดการ session
app.use(
  session({
    secret: "xAM6QkdRgD54XbTcUS27uEthZFwejvyW", // ใส่คีย์ลับที่ปลอดภัย
    resave: false, // ไม่บันทึก session ที่ไม่มีการเปลี่ยนแปลง
    saveUninitialized: true, // บันทึก session ที่ยังไม่มีข้อมูลเริ่มต้น
    cookie: { secure: false }, // ใช้ true ถ้าใช้ HTTPS
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

// เส้นทางสำหรับ Google OAuth
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
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM users WHERE email = ? AND password = ?";

  connection.query(query, [email, password], (err, results) => {
    if (err) {
      console.error("Error executing query:", err.message);
      res.render("login", { error: "เกิดข้อผิดพลาด โปรดลองอีกครั้ง" });
      return;
    }
    if (results.length > 0) {
      req.session.user = results[0];
      res.redirect("/dashboard");
    } else {
      res.render("login", { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }
  });
});

// เส้นทาง Dashboard
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("dashboard", { user: req.session.user });
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

// เส้นทางสำหรับบันทึกบัญชีใหม่
// ✅ ลงทะเบียนผู้ใช้
app.post("/createaccount", async (req, res) => {
  try {
    const { username, first_name, last_name, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน!" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log("✅ รหัสผ่านที่เข้ารหัสแล้ว:", hashedPassword);

    // ✅ ใช้ connection จาก pool
    const sql =
      "INSERT INTO users (username, first_name, last_name, email, password) VALUES (?, ?, ?, ?, ?)";
    const [result] = await pool.query(sql, [
      username,
      first_name,
      last_name,
      email,
      hashedPassword,
    ]);

    res.json({ message: `บัญชีของ ${username} ถูกสร้างเรียบร้อยแล้ว!` });
  } catch (error) {
    console.error("❌ ERROR:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด!", error: error.message });
  }
});


app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.get("/Facilities", (req, res) => {
  res.render("Facilities.ejs");
});

app.get('/payment', (req, res) => {
    res.render('payment', { message: null }); // Pass a default message
});

app.post('/payment', (req, res) => {
    const { amount, method } = req.body;

    if (!amount || !method) {
        res.render('payment', { message: 'Please fill out all fields!' });
    } else {
        // Handle payment logic here
        console.log(`Payment received: ${amount} via ${method}`);
        res.render('payment', { message: 'Payment successful!' });
    }
});

app.listen(PORT, () => {
  console.log("server is running on port " + PORT)
})

app.post("/create-bill", (req, res) => {
  const { userId, amount, dueDate } = req.body;
  db.query(
      "INSERT INTO bills (user_id, amount, due_date, status) VALUES (?, ?, ?, 'pending')",
      [userId, amount, dueDate],
      (err, results) => {
          if (err) return res.status(500).json(err);
          res.json({ message: "บันทึกบิลสำเร็จ", billId: results.insertId });
      }
  );
});

app.post("/update-payment", (req, res) => {
  const { billId, transactionId } = req.body;
  db.query("UPDATE bills SET status = 'paid', transaction_id = ?, paid_at = NOW() WHERE id = ?", 
      [transactionId, billId], 
      (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "✅ Payment successful!" });
      }
  );
});

app.post("/webhook-payment", (req, res) => {
  const { transactionId, billId, status } = req.body;

  if (status === "success") {
      db.query("UPDATE bills SET status = 'paid' WHERE id = ?", [billId]);
      console.log(`บิล ${billId} ชำระเงินเรียบร้อย`);
  }

  res.sendStatus(200);
});

// app.get("/get-bill-status", (req, res) => {
//   const { billId } = req.query;
//   db.query("SELECT status FROM bills WHERE id = ?", [billId], (err, results) => {
//       if (err) return res.status(500).json({ error: err.message });
//       if (results.length > 0) {
//           res.json({ status: results[0].status });
//       } else {
//           res.status(404).json({ error: "ไม่พบบิล" });
//       }
//   });
// });

app.get("/room", (req, res) => {
  res.render("room"); // สมมติว่าใช้ EJS
});

app.get("/roomS", (req, res) => {
  res.render("roomS"); // สมมติว่าใช้ EJS
});
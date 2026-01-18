require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { clerkClient } = require('@clerk/clerk-sdk-node'); // Use the direct client
const db = require('./db');
const { calculateStreak, formatDate } = require('./utils');

const app = express();

// 1. NUCLEAR CORS SETUP
// This prevents the "Preflight" 401 errors
app.use(cors({
    // Allow BOTH your local laptop AND your Vercel site
    origin: [
        'http://localhost:5173',
        'https://habit-tracker-bice-gamma.vercel.app' // <--- YOUR VERCEL URL
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. MANUAL AUTH MIDDLEWARE (The Fix)
// We verify the token ourselves so we can see the errors
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log("❌ Auth Failed: No Header");
            return res.status(401).json({ error: "No Authorization header" });
        }

        const token = authHeader.split(' ')[1];
        
        // Ask Clerk: "Is this token real?"
        const verifiedToken = await clerkClient.verifyToken(token);
        
        // If we get here, it is valid. Attach ID to request.
        req.auth = { userId: verifiedToken.sub };
        next();

    } catch (err) {
        // THIS prints the exact reason (Expired, Key Mismatch, etc)
        console.error("🔥 AUTH ERROR:", err.message);
        return res.status(401).json({ error: "Unauthenticated", details: err.message });
    }
};

// 3. USER SYNC MIDDLEWARE
const syncUserToDB = async (req, res, next) => {
    const userId = req.auth.userId;
    try {
        await db.query(`INSERT IGNORE INTO users (id, email) VALUES (?, ?)`, [userId, 'clerk_user']);
        next();
    } catch (err) {
        console.error("User Sync Error:", err);
        next(); // Don't block the request, just log error
    }
};

// ==========================================
// ROUTES
// ==========================================

// GET ALL HABITS
app.get('/habits', requireAuth, syncUserToDB, async (req, res) => {
    try {
        const userId = req.auth.userId;
        const [habits] = await db.query(
            'SELECT * FROM habits WHERE user_id = ? AND is_archived = FALSE ORDER BY created_at DESC', 
            [userId]
        );

        let logs = [];
        if (habits.length > 0) {
            const habitIds = habits.map(h => h.id);
            [logs] = await db.query(
                `SELECT * FROM habit_logs WHERE habit_id IN (?) ORDER BY check_date DESC`,
                [habitIds]
            );
        }

        const habitsWithStats = habits.map(habit => {
            const habitLogs = logs.filter(log => log.habit_id === habit.id);
            const stats = calculateStreak(habitLogs);
            return { ...habit, ...stats };
        });

        res.json(habitsWithStats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

// CREATE HABIT
app.post('/habits', requireAuth, syncUserToDB, async (req, res) => {
    const { title } = req.body;
    const userId = req.auth.userId;
    
    if (!title) return res.status(400).json({ error: "Title required" });

    try {
        const [result] = await db.query(
            'INSERT INTO habits (user_id, title) VALUES (?, ?)',
            [userId, title]
        );
        res.json({ id: result.insertId, title, currentStreak: 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// CHECK IN
app.post('/habits/:id/check', requireAuth, async (req, res) => {
    const habitId = req.params.id;
    const userId = req.auth.userId;
    const today = formatDate(new Date());

    try {
        const [habit] = await db.query('SELECT * FROM habits WHERE id = ? AND user_id = ?', [habitId, userId]);
        if (habit.length === 0) return res.status(403).json({ error: "Not authorized" });

        await db.query(
            `INSERT INTO habit_logs (habit_id, check_date, status) VALUES (?, ?, 'completed')`,
            [habitId, today]
        );
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.json({ success: true });
        res.status(500).json({ error: err.message });
    }
});

// FREEZE
// 4. STREAK FREEZE (REPAIR YESTERDAY) - NOW COSTS 1 FREEZE
app.post('/habits/:id/freeze', requireAuth, async (req, res) => {
    const habitId = req.params.id;
    const userId = req.auth.userId;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    try {
        // 1. Check if User owns the habit AND has enough freezes
        const [user] = await db.query('SELECT streak_freezes FROM users WHERE id = ?', [userId]);
        const [habit] = await db.query('SELECT * FROM habits WHERE id = ? AND user_id = ?', [habitId, userId]);

        if (habit.length === 0) return res.status(403).json({ error: "Not authorized" });
        if (user[0].streak_freezes < 1) return res.status(400).json({ error: "Not enough freezes! Watch an ad." });

        // 2. Start Transaction (Do both or neither)
        await db.beginTransaction();

        try {
            // A. Deduct 1 Freeze
            await db.query('UPDATE users SET streak_freezes = streak_freezes - 1 WHERE id = ?', [userId]);

            // B. Mark yesterday as 'frozen'
            await db.query(
                `INSERT INTO habit_logs (habit_id, check_date, status) 
                 VALUES (?, ?, 'frozen')`,
                [habitId, yesterdayStr]
            );

            await db.commit(); // Save changes
            res.json({ success: true, message: "Streak frozen! -1 Inventory" });

        } catch (err) {
            await db.rollback(); // Undo if something failed
            throw err;
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. GET USER STATS (Freeze Balance)
app.get('/user/stats', requireAuth, syncUserToDB, async (req, res) => {
    const userId = req.auth.userId;
    try {
        const [users] = await db.query('SELECT streak_freezes FROM users WHERE id = ?', [userId]);
        // Default to 0 if user not found (shouldn't happen due to sync)
        res.json({ freezes: users[0]?.streak_freezes || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. WATCH AD (Earn Freeze)
app.post('/user/watch-ad', requireAuth, syncUserToDB, async (req, res) => {
    const userId = req.auth.userId;
    try {
        // Add 1 freeze to the user's balance
        await db.query('UPDATE users SET streak_freezes = streak_freezes + 1 WHERE id = ?', [userId]);
        res.json({ success: true, message: "Ad watched! +1 Freeze" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 👇 SELF-REPAIR: Create tables automatically on startup
async function initDB() {
  try {
    await db.query(`USE test`); // Force usage of 'test' db
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        streak_freezes INT DEFAULT 0
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(100) NOT NULL,
        currentStreak INT DEFAULT 0,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        habit_id INT NOT NULL,
        check_date DATE NOT NULL,
        status ENUM('completed', 'frozen') DEFAULT 'completed',
        UNIQUE KEY unique_checkin (habit_id, check_date)
      )
    `);
    console.log("✅ Tables checked and created successfully!");
  } catch (err) {
    console.error("❌ Database Init Failed:", err);
  }
}

// Start Server ONLY after DB is ready
initDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
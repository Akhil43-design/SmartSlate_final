const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { get, run, all } = require('../db/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const authRateLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });

// Parent & Teacher Signup
router.post('/signup', authRateLimiter, async (req, res) => {
    try {
        const { name, role, email, password } = req.body;

        if (!name || !role || !email || !password) {
            return res.status(400).json({ error: 'Please provide name, role, email, and password.' });
        }

        if (!['teacher', 'parent'].includes(role)) {
            return res.status(400).json({ error: 'Only Teacher or Parent registration is supported on this portal.' });
        }

        const existingUser = await get("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email address already exists.' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const userRes = await run(
            "INSERT INTO users (name, role, email, password_hash) VALUES (?, ?, ?, ?)",
            [name.trim(), role, email.toLowerCase().trim(), password_hash]
        );

        const userId = userRes.id;
        if (role === 'teacher') {
            await run("INSERT INTO teachers (user_id) VALUES (?)", [userId]);
            await run("INSERT INTO classes (name, teacher_id, class_code) VALUES (?, ?, ?)", [
                `${name.trim()}'s Class`,
                userId,
                'CLASS-' + Math.floor(100 + Math.random() * 900)
            ]);
        }

        const newUser = {
            id: userId,
            name: name.trim(),
            role,
            email: email.toLowerCase().trim()
        };

        const token = generateToken(newUser);

        res.status(201).json({
            message: 'Account created successfully!',
            token,
            user: newUser
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error during account creation.' });
    }
});

// Login by PIN or Password
router.post('/login', authRateLimiter, async (req, res) => {
    try {
        const { email, password, pin } = req.body;
        const targetPin = pin || password;

        if (email) {
            const user = await get("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
            if (user && targetPin && await bcrypt.compare(targetPin, user.password_hash)) {
                const userData = {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    email: user.email
                };
                const token = generateToken(userData);
                return res.json({ message: 'Logged in successfully!', token, user: userData });
            }
        }

        if (targetPin) {
            const users = await all("SELECT * FROM users WHERE role IN ('teacher', 'parent')");
            for (const user of users) {
                if (await bcrypt.compare(targetPin, user.password_hash)) {
                    const userData = {
                        id: user.id,
                        name: user.name,
                        role: user.role,
                        email: user.email
                    };
                    const token = generateToken(userData);
                    return res.json({ message: 'Logged in successfully!', token, user: userData });
                }
            }
        }

        return res.status(401).json({ error: 'Invalid email, PIN, or credentials.' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error during login.' });
    }
});

// Get Logged In User
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await get("SELECT id, name, role, email, created_at FROM users WHERE id = ?", [req.user.id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (err) {
        console.error('Auth /me error:', err);
        res.status(500).json({ error: 'Error fetching profile.' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully.' });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { get, run, all } = require('../db/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const authRateLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });

// GET /api/auth/profiles - Public registered student profiles for Kiosk PIN screen
router.get('/profiles', async (req, res) => {
    try {
        const users = await all("SELECT id, name, role, email, student_code FROM users WHERE role = 'student' ORDER BY id ASC");
        const profiles = users.map(u => ({
            id: u.id,
            name: u.name,
            role: u.role,
            email: u.email,
            student_code: u.student_code,
            avatar: '👨‍🎓',
            color: 'var(--accent-coral)'
        }));
        res.json({ profiles });
    } catch (err) {
        console.error('Fetch profiles error:', err);
        res.status(500).json({ error: 'Error fetching student profiles.' });
    }
});

// Student Signup
router.post('/signup', authRateLimiter, async (req, res) => {
    try {
        const { name, email, password, class_id } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Please provide all required fields: name, email, password.' });
        }

        const role = 'student';

        // Check duplicate email
        const existingUser = await get("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email address already exists.' });
        }

        // Check unique PIN / password across all users
        const allUsers = await all("SELECT id, password_hash FROM users");
        for (const u of allUsers) {
            if (await bcrypt.compare(password, u.password_hash)) {
                return res.status(400).json({ error: 'This PIN / Password is already in use. Please try a different PIN.' });
            }
        }

        const password_hash = await bcrypt.hash(password, 10);
        const studentCode = 'STU-' + Math.floor(1000 + Math.random() * 9000);

        const userRes = await run(
            "INSERT INTO users (name, role, email, password_hash, student_code) VALUES (?, ?, ?, ?, ?)",
            [name.trim(), role, email.toLowerCase().trim(), password_hash, studentCode]
        );

        const userId = userRes.id;
        let assignedClassId = class_id ? parseInt(class_id) : null;
        if (!assignedClassId) {
            const defaultClass = await get("SELECT id FROM classes ORDER BY id ASC LIMIT 1");
            assignedClassId = defaultClass ? defaultClass.id : null;
        }

        const sRes = await run(
            "INSERT INTO students (user_id, class_id, student_code) VALUES (?, ?, ?)",
            [userId, assignedClassId, studentCode]
        );

        await run(
            "INSERT INTO books (student_id, title, subject, cover_style) VALUES (?, ?, ?, ?)",
            [sRes.id, 'My First Notebook', 'General Notes', 'blue_linen']
        );

        const newUser = {
            id: userId,
            name: name.trim(),
            role,
            email: email.toLowerCase().trim(),
            student_code: studentCode
        };

        const token = generateToken(newUser);

        res.status(201).json({
            message: 'Student account created successfully!',
            token,
            user: newUser
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error during account creation.' });
    }
});

// Direct PIN Login Endpoint
router.post('/login-by-pin', authRateLimiter, async (req, res) => {
    try {
        const { pin, password } = req.body;
        const targetPin = pin || password;

        if (!targetPin) {
            return res.status(400).json({ error: 'Please enter your 4-digit PIN.' });
        }

        const users = await all("SELECT * FROM users WHERE role = 'student'");
        let matchedUser = null;

        for (const user of users) {
            const isValid = await bcrypt.compare(targetPin, user.password_hash);
            if (isValid) {
                matchedUser = user;
                break;
            }
        }

        if (!matchedUser) {
            return res.status(401).json({ error: 'Invalid PIN. No matching student account found.' });
        }

        const userData = {
            id: matchedUser.id,
            name: matchedUser.name,
            role: matchedUser.role,
            email: matchedUser.email,
            student_code: matchedUser.student_code
        };

        const token = generateToken(userData);

        res.json({
            message: `Welcome back, ${userData.name}!`,
            token,
            user: userData
        });
    } catch (err) {
        console.error('PIN login error:', err);
        res.status(500).json({ error: 'Internal server error during PIN login.' });
    }
});

// Login (Email or PIN)
router.post('/login', authRateLimiter, async (req, res) => {
    try {
        const { email, password, pin } = req.body;
        const targetPin = pin || password;

        if (email) {
            const user = await get("SELECT * FROM users WHERE email = ? AND role = 'student'", [email.toLowerCase().trim()]);
            if (user && targetPin && await bcrypt.compare(targetPin, user.password_hash)) {
                const userData = {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    email: user.email,
                    student_code: user.student_code
                };
                const token = generateToken(userData);
                return res.json({ message: 'Logged in successfully!', token, user: userData });
            }
        }

        if (targetPin) {
            const users = await all("SELECT * FROM users WHERE role = 'student'");
            for (const user of users) {
                if (await bcrypt.compare(targetPin, user.password_hash)) {
                    const userData = {
                        id: user.id,
                        name: user.name,
                        role: user.role,
                        email: user.email,
                        student_code: user.student_code
                    };
                    const token = generateToken(userData);
                    return res.json({ message: 'Logged in successfully!', token, user: userData });
                }
            }
        }

        return res.status(401).json({ error: 'Invalid PIN or credentials.' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error during login.' });
    }
});

// Get Current Logged In Student
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await get("SELECT id, name, role, email, student_code, created_at FROM users WHERE id = ?", [req.user.id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let extraDetails = {};
        if (user.role === 'student') {
            const studentRow = await get(
                "SELECT s.id as student_id, s.class_id, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.user_id = ?",
                [user.id]
            );
            if (studentRow) extraDetails = studentRow;
        }

        res.json({
            user: {
                ...user,
                ...extraDetails
            }
        });
    } catch (err) {
        console.error('Auth /me error:', err);
        res.status(500).json({ error: 'Error fetching user profile.' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully.' });
});

module.exports = router;

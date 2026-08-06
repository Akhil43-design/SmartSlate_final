const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { get, run } = require('../db/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const authRateLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });

// GET /api/auth/profiles - Public registered profiles for device Lock Screen
router.get('/profiles', async (req, res) => {
    try {
        const { all } = require('../db/database');
        const users = await all("SELECT id, name, role, email, student_code FROM users ORDER BY id ASC");
        const profiles = users.map(u => ({
            id: u.id,
            name: u.name,
            role: u.role,
            email: u.email,
            student_code: u.student_code,
            avatar: u.role === 'student' ? '👨‍🎓' : u.role === 'teacher' ? '👩‍🏫' : '👨‍👩‍👦',
            color: u.role === 'student' ? 'var(--accent-coral)' : u.role === 'teacher' ? 'var(--accent-blue)' : 'var(--accent-purple)'
        }));
        res.json({ profiles });
    } catch (err) {
        console.error('Fetch profiles error:', err);
        res.status(500).json({ error: 'Error fetching lockscreen profiles.' });
    }
});

// Signup
router.post('/signup', authRateLimiter, async (req, res) => {
    try {
        const { name, role, email, password, class_id } = req.body;

        if (!name || !role || !email || !password) {
            return res.status(400).json({ error: 'Please provide all required fields: name, role, email, password.' });
        }

        if (!['student', 'teacher', 'parent'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role specified.' });
        }

        // Check duplicate email
        const existingUser = await get("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email address already exists.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        let studentCode = null;

        if (role === 'student') {
            studentCode = 'STU-' + Math.floor(1000 + Math.random() * 9000);
        }

        const userRes = await run(
            "INSERT INTO users (name, role, email, password_hash, student_code) VALUES (?, ?, ?, ?, ?)",
            [name.trim(), role, email.toLowerCase().trim(), password_hash, studentCode]
        );

        const userId = userRes.id;

        // Auto-assign profile record based on role
        if (role === 'student') {
            let assignedClassId = class_id ? parseInt(class_id) : null;
            if (!assignedClassId) {
                const defaultClass = await get("SELECT id FROM classes ORDER BY id ASC LIMIT 1");
                assignedClassId = defaultClass ? defaultClass.id : null;
            }

            const sRes = await run(
                "INSERT INTO students (user_id, class_id, student_code) VALUES (?, ?, ?)",
                [userId, assignedClassId, studentCode]
            );
            // Create default initial book for student
            await run(
                "INSERT INTO books (student_id, title, subject, cover_style) VALUES (?, ?, ?, ?)",
                [sRes.id, 'My First Notebook', 'General Notes', 'blue_linen']
            );
        } else if (role === 'teacher') {
            await run("INSERT INTO teachers (user_id) VALUES (?)", [userId]);
        }

        const newUser = {
            id: userId,
            name: name.trim(),
            role,
            email: email.toLowerCase().trim(),
            student_code: studentCode
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

// Login
router.post('/login', authRateLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please enter both email and password.' });
        }

        const user = await get("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const userData = {
            id: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
            student_code: user.student_code
        };

        const token = generateToken(userData);

        res.json({
            message: 'Logged in successfully!',
            token,
            user: userData
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error during login.' });
    }
});

// Get Current Logged In User
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
        } else if (user.role === 'teacher') {
            const teacherRow = await get("SELECT id as teacher_id FROM teachers WHERE user_id = ?", [user.id]);
            if (teacherRow) extraDetails = teacherRow;
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

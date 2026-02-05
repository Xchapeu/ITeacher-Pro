require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { Resend } = require('resend');
const cron = require('node-cron');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

const models = require('./models');
const { User, UserSession, Subject, Class, TeacherAssignment, Student, Schedule, Material, Attendance, Message } = models;

// Initialize Express
const app = express();
const PORT = process.env.PORT || 8001;

// MongoDB connection
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'iteacher_db';

mongoose.connect(`${MONGO_URL}/${DB_NAME}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✓ Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload setup
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  }
});
const upload = multer({ storage });

// JWT Config
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = '7d';

// Resend Config
const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

// Helper functions
const generateId = (prefix) => `${prefix}_${Math.random().toString(36).substr(2, 12)}`;

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const createJWT = (userId) => {
  return jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

const calculateEndDate = (startDateStr, recurrenceType) => {
  const startDate = new Date(startDateStr);
  let endDate;

  switch (recurrenceType) {
    case 'once':
      return startDateStr;
    case 'weekly':
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
    case 'monthly':
      const month = startDate.getMonth();
      const year = startDate.getFullYear();
      endDate = new Date(year, month + 1, 0); // Last day of month
      break;
    case 'semester_1':
      endDate = new Date(startDate.getFullYear(), 5, 30); // June 30
      break;
    case 'semester_2':
      endDate = new Date(startDate.getFullYear(), 11, 31); // December 31
      break;
    case 'annual':
      endDate = new Date(startDate.getFullYear(), 11, 31);
      break;
    default:
      endDate = startDate;
  }

  return endDate.toISOString().split('T')[0];
};

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.session_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }

    // Check if it's a session token (OAuth)
    const session = await UserSession.findOne({ session_token: token });
    if (session) {
      if (new Date(session.expires_at) < new Date()) {
        return res.status(401).json({ detail: 'Session expired' });
      }
      const user = await User.findOne({ user_id: session.user_id }).select('-password_hash');
      if (!user) {
        return res.status(404).json({ detail: 'User not found' });
      }
      req.user = user.toObject();
      return next();
    }

    // Check if it's a JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findOne({ user_id: decoded.user_id }).select('-password_hash');
      if (!user) {
        return res.status(404).json({ detail: 'User not found' });
      }
      req.user = user.toObject();
      next();
    } catch (err) {
      return res.status(401).json({ detail: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ detail: 'Authentication error' });
  }
};

// ===== ROUTES =====

// Health check
app.get('/api/', (req, res) => {
  res.json({ message: 'ITeacher API is running', status: 'healthy' });
});

// Auth routes
app.post('/api/auth/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  body('user_type').isIn(['institution', 'teacher'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: 'Validation error', errors: errors.array() });
    }

    const { email, password, name, user_type, picture } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    const user_id = generateId('user');
    const password_hash = await hashPassword(password);

    const user = new User({
      user_id,
      email,
      name,
      user_type,
      password_hash,
      picture: picture || null
    });

    await user.save();

    const token = createJWT(user_id);
    const userResponse = user.toObject();
    delete userResponse.password_hash;
    delete userResponse._id;
    delete userResponse.__v;

    res.json({ user: userResponse, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ detail: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password_hash) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const token = createJWT(user.user_id);
    const userResponse = user.toObject();
    delete userResponse.password_hash;
    delete userResponse._id;
    delete userResponse.__v;

    res.json({ user: userResponse, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Login failed' });
  }
});

app.post('/api/auth/session', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId) {
      return res.status(400).json({ detail: 'Session ID required' });
    }

    const response = await axios.get(
      'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
      { headers: { 'X-Session-ID': sessionId } }
    );

    const oauthData = response.data;

    let user = await User.findOne({ email: oauthData.email });
    let isNewUser = false;

    if (!user) {
      // New user - create without user_type (will be set later)
      const user_id = generateId('user');
      user = new User({
        user_id,
        email: oauthData.email,
        name: oauthData.name,
        user_type: null, // Will be selected by user
        picture: oauthData.picture || null
      });
      await user.save();
      isNewUser = true;
    } else {
      user.name = oauthData.name;
      user.picture = oauthData.picture || user.picture;
      await user.save();
    }

    const session_token = oauthData.session_token;
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    await UserSession.create({
      user_id: user.user_id,
      session_token,
      expires_at
    });

    const userResponse = user.toObject();
    delete userResponse.password_hash;
    delete userResponse._id;
    delete userResponse.__v;

    res.json({ user: userResponse, session_token, needs_user_type: isNewUser || !user.user_type });
  } catch (error) {
    console.error('Session error:', error);
    res.status(400).json({ detail: 'Invalid session' });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  res.json(req.user);
});

app.post('/api/auth/logout', authenticate, async (req, res) => {
  try {
    const token = req.cookies?.session_token;
    if (token) {
      await UserSession.deleteOne({ session_token: token });
    }
    res.clearCookie('session_token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Logout failed' });
  }
});

// Subject routes
app.post('/api/subjects', authenticate, async (req, res) => {
  try {
    if (req.user.user_type !== 'institution') {
      return res.status(403).json({ detail: 'Only institutions can create subjects' });
    }

    const { name, description } = req.body;
    const subject_id = generateId('subject');

    const subject = new Subject({
      subject_id,
      name,
      description,
      institution_id: req.user.user_id
    });

    await subject.save();

    const response = subject.toObject();
    delete response._id;
    delete response.__v;

    res.json(response);
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ detail: 'Failed to create subject' });
  }
});

app.get('/api/subjects', authenticate, async (req, res) => {
  try {
    let query = {};
    if (req.user.user_type === 'institution') {
      query.institution_id = req.user.user_id;
    } else {
      const assignments = await TeacherAssignment.find({ teacher_id: req.user.user_id });
      const subjectIds = [...new Set(assignments.map(a => a.subject_id))];
      query.subject_id = { $in: subjectIds };
    }

    const subjects = await Subject.find(query).select('-_id -__v');
    res.json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ detail: 'Failed to fetch subjects' });
  }
});

app.delete('/api/subjects/:subject_id', authenticate, async (req, res) => {
  try {
    const subject = await Subject.findOne({ subject_id: req.params.subject_id });
    if (!subject) {
      return res.status(404).json({ detail: 'Subject not found' });
    }

    if (req.user.user_type !== 'institution' || subject.institution_id !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    await Subject.deleteOne({ subject_id: req.params.subject_id });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to delete subject' });
  }
});

// Class routes
app.post('/api/classes', authenticate, async (req, res) => {
  try {
    if (req.user.user_type !== 'institution') {
      return res.status(403).json({ detail: 'Only institutions can create classes' });
    }

    const { name, description } = req.body;
    const class_id = generateId('class');

    const newClass = new Class({
      class_id,
      name,
      description,
      institution_id: req.user.user_id
    });

    await newClass.save();

    const response = newClass.toObject();
    delete response._id;
    delete response.__v;

    res.json(response);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ detail: 'Failed to create class' });
  }
});

app.get('/api/classes', authenticate, async (req, res) => {
  try {
    let classes;
    
    if (req.user.user_type === 'institution') {
      classes = await Class.find({ institution_id: req.user.user_id }).select('-_id -__v');
    } else {
      const assignments = await TeacherAssignment.find({ teacher_id: req.user.user_id });
      const classIds = [...new Set(assignments.map(a => a.class_id))];
      classes = await Class.find({ class_id: { $in: classIds } }).select('-_id -__v');

      // Add subjects for each class
      for (let cls of classes) {
        const clsAssignments = assignments.filter(a => a.class_id === cls.class_id);
        const subjectIds = clsAssignments.map(a => a.subject_id).filter(Boolean);
        if (subjectIds.length > 0) {
          const subjects = await Subject.find({ subject_id: { $in: subjectIds } }).select('-_id -__v');
          cls._doc.subjects = subjects;
        } else {
          cls._doc.subjects = [];
        }
      }
    }

    res.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ detail: 'Failed to fetch classes' });
  }
});

app.get('/api/classes/:class_id', authenticate, async (req, res) => {
  try {
    const cls = await Class.findOne({ class_id: req.params.class_id }).select('-_id -__v');
    if (!cls) {
      return res.status(404).json({ detail: 'Class not found' });
    }
    res.json(cls);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch class' });
  }
});

app.delete('/api/classes/:class_id', authenticate, async (req, res) => {
  try {
    const cls = await Class.findOne({ class_id: req.params.class_id });
    if (!cls) {
      return res.status(404).json({ detail: 'Class not found' });
    }

    if (req.user.user_type !== 'institution' || cls.institution_id !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    await Class.deleteOne({ class_id: req.params.class_id });
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to delete class' });
  }
});

// Teacher assignment routes
app.post('/api/teacher-assignments', authenticate, async (req, res) => {
  try {
    if (req.user.user_type !== 'institution') {
      return res.status(403).json({ detail: 'Only institutions can assign teachers' });
    }

    const { teacher_id, subject_id, class_id } = req.body;

    const cls = await Class.findOne({ class_id });
    if (!cls || cls.institution_id !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    const subject = await Subject.findOne({ subject_id });
    if (!subject || subject.institution_id !== req.user.user_id) {
      return res.status(403).json({ detail: 'Subject not found or not authorized' });
    }

    const existing = await TeacherAssignment.findOne({ teacher_id, subject_id, class_id });
    if (existing) {
      return res.status(400).json({ detail: 'Teacher already assigned to this subject in this class' });
    }

    const assignment_id = generateId('assign');
    const assignment = new TeacherAssignment({
      assignment_id,
      teacher_id,
      subject_id,
      class_id
    });

    await assignment.save();
    res.json({ message: 'Teacher assigned successfully' });
  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({ detail: 'Failed to assign teacher' });
  }
});

app.get('/api/classes/:class_id/teachers', authenticate, async (req, res) => {
  try {
    const assignments = await TeacherAssignment.find({ class_id: req.params.class_id });
    
    const teachersData = [];
    for (let assignment of assignments) {
      const teacher = await User.findOne({ user_id: assignment.teacher_id }).select('-password_hash -_id -__v');
      const subject = await Subject.findOne({ subject_id: assignment.subject_id }).select('-_id -__v');
      
      if (teacher && subject) {
        teachersData.push({
          teacher_id: teacher.user_id,
          teacher_name: teacher.name,
          subject_id: subject.subject_id,
          subject_name: subject.name,
          assignment_id: assignment.assignment_id
        });
      }
    }

    res.json(teachersData);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch teachers' });
  }
});

app.get('/api/teachers', authenticate, async (req, res) => {
  try {
    const teachers = await User.find({ user_type: 'teacher' }).select('-password_hash -_id -__v');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch teachers' });
  }
});

// Student routes
app.post('/api/students', authenticate, async (req, res) => {
  try {
    if (req.user.user_type !== 'institution') {
      return res.status(403).json({ detail: 'Only institutions can add students' });
    }

    const { name, email, enrollment_number, class_id } = req.body;
    const student_id = generateId('student');

    const student = new Student({
      student_id,
      name,
      email,
      enrollment_number,
      class_id
    });

    await student.save();

    const response = student.toObject();
    delete response._id;
    delete response.__v;

    res.json(response);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ detail: 'Failed to create student' });
  }
});

app.get('/api/students/class/:class_id', authenticate, async (req, res) => {
  try {
    const students = await Student.find({ class_id: req.params.class_id })
      .sort({ name: 1 })
      .select('-_id -__v');
    res.json(students);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch students' });
  }
});

app.delete('/api/students/:student_id', authenticate, async (req, res) => {
  try {
    if (req.user.user_type !== 'institution') {
      return res.status(403).json({ detail: 'Only institutions can delete students' });
    }

    await Student.deleteOne({ student_id: req.params.student_id });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to delete student' });
  }
});

// Schedule routes
app.post('/api/schedules', authenticate, async (req, res) => {
  try {
    const { class_id, teacher_id, subject_id, day_of_week, time, duration, recurrence_type, start_date } = req.body;

    const cls = await Class.findOne({ class_id });
    if (!cls) {
      return res.status(404).json({ detail: 'Class not found' });
    }

    if (req.user.user_type === 'institution' && cls.institution_id !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    if (req.user.user_type === 'teacher') {
      const assignment = await TeacherAssignment.findOne({ teacher_id: req.user.user_id, class_id });
      if (!assignment) {
        return res.status(403).json({ detail: 'Not authorized' });
      }
    }

    const end_date = calculateEndDate(start_date, recurrence_type);
    const schedule_id = generateId('schedule');

    const schedule = new Schedule({
      schedule_id,
      class_id,
      teacher_id,
      subject_id,
      day_of_week,
      time,
      duration,
      recurrence_type,
      start_date,
      end_date
    });

    await schedule.save();

    const response = schedule.toObject();
    delete response._id;
    delete response.__v;

    res.json(response);
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ detail: 'Failed to create schedule' });
  }
});

app.get('/api/schedules/class/:class_id', authenticate, async (req, res) => {
  try {
    const schedules = await Schedule.find({ class_id: req.params.class_id }).select('-_id -__v');
    
    for (let schedule of schedules) {
      const teacher = await User.findOne({ user_id: schedule.teacher_id }).select('name');
      const subject = await Subject.findOne({ subject_id: schedule.subject_id }).select('name');
      
      schedule._doc.teacher_name = teacher ? teacher.name : 'Unknown';
      schedule._doc.subject_name = subject ? subject.name : 'Unknown';
    }

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch schedules' });
  }
});

app.delete('/api/schedules/:schedule_id', authenticate, async (req, res) => {
  try {
    const schedule = await Schedule.findOne({ schedule_id: req.params.schedule_id });
    if (!schedule) {
      return res.status(404).json({ detail: 'Schedule not found' });
    }

    const cls = await Class.findOne({ class_id: schedule.class_id });
    
    if (req.user.user_type === 'institution' && cls.institution_id !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    if (req.user.user_type === 'teacher' && schedule.teacher_id !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    await Schedule.deleteOne({ schedule_id: req.params.schedule_id });
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to delete schedule' });
  }
});

// Material routes
app.post('/api/materials', authenticate, async (req, res) => {
  try {
    const { title, description, file_url, content, class_id, subject_id } = req.body;
    const material_id = generateId('material');

    const material = new Material({
      material_id,
      title,
      description,
      file_url,
      content,
      class_id,
      subject_id,
      uploaded_by: req.user.user_id
    });

    await material.save();

    const response = material.toObject();
    delete response._id;
    delete response.__v;

    res.json(response);
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ detail: 'Failed to create material' });
  }
});

app.get('/api/materials/class/:class_id', authenticate, async (req, res) => {
  try {
    let query = { class_id: req.params.class_id };

    if (req.user.user_type === 'teacher') {
      const assignments = await TeacherAssignment.find({
        teacher_id: req.user.user_id,
        class_id: req.params.class_id
      });
      const subjectIds = assignments.map(a => a.subject_id).filter(Boolean);
      if (subjectIds.length > 0) {
        query.subject_id = { $in: subjectIds };
      }
    }

    const materials = await Material.find(query).select('-_id -__v');

    for (let material of materials) {
      if (material.subject_id) {
        const subject = await Subject.findOne({ subject_id: material.subject_id }).select('-_id -__v');
        material._doc.subject = subject;
      } else {
        material._doc.subject = null;
      }
    }

    res.json(materials);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch materials' });
  }
});

app.delete('/api/materials/:material_id', authenticate, async (req, res) => {
  try {
    const material = await Material.findOne({ material_id: req.params.material_id });
    if (!material) {
      return res.status(404).json({ detail: 'Material not found' });
    }

    if (material.uploaded_by !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    await Material.deleteOne({ material_id: req.params.material_id });
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to delete material' });
  }
});

app.post('/api/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }

    const file_url = `/uploads/${req.file.filename}`;
    res.json({ file_url, filename: req.file.originalname });
  } catch (error) {
    res.status(500).json({ detail: 'Upload failed' });
  }
});

// Attendance routes
app.post('/api/attendance', authenticate, async (req, res) => {
  try {
    if (!['teacher', 'institution'].includes(req.user.user_type)) {
      return res.status(403).json({ detail: 'Only teachers and institutions can mark attendance' });
    }

    const { student_id, class_id, date, status } = req.body;

    const existing = await Attendance.findOne({ student_id, class_id, date });

    if (existing) {
      existing.status = status;
      await existing.save();
      const response = existing.toObject();
      delete response._id;
      delete response.__v;
      return res.json(response);
    }

    const attendance_id = generateId('attendance');
    const attendance = new Attendance({
      attendance_id,
      student_id,
      class_id,
      date,
      status,
      marked_by: req.user.user_id
    });

    await attendance.save();

    const response = attendance.toObject();
    delete response._id;
    delete response.__v;

    res.json(response);
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ detail: 'Failed to mark attendance' });
  }
});

app.get('/api/attendance/class/:class_id', authenticate, async (req, res) => {
  try {
    const query = { class_id: req.params.class_id };
    if (req.query.date) {
      query.date = req.query.date;
    }

    const records = await Attendance.find(query).select('-_id -__v');
    res.json(records);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch attendance' });
  }
});

// Message routes
app.post('/api/messages', authenticate, async (req, res) => {
  try {
    const { recipient_id, content } = req.body;
    const message_id = generateId('message');

    const message = new Message({
      message_id,
      sender_id: req.user.user_id,
      recipient_id,
      content,
      read: false
    });

    await message.save();

    const response = message.toObject();
    delete response._id;
    delete response.__v;

    res.json(response);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to send message' });
  }
});

app.get('/api/messages', authenticate, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender_id: req.user.user_id },
        { recipient_id: req.user.user_id }
      ]
    })
    .sort({ created_at: -1 })
    .select('-_id -__v');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch messages' });
  }
});

app.put('/api/messages/:message_id/read', authenticate, async (req, res) => {
  try {
    await Message.updateOne(
      { message_id: req.params.message_id, recipient_id: req.user.user_id },
      { $set: { read: true } }
    );
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to mark message as read' });
  }
});

// Update user type (for Google OAuth users)
app.put('/api/auth/user-type', authenticate, async (req, res) => {
  try {
    const { user_type } = req.body;
    
    if (!['institution', 'teacher'].includes(user_type)) {
      return res.status(400).json({ detail: 'Invalid user type' });
    }

    await User.updateOne(
      { user_id: req.user.user_id },
      { $set: { user_type } }
    );

    const updatedUser = await User.findOne({ user_id: req.user.user_id }).select('-password_hash -_id -__v');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user type error:', error);
    res.status(500).json({ detail: 'Failed to update user type' });
  }
});

// Analytics routes
app.get('/api/analytics/attendance/:class_id', authenticate, async (req, res) => {
  try {
    const { class_id } = req.params;
    const { start_date, end_date } = req.query;

    const query = { class_id };
    if (start_date && end_date) {
      query.date = { $gte: start_date, $lte: end_date };
    }

    const attendanceRecords = await Attendance.find(query);
    const students = await Student.find({ class_id });

    // Calculate attendance stats
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;

    // Group by date for chart
    const byDate = {};
    attendanceRecords.forEach(record => {
      if (!byDate[record.date]) {
        byDate[record.date] = { date: record.date, present: 0, absent: 0, late: 0, total: 0 };
      }
      byDate[record.date][record.status]++;
      byDate[record.date].total++;
    });

    // Group by student
    const byStudent = {};
    students.forEach(student => {
      byStudent[student.student_id] = {
        student_id: student.student_id,
        name: student.name,
        present: 0,
        absent: 0,
        late: 0,
        total: 0,
        attendance_rate: 0
      };
    });

    attendanceRecords.forEach(record => {
      if (byStudent[record.student_id]) {
        byStudent[record.student_id][record.status]++;
        byStudent[record.student_id].total++;
      }
    });

    // Calculate attendance rate for each student
    Object.values(byStudent).forEach(student => {
      if (student.total > 0) {
        student.attendance_rate = Math.round((student.present / student.total) * 100);
      }
    });

    res.json({
      summary: {
        total_records: totalRecords,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        attendance_rate: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0
      },
      by_date: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)),
      by_student: Object.values(byStudent).sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ detail: 'Failed to fetch analytics' });
  }
});

app.get('/api/analytics/overview', authenticate, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.user_type === 'institution') {
      const classes = await Class.find({ institution_id: req.user.user_id });
      const classIds = classes.map(c => c.class_id);
      query.class_id = { $in: classIds };
    } else {
      const assignments = await TeacherAssignment.find({ teacher_id: req.user.user_id });
      const classIds = [...new Set(assignments.map(a => a.class_id))];
      query.class_id = { $in: classIds };
    }

    // Get all attendance records
    const attendanceRecords = await Attendance.find(query);
    
    // Last 30 days trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const recentRecords = attendanceRecords.filter(r => r.date >= thirtyDaysAgoStr);
    
    // Group by date for trend
    const trend = {};
    recentRecords.forEach(record => {
      if (!trend[record.date]) {
        trend[record.date] = { date: record.date, present: 0, absent: 0, late: 0, total: 0 };
      }
      trend[record.date][record.status]++;
      trend[record.date].total++;
    });

    // Calculate attendance rate per day
    const trendData = Object.values(trend).map(day => ({
      ...day,
      rate: day.total > 0 ? Math.round((day.present / day.total) * 100) : 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Overall stats
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;

    res.json({
      overall_attendance_rate: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
      total_records: totalRecords,
      trend: trendData
    });
  } catch (error) {
    console.error('Overview analytics error:', error);
    res.status(500).json({ detail: 'Failed to fetch overview analytics' });
  }
});

// Export routes
app.get('/api/export/attendance/:class_id/pdf', authenticate, async (req, res) => {
  try {
    const { class_id } = req.params;
    const { start_date, end_date } = req.query;

    const cls = await Class.findOne({ class_id });
    if (!cls) {
      return res.status(404).json({ detail: 'Class not found' });
    }

    const query = { class_id };
    if (start_date && end_date) {
      query.date = { $gte: start_date, $lte: end_date };
    }

    const students = await Student.find({ class_id }).sort({ name: 1 });
    const attendanceRecords = await Attendance.find(query);

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio_presenca_${class_id}.pdf`);
    
    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Relatório de Presença', { align: 'center' });
    doc.fontSize(14).text(`Turma: ${cls.name}`, { align: 'center' });
    if (start_date && end_date) {
      doc.fontSize(10).text(`Período: ${start_date} a ${end_date}`, { align: 'center' });
    }
    doc.moveDown(2);

    // Summary
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    const total = attendanceRecords.length;

    doc.fontSize(12).text('Resumo:', { underline: true });
    doc.fontSize(10);
    doc.text(`Total de registros: ${total}`);
    doc.text(`Presentes: ${presentCount} (${total > 0 ? Math.round((presentCount/total)*100) : 0}%)`);
    doc.text(`Ausentes: ${absentCount} (${total > 0 ? Math.round((absentCount/total)*100) : 0}%)`);
    doc.text(`Atrasados: ${lateCount} (${total > 0 ? Math.round((lateCount/total)*100) : 0}%)`);
    doc.moveDown(2);

    // Student details
    doc.fontSize(12).text('Detalhes por Aluno:', { underline: true });
    doc.moveDown();

    students.forEach(student => {
      const studentRecords = attendanceRecords.filter(r => r.student_id === student.student_id);
      const studentPresent = studentRecords.filter(r => r.status === 'present').length;
      const studentTotal = studentRecords.length;
      const rate = studentTotal > 0 ? Math.round((studentPresent / studentTotal) * 100) : 0;

      doc.fontSize(10);
      doc.text(`${student.name} - Taxa de presença: ${rate}% (${studentPresent}/${studentTotal})`);
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ detail: 'Failed to export PDF' });
  }
});

app.get('/api/export/attendance/:class_id/csv', authenticate, async (req, res) => {
  try {
    const { class_id } = req.params;
    const { start_date, end_date } = req.query;

    const cls = await Class.findOne({ class_id });
    if (!cls) {
      return res.status(404).json({ detail: 'Class not found' });
    }

    const query = { class_id };
    if (start_date && end_date) {
      query.date = { $gte: start_date, $lte: end_date };
    }

    const students = await Student.find({ class_id }).sort({ name: 1 });
    const attendanceRecords = await Attendance.find(query);

    // Prepare data for CSV
    const data = [];
    students.forEach(student => {
      const studentRecords = attendanceRecords.filter(r => r.student_id === student.student_id);
      const presentCount = studentRecords.filter(r => r.status === 'present').length;
      const absentCount = studentRecords.filter(r => r.status === 'absent').length;
      const lateCount = studentRecords.filter(r => r.status === 'late').length;
      const total = studentRecords.length;

      data.push({
        'Nome do Aluno': student.name,
        'Email': student.email || '',
        'Matrícula': student.enrollment_number || '',
        'Presenças': presentCount,
        'Ausências': absentCount,
        'Atrasos': lateCount,
        'Total de Aulas': total,
        'Taxa de Presença (%)': total > 0 ? Math.round((presentCount / total) * 100) : 0
      });
    });

    const parser = new Parser();
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio_presenca_${class_id}.csv`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ detail: 'Failed to export CSV' });
  }
});

// Email notification routes
app.post('/api/notifications/send-reminder', authenticate, async (req, res) => {
  try {
    const { schedule_id, custom_message } = req.body;

    const schedule = await Schedule.findOne({ schedule_id });
    if (!schedule) {
      return res.status(404).json({ detail: 'Schedule not found' });
    }

    const teacher = await User.findOne({ user_id: schedule.teacher_id });
    const cls = await Class.findOne({ class_id: schedule.class_id });
    const subject = await Subject.findOne({ subject_id: schedule.subject_id });

    if (!teacher || !teacher.email) {
      return res.status(400).json({ detail: 'Teacher email not found' });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0EA5E9; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ITeacher</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e293b;">Lembrete de Aula</h2>
          <p style="color: #475569;">Olá ${teacher.name},</p>
          <p style="color: #475569;">Este é um lembrete sobre sua próxima aula:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Turma:</strong> ${cls?.name || 'N/A'}</p>
            <p><strong>Matéria:</strong> ${subject?.name || 'N/A'}</p>
            <p><strong>Dia:</strong> ${schedule.day_of_week}</p>
            <p><strong>Horário:</strong> ${schedule.time}</p>
            <p><strong>Duração:</strong> ${schedule.duration} minutos</p>
          </div>
          ${custom_message ? `<p style="color: #475569;"><strong>Mensagem:</strong> ${custom_message}</p>` : ''}
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">
            Este email foi enviado automaticamente pelo sistema ITeacher.
          </p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [teacher.email],
      subject: `Lembrete de Aula - ${cls?.name || 'Turma'} - ${subject?.name || 'Matéria'}`,
      html: htmlContent
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ detail: 'Failed to send email', error: error.message });
    }

    res.json({ message: 'Reminder sent successfully', email_id: data?.id });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ detail: 'Failed to send reminder' });
  }
});

app.post('/api/notifications/send-bulk', authenticate, async (req, res) => {
  try {
    if (req.user.user_type !== 'institution') {
      return res.status(403).json({ detail: 'Only institutions can send bulk notifications' });
    }

    const { subject: emailSubject, message, recipient_type } = req.body;

    let recipients = [];
    
    if (recipient_type === 'teachers') {
      // Get all teachers assigned to this institution's classes
      const classes = await Class.find({ institution_id: req.user.user_id });
      const classIds = classes.map(c => c.class_id);
      const assignments = await TeacherAssignment.find({ class_id: { $in: classIds } });
      const teacherIds = [...new Set(assignments.map(a => a.teacher_id))];
      recipients = await User.find({ user_id: { $in: teacherIds } });
    } else {
      recipients = await User.find({ user_type: recipient_type });
    }

    const emails = recipients.filter(r => r.email).map(r => r.email);

    if (emails.length === 0) {
      return res.status(400).json({ detail: 'No recipients found' });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0EA5E9; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ITeacher</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e293b;">${emailSubject}</h2>
          <div style="color: #475569; white-space: pre-wrap;">${message}</div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">
            Enviado por ${req.user.name} via ITeacher.
          </p>
        </div>
      </div>
    `;

    // Send to each recipient (Resend free tier limitation)
    const results = [];
    for (const email of emails) {
      try {
        const { data, error } = await resend.emails.send({
          from: SENDER_EMAIL,
          to: [email],
          subject: emailSubject,
          html: htmlContent
        });
        results.push({ email, success: !error, id: data?.id });
      } catch (err) {
        results.push({ email, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    res.json({ 
      message: `Sent ${successCount}/${emails.length} emails successfully`,
      results 
    });
  } catch (error) {
    console.error('Send bulk notification error:', error);
    res.status(500).json({ detail: 'Failed to send bulk notifications' });
  }
});

// Get notification settings
app.get('/api/notifications/settings', authenticate, async (req, res) => {
  try {
    // For now, return default settings
    res.json({
      email_reminders: true,
      reminder_hours_before: 24
    });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to get settings' });
  }
});

// Cron job for automatic notifications (runs every hour)
const sendAutomaticReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][tomorrow.getDay()];
    
    // Find schedules for tomorrow
    const schedules = await Schedule.find({ day_of_week: dayOfWeek });
    
    for (const schedule of schedules) {
      const teacher = await User.findOne({ user_id: schedule.teacher_id });
      const cls = await Class.findOne({ class_id: schedule.class_id });
      const subject = await Subject.findOne({ subject_id: schedule.subject_id });
      
      if (teacher && teacher.email) {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #0EA5E9; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">ITeacher</h1>
            </div>
            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #1e293b;">Lembrete: Aula Amanhã</h2>
              <p style="color: #475569;">Olá ${teacher.name},</p>
              <p style="color: #475569;">Você tem uma aula agendada para amanhã:</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Turma:</strong> ${cls?.name || 'N/A'}</p>
                <p><strong>Matéria:</strong> ${subject?.name || 'N/A'}</p>
                <p><strong>Horário:</strong> ${schedule.time}</p>
                <p><strong>Duração:</strong> ${schedule.duration} minutos</p>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">
                Este email foi enviado automaticamente pelo sistema ITeacher.
              </p>
            </div>
          </div>
        `;

        try {
          await resend.emails.send({
            from: SENDER_EMAIL,
            to: [teacher.email],
            subject: `Lembrete: Aula amanhã - ${cls?.name || 'Turma'}`,
            html: htmlContent
          });
          console.log(`Reminder sent to ${teacher.email}`);
        } catch (emailError) {
          console.error(`Failed to send reminder to ${teacher.email}:`, emailError);
        }
      }
    }
  } catch (error) {
    console.error('Automatic reminder error:', error);
  }
};

// Schedule cron job to run at 6 PM every day
cron.schedule('0 18 * * *', () => {
  console.log('Running automatic reminder job...');
  sendAutomaticReminders();
});

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ detail: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ ITeacher Backend running on port ${PORT}`);
});

module.exports = app;

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

    if (!user) {
      const user_id = generateId('user');
      user = new User({
        user_id,
        email: oauthData.email,
        name: oauthData.name,
        user_type: 'teacher',
        picture: oauthData.picture || null
      });
      await user.save();
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

    res.json({ user: userResponse, session_token });
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

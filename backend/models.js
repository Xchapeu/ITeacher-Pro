const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  user_type: { type: String, enum: ['institution', 'teacher'], required: true },
  password_hash: { type: String },
  picture: { type: String },
  created_at: { type: Date, default: Date.now }
});

// User Session Schema
const userSessionSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  session_token: { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

// Subject Schema
const subjectSchema = new mongoose.Schema({
  subject_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  institution_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Class Schema
const classSchema = new mongoose.Schema({
  class_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  institution_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Teacher Assignment Schema
const teacherAssignmentSchema = new mongoose.Schema({
  assignment_id: { type: String, required: true, unique: true },
  teacher_id: { type: String, required: true },
  subject_id: { type: String, required: true },
  class_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Student Schema
const studentSchema = new mongoose.Schema({
  student_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  enrollment_number: { type: String },
  class_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Schedule Schema
const scheduleSchema = new mongoose.Schema({
  schedule_id: { type: String, required: true, unique: true },
  class_id: { type: String, required: true },
  teacher_id: { type: String, required: true },
  subject_id: { type: String, required: true },
  day_of_week: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: Number, required: true },
  recurrence_type: { type: String, enum: ['once', 'weekly', 'monthly', 'semester_1', 'semester_2', 'annual'], required: true },
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Material Schema
const materialSchema = new mongoose.Schema({
  material_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  file_url: { type: String },
  content: { type: String },
  class_id: { type: String, required: true },
  subject_id: { type: String, required: true },
  uploaded_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  attendance_id: { type: String, required: true, unique: true },
  student_id: { type: String, required: true },
  class_id: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], required: true },
  marked_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Message Schema
const messageSchema = new mongoose.Schema({
  message_id: { type: String, required: true, unique: true },
  sender_id: { type: String, required: true },
  recipient_id: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const UserSession = mongoose.model('UserSession', userSessionSchema);
const Subject = mongoose.model('Subject', subjectSchema);
const Class = mongoose.model('Class', classSchema);
const TeacherAssignment = mongoose.model('TeacherAssignment', teacherAssignmentSchema);
const Student = mongoose.model('Student', studentSchema);
const Schedule = mongoose.model('Schedule', scheduleSchema);
const Material = mongoose.model('Material', materialSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = {
  User,
  UserSession,
  Subject,
  Class,
  TeacherAssignment,
  Student,
  Schedule,
  Material,
  Attendance,
  Message
};

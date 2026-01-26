import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  BookOpen,
  Users,
  Calendar as CalendarIcon,
  CheckCircle2,
  FileText,
  ArrowLeft,
  Plus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const ClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    enrollment_number: ''
  });
  const [scheduleForm, setScheduleForm] = useState({
    teacher_id: '',
    subject_id: '',
    day_of_week: 'Segunda',
    time: '08:00',
    duration: 60,
    recurrence_type: 'weekly',
    start_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
  };

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  useEffect(() => {
    if (students.length > 0) {
      fetchAttendance();
    }
  }, [selectedDate, students]);

  const fetchClassData = async () => {
    try {
      const [classRes, studentsRes, materialsRes, schedulesRes, teachersRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/classes/${classId}`, getAuthHeaders()),
        axios.get(`${BACKEND_URL}/api/students/class/${classId}`, getAuthHeaders()),
        axios.get(`${BACKEND_URL}/api/materials/class/${classId}`, getAuthHeaders()),
        axios.get(`${BACKEND_URL}/api/schedules/class/${classId}`, getAuthHeaders()),
        axios.get(`${BACKEND_URL}/api/classes/${classId}/teachers`, getAuthHeaders())
      ]);

      setClassData(classRes.data);
      setStudents(studentsRes.data);
      setMaterials(materialsRes.data);
      setSchedules(schedulesRes.data);
      setTeachers(teachersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching class data:', error);
      toast.error('Erro ao carregar dados da turma');
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/attendance/class/${classId}?date=${selectedDate}`,
        getAuthHeaders()
      );
      const attendanceMap = {};
      response.data.forEach((record) => {
        attendanceMap[record.student_id] = record.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setShowStudentDialog(false); // Close dialog immediately
    try {
      await axios.post(
        `${BACKEND_URL}/api/students`,
        { ...studentForm, class_id: classId },
        getAuthHeaders()
      );
      toast.success('Aluno adicionado com sucesso!');
      setStudentForm({ name: '', email: '', enrollment_number: '' });
      fetchClassData();
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Erro ao adicionar aluno');
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setShowScheduleDialog(false); // Close dialog immediately
    try {
      await axios.post(
        `${BACKEND_URL}/api/schedules`,
        { ...scheduleForm, class_id: classId },
        getAuthHeaders()
      );
      toast.success('Horário adicionado com sucesso!');
      setScheduleForm({
        teacher_id: '',
        subject_id: '',
        day_of_week: 'Segunda',
        time: '08:00',
        duration: 60,
        recurrence_type: 'weekly',
        start_date: format(new Date(), 'yyyy-MM-dd')
      });
      fetchClassData();
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Erro ao adicionar horário');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Tem certeza que deseja excluir este horário?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/schedules/${scheduleId}`, getAuthHeaders());
      toast.success('Horário excluído com sucesso!');
      fetchClassData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Erro ao excluir horário');
    }
  };

  const handleTeacherChange = (teacherId) => {
    const teacher = teachers.find(t => t.teacher_id === teacherId);
    setScheduleForm({
      ...scheduleForm,
      teacher_id: teacherId,
      subject_id: teacher ? teacher.subject_id : ''
    });
  };

  const handleMarkAttendance = async (studentId, status) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/attendance`,
        {
          student_id: studentId,
          class_id: classId,
          date: selectedDate,
          status: status
        },
        getAuthHeaders()
      );
      setAttendance({ ...attendance, [studentId]: status });
      toast.success('Presença marcada!');
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Erro ao marcar presença');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Tem certeza que deseja remover este aluno?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/students/${studentId}`, getAuthHeaders());
      toast.success('Aluno removido com sucesso!');
      fetchClassData();
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Erro ao remover aluno');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-slate-600 hover:text-primary"
              data-testid="back-btn"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-heading font-bold text-slate-900">{classData?.name}</h1>
              <p className="text-slate-600">{classData?.description || 'Sem descrição'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="students" data-testid="tab-students">
              <Users className="h-4 w-4 mr-2" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="attendance" data-testid="tab-attendance">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Presença
            </TabsTrigger>
            <TabsTrigger value="schedule" data-testid="tab-schedule">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="materials" data-testid="tab-materials">
              <FileText className="h-4 w-4 mr-2" />
              Materiais
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Alunos da Turma</h2>
              <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="add-student-btn">
                    <Plus className="h-4 w-4" />
                    Adicionar Aluno
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Aluno</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                      <Label htmlFor="student-name">Nome</Label>
                      <Input
                        id="student-name"
                        data-testid="student-name-input"
                        value={studentForm.name}
                        onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="student-email">Email</Label>
                      <Input
                        id="student-email"
                        data-testid="student-email-input"
                        type="email"
                        value={studentForm.email}
                        onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="enrollment">Matrícula</Label>
                      <Input
                        id="enrollment"
                        data-testid="student-enrollment-input"
                        value={studentForm.enrollment_number}
                        onChange={(e) =>
                          setStudentForm({ ...studentForm, enrollment_number: e.target.value })
                        }
                      />
                    </div>
                    <Button type="submit" className="w-full" data-testid="submit-student-btn">
                      Adicionar
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {students.map((student) => (
                <Card key={student.student_id} className="border-slate-200" data-testid={`student-${student.student_id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{student.name}</h3>
                        <p className="text-sm text-slate-600">{student.email}</p>
                        {student.enrollment_number && (
                          <p className="text-xs text-slate-500 mt-1">
                            Matrícula: {student.enrollment_number}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStudent(student.student_id)}
                        className="text-red-600 hover:bg-red-50"
                        data-testid={`remove-student-${student.student_id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {students.length === 0 && (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Nenhum aluno cadastrado ainda</p>
              </div>
            )}
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="date">Data:</Label>
              <Input
                id="date"
                data-testid="attendance-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-64"
              />
            </div>

            <div className="space-y-4">
              {students.map((student) => (
                <Card key={student.student_id} className="border-slate-200" data-testid={`attendance-${student.student_id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{student.name}</h3>
                        <p className="text-sm text-slate-600">{student.enrollment_number}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={attendance[student.student_id] === 'present' ? 'default' : 'outline'}
                          className={
                            attendance[student.student_id] === 'present'
                              ? 'bg-green-500 hover:bg-green-600'
                              : ''
                          }
                          onClick={() => handleMarkAttendance(student.student_id, 'present')}
                          data-testid={`mark-present-${student.student_id}`}
                        >
                          Presente
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[student.student_id] === 'absent' ? 'default' : 'outline'}
                          className={
                            attendance[student.student_id] === 'absent'
                              ? 'bg-red-500 hover:bg-red-600'
                              : ''
                          }
                          onClick={() => handleMarkAttendance(student.student_id, 'absent')}
                          data-testid={`mark-absent-${student.student_id}`}
                        >
                          Ausente
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[student.student_id] === 'late' ? 'default' : 'outline'}
                          className={
                            attendance[student.student_id] === 'late'
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : ''
                          }
                          onClick={() => handleMarkAttendance(student.student_id, 'late')}
                          data-testid={`mark-late-${student.student_id}`}
                        >
                          Atrasado
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {students.length === 0 && (
              <div className="text-center py-16">
                <CheckCircle2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Adicione alunos para marcar presença</p>
              </div>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Horários de Aula</h2>
              <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="add-schedule-btn">
                    <Plus className="h-4 w-4" />
                    Adicionar Horário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar Horário de Aula</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddSchedule} className="space-y-4">
                    <div>
                      <Label htmlFor="teacher">Professor</Label>
                      <select
                        id="teacher"
                        data-testid="schedule-teacher-select"
                        value={scheduleForm.teacher_id}
                        onChange={(e) => handleTeacherChange(e.target.value)}
                        className="w-full h-12 bg-slate-50 border-slate-200 rounded-lg px-4"
                        required
                      >
                        <option value="">Selecione um professor</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.teacher_id} value={teacher.teacher_id}>
                            {teacher.teacher_name} - {teacher.subject_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {scheduleForm.teacher_id && (
                      <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-slate-700">
                          Matéria: <span className="text-primary">{teachers.find(t => t.teacher_id === scheduleForm.teacher_id)?.subject_name}</span>
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="day_of_week">Dia da Semana</Label>
                        <select
                          id="day_of_week"
                          data-testid="schedule-day-select"
                          value={scheduleForm.day_of_week}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })}
                          className="w-full h-12 bg-slate-50 border-slate-200 rounded-lg px-4"
                        >
                          {DAYS_OF_WEEK.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="time">Horário</Label>
                        <Input
                          id="time"
                          data-testid="schedule-time-input"
                          type="time"
                          value={scheduleForm.time}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duração (minutos)</Label>
                        <Input
                          id="duration"
                          data-testid="schedule-duration-input"
                          type="number"
                          value={scheduleForm.duration}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, duration: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="start_date">Data de Início</Label>
                        <Input
                          id="start_date"
                          data-testid="schedule-start-date-input"
                          type="date"
                          value={scheduleForm.start_date}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, start_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="recurrence">Recorrência</Label>
                      <select
                        id="recurrence"
                        data-testid="schedule-recurrence-select"
                        value={scheduleForm.recurrence_type}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, recurrence_type: e.target.value })}
                        className="w-full h-12 bg-slate-50 border-slate-200 rounded-lg px-4"
                      >
                        <option value="once">Uma vez</option>
                        <option value="weekly">Semanal (semana corrente)</option>
                        <option value="monthly">Mensal (mês corrente)</option>
                        <option value="semester_1">1º Semestre (Jan-Jun)</option>
                        <option value="semester_2">2º Semestre (Jul-Dez)</option>
                        <option value="annual">Anual</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        {scheduleForm.recurrence_type === 'once' && 'Aula única na data selecionada'}
                        {scheduleForm.recurrence_type === 'weekly' && 'Repetir por 7 dias (semana corrente)'}
                        {scheduleForm.recurrence_type === 'monthly' && 'Repetir até o fim do mês corrente'}
                        {scheduleForm.recurrence_type === 'semester_1' && 'Todas as semanas de Janeiro a Junho'}
                        {scheduleForm.recurrence_type === 'semester_2' && 'Todas as semanas de Julho a Dezembro'}
                        {scheduleForm.recurrence_type === 'annual' && 'Todas as semanas durante o ano todo'}
                      </p>
                    </div>
                    <Button type="submit" className="w-full" data-testid="submit-schedule-btn">
                      Adicionar Horário
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-7 gap-4">
              {DAYS_OF_WEEK.map((day) => {
                const daySchedules = schedules.filter((s) => s.day_of_week === day);
                return (
                  <Card key={day} className="border-slate-200" data-testid={`schedule-${day}`}>
                    <CardHeader>
                      <CardTitle className="text-base text-slate-900">{day}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {daySchedules.length > 0 ? (
                        <div className="space-y-3">
                          {daySchedules.map((schedule) => (
                            <div
                              key={schedule.schedule_id}
                              className="bg-sky-50 border border-sky-200 rounded-lg p-3 relative group"
                            >
                              <button
                                onClick={() => handleDeleteSchedule(schedule.schedule_id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Excluir horário"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <p className="text-sm font-semibold text-slate-900">
                                {schedule.time}
                              </p>
                              <p className="text-xs text-slate-600">{schedule.duration} min</p>
                              <div className="mt-2 pt-2 border-t border-sky-300">
                                <p className="text-xs font-medium text-primary">
                                  {schedule.teacher_name}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {schedule.subject_name}
                                </p>
                              </div>
                              <div className="mt-1">
                                <span className="inline-block text-xs bg-sky-200 text-sky-800 px-2 py-0.5 rounded-full">
                                  {schedule.recurrence_type === 'once' && 'Única'}
                                  {schedule.recurrence_type === 'weekly' && 'Semanal'}
                                  {schedule.recurrence_type === 'monthly' && 'Mensal'}
                                  {schedule.recurrence_type === 'semester_1' && '1º Sem'}
                                  {schedule.recurrence_type === 'semester_2' && '2º Sem'}
                                  {schedule.recurrence_type === 'annual' && 'Anual'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Sem aulas</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {schedules.length === 0 && (
              <div className="text-center py-16">
                <CalendarIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Nenhum horário cadastrado ainda</p>
                <p className="text-sm text-slate-500 mt-2">Clique em "Adicionar Horário" para começar</p>
              </div>
            )}
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Materiais de Aula</h2>

            <div className="grid grid-cols-2 gap-6">
              {materials.map((material) => (
                <Card key={material.material_id} className="border-slate-200" data-testid={`material-${material.material_id}`}>
                  <CardHeader>
                    <CardTitle className="text-slate-900">{material.title}</CardTitle>
                    <CardDescription>{material.description || 'Sem descrição'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {material.content && (
                      <p className="text-slate-600 mb-4">{material.content}</p>
                    )}
                    {material.file_url && (
                      <a
                        href={`${BACKEND_URL}${material.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Ver arquivo anexado
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {materials.length === 0 && (
              <div className="text-center py-16">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Nenhum material cadastrado ainda</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClassDetails;

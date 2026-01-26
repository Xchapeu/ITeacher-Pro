import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  BookOpen,
  Users,
  GraduationCap,
  MessageSquare,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const InstitutionDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, classesRes, teachersRes, subjectsRes, messagesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/auth/me`, getAuthHeaders()),
        axios.get(`${BACKEND_URL}/api/classes`, getAuthHeaders()),
        axios.get(`${BACKEND_URL}/api/teachers`, getAuthHeaders()),
        axios.get(`${BACKEND_URL}/api/subjects`, getAuthHeaders()),
        axios.get(`${BACKEND_URL}/api/messages`, getAuthHeaders())
      ]);

      setUser(userRes.data);
      setClasses(classesRes.data);
      setTeachers(teachersRes.data);
      setSubjects(subjectsRes.data);
      setMessages(messagesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, getAuthHeaders());
      localStorage.removeItem('token');
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
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
    <div className="min-h-screen bg-slate-50">
      <div className="grid grid-cols-12 min-h-screen">
        {/* Sidebar */}
        <aside className="col-span-2 bg-white border-r border-slate-200 p-6 space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <BookOpen className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-heading font-bold text-slate-900">EduFlow</span>
          </div>

          <nav className="space-y-2">
            <Link to="/institution" data-testid="nav-overview">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${
                  location.pathname === '/institution'
                    ? 'bg-sky-50 text-primary'
                    : 'text-slate-600 hover:text-primary hover:bg-sky-50'
                }`}
              >
                <BookOpen className="h-5 w-5" />
                Visão Geral
              </Button>
            </Link>
            <Link to="/institution/classes" data-testid="nav-classes">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${
                  location.pathname === '/institution/classes'
                    ? 'bg-sky-50 text-primary'
                    : 'text-slate-600 hover:text-primary hover:bg-sky-50'
                }`}
              >
                <GraduationCap className="h-5 w-5" />
                Turmas
              </Button>
            </Link>
            <Link to="/institution/subjects" data-testid="nav-subjects">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${
                  location.pathname === '/institution/subjects'
                    ? 'bg-sky-50 text-primary'
                    : 'text-slate-600 hover:text-primary hover:bg-sky-50'
                }`}
              >
                <BookOpen className="h-5 w-5" />
                Matérias
              </Button>
            </Link>
            <Link to="/institution/teachers" data-testid="nav-teachers">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${
                  location.pathname === '/institution/teachers'
                    ? 'bg-sky-50 text-primary'
                    : 'text-slate-600 hover:text-primary hover:bg-sky-50'
                }`}
              >
                <Users className="h-5 w-5" />
                Professores
              </Button>
            </Link>
            <Link to="/institution/messages" data-testid="nav-messages">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${
                  location.pathname === '/institution/messages'
                    ? 'bg-sky-50 text-primary'
                    : 'text-slate-600 hover:text-primary hover:bg-sky-50'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                Mensagens
              </Button>
            </Link>
          </nav>

          <div className="pt-8 border-t border-slate-200">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-600 hover:text-red-600 hover:bg-red-50"
              data-testid="logout-btn"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="col-span-10 p-8">
          <Routes>
            <Route path="/" element={<Overview classes={classes} teachers={teachers} subjects={subjects} user={user} />} />
            <Route path="/classes" element={<ClassesView classes={classes} fetchData={fetchData} />} />
            <Route path="/subjects" element={<SubjectsView subjects={subjects} fetchData={fetchData} />} />
            <Route path="/teachers" element={<TeachersView teachers={teachers} classes={classes} subjects={subjects} fetchData={fetchData} />} />
            <Route path="/messages" element={<MessagesView messages={messages} teachers={teachers} fetchData={fetchData} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const Overview = ({ classes, teachers, subjects, user }) => {
  return (
    <div className="space-y-8" data-testid="institution-overview">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900">
          Bem-vindo, {user?.name}
        </h1>
        <p className="text-slate-600 mt-2">Visão geral da sua instituição</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              Total de Turmas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{classes.length}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              Matérias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{subjects.length}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              Professores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{teachers.length}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              Sistema Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium text-slate-600">Operacional</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Turmas Recentes</CardTitle>
          <CardDescription>Últimas turmas criadas</CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length > 0 ? (
            <div className="space-y-4">
              {classes.slice(0, 5).map((cls) => (
                <div key={cls.class_id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-primary/20 transition-colors">
                  <div>
                    <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                    <p className="text-sm text-slate-600">{cls.description || 'Sem descrição'}</p>
                  </div>
                  <Link to={`/class/${cls.class_id}`}>
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-sky-50">
                      Ver Detalhes
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">Nenhuma turma cadastrada ainda</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ClassesView = ({ classes, fetchData }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    schedule: []
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/classes`, formData, getAuthHeaders());
      toast.success('Turma criada com sucesso!');
      setShowDialog(false);
      setFormData({ name: '', description: '', schedule: [] });
      fetchData();
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Erro ao criar turma');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta turma?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/classes/${classId}`, getAuthHeaders());
      toast.success('Turma excluída com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Erro ao excluir turma');
    }
  };

  return (
    <div className="space-y-6" data-testid="classes-view">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Turmas</h1>
          <p className="text-slate-600">Gerencie as turmas da instituição</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full px-6 py-6 font-semibold gap-2" data-testid="create-class-btn">
              <Plus className="h-5 w-5" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Turma</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Turma</Label>
                <Input
                  id="name"
                  data-testid="class-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Matemática 101"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  data-testid="class-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da turma"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="submit-class-btn">
                Criar Turma
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {classes.map((cls) => (
          <Card key={cls.class_id} className="border-slate-200 hover:border-primary/20 transition-colors" data-testid={`class-card-${cls.class_id}`}>
            <CardHeader>
              <CardTitle className="text-slate-900">{cls.name}</CardTitle>
              <CardDescription>{cls.description || 'Sem descrição'}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Link to={`/class/${cls.class_id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full" data-testid={`view-class-${cls.class_id}`}>
                  Ver Detalhes
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClass(cls.class_id)}
                className="text-red-600 hover:bg-red-50"
                data-testid={`delete-class-${cls.class_id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-16">
          <GraduationCap className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Nenhuma turma cadastrada ainda</p>
          <p className="text-sm text-slate-500 mt-2">Clique em "Nova Turma" para começar</p>
        </div>
      )}
    </div>
  );
};

const TeachersView = ({ teachers, classes, fetchData }) => {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${BACKEND_URL}/api/teacher-assignments`,
        { teacher_id: selectedTeacher, class_id: selectedClass },
        getAuthHeaders()
      );
      toast.success('Professor atribuído à turma com sucesso!');
      setShowAssignDialog(false);
      setSelectedTeacher('');
      setSelectedClass('');
      fetchData();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atribuir professor');
    }
  };

  return (
    <div className="space-y-6" data-testid="teachers-view">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Professores</h1>
          <p className="text-slate-600">Gerencie professores e atribuições</p>
        </div>
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full px-6 py-6 font-semibold gap-2" data-testid="assign-teacher-btn">
              <Plus className="h-5 w-5" />
              Atribuir à Turma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atribuir Professor à Turma</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <div>
                <Label htmlFor="teacher">Professor</Label>
                <select
                  id="teacher"
                  data-testid="select-teacher"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full h-12 bg-slate-50 border-slate-200 rounded-lg px-4"
                  required
                >
                  <option value="">Selecione um professor</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.user_id} value={teacher.user_id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="class">Turma</Label>
                <select
                  id="class"
                  data-testid="select-class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full h-12 bg-slate-50 border-slate-200 rounded-lg px-4"
                  required
                >
                  <option value="">Selecione uma turma</option>
                  {classes.map((cls) => (
                    <option key={cls.class_id} value={cls.class_id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full" data-testid="submit-assign-btn">
                Atribuir
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {teachers.map((teacher) => (
          <Card key={teacher.user_id} className="border-slate-200" data-testid={`teacher-card-${teacher.user_id}`}>
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-3">
                <div className="h-10 w-10 bg-sky-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                {teacher.name}
              </CardTitle>
              <CardDescription>{teacher.email}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {teachers.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Nenhum professor cadastrado ainda</p>
        </div>
      )}
    </div>
  );
};

const MessagesView = ({ messages, teachers, fetchData }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    recipient_id: '',
    content: ''
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/messages`, formData, getAuthHeaders());
      toast.success('Mensagem enviada!');
      setShowDialog(false);
      setFormData({ recipient_id: '', content: '' });
      fetchData();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  return (
    <div className="space-y-6" data-testid="messages-view">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Mensagens</h1>
          <p className="text-slate-600">Comunicação com professores</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full px-6 py-6 font-semibold gap-2" data-testid="new-message-btn">
              <Send className="h-5 w-5" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Mensagem</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <Label htmlFor="recipient">Destinatário</Label>
                <select
                  id="recipient"
                  data-testid="select-recipient"
                  value={formData.recipient_id}
                  onChange={(e) => setFormData({ ...formData, recipient_id: e.target.value })}
                  className="w-full h-12 bg-slate-50 border-slate-200 rounded-lg px-4"
                  required
                >
                  <option value="">Selecione um professor</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.user_id} value={teacher.user_id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="content">Mensagem</Label>
                <Textarea
                  id="content"
                  data-testid="message-content-input"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Digite sua mensagem..."
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" className="w-full" data-testid="send-message-btn">
                Enviar Mensagem
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {messages.map((msg) => {
          const teacher = teachers.find((t) => t.user_id === msg.recipient_id || t.user_id === msg.sender_id);
          return (
            <Card key={msg.message_id} className="border-slate-200" data-testid={`message-${msg.message_id}`}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-sky-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{teacher?.name || 'Usuário'}</p>
                    <p className="text-slate-600 mt-1">{msg.content}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(msg.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {messages.length === 0 && (
        <div className="text-center py-16">
          <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Nenhuma mensagem ainda</p>
        </div>
      )}
    </div>
  );
};

export default InstitutionDashboard;

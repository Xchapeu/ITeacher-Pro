import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  BookOpen,
  Calendar,
  FileText,
  CheckCircle2,
  MessageSquare,
  LogOut,
  Plus,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
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
      const [userRes, classesRes, messagesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/auth/me`, getAuthHeaders()),
        axios.get(`${BACKEND_URL}/api/classes`, getAuthHeaders()),
        axios.get(`${BACKEND_URL}/api/messages`, getAuthHeaders())
      ]);

      setUser(userRes.data);
      setClasses(classesRes.data);
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
            <Link to="/teacher" data-testid="nav-overview">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${
                  location.pathname === '/teacher'
                    ? 'bg-sky-50 text-primary'
                    : 'text-slate-600 hover:text-primary hover:bg-sky-50'
                }`}
              >
                <BookOpen className="h-5 w-5" />
                Minhas Turmas
              </Button>
            </Link>
            <Link to="/teacher/materials" data-testid="nav-materials">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${
                  location.pathname === '/teacher/materials'
                    ? 'bg-sky-50 text-primary'
                    : 'text-slate-600 hover:text-primary hover:bg-sky-50'
                }`}
              >
                <FileText className="h-5 w-5" />
                Materiais
              </Button>
            </Link>
            <Link to="/teacher/messages" data-testid="nav-messages">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${
                  location.pathname === '/teacher/messages'
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
            <Route path="/" element={<MyClasses classes={classes} user={user} />} />
            <Route path="/materials" element={<Materials classes={classes} fetchData={fetchData} />} />
            <Route path="/messages" element={<Messages messages={messages} fetchData={fetchData} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const MyClasses = ({ classes, user }) => {
  return (
    <div className="space-y-8" data-testid="teacher-classes">
      <div>
        <h1 className="text-4xl font-heading font-bold text-slate-900">
          Olá, {user?.name}
        </h1>
        <p className="text-slate-600 mt-2">Suas turmas e matérias atribuídas</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {classes.map((cls) => (
          <Card key={cls.class_id} className="border-slate-200 hover:border-primary/20 transition-all hover:shadow-md" data-testid={`class-card-${cls.class_id}`}>
            <CardHeader>
              <CardTitle className="text-slate-900">{cls.name}</CardTitle>
              <CardDescription>{cls.description || 'Sem descrição'}</CardDescription>
              {cls.subjects && cls.subjects.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {cls.subjects.map((subject) => (
                    <span
                      key={subject.subject_id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-primary"
                    >
                      {subject.name}
                    </span>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Link to={`/class/${cls.class_id}`}>
                <Button className="w-full" variant="outline" data-testid={`view-class-${cls.class_id}`}>
                  Acessar Turma
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Você ainda não foi atribuído a nenhuma turma</p>
          <p className="text-sm text-slate-500 mt-2">Aguarde a instituição atribuir turmas e matérias para você</p>
        </div>
      )}
    </div>
  );
};

const Materials = ({ classes, fetchData }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    class_id: '',
    subject_id: ''
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchMaterials(selectedClass);
    }
  }, [selectedClass]);

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/subjects`, getAuthHeaders());
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchMaterials = async (classId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/materials/class/${classId}`, getAuthHeaders());
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const formDataFile = new FormData();
    formDataFile.append('file', file);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/upload`, formDataFile, {
        ...getAuthHeaders(),
        headers: {
          ...getAuthHeaders().headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFormData({ ...formData, file_url: response.data.file_url });
      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/materials`, formData, getAuthHeaders());
      toast.success('Material criado com sucesso!');
      setShowDialog(false);
      setFormData({ title: '', description: '', content: '', class_id: '' });
      if (selectedClass) {
        fetchMaterials(selectedClass);
      }
    } catch (error) {
      console.error('Error creating material:', error);
      toast.error('Erro ao criar material');
    }
  };

  return (
    <div className="space-y-6" data-testid="materials-view">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Materiais de Aula</h1>
          <p className="text-slate-600">Gerencie materiais das suas turmas</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full px-6 py-6 font-semibold gap-2" data-testid="create-material-btn">
              <Plus className="h-5 w-5" />
              Novo Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Material de Aula</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMaterial} className="space-y-4">
              <div>
                <Label htmlFor="class">Turma</Label>
                <select
                  id="class"
                  data-testid="select-class-material"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
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
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  data-testid="material-title-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do material"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  data-testid="material-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do material"
                />
              </div>
              <div>
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  data-testid="material-content-input"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Conteúdo do material"
                  rows={5}
                />
              </div>
              <div>
                <Label htmlFor="file">Upload de Arquivo (opcional)</Label>
                <Input
                  id="file"
                  data-testid="material-file-input"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
                {uploadingFile && <p className="text-sm text-slate-600 mt-2">Enviando...</p>}
              </div>
              <Button type="submit" className="w-full" data-testid="submit-material-btn">
                Criar Material
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <Label>Filtrar por Turma</Label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full max-w-md h-12 bg-slate-50 border-slate-200 rounded-lg px-4 mt-2"
          data-testid="filter-class-select"
        >
          <option value="">Todas as turmas</option>
          {classes.map((cls) => (
            <option key={cls.class_id} value={cls.class_id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

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

      {selectedClass && materials.length === 0 && (
        <div className="text-center py-16">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Nenhum material cadastrado para esta turma</p>
        </div>
      )}
    </div>
  );
};

const Messages = ({ messages, fetchData }) => {
  return (
    <div className="space-y-6" data-testid="teacher-messages">
      <div>
        <h1 className="text-3xl font-heading font-bold text-slate-900">Mensagens</h1>
        <p className="text-slate-600">Suas conversas com a instituição</p>
      </div>

      <div className="space-y-4">
        {messages.map((msg) => (
          <Card key={msg.message_id} className="border-slate-200" data-testid={`message-${msg.message_id}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-sky-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-600">{msg.content}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(msg.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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

export default TeacherDashboard;

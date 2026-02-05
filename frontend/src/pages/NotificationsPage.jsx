import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Mail,
  Bell,
  Send,
  Users,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [recipientType, setRecipientType] = useState('teachers');
  const [sending, setSending] = useState(false);
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

  useEffect(() => {
    if (selectedClass) {
      fetchSchedules(selectedClass);
    }
  }, [selectedClass]);

  const fetchData = async () => {
    try {
      const classesRes = await axios.get(`${BACKEND_URL}/api/classes`, getAuthHeaders());
      setClasses(classesRes.data);
      
      if (classesRes.data.length > 0) {
        setSelectedClass(classesRes.data[0].class_id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
      setLoading(false);
    }
  };

  const fetchSchedules = async (classId) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/schedules/class/${classId}`,
        getAuthHeaders()
      );
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const handleSendReminder = async () => {
    if (!selectedSchedule) {
      toast.error('Selecione um horário');
      return;
    }

    setSending(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/notifications/send-reminder`,
        {
          schedule_id: selectedSchedule,
          custom_message: customMessage
        },
        getAuthHeaders()
      );
      
      toast.success('Lembrete enviado com sucesso!');
      setCustomMessage('');
    } catch (error) {
      console.error('Send reminder error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar lembrete');
    } finally {
      setSending(false);
    }
  };

  const handleSendBulk = async () => {
    if (!bulkSubject || !bulkMessage) {
      toast.error('Preencha o assunto e a mensagem');
      return;
    }

    setSending(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/notifications/send-bulk`,
        {
          subject: bulkSubject,
          message: bulkMessage,
          recipient_type: recipientType
        },
        getAuthHeaders()
      );
      
      toast.success(response.data.message);
      setBulkSubject('');
      setBulkMessage('');
    } catch (error) {
      console.error('Send bulk error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar notificações');
    } finally {
      setSending(false);
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-slate-600 hover:text-primary"
            data-testid="back-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-slate-900">Notificações</h1>
            <p className="text-sm sm:text-base text-slate-600">Envie lembretes para professores</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-sky-200 bg-sky-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Bell className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900">Notificações Automáticas</h3>
                <p className="text-sm text-slate-600 mt-1">
                  O sistema envia automaticamente lembretes por email aos professores 24 horas antes de suas aulas agendadas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="reminder" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reminder" data-testid="tab-reminder">
              <Calendar className="h-4 w-4 mr-2" />
              Lembrete de Aula
            </TabsTrigger>
            <TabsTrigger value="bulk" data-testid="tab-bulk">
              <Users className="h-4 w-4 mr-2" />
              Envio em Massa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reminder">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  Enviar Lembrete de Aula
                </CardTitle>
                <CardDescription>
                  Envie um lembrete por email para o professor de uma aula específica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Turma</Label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-4"
                    data-testid="select-class-notification"
                  >
                    {classes.map((cls) => (
                      <option key={cls.class_id} value={cls.class_id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Horário/Aula</Label>
                  <select
                    value={selectedSchedule}
                    onChange={(e) => setSelectedSchedule(e.target.value)}
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-4"
                    data-testid="select-schedule-notification"
                  >
                    <option value="">Selecione um horário</option>
                    {schedules.map((schedule) => (
                      <option key={schedule.schedule_id} value={schedule.schedule_id}>
                        {schedule.day_of_week} - {schedule.time} - {schedule.teacher_name} ({schedule.subject_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Mensagem Personalizada (opcional)</Label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Adicione uma mensagem personalizada ao lembrete..."
                    rows={3}
                    data-testid="custom-message-input"
                  />
                </div>

                <Button
                  onClick={handleSendReminder}
                  disabled={sending || !selectedSchedule}
                  className="w-full"
                  data-testid="send-reminder-btn"
                >
                  {sending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Lembrete
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  Envio em Massa
                </CardTitle>
                <CardDescription>
                  Envie um comunicado para todos os professores da sua instituição
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Destinatários</Label>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-4"
                    data-testid="select-recipient-type"
                  >
                    <option value="teachers">Todos os Professores</option>
                  </select>
                </div>

                <div>
                  <Label>Assunto</Label>
                  <Input
                    value={bulkSubject}
                    onChange={(e) => setBulkSubject(e.target.value)}
                    placeholder="Assunto do email..."
                    data-testid="bulk-subject-input"
                  />
                </div>

                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    rows={6}
                    data-testid="bulk-message-input"
                  />
                </div>

                <Button
                  onClick={handleSendBulk}
                  disabled={sending || !bulkSubject || !bulkMessage}
                  className="w-full"
                  data-testid="send-bulk-btn"
                >
                  {sending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar para Todos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NotificationsPage;

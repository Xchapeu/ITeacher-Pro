import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  BookOpen,
  ArrowLeft,
  TrendingUp,
  Users,
  Calendar,
  Download,
  FileText,
  Table
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const COLORS = ['#0EA5E9', '#EF4444', '#F59E0B', '#10B981'];

export const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [overviewData, setOverviewData] = useState(null);
  const [classAnalytics, setClassAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exporting, setExporting] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassAnalytics(selectedClass);
    }
  }, [selectedClass, startDate, endDate]);

  const fetchInitialData = async () => {
    try {
      const [classesRes, overviewRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/classes`, getAuthHeaders()),
        axios.get(`${BACKEND_URL}/api/analytics/overview`, getAuthHeaders())
      ]);

      setClasses(classesRes.data);
      setOverviewData(overviewRes.data);
      
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

  const fetchClassAnalytics = async (classId) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/analytics/attendance/${classId}?start_date=${startDate}&end_date=${endDate}`,
        getAuthHeaders()
      );
      setClassAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching class analytics:', error);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedClass) return;
    setExporting(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/export/attendance/${selectedClass}/pdf?start_date=${startDate}&end_date=${endDate}`,
        {
          ...getAuthHeaders(),
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_presenca_${selectedClass}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedClass) return;
    setExporting(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/export/attendance/${selectedClass}/csv?start_date=${startDate}&end_date=${endDate}`,
        {
          ...getAuthHeaders(),
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_presenca_${selectedClass}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exportado com sucesso!');
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Erro ao exportar CSV');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-slate-600">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  const pieData = classAnalytics ? [
    { name: 'Presentes', value: classAnalytics.summary.present },
    { name: 'Ausentes', value: classAnalytics.summary.absent },
    { name: 'Atrasados', value: classAnalytics.summary.late }
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">Analytics</h1>
              <p className="text-sm sm:text-base text-slate-600">Estatísticas de presença</p>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="border-slate-200" data-testid="overall-rate-card">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-slate-900 flex items-center gap-2 lg:gap-3 text-xs sm:text-sm lg:text-base">
                <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-primary flex-shrink-0" />
                <span className="truncate">Taxa Geral</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 lg:p-6 lg:pt-0">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
                {overviewData?.overall_attendance_rate || 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-slate-900 flex items-center gap-2 lg:gap-3 text-xs sm:text-sm lg:text-base">
                <Users className="h-4 w-4 lg:h-5 lg:w-5 text-primary flex-shrink-0" />
                <span className="truncate">Turmas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 lg:p-6 lg:pt-0">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">{classes.length}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-slate-900 flex items-center gap-2 lg:gap-3 text-xs sm:text-sm lg:text-base">
                <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-primary flex-shrink-0" />
                <span className="truncate">Registros</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 lg:p-6 lg:pt-0">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
                {overviewData?.total_records || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-slate-900 flex items-center gap-2 lg:gap-3 text-xs sm:text-sm lg:text-base">
                <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 text-primary flex-shrink-0" />
                <span className="truncate">Período</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 lg:p-6 lg:pt-0">
              <p className="text-sm lg:text-lg font-medium text-slate-600">30 dias</p>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        {overviewData?.trend && overviewData.trend.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Tendência de Presença (30 dias)</CardTitle>
              <CardDescription>Taxa de presença diária</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={overviewData.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
                    formatter={(value) => [`${value}%`, 'Taxa de Presença']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    name="Taxa de Presença (%)" 
                    stroke="#0EA5E9" 
                    strokeWidth={2}
                    dot={{ fill: '#0EA5E9' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Class-specific Analytics */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-900">Análise por Turma</CardTitle>
                <CardDescription>Selecione uma turma para ver detalhes</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportPDF}
                  disabled={exporting || !selectedClass}
                  data-testid="export-pdf-btn"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportCSV}
                  disabled={exporting || !selectedClass}
                  data-testid="export-csv-btn"
                >
                  <Table className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label className="text-sm">Turma</Label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm"
                  data-testid="select-class-analytics"
                >
                  {classes.map((cls) => (
                    <option key={cls.class_id} value={cls.class_id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm">Data Início</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm"
                  data-testid="start-date-input"
                />
              </div>
              <div>
                <Label className="text-sm">Data Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm"
                  data-testid="end-date-input"
                />
              </div>
            </div>

            {classAnalytics && (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList>
                  <TabsTrigger value="summary">Resumo</TabsTrigger>
                  <TabsTrigger value="students">Por Aluno</TabsTrigger>
                  <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Summary Stats */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="border-green-200 bg-green-50">
                          <CardContent className="pt-6">
                            <p className="text-sm text-green-600 font-medium">Presentes</p>
                            <p className="text-3xl font-bold text-green-700">
                              {classAnalytics.summary.present}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="border-red-200 bg-red-50">
                          <CardContent className="pt-6">
                            <p className="text-sm text-red-600 font-medium">Ausentes</p>
                            <p className="text-3xl font-bold text-red-700">
                              {classAnalytics.summary.absent}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="border-yellow-200 bg-yellow-50">
                          <CardContent className="pt-6">
                            <p className="text-sm text-yellow-600 font-medium">Atrasados</p>
                            <p className="text-3xl font-bold text-yellow-700">
                              {classAnalytics.summary.late}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="border-sky-200 bg-sky-50">
                          <CardContent className="pt-6">
                            <p className="text-sm text-sky-600 font-medium">Taxa Geral</p>
                            <p className="text-3xl font-bold text-sky-700">
                              {classAnalytics.summary.attendance_rate}%
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Pie Chart */}
                    <div>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="students">
                  <div className="space-y-4">
                    {classAnalytics.by_student.map((student) => (
                      <div 
                        key={student.student_id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                        data-testid={`student-analytics-${student.student_id}`}
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{student.name}</p>
                          <p className="text-sm text-slate-600">
                            {student.present} presenças | {student.absent} faltas | {student.late} atrasos
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${student.attendance_rate}%` }}
                            />
                          </div>
                          <span className={`font-bold ${
                            student.attendance_rate >= 75 ? 'text-green-600' : 
                            student.attendance_rate >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {student.attendance_rate}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="timeline">
                  {classAnalytics.by_date.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={classAnalytics.by_date}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
                        />
                        <Legend />
                        <Bar dataKey="present" name="Presentes" fill="#10B981" stackId="a" />
                        <Bar dataKey="late" name="Atrasados" fill="#F59E0B" stackId="a" />
                        <Bar dataKey="absent" name="Ausentes" fill="#EF4444" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-slate-600 py-8">
                      Nenhum dado disponível para o período selecionado
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { BookOpen, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const SelectUserType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userType, setUserType] = useState('teacher');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/auth/user-type`,
        { user_type: userType },
        {
          withCredentials: true,
          headers: {
            Authorization: localStorage.getItem('token')
              ? `Bearer ${localStorage.getItem('token')}`
              : undefined
          }
        }
      );

      toast.success('Tipo de conta definido com sucesso!');
      
      // Store updated user in localStorage
      localStorage.setItem('user', JSON.stringify(response.data));

      if (response.data.user_type === 'institution') {
        navigate('/institution', { replace: true });
      } else {
        navigate('/teacher', { replace: true });
      }
    } catch (error) {
      console.error('Error updating user type:', error);
      toast.error('Erro ao definir tipo de conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-3xl font-heading font-bold text-slate-900">ITeacher</span>
        </div>

        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-heading font-bold text-slate-900">Bem-vindo!</h1>
            <p className="text-slate-600">Selecione o tipo da sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <RadioGroup
              value={userType}
              onValueChange={setUserType}
              className="space-y-3"
            >
              <div 
                className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                  userType === 'teacher' 
                    ? 'border-primary bg-sky-50' 
                    : 'border-slate-200 bg-slate-50 hover:border-primary/50'
                }`}
                data-testid="select-teacher-type"
                onClick={() => setUserType('teacher')}
              >
                <RadioGroupItem value="teacher" id="teacher" />
                <Label htmlFor="teacher" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    userType === 'teacher' ? 'bg-primary' : 'bg-slate-200'
                  }`}>
                    <User className={`h-5 w-5 ${userType === 'teacher' ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Professor</p>
                    <p className="text-sm text-slate-600">Acesse turmas, materiais e calendário</p>
                  </div>
                </Label>
              </div>

              <div 
                className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                  userType === 'institution' 
                    ? 'border-primary bg-sky-50' 
                    : 'border-slate-200 bg-slate-50 hover:border-primary/50'
                }`}
                data-testid="select-institution-type"
                onClick={() => setUserType('institution')}
              >
                <RadioGroupItem value="institution" id="institution" />
                <Label htmlFor="institution" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    userType === 'institution' ? 'bg-primary' : 'bg-slate-200'
                  }`}>
                    <Building2 className={`h-5 w-5 ${userType === 'institution' ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Instituição de Ensino</p>
                    <p className="text-sm text-slate-600">Gerencie turmas, professores e alunos</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full py-6 font-semibold text-base transition-transform active:scale-95"
              data-testid="confirm-user-type-btn"
            >
              {loading ? 'Salvando...' : 'Continuar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SelectUserType;

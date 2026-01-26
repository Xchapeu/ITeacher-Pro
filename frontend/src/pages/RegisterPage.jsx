import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { BookOpen, Mail, Lock, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    user_type: 'teacher'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, formData);
      localStorage.setItem('token', response.data.token);
      toast.success('Conta criada com sucesso!');

      if (response.data.user.user_type === 'institution') {
        navigate('/institution', { state: { user: response.data.user } });
      } else {
        navigate('/teacher', { state: { user: response.data.user } });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-3xl font-heading font-bold text-slate-900">ITeacher</span>
        </Link>

        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-heading font-bold text-slate-900">Criar Conta</h1>
            <p className="text-slate-600">Preencha os dados para começar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-medium">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="name"
                  data-testid="register-name-input"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-50 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg h-12 pl-10 text-base transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  data-testid="register-email-input"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-50 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg h-12 pl-10 text-base transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  data-testid="register-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-slate-50 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-lg h-12 pl-10 text-base transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-slate-700 font-medium">Tipo de Usuário</Label>
              <RadioGroup
                value={formData.user_type}
                onValueChange={(value) => setFormData({ ...formData, user_type: value })}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors" data-testid="user-type-teacher">
                  <RadioGroupItem value="teacher" id="teacher" />
                  <Label htmlFor="teacher" className="flex items-center gap-3 cursor-pointer flex-1">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-slate-900">Professor</p>
                      <p className="text-sm text-slate-600">Acesso a turmas e materiais</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors" data-testid="user-type-institution">
                  <RadioGroupItem value="institution" id="institution" />
                  <Label htmlFor="institution" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-slate-900">Instituição de Ensino</p>
                      <p className="text-sm text-slate-600">Gerencie turmas e professores</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full py-6 font-semibold text-base transition-transform active:scale-95"
              data-testid="register-submit-btn"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-600">ou</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full py-6 font-medium text-base flex items-center justify-center gap-3"
            data-testid="google-auth-btn"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar com Google
          </Button>

          <p className="text-center text-sm text-slate-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

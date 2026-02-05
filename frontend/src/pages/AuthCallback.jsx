import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = window.location.hash;
        const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');

        if (!sessionId) {
          toast.error('Sessão inválida');
          navigate('/login');
          return;
        }

        const response = await axios.post(
          `${BACKEND_URL}/api/auth/session`,
          {},
          {
            headers: { 'X-Session-ID': sessionId },
            withCredentials: true
          }
        );

        const { user, session_token, needs_user_type } = response.data;

        document.cookie = `session_token=${session_token}; path=/; secure; samesite=none; max-age=${7 * 24 * 60 * 60}`;
        localStorage.setItem('token', session_token);
        localStorage.setItem('user', JSON.stringify(user));

        toast.success(`Bem-vindo, ${user.name}!`);

        // If new user via Google OAuth, redirect to select user type
        if (needs_user_type || !user.user_type) {
          navigate('/select-user-type', { replace: true });
          return;
        }

        if (user.user_type === 'institution') {
          navigate('/institution', { replace: true, state: { user } });
        } else {
          navigate('/teacher', { replace: true, state: { user } });
        }
      } catch (error) {
        console.error('Session processing failed:', error);
        toast.error('Falha na autenticação');
        navigate('/login');
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-slate-600">Processando autenticação...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

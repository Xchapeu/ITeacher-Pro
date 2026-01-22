import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Users, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="px-6 md:px-12 lg:px-24 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <BookOpen className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-heading font-bold text-slate-900">EduFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-primary hover:bg-sky-50 rounded-lg" data-testid="header-login-btn">
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full px-8 py-6 font-semibold tracking-wide transition-transform active:scale-95" data-testid="header-register-btn">
                Cadastrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 md:px-12 lg:px-24 py-24 bg-gradient-to-br from-sky-50 to-white">
        <div className="grid grid-cols-12 gap-12 items-center">
          <div className="col-span-12 md:col-span-7 space-y-8">
            <div className="inline-block">
              <span className="text-sm font-medium tracking-wide uppercase text-primary bg-sky-100 px-4 py-2 rounded-full">
                Plataforma Educacional
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-bold text-slate-900 tracking-tight leading-none">
              Gerencie aulas e
              <span className="text-primary"> conecte professores</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              Plataforma completa para instituições de ensino gerenciarem turmas, professores e alunos. Professores acessam materiais, calendário e lista de presença em um só lugar.
            </p>
            <div className="flex gap-4">
              <Link to="/register">
                <Button className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full px-8 py-6 font-semibold tracking-wide transition-transform active:scale-95 text-base" data-testid="hero-register-btn">
                  Começar Agora
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full px-8 py-6 font-medium text-base" data-testid="hero-login-btn">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </div>
          <div className="col-span-12 md:col-span-5">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1586144131462-fa2a2b6d070c?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="Sala de aula moderna"
                className="rounded-2xl shadow-2xl border border-slate-200 w-full h-auto transition-transform hover:-translate-y-1 duration-300"
              />
              <div className="absolute -bottom-6 -left-6 bg-white border border-slate-100 rounded-xl p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-sky-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">500+</p>
                    <p className="text-sm text-slate-600">Professores ativos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 md:px-12 lg:px-24 py-24">
        <div className="text-center mb-16">
          <span className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Funcionalidades</span>
          <h2 className="text-3xl md:text-4xl font-heading font-semibold text-slate-900 mt-4 tracking-tight">
            Tudo que você precisa em um lugar
          </h2>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-4 group relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-8 hover:border-primary/20 transition-all duration-200 hover:shadow-md" data-testid="feature-classes">
            <div className="h-14 w-14 bg-sky-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="h-7 w-7 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-slate-900 mb-3">Gestão de Turmas</h3>
            <p className="text-base text-slate-600 leading-relaxed">
              Crie e organize turmas, adicione professores e alunos, defina horários de aula com facilidade.
            </p>
          </div>

          <div className="col-span-12 md:col-span-4 group relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-8 hover:border-primary/20 transition-all duration-200 hover:shadow-md" data-testid="feature-calendar">
            <div className="h-14 w-14 bg-sky-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Calendar className="h-7 w-7 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-slate-900 mb-3">Calendário Integrado</h3>
            <p className="text-base text-slate-600 leading-relaxed">
              Visualize horários de aulas, compromissos e eventos em um calendário intuitivo e organizado.
            </p>
          </div>

          <div className="col-span-12 md:col-span-4 group relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-8 hover:border-primary/20 transition-all duration-200 hover:shadow-md" data-testid="feature-attendance">
            <div className="h-14 w-14 bg-sky-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-7 w-7 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-slate-900 mb-3">Lista de Presença</h3>
            <p className="text-base text-slate-600 leading-relaxed">
              Professores marcam presença rapidamente. Gere relatórios de frequência instantâneos.
            </p>
          </div>

          <div className="col-span-12 md:col-span-6 group relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-8 hover:border-primary/20 transition-all duration-200 hover:shadow-md" data-testid="feature-materials">
            <div className="h-14 w-14 bg-sky-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="h-7 w-7 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-slate-900 mb-3">Materiais de Aula</h3>
            <p className="text-base text-slate-600 leading-relaxed">
              Faça upload de PDFs, apresentações e documentos. Professores acessam materiais organizados por turma.
            </p>
          </div>

          <div className="col-span-12 md:col-span-6 group relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-8 hover:border-primary/20 transition-all duration-200 hover:shadow-md" data-testid="feature-messages">
            <div className="h-14 w-14 bg-sky-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-7 w-7 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-slate-900 mb-3">Sistema de Mensagens</h3>
            <p className="text-base text-slate-600 leading-relaxed">
              Comunicação direta entre instituições e professores. Notificações de novas mensagens em tempo real.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-12 lg:px-24 py-24 bg-gradient-to-br from-primary to-sky-600">
        <div className="text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight">
            Pronto para começar?
          </h2>
          <p className="text-xl text-sky-100 max-w-2xl mx-auto">
            Cadastre sua instituição ou entre como professor em minutos.
          </p>
          <Link to="/register">
            <Button className="bg-white text-primary hover:bg-sky-50 shadow-2xl rounded-full px-12 py-7 font-semibold text-lg tracking-wide transition-transform active:scale-95" data-testid="cta-register-btn">
              Criar Conta Gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 lg:px-24 py-12 border-t border-slate-100">
        <div className="text-center text-slate-600">
          <p>© 2025 EduFlow. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

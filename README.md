# ITeacher - Sistema de Gestão Educacional

ITeacher é uma plataforma completa para instituições de ensino gerenciarem turmas, professores e alunos. Professores têm acesso a materiais, calendário e lista de presença em um só lugar.

## 🚀 Tecnologias

### Backend
- **Node.js** com Express.js
- **MongoDB** com Mongoose
- **JWT** para autenticação
- **bcryptjs** para criptografia de senhas
- **Resend** para envio de emails
- **node-cron** para tarefas agendadas
- **PDFKit** para geração de PDFs
- **json2csv** para exportação CSV

### Frontend
- **React 19** com Vite
- **Tailwind CSS** para estilização
- **Shadcn/UI** para componentes
- **React Router** para navegação
- **Axios** para requisições HTTP
- **Recharts** para gráficos e analytics
- **date-fns** para manipulação de datas

## 📋 Requisitos

- Node.js 18+ 
- MongoDB 6+
- Yarn ou npm

## ⚙️ Configuração do Ambiente

### Backend (.env)

Crie o arquivo `/app/backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=iteacher_db
JWT_SECRET=sua_chave_secreta_aqui
CORS_ORIGINS=*
RESEND_API_KEY=re_xxxxx
SENDER_EMAIL=onboarding@resend.dev
```

### Frontend (.env)

Crie o arquivo `/app/frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:8001
```

## 🛠️ Instalação

### Backend

```bash
cd backend
npm install
npm start
```

O servidor iniciará na porta `8001`.

### Frontend

```bash
cd frontend
yarn install
yarn dev
```

O frontend iniciará na porta `3000`.

## 📁 Estrutura do Projeto

```
/app/
├── backend/
│   ├── models.js       # Modelos Mongoose
│   ├── server.js       # Servidor Express + Cron jobs
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── pages/      # Páginas da aplicação
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── InstitutionDashboard.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── ClassDetails.jsx
│   │   │   ├── AnalyticsDashboard.jsx  # Dashboard de estatísticas
│   │   │   ├── NotificationsPage.jsx    # Notificações por email
│   │   │   ├── SelectUserType.jsx       # Seleção de tipo (Google OAuth)
│   │   │   └── AuthCallback.jsx
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── vite.config.js
│   ├── package.json
│   └── .env
└── uploads/
```

## 🔐 Autenticação

A aplicação suporta dois métodos de autenticação:

1. **JWT (Email/Senha)**: Login tradicional com email e senha
2. **Google OAuth**: Login social via Google (Emergent Auth)
   - Novos usuários são redirecionados para selecionar o tipo de conta

## 👤 Tipos de Usuário

### Instituição de Ensino
- Criar e gerenciar turmas
- Cadastrar e gerenciar matérias
- Atribuir professores às turmas/matérias
- Cadastrar alunos
- Criar horários de aula com recorrência
- Enviar mensagens para professores
- **Dashboard de Analytics** com gráficos de frequência
- **Enviar notificações por email** para professores
- **Exportar relatórios** de presença em PDF e CSV

### Professor
- Visualizar turmas atribuídas
- Acessar materiais de aula
- Fazer upload de novos materiais
- Marcar presença dos alunos
- Visualizar calendário de aulas
- Receber mensagens da instituição
- **Visualizar Analytics** das suas turmas
- Receber **notificações automáticas** 24h antes das aulas

## 📊 Analytics e Relatórios

### Dashboard de Analytics
- Taxa de presença geral e por turma
- Gráfico de tendência dos últimos 30 dias
- Estatísticas por aluno
- Gráfico de presença/ausência/atraso

### Exportação de Relatórios
- **PDF**: Relatório completo com resumo e detalhes por aluno
- **CSV/Excel**: Dados estruturados para análise externa

## 📧 Sistema de Notificações

### Notificações Manuais
- Enviar lembretes para professores sobre aulas específicas
- Envio em massa para todos os professores

### Notificações Automáticas
- O sistema envia automaticamente lembretes por email 24 horas antes de cada aula agendada
- Executado diariamente às 18:00

## 📚 API Endpoints

### Autenticação
```
POST /api/auth/register   - Criar conta
POST /api/auth/login      - Login
POST /api/auth/session    - Google OAuth callback
GET  /api/auth/me         - Dados do usuário logado
PUT  /api/auth/user-type  - Atualizar tipo de usuário
POST /api/auth/logout     - Logout
```

### Turmas
```
GET    /api/classes            - Listar turmas
POST   /api/classes            - Criar turma
GET    /api/classes/:id        - Detalhes da turma
DELETE /api/classes/:id        - Excluir turma
GET    /api/classes/:id/teachers - Professores da turma
```

### Matérias
```
GET    /api/subjects     - Listar matérias
POST   /api/subjects     - Criar matéria
DELETE /api/subjects/:id - Excluir matéria
```

### Professores
```
GET  /api/teachers            - Listar professores
POST /api/teacher-assignments - Atribuir professor
```

### Alunos
```
GET    /api/students/class/:classId - Alunos da turma
POST   /api/students                - Adicionar aluno
DELETE /api/students/:id            - Remover aluno
```

### Horários
```
GET    /api/schedules/class/:classId - Horários da turma
POST   /api/schedules                - Criar horário
DELETE /api/schedules/:id            - Excluir horário
```

### Presença
```
GET  /api/attendance/class/:classId - Presença da turma
POST /api/attendance                - Marcar presença
```

### Materiais
```
GET  /api/materials/class/:classId - Materiais da turma
POST /api/materials                - Criar material
POST /api/upload                   - Upload de arquivo
```

### Mensagens
```
GET  /api/messages          - Listar mensagens
POST /api/messages          - Enviar mensagem
PUT  /api/messages/:id/read - Marcar como lida
```

### Analytics
```
GET /api/analytics/overview           - Visão geral de presença
GET /api/analytics/attendance/:classId - Analytics por turma
```

### Exportação
```
GET /api/export/attendance/:classId/pdf - Exportar PDF
GET /api/export/attendance/:classId/csv - Exportar CSV
```

### Notificações
```
POST /api/notifications/send-reminder - Enviar lembrete individual
POST /api/notifications/send-bulk     - Envio em massa
GET  /api/notifications/settings      - Configurações
```

## 🗓️ Sistema de Recorrência

O sistema de horários suporta várias opções de recorrência:

| Tipo | Descrição |
|------|-----------|
| `once` | Aula única na data selecionada |
| `weekly` | Repetir por 7 dias (semana corrente) |
| `monthly` | Repetir até o fim do mês corrente |
| `semester_1` | Janeiro a Junho |
| `semester_2` | Julho a Dezembro |
| `annual` | Ano inteiro |

## 🧪 Contas de Teste

Para testar a aplicação, você pode usar:

**Instituição:**
- Email: `test@institution.com`
- Senha: `test123456`

**Professor:**
- Email: `teacher@test.com`
- Senha: `test123456`

## 🔧 Scripts Disponíveis

### Backend
```bash
npm start    # Inicia o servidor
npm run dev  # Inicia com nodemon (hot reload)
```

### Frontend
```bash
yarn dev     # Inicia em modo desenvolvimento
yarn build   # Gera build de produção
yarn preview # Visualiza build de produção
```

## 🔔 Configuração do Resend (Email)

1. Crie uma conta em https://resend.com
2. Obtenha sua API Key
3. Configure no arquivo `.env` do backend:
   ```
   RESEND_API_KEY=re_xxxxx
   SENDER_EMAIL=onboarding@resend.dev
   ```
4. **Nota:** No modo de teste, emails só são enviados para endereços verificados

## 📝 Licença

Este projeto foi desenvolvido para fins educacionais.

---

Desenvolvido com ❤️ usando Node.js, React e MongoDB

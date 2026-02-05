# ITeacher - Product Requirements Document (PRD)

## Problema Original
Construir um website para instituições de ensino que permite gerenciar planos de aula, turmas e listas de alunos. Professores têm uma página dedicada com turmas atribuídas, materiais de aula, calendário com horários e lista de presença.

## Requisitos do Produto
- Formulário de registro com tipo de usuário: "Instituição de Ensino" ou "Professor"
- Autenticação via JWT (email/senha) e Google OAuth
- Instituições podem criar/gerenciar turmas, alunos, matérias e atribuir professores
- Professores podem ver turmas atribuídas, fazer upload de materiais e ver calendário
- Sistema de horários com recorrência (semanal, mensal, semestral, anual)
- Nome da aplicação: "ITeacher"
- Sem badges "Made with Emergent" visíveis

## Stack Tecnológico
- **Backend:** Node.js + Express.js + Mongoose + MongoDB
- **Frontend:** React 19 + Vite + Tailwind CSS + Shadcn/UI + Recharts
- **Autenticação:** JWT + Emergent Google OAuth
- **Email:** Resend
- **PDF/CSV:** PDFKit + json2csv

---

## O que foi implementado

### Funcionalidades Completas ✅

| Feature | Status | Data |
|---------|--------|------|
| Landing Page | ✅ Completo | Jan 2026 |
| Registro de usuários (Institution/Teacher) | ✅ Completo | Jan 2026 |
| Login JWT (email/senha) | ✅ Completo | Jan 2026 |
| Login Google OAuth | ✅ Completo | Jan 2026 |
| **Seleção de tipo usuário (Google OAuth)** | ✅ Completo | Fev 2026 |
| Dashboard Instituição | ✅ Completo | Jan 2026 |
| Dashboard Professor | ✅ Completo | Jan 2026 |
| CRUD de Turmas | ✅ Completo | Jan 2026 |
| CRUD de Matérias | ✅ Completo | Jan 2026 |
| CRUD de Alunos | ✅ Completo | Jan 2026 |
| Atribuição Professor/Matéria/Turma | ✅ Completo | Jan 2026 |
| Sistema de Horários com Recorrência | ✅ Completo | Jan 2026 |
| Sistema de Presença | ✅ Completo | Jan 2026 |
| Upload de Materiais | ✅ Completo | Jan 2026 |
| Sistema de Mensagens | ✅ Completo | Jan 2026 |
| Migração para Node.js/Vite | ✅ Completo | Fev 2026 |
| **Dashboard de Analytics** | ✅ Completo | Fev 2026 |
| **Notificações por Email (Resend)** | ✅ Completo | Fev 2026 |
| **Notificações Automáticas (Cron)** | ✅ Completo | Fev 2026 |
| **Exportar Relatórios PDF** | ✅ Completo | Fev 2026 |
| **Exportar Relatórios CSV/Excel** | ✅ Completo | Fev 2026 |
| README.md documentação | ✅ Completo | Fev 2026 |

### Novas Funcionalidades Adicionadas (Fev 2026)

#### 1. Dashboard de Analytics
- Taxa de presença geral e por turma
- Gráfico de tendência (últimos 30 dias)
- Estatísticas detalhadas por aluno
- Gráficos interativos (Recharts)
- Filtros por período

#### 2. Sistema de Notificações por Email
- Lembretes manuais para professores
- Envio em massa para todos os professores
- **Notificações automáticas** 24h antes das aulas (cron job às 18h)
- Templates de email profissionais
- Integração com Resend API

#### 3. Exportação de Relatórios
- **PDF:** Relatório completo com resumo e detalhes por aluno
- **CSV/Excel:** Dados estruturados com BOM UTF-8 para Excel
- Filtros por período

#### 4. Seleção de Tipo de Usuário (Google OAuth)
- Novos usuários via Google são redirecionados para escolher tipo
- Opções: Professor ou Instituição de Ensino
- Interface amigável com ícones

---

## Arquitetura de Código

```
/app/
├── backend/
│   ├── models.js       # Mongoose schemas
│   ├── server.js       # Express server + cron jobs + all routes
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Shadcn components
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── InstitutionDashboard.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── ClassDetails.jsx
│   │   │   ├── AuthCallback.jsx
│   │   │   ├── SelectUserType.jsx      # NEW
│   │   │   ├── AnalyticsDashboard.jsx  # NEW
│   │   │   └── NotificationsPage.jsx   # NEW
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── vite.config.js
│   └── .env
└── uploads/
```

---

## Modelos de Dados (MongoDB)

### User
```javascript
{
  user_id: String,
  email: String,
  password_hash: String,
  name: String,
  user_type: 'institution' | 'teacher' | null, // null para OAuth sem tipo definido
  google_id: String,
  picture: String
}
```

### Class, Subject, Schedule, Student, Attendance, Material, Message
(Ver documentação completa no README.md)

---

## APIs Principais

### Novos Endpoints (Fev 2026)

```
PUT  /api/auth/user-type              - Atualizar tipo de usuário
GET  /api/analytics/overview          - Visão geral de presença
GET  /api/analytics/attendance/:id    - Analytics por turma
GET  /api/export/attendance/:id/pdf   - Exportar PDF
GET  /api/export/attendance/:id/csv   - Exportar CSV
POST /api/notifications/send-reminder - Enviar lembrete
POST /api/notifications/send-bulk     - Envio em massa
```

---

## Integrações de Terceiros

| Serviço | Propósito | Status |
|---------|-----------|--------|
| Emergent Google Auth | Login social | ✅ Funcionando |
| Resend | Envio de emails | ✅ Funcionando (modo teste) |

**Nota:** Resend em modo teste só envia para emails verificados.

---

## Testes

### Backend: 100% (30/30 testes)
### Frontend: 100% (todos os testes UI passaram)

Arquivos de teste: `/app/backend/tests/test_iteacher_api.py`

---

## Credenciais de Teste

**Instituição:**
- Email: test@institution.com
- Senha: test123456

**Professor:**
- Email: teacher@test.com
- Senha: test123456

---

## Tarefas Futuras/Backlog

### P3 - Nice to have
- [ ] Integração com calendário Google
- [ ] App mobile (React Native)
- [ ] Dashboard de analytics mais avançado com IA

---

## URLs

- **Frontend:** https://schoolmate-108.preview.emergentagent.com
- **API Base:** https://schoolmate-108.preview.emergentagent.com/api

---

*Última atualização: Fevereiro 2026*

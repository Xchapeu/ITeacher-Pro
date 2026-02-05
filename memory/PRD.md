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
- **Frontend:** React 19 + Vite + Tailwind CSS + Shadcn/UI
- **Autenticação:** JWT + Emergent Google OAuth

---

## O que foi implementado

### Funcionalidades Completas
| Feature | Status | Data |
|---------|--------|------|
| Landing Page | ✅ Completo | Jan 2026 |
| Registro de usuários (Institution/Teacher) | ✅ Completo | Jan 2026 |
| Login JWT (email/senha) | ✅ Completo | Jan 2026 |
| Login Google OAuth | ✅ Completo | Jan 2026 |
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
| README.md documentação | ✅ Completo | Fev 2026 |

### Migrações Realizadas (Fev 2026)
- Backend: Python/FastAPI → Node.js/Express
- Frontend: Create React App → Vite
- Variáveis de ambiente: process.env.REACT_APP_* → import.meta.env.VITE_*
- Remoção de badges "Made with Emergent"

---

## Arquitetura de Código

```
/app/
├── backend/
│   ├── models.js       # Mongoose schemas
│   ├── server.js       # Express server + all routes
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
│   │   │   └── AuthCallback.jsx
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
  user_type: 'institution' | 'teacher',
  google_id: String,
  picture: String
}
```

### Class
```javascript
{
  class_id: String,
  name: String,
  description: String,
  institution_id: String
}
```

### Subject
```javascript
{
  subject_id: String,
  name: String,
  description: String,
  institution_id: String
}
```

### Schedule
```javascript
{
  schedule_id: String,
  class_id: String,
  teacher_id: String,
  subject_id: String,
  day_of_week: String,
  time: String,
  duration: Number,
  recurrence_type: String,
  start_date: String,
  end_date: String
}
```

---

## Issues Conhecidas

### P2 - Seleção de tipo de usuário no Google OAuth
- **Status:** Pendente
- **Descrição:** Usuários que fazem login via Google são automaticamente definidos como "teacher"
- **Solução:** Implementar tela/modal para escolher tipo de usuário após primeiro login Google

---

## Tarefas Futuras (Backlog)

### P1 - Próximas
- [ ] Implementar seleção de tipo de usuário no Google OAuth

### P2 - Melhorias
- [ ] Dashboard com analytics e gráficos de frequência
- [ ] Notificações automáticas antes das aulas

### P3 - Nice to have
- [ ] Exportar relatórios de presença em PDF/Excel
- [ ] Integração com calendário Google
- [ ] App mobile (React Native)

---

## Credenciais de Teste

**Instituição:**
- Email: test@institution.com
- Senha: test123456

**Professor:**
- Email: teacher@test.com
- Senha: test123456

---

## URLs e Endpoints

- **Frontend:** https://schoolmate-108.preview.emergentagent.com
- **API Base:** https://schoolmate-108.preview.emergentagent.com/api

---

*Última atualização: Fevereiro 2026*

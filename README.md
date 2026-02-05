# ITeacher - Sistema de Gestão Educacional

ITeacher é uma plataforma completa para instituições de ensino gerenciarem turmas, professores e alunos. Professores têm acesso a materiais, calendário e lista de presença em um só lugar.

## 🚀 Tecnologias

### Backend
- **Node.js** com Express.js
- **MongoDB** com Mongoose
- **JWT** para autenticação
- **bcryptjs** para criptografia de senhas

### Frontend
- **React 19** com Vite
- **Tailwind CSS** para estilização
- **Shadcn/UI** para componentes
- **React Router** para navegação
- **Axios** para requisições HTTP

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
│   ├── server.js       # Servidor Express
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── pages/      # Páginas da aplicação
│   │   ├── App.jsx     # Componente principal
│   │   └── index.jsx   # Entry point
│   ├── vite.config.js  # Configuração Vite
│   ├── package.json
│   └── .env
└── uploads/            # Arquivos enviados
```

## 🔐 Autenticação

A aplicação suporta dois métodos de autenticação:

1. **JWT (Email/Senha)**: Login tradicional com email e senha
2. **Google OAuth**: Login social via Google (Emergent Auth)

## 👤 Tipos de Usuário

### Instituição de Ensino
- Criar e gerenciar turmas
- Cadastrar e gerenciar matérias
- Atribuir professores às turmas/matérias
- Cadastrar alunos
- Criar horários de aula com recorrência
- Enviar mensagens para professores

### Professor
- Visualizar turmas atribuídas
- Acessar materiais de aula
- Fazer upload de novos materiais
- Marcar presença dos alunos
- Visualizar calendário de aulas
- Receber mensagens da instituição

## 📚 API Endpoints

### Autenticação
```
POST /api/auth/register  - Criar conta
POST /api/auth/login     - Login
POST /api/auth/session   - Google OAuth callback
GET  /api/auth/me        - Dados do usuário logado
POST /api/auth/logout    - Logout
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

## 📝 Licença

Este projeto foi desenvolvido para fins educacionais.

---

Desenvolvido com ❤️ usando Node.js, React e MongoDB

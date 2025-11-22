# ContextCore - Guia de Desenvolvimento

## 🚀 Como Iniciar o Sistema

### Método Simples (Recomendado)
Abra um terminal na raiz do projeto e execute:

```bash
npm run dev
```

Este comando inicia **automaticamente**:
- ✅ Backend (porta 3001)
- ✅ Frontend (porta 3000)

### Métodos Alternativos

#### Iniciar apenas o Backend
```bash
npm run dev:backend
```

#### Iniciar apenas o Frontend
```bash
npm run dev:frontend
```

## 📦 Instalação Inicial

Se for a primeira vez rodando o projeto, instale todas as dependências:

```bash
npm run install:all
```

Ou manualmente:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## 🌐 URLs de Acesso

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

## 🛠️ Estrutura de Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia backend + frontend simultaneamente |
| `npm run dev:backend` | Inicia apenas o backend |
| `npm run dev:frontend` | Inicia apenas o frontend |
| `npm run install:all` | Instala dependências em todos os workspaces |

## ⚙️ Ferramentas Utilizadas

- **concurrently:** Permite rodar múltiplos processos npm em paralelo
- **Backend:** Node.js com Express + Nodemon (auto-reload)
- **Frontend:** Next.js com hot-reload

---

**Dica:** Com `npm run dev`, você verá os logs de ambos os servidores no mesmo terminal, cada um com sua própria cor para facilitar a identificação.

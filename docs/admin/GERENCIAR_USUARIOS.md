# 👥 Gerenciar Usuários - Guia Completo

## 📋 Funcionalidades

A página de Gerenciamento de Usuários permite que administradores:

- ✅ **Visualizar** todos os usuários do sistema
- ✅ **Buscar** usuários por email
- ✅ **Filtrar** por função (admin/user)
- ✅ **Editar** role de usuários (tornar admin/user)
- ✅ **Deletar** usuários
- ✅ **Ver estatísticas** (total, admins, usuários)
- ✅ **Criar** novos usuários

## 🚀 Como Usar

### Acessar a Página

1. Faça login como administrador
2. Vá para o Dashboard
3. Clique em **"Gerenciar Usuários"** ou acesse `/admin/users`

### Buscar Usuários

- Digite o email no campo de busca
- Os resultados são filtrados em tempo real

### Filtrar por Função

- Selecione no dropdown:
  - **Todos**: Mostra todos os usuários
  - **Administradores**: Apenas admins
  - **Usuários**: Apenas usuários comuns

### Editar Role

1. Clique em **"Editar"** na linha do usuário
2. Selecione a nova função (Administrador ou Usuário)
3. Clique fora do campo ou pressione Enter
4. A alteração é salva automaticamente

**⚠️ Nota**: Você não pode editar seu próprio role.

### Deletar Usuário

1. Clique em **"Deletar"** na linha do usuário
2. Confirme a ação no diálogo
3. O usuário será removido permanentemente

**⚠️ Nota**: Você não pode deletar sua própria conta.

## 📊 Estatísticas

A página mostra três cards com estatísticas:

- **Total de Usuários**: Número total de usuários cadastrados
- **Administradores**: Quantidade de admins
- **Usuários**: Quantidade de usuários comuns

## 🔒 Segurança

### Políticas RLS

Para que as funcionalidades funcionem corretamente, execute este SQL no Supabase:

```sql
-- Permitir que admins atualizem roles
CREATE POLICY "Admins can update all profiles" 
  ON public.user_profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Arquivo**: `scripts/sql/004_admin_update_roles.sql`

### Service Role Key

A deleção de usuários requer `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

## 🛠️ API Routes

### Atualizar Role

```typescript
PATCH /api/admin/users/[user_id]
Body: { role: "admin" | "user" }
```

### Deletar Usuário

```typescript
DELETE /api/admin/users/[user_id]
```

## ⚠️ Limitações

1. **Auto-edição**: Você não pode editar ou deletar sua própria conta
2. **Último Admin**: Cuidado ao remover o último admin do sistema
3. **Deleção Permanente**: Usuários deletados não podem ser recuperados

## 🐛 Troubleshooting

### Erro: "Não é possível atualizar role"

**Solução**: Execute o script SQL `004_admin_update_roles.sql` no Supabase.

### Erro: "Erro ao deletar usuário"

**Solução**: Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada no `.env.local`.

### Usuários não aparecem

**Solução**: 
1. Verifique se você está logado como admin
2. Recarregue a página
3. Verifique o console do navegador para erros

## 📝 Notas

- Todas as ações são registradas no console
- Mensagens de sucesso/erro aparecem no topo da página
- A lista é atualizada automaticamente após edições/deleções

---

**Status**: ✅ Funcional e pronto para uso!


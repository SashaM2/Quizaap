# 🗑️ Corrigir Problema ao Deletar Usuário

## ❌ Problema

Ao tentar deletar um usuário na página "Gerenciar Usuários", a ação não funciona ou retorna erro.

## ✅ Soluções Implementadas

### 1. **Melhor Tratamento de Erros**

O sistema agora mostra mensagens de erro mais claras:
- ✅ Verifica se o usuário existe antes de deletar
- ✅ Mostra mensagens de erro detalhadas
- ✅ Indica quando está deletando (botão "Deletando...")
- ✅ Previne deleção da própria conta

### 2. **Verificações de Segurança**

- ✅ Não permite deletar sua própria conta
- ✅ Verifica se o usuário existe antes de deletar
- ✅ Usa Service Role Key para permissões administrativas

## 🔍 Verificar Problemas

### Erro: "Configuração do Supabase incompleta"

**Causa**: `SUPABASE_SERVICE_ROLE_KEY` não está configurada

**Solução**:
1. Adicione `SUPABASE_SERVICE_ROLE_KEY` ao `.env.local`
2. Reinicie o servidor (`pnpm dev`)

### Erro: "Usuário não encontrado"

**Causa**: O usuário já foi deletado ou não existe

**Solução**: Recarregue a página para atualizar a lista

### Erro: "Você não pode deletar sua própria conta"

**Causa**: Tentando deletar a si mesmo

**Solução**: Isso é uma proteção de segurança. Peça a outro admin para deletar sua conta se necessário.

### Erro: "Erro ao deletar usuário"

**Possíveis causas**:
1. Service Role Key sem permissões
2. Problemas de conexão com Supabase
3. Usuário tem dependências (quizzes, sessões, etc.)

**Solução**:
1. Verifique o console do navegador (F12) para mais detalhes
2. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está correta
3. Execute: `pnpm run verify:service-key`

## 🧪 Testar Deleção

### Passo a Passo:

1. **Acesse a página de Gerenciar Usuários**:
   - Faça login como admin
   - Vá em "Gerenciar Usuários"

2. **Tente deletar um usuário**:
   - Clique em "Deletar" na linha do usuário
   - Confirme a ação
   - O botão deve mostrar "Deletando..." durante o processo

3. **Verifique o resultado**:
   - Se sucesso: Mensagem verde "Usuário deletado com sucesso!"
   - Se erro: Mensagem vermelha com detalhes do erro

## 🔧 Debug

### Verificar Logs

1. **Console do Navegador** (F12):
   - Abra o Console
   - Tente deletar um usuário
   - Veja os erros detalhados

2. **Logs do Servidor**:
   - Veja o terminal onde `pnpm dev` está rodando
   - Procure por mensagens de erro

### Verificar Service Role Key

Execute:
```bash
pnpm run verify:service-key
```

Isso verifica se a chave está configurada corretamente e tem permissões.

## 📝 Notas Importantes

### O que acontece ao deletar:

1. ✅ Usuário é removido de `auth.users`
2. ✅ Perfil é removido de `user_profiles` (CASCADE)
3. ⚠️ Quizzes, sessões e leads do usuário **NÃO são deletados automaticamente**
   - Eles permanecem no banco com `user_id` do usuário deletado
   - Isso é intencional para manter histórico

### Proteções Implementadas:

- ✅ Não pode deletar a si mesmo
- ✅ Botão desabilitado durante deleção
- ✅ Confirmação antes de deletar
- ✅ Mensagens de erro claras

## 🎯 Se Ainda Não Funcionar

1. **Verifique o Console** (F12) para ver o erro exato
2. **Verifique o Terminal** do servidor para logs
3. **Teste a API diretamente**:
   ```bash
   # No console do navegador (F12)
   fetch('/api/admin/users/USER_ID_AQUI', { method: 'DELETE' })
     .then(r => r.json())
     .then(console.log)
   ```
   Substitua `USER_ID_AQUI` pelo ID do usuário que quer deletar.

4. **Verifique Permissões**:
   - Certifique-se de que você é admin
   - Verifique em `/admin/debug`

## 🎉 Pronto!

O sistema agora tem melhor tratamento de erros e feedback visual. Se ainda houver problemas, verifique os logs para identificar a causa específica.



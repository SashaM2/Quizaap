-- ============================================
-- SCRIPT DE VERIFICAÇÃO
-- Execute este para ver quais tabelas existem
-- ============================================

-- Ver todas as tabelas no schema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Ver se as tabelas específicas existem
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quizzes') 
         THEN '✅ quizzes existe' 
         ELSE '❌ quizzes NÃO existe' 
    END as status_quizzes,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions') 
         THEN '✅ sessions existe' 
         ELSE '❌ sessions NÃO existe' 
    END as status_sessions,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') 
         THEN '✅ events existe' 
         ELSE '❌ events NÃO existe' 
    END as status_events,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') 
         THEN '✅ leads existe' 
         ELSE '❌ leads NÃO existe' 
    END as status_leads,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') 
         THEN '✅ user_profiles existe' 
         ELSE '❌ user_profiles NÃO existe' 
    END as status_user_profiles;


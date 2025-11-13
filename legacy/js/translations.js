/* ============================================================================
   TRANSLATIONS - Multilingual Support (PT, EN, ES)
   ============================================================================ */

const translations = {
  pt: {
    // Navigation
    "nav.dashboard": "Painel",
    "nav.quizzes": "Testes",
    "nav.leads": "Leads",
    "nav.logout": "Sair",
    "nav.login": "Entrar",

    // Dashboard
    "dashboard.title": "Painel de Controle",
    "dashboard.totalQuizzes": "Total de Testes",
    "dashboard.totalSessions": "Total de Sessões",
    "dashboard.totalLeads": "Total de Leads",
    "dashboard.conversionRate": "Taxa de Conversão",
    "dashboard.recentActivity": "Atividade Recente",

    // Messages
    "msg.noData": "Nenhum dado encontrado",
    "msg.success": "Sucesso!",
    "msg.error": "Erro!",

    // Auth
    "auth.adminAccess": "Acesso Administrativo",
    "auth.adminCode": "Código de Admin",
    "auth.invalidCode": "Código inválido",
    "auth.login": "Login",
    "auth.logout": "Sair",
    "auth.publicSale": "Visitante?",
    "auth.viewSalesPage": "Ver Página de Vendas",

    // Sales Page
    "sales.title": "Analise Seus Quizzes com Precisão",
    "sales.subtitle": "Acompanhe em tempo real o desempenho de seus testes e converta visitantes em leads qualificados",
    "sales.cta": "Comece Agora",
    "sales.features": "Recursos Principais",
    "sales.feature1Title": "Análise em Tempo Real",
    "sales.feature1Desc": "Acompanhe o desempenho dos seus quizzes instantaneamente",
    "sales.feature2Title": "Captura de Leads",
    "sales.feature2Desc": "Transforme visitantes em contatos qualificados",
    "sales.feature3Title": "Relatórios Detalhados",
    "sales.feature3Desc": "Acesse métricas completas e insights valiosos",
    "sales.feature4Title": "Segurança Garantida",
    "sales.feature4Desc": "Seus dados estão protegidos com as melhores práticas",
  },

  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.quizzes": "Quizzes",
    "nav.leads": "Leads",
    "nav.logout": "Logout",
    "nav.login": "Login",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.totalQuizzes": "Total Quizzes",
    "dashboard.totalSessions": "Total Sessions",
    "dashboard.totalLeads": "Total Leads",
    "dashboard.conversionRate": "Conversion Rate",
    "dashboard.recentActivity": "Recent Activity",

    // Messages
    "msg.noData": "No data found",
    "msg.success": "Success!",
    "msg.error": "Error!",

    // Auth
    "auth.adminAccess": "Admin Access",
    "auth.adminCode": "Admin Code",
    "auth.invalidCode": "Invalid code",
    "auth.login": "Login",
    "auth.logout": "Logout",
    "auth.publicSale": "Visitor?",
    "auth.viewSalesPage": "View Sales Page",

    // Sales Page
    "sales.title": "Analyze Your Quizzes with Precision",
    "sales.subtitle": "Track your tests in real-time and convert visitors into qualified leads",
    "sales.cta": "Get Started",
    "sales.features": "Key Features",
    "sales.feature1Title": "Real-Time Analysis",
    "sales.feature1Desc": "Monitor your quizzes performance instantly",
    "sales.feature2Title": "Lead Capture",
    "sales.feature2Desc": "Transform visitors into qualified contacts",
    "sales.feature3Title": "Detailed Reports",
    "sales.feature3Desc": "Access complete metrics and valuable insights",
    "sales.feature4Title": "Guaranteed Security",
    "sales.feature4Desc": "Your data is protected with best practices",
  },

  es: {
    // Navigation
    "nav.dashboard": "Panel",
    "nav.quizzes": "Cuestionarios",
    "nav.leads": "Leads",
    "nav.logout": "Cerrar Sesión",
    "nav.login": "Iniciar Sesión",

    // Dashboard
    "dashboard.title": "Panel de Control",
    "dashboard.totalQuizzes": "Total de Cuestionarios",
    "dashboard.totalSessions": "Total de Sesiones",
    "dashboard.totalLeads": "Total de Leads",
    "dashboard.conversionRate": "Tasa de Conversión",
    "dashboard.recentActivity": "Actividad Reciente",

    // Messages
    "msg.noData": "No hay datos",
    "msg.success": "¡Éxito!",
    "msg.error": "¡Error!",

    // Auth
    "auth.adminAccess": "Acceso de Administrador",
    "auth.adminCode": "Código de Admin",
    "auth.invalidCode": "Código inválido",
    "auth.login": "Iniciar Sesión",
    "auth.logout": "Cerrar Sesión",
    "auth.publicSale": "¿Visitante?",
    "auth.viewSalesPage": "Ver Página de Ventas",

    // Sales Page
    "sales.title": "Analiza Tus Cuestionarios con Precisión",
    "sales.subtitle": "Monitorea tus pruebas en tiempo real y convierte visitantes en leads calificados",
    "sales.cta": "Comenzar Ahora",
    "sales.features": "Características Principales",
    "sales.feature1Title": "Análisis en Tiempo Real",
    "sales.feature1Desc": "Monitorea el desempeño de tus cuestionarios al instante",
    "sales.feature2Title": "Captura de Leads",
    "sales.feature2Desc": "Transforma visitantes en contactos calificados",
    "sales.feature3Title": "Informes Detallados",
    "sales.feature3Desc": "Accede a métricas completas e insights valiosos",
    "sales.feature4Title": "Seguridad Garantizada",
    "sales.feature4Desc": "Tus datos están protegidos con las mejores prácticas",
  },
}

class Translator {
  constructor() {
    this.currentLanguage = localStorage.getItem("language") || "pt"
  }

  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLanguage = lang
      localStorage.setItem("language", lang)
      this.updateUI()
    }
  }

  getLanguage() {
    return this.currentLanguage
  }

  t(key, defaultValue = key) {
    const keys = key.split(".")
    let value = translations[this.currentLanguage]

    for (const k of keys) {
      value = value?.[k]
    }

    return value || defaultValue
  }

  updateUI() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n")
      el.textContent = this.t(key)
    })

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder")
      el.placeholder = this.t(key)
    })
  }
}

const i18n = new Translator()
window.i18n = i18n

/* ============================================================================
   MAIN APPLICATION LOGIC - CrivusAnalizerIQ
   ============================================================================ */

// Supabase Client
let supabaseClient = null

async function initSupabase() {
  try {
    // Check if Supabase environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || window.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || window.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("[v0] Supabase não configurado. Modo demo ativo.")
      return null
    }

    // If supabase-js is available, initialize it
    if (typeof window.supabase !== "undefined" && window.supabase.createClient) {
      const { createClient } = window.supabase
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
      console.log("[v0] Cliente Supabase inicializado")
    }

    return supabaseClient
  } catch (error) {
    console.error("[v0] Erro ao inicializar Supabase:", error)
    return null
  }
}

// App State
const appState = {
  user: null,
  currentPage: "dashboard",
  quizzes: [],
  leads: [],
  isLoading: false,
}

// Internationalization
const i18n = {
  language: "en",
  translations: {
    pt: {
      nav: {
        dashboard: "Painel",
        quizzes: "Questionários",
        leads: "Leads",
        logout: "Logout",
      },
      dashboard: {
        title: "Bem-vindo ao Quiz Tracker",
        totalQuizzes: "Total de Questionários",
        totalSessions: "Total de Sessões",
        totalLeads: "Total de Leads",
        conversionRate: "Taxa de Conversão",
        recentActivity: "Atividade Recente",
      },
      msg: {
        noData: "Nenhum dado disponível",
        error: "Ocorreu um erro",
      },
      sales: {
        title: "Analise Seus Quizzes com Precisão",
        subtitle: "Acompanhe em tempo real o desempenho de seus testes e converta visitantes em leads qualificados",
        cta: "Comece Agora",
        features: "Recursos Principais",
        feature1Title: "Análise em Tempo Real",
        feature1Desc: "Acompanhe o desempenho dos seus quizzes instantaneamente",
        feature2Title: "Captura de Leads",
        feature2Desc: "Transforme visitantes em contatos qualificados",
        feature3Title: "Relatórios Detalhados",
        feature3Desc: "Acesse métricas completas e insights valiosos",
        feature4Title: "Segurança Garantida",
        feature4Desc: "Seus dados estão protegidos com as melhores práticas",
      },
      auth: {
        login: "Login",
      },
    },
    en: {
      nav: {
        dashboard: "Dashboard",
        quizzes: "Quizzes",
        leads: "Leads",
        logout: "Logout",
      },
      dashboard: {
        title: "Welcome to Quiz Tracker",
        totalQuizzes: "Total Quizzes",
        totalSessions: "Total Sessions",
        totalLeads: "Total Leads",
        conversionRate: "Conversion Rate",
        recentActivity: "Recent Activity",
      },
      msg: {
        noData: "No data available",
        error: "An error occurred",
      },
      sales: {
        title: "Analyze Your Quizzes with Precision",
        subtitle: "Track the performance of your tests in real-time and convert visitors into qualified leads",
        cta: "Get Started Now",
        features: "Main Features",
        feature1Title: "Real-Time Analysis",
        feature1Desc: "Monitor the performance of your quizzes instantly",
        feature2Title: "Lead Capture",
        feature2Desc: "Transform visitors into qualified contacts",
        feature3Title: "Detailed Reports",
        feature3Desc: "Access comprehensive metrics and valuable insights",
        feature4Title: "Guaranteed Security",
        feature4Desc: "Your data is protected with best practices",
      },
      auth: {
        login: "Login",
      },
    },
    es: {
      nav: {
        dashboard: "Panel de control",
        quizzes: "Cuestionarios",
        leads: "Líderes",
        logout: "Cerrar sesión",
      },
      dashboard: {
        title: "Bienvenido a Quiz Tracker",
        totalQuizzes: "Total de Cuestionarios",
        totalSessions: "Total de Sesiones",
        totalLeads: "Total de Líderes",
        conversionRate: "Tasa de Conversión",
        recentActivity: "Actividad Reciente",
      },
      msg: {
        noData: "No hay datos disponibles",
        error: "Ocurrió un error",
      },
      sales: {
        title: "Analice Sus Quizzes con Precisión",
        subtitle: "Siga el rendimiento de sus pruebas en tiempo real y convierta visitantes en leads cualificados",
        cta: "Comience Ahora",
        features: "Características Principales",
        feature1Title: "Análisis en Tiempo Real",
        feature1Desc: "Supervise el rendimiento de sus quizzes instantáneamente",
        feature2Title: "Captura de Leads",
        feature2Desc: "Transforme visitantes en contactos cualificados",
        feature3Title: "Informes Detallados",
        feature3Desc: "Acceda a métricas completas e insights valiosos",
        feature4Title: "Seguridad Garantizada",
        feature4Desc: "Sus datos están protegidos con las mejores prácticas",
      },
      auth: {
        login: "Iniciar sesión",
      },
    },
  },
  t(key) {
    const keys = key.split(".")
    let translation = this.translations[this.language]
    keys.forEach((k) => {
      translation = translation[k]
    })
    return translation || key
  },
  setLanguage(lang) {
    this.language = lang
    this.updateUI()
  },
  updateUI() {
    const elements = document.querySelectorAll("[data-i18n]")
    elements.forEach((el) => {
      el.textContent = this.t(el.getAttribute("data-i18n"))
    })
  },
}

// API Calls
const API = {
  async getUser() {
    try {
      if (!supabaseClient) return null
      const { data } = await supabaseClient.auth.getUser()
      return data?.user || null
    } catch (error) {
      console.error("[v0] Error getting user:", error)
      return null
    }
  },

  async getQuizzes() {
    try {
      if (!supabaseClient) {
        console.log("[v0] Demo mode: returning empty quizzes")
        return []
      }
      const { data, error } = await supabaseClient.from("quizzes").select("*").order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching quizzes:", error)
      return []
    }
  },

  async getLeads() {
    try {
      if (!supabaseClient) {
        console.log("[v0] Demo mode: returning empty leads")
        return []
      }
      const { data, error } = await supabaseClient.from("leads").select("*").order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching leads:", error)
      return []
    }
  },

  async createQuiz(title, url) {
    try {
      if (!supabaseClient) {
        console.log("[v0] Demo mode: quiz not created")
        return null
      }
      const { data, error } = await supabaseClient.from("quizzes").insert([{ title, url }]).select()

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error("[v0] Error creating quiz:", error)
      return null
    }
  },

  async deleteQuiz(id) {
    try {
      if (!supabaseClient) {
        console.log("[v0] Demo mode: quiz not deleted")
        return false
      }
      const { error } = await supabaseClient.from("quizzes").delete().eq("id", id)

      if (error) throw error
      return true
    } catch (error) {
      console.error("[v0] Error deleting quiz:", error)
      return false
    }
  },

  async trackEvent(quizId, sessionId, eventType, data = {}) {
    try {
      if (!supabaseClient) return false
      const { error } = await supabaseClient.from("events").insert([
        {
          session_id: sessionId,
          event_type: eventType,
          ...data,
        },
      ])

      if (error) throw error
      return true
    } catch (error) {
      console.error("[v0] Error tracking event:", error)
      return false
    }
  },

  async createLead(quizId, sessionId, name, email, phone) {
    try {
      if (!supabaseClient) return null
      const { data, error } = await supabaseClient
        .from("leads")
        .insert([{ quiz_id: quizId, session_id: sessionId, name, email, phone }])
        .select()

      if (error) throw error
      return data?.[0] || null
    } catch (error) {
      console.error("[v0] Error creating lead:", error)
      return null
    }
  },
}

// UI Rendering
const UI = {
  showLoading() {
    appState.isLoading = true
    const overlay = document.createElement("div")
    overlay.className = "loading-overlay"
    overlay.id = "loading-overlay"
    overlay.innerHTML = '<div class="spinner"></div>'
    document.body.appendChild(overlay)
  },

  hideLoading() {
    appState.isLoading = false
    const overlay = document.getElementById("loading-overlay")
    if (overlay) overlay.remove()
  },

  showAlert(message, type = "info") {
    const alertBox = document.createElement("div")
    alertBox.className = `alert alert-${type}`
    alertBox.innerHTML = `<span>${message}</span>`

    const container = document.querySelector(".container") || document.body
    container.insertBefore(alertBox, container.firstChild)

    setTimeout(() => alertBox.remove(), 5000)
  },

  renderPublicSalesPage(root) {
    root.innerHTML = `
      <div class="navbar-public">
        <div class="container">
          <div class="navbar-content">
            <div class="navbar-brand">CrivusAnalizerIQ</div>
            <ul class="navbar-menu">
              <li class="navbar-item">
                <select onchange="i18n.setLanguage(this.value)" class="language-select">
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </li>
              <li class="navbar-item">
                <a href="#" onclick="AUTH.renderLoginPage(document.getElementById('root'))" class="btn btn-sm btn-primary" data-i18n="auth.login">Login</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="hero-section">
        <div class="container">
          <div class="hero-content">
            <h1 data-i18n="sales.title">Analise Seus Quizzes com Precisão</h1>
            <p data-i18n="sales.subtitle">Acompanhe em tempo real o desempenho de seus testes e converta visitantes em leads qualificados</p>
            <button class="btn btn-primary btn-lg" data-i18n="sales.cta">Comece Agora</button>
          </div>
        </div>
      </div>

      <div class="container mt-xl">
        <h2 class="text-center mb-lg" data-i18n="sales.features">Recursos Principais</h2>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3 data-i18n="sales.feature1Title">Análise em Tempo Real</h3>
            <p data-i18n="sales.feature1Desc">Acompanhe o desempenho dos seus quizzes instantaneamente</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">👥</div>
            <h3 data-i18n="sales.feature2Title">Captura de Leads</h3>
            <p data-i18n="sales.feature2Desc">Transforme visitantes em contatos qualificados</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📈</div>
            <h3 data-i18n="sales.feature3Title">Relatórios Detalhados</h3>
            <p data-i18n="sales.feature3Desc">Acesse métricas completas e insights valiosos</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3 data-i18n="sales.feature4Title">Segurança Garantida</h3>
            <p data-i18n="sales.feature4Desc">Seus dados estão protegidos com as melhores práticas</p>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="container">
          <p>&copy; 2025 CrivusAnalizerIQ. Todos os direitos reservados.</p>
        </div>
      </div>
    `

    i18n.updateUI()
  },

  renderAdminDashboard(root) {
    root.innerHTML = `
      <div class="navbar">
        <div class="container">
          <div class="navbar-content">
            <div class="navbar-brand">CrivusAnalizerIQ - Admin</div>
            <ul class="navbar-menu">
              <li class="navbar-item"><a href="#" onclick="UI.renderAdminDashboard(document.getElementById('root'))" class="active">${i18n.t("nav.dashboard")}</a></li>
              <li class="navbar-item"><a href="#" onclick="UI.renderQuizzesPage(document.getElementById('root'))">${i18n.t("nav.quizzes")}</a></li>
              <li class="navbar-item"><a href="#" onclick="UI.renderLeadsPage(document.getElementById('root'))">${i18n.t("nav.leads")}</a></li>
              <li class="navbar-item">
                <select onchange="i18n.setLanguage(this.value)" class="language-select">
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </li>
              <li class="navbar-item">
                <a href="#" onclick="AUTH.logout(); AUTH.renderLoginPage(document.getElementById('root'))" class="btn btn-sm btn-danger" data-i18n="nav.logout">Logout</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="container mt-lg">
        <h1 data-i18n="dashboard.title"></h1>

        <div class="dashboard-grid">
          <div class="stat-card">
            <div class="stat-value" id="total-quizzes">0</div>
            <div class="stat-label" data-i18n="dashboard.totalQuizzes"></div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="total-sessions">0</div>
            <div class="stat-label" data-i18n="dashboard.totalSessions"></div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="total-leads">0</div>
            <div class="stat-label" data-i18n="dashboard.totalLeads"></div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="conversion-rate">0%</div>
            <div class="stat-label" data-i18n="dashboard.conversionRate"></div>
          </div>
        </div>

        <div class="chart-container">
          <h3 data-i18n="dashboard.recentActivity"></h3>
          <p data-i18n="msg.noData"></p>
        </div>
      </div>
    `

    i18n.updateUI()
    this.updateDashboardStats()
  },

  renderDashboard(root) {
    if (window.AUTH.isAuthenticated()) {
      this.renderAdminDashboard(root)
    } else {
      window.AUTH.renderLoginPage(root)
    }
  },

  renderQuizzesPage(root) {
    root.innerHTML = `
      <div class="navbar">
        <div class="container">
          <div class="navbar-content">
            <div class="navbar-brand">Quiz Tracker</div>
            <ul class="navbar-menu">
              <li class="navbar-item"><a href="#" onclick="UI.renderPage('dashboard')">${i18n.t("nav.dashboard")}</a></li>
              <li class="navbar-item"><a href="#" onclick="UI.renderPage('quizzes')" class="active">${i18n.t("nav.quizzes")}</a></li>
              <li class="navbar-item"><a href="#" onclick="UI.renderPage('leads')">${i18n.t("nav.leads")}</a></li>
              <li class="navbar-item">
                <select onchange="i18n.setLanguage(this.value)" class="language-select">
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="container mt-lg">
        <h1 data-i18n="nav.quizzes"></h1>
        <p data-i18n="msg.noData"></p>
      </div>
    `
  },

  renderLeadsPage(root) {
    root.innerHTML = `
      <div class="navbar">
        <div class="container">
          <div class="navbar-content">
            <div class="navbar-brand">Quiz Tracker</div>
            <ul class="navbar-menu">
              <li class="navbar-item"><a href="#" onclick="UI.renderPage('dashboard')">${i18n.t("nav.dashboard")}</a></li>
              <li class="navbar-item"><a href="#" onclick="UI.renderPage('quizzes')">${i18n.t("nav.quizzes")}</a></li>
              <li class="navbar-item"><a href="#" onclick="UI.renderPage('leads')" class="active">${i18n.t("nav.leads")}</a></li>
              <li class="navbar-item">
                <select onchange="i18n.setLanguage(this.value)" class="language-select">
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="container mt-lg">
        <h1 data-i18n="nav.leads"></h1>
        <p data-i18n="msg.noData"></p>
      </div>
    `
  },

  async updateDashboardStats() {
    const quizzes = await API.getQuizzes()
    const leads = await API.getLeads()

    document.getElementById("total-quizzes").textContent = quizzes.length
    document.getElementById("total-leads").textContent = leads.length
    document.getElementById("total-sessions").textContent = "0" // TODO: Calculate from database
    document.getElementById("conversion-rate").textContent = "0%" // TODO: Calculate
  },

  renderPage(pageName) {
    if (!window.AUTH.isAuthenticated() && pageName !== "sales") {
      window.AUTH.renderLoginPage(document.getElementById("root"))
      return
    }

    appState.currentPage = pageName
    const root = document.getElementById("root")

    switch (pageName) {
      case "dashboard":
        this.renderAdminDashboard(root)
        break
      case "quizzes":
        this.renderQuizzesPage(root)
        break
      case "leads":
        this.renderLeadsPage(root)
        break
      case "sales":
        this.renderPublicSalesPage(root)
        break
      default:
        this.renderDashboard(root)
    }
  },
}

window.UI = UI

// Initialize Application
async function initApp() {
  try {
    const loader = document.getElementById("app-loader")
    if (loader) loader.style.display = "flex"

    // Initialize Supabase (may return null if not configured)
    await initSupabase()

    if (window.AUTH && window.AUTH.isAuthenticated()) {
      UI.renderPage("dashboard")
    } else {
      UI.renderPage("sales")
    }

    i18n.updateUI()

    if (loader) loader.style.display = "none"
  } catch (error) {
    console.error("[v0] Erro ao inicializar app:", error)
    const loader = document.getElementById("app-loader")
    if (loader) loader.style.display = "none"
  }
}

// Start app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp)
} else {
  initApp()
}

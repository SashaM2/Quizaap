/* ============================================================================
   AUTHENTICATION SYSTEM - Admin Only with Secret Code
   ============================================================================ */

const AUTH = {
  ADMIN_CODE: "CRIVUS2024",

  isAuthenticated() {
    const token = sessionStorage.getItem("crivus_admin_token")
    return token === "authenticated"
  },

  authenticate(code) {
    if (code === this.ADMIN_CODE) {
      sessionStorage.setItem("crivus_admin_token", "authenticated")
      localStorage.setItem("last_login", new Date().toISOString())
      return true
    }
    return false
  },

  logout() {
    sessionStorage.removeItem("crivus_admin_token")
  },

  renderLoginPage(root) {
    root.innerHTML = `
      <div class="login-container">
        <div class="login-box">
          <div class="login-header">
            <h1>CrivusAnalizerIQ</h1>
            <p data-i18n="auth.adminAccess">Acesso Administrativo</p>
          </div>
          
          <form id="login-form" class="login-form">
            <div class="form-group">
              <label for="admin-code" data-i18n="auth.adminCode">Código de Admin</label>
              <input 
                type="password" 
                id="admin-code" 
                class="form-input" 
                required
                data-i18n-placeholder="auth.adminCode"
                autocomplete="off"
              >
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" data-i18n="auth.login">Login</button>
            
            <div id="login-error" class="error-message" style="display: none;"></div>
          </form>

          <div class="login-footer">
            <p data-i18n="auth.publicSale">Visitante?</p>
            <a href="#" class="link" data-i18n="auth.viewSalesPage">Ver Página de Vendas</a>
          </div>
        </div>
      </div>
    `

    window.i18n.updateUI()

    document.getElementById("login-form").addEventListener("submit", (e) => {
      e.preventDefault()
      const code = document.getElementById("admin-code").value

      if (AUTH.authenticate(code)) {
        window.UI.renderAdminDashboard(document.getElementById("root"))
      } else {
        const errorDiv = document.getElementById("login-error")
        errorDiv.textContent = window.i18n.t("auth.invalidCode", "Código inválido")
        errorDiv.style.display = "block"
        document.getElementById("admin-code").value = ""
      }
    })
  },
}

window.AUTH = AUTH

// Declare i18n and UI variables for demonstration purposes
window.i18n = {
  updateUI: () => {},
  t: (key, defaultValue) => defaultValue,
}

window.UI = {
  renderAdminDashboard: (root) => {
    root.innerHTML = "<h1>Admin Dashboard</h1>"
  },
  renderPublicSalesPage: (root) => {
    root.innerHTML = "<h1>Public Sales Page</h1>"
  },
}

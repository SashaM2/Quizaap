"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"
import { LanguageSelector } from "@/components/language-selector"

interface UserProfile {
  id: string
  email: string
  role: string
  created_at: string
}

// Helper function to format dates consistently
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export default function UsersManagementPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function loadUsers() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError)
        setMessage({ type: "error", text: `${t("admin.errors.checkPermissions")}: ${profileError.message}` })
        setLoading(false)
        return
      }

      if (!profile) {
        console.warn("Perfil não encontrado para usuário:", user.id)
        setMessage({ 
          type: "error", 
          text: t("admin.errors.profileNotFound")
        })
        setLoading(false)
        return
      }

      if (profile.role !== "admin") {
        console.warn("Usuário não é admin. Role:", profile.role)
        setMessage({ 
          type: "error", 
          text: t("admin.errors.accessDenied")
        })
        setTimeout(() => {
          router.push("/")
        }, 2000)
        setLoading(false)
        return
      }

      setIsAdmin(true)
      setCurrentUser(user)

      // Load all users
      const { data: userProfiles, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading users:", error)
        setMessage({ type: "error", text: t("admin.errors.loadUsers") })
      } else {
        setUsers(userProfiles || [])
        setFilteredUsers(userProfiles || [])
      }

      setLoading(false)
    }

    loadUsers()
  }, [router])

  // Filtrar usuários
  useEffect(() => {
    let filtered = users

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por role
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [searchTerm, roleFilter, users])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao atualizar role")
      }

      // Atualizar lista local
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      )

      setEditingUser(null)
      setMessage({ type: "success", text: t("admin.success.roleUpdated") })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || t("admin.errors.updateRole") })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    // Verificar se está tentando deletar a si mesmo
    if (currentUser?.id === userId) {
      setMessage({ type: "error", text: t("admin.errors.cannotDeleteSelf") })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    if (!confirm(t("admin.deleteConfirm"))) {
      return
    }

    setDeletingUser(userId)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.details || result.error || "Erro ao deletar usuário"
        console.error("Erro ao deletar:", errorMsg)
        throw new Error(errorMsg)
      }

      // Remover da lista local
      setUsers((prev) => prev.filter((user) => user.id !== userId))
      setDeletingUser(null)
      setMessage({ type: "success", text: t("admin.success.userDeleted") })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error("Erro completo:", error)
      setDeletingUser(null)
      const errorMessage = error.message || t("admin.errors.deleteUser")
      setMessage({ type: "error", text: errorMessage })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  if (!mounted || loading) {
    return (
      <div
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          minHeight: "100vh",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#111827",
        }}
        suppressHydrationWarning
      >
        <div style={{ fontSize: "1.125rem" }} suppressHydrationWarning>{t("common.loading")}</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          minHeight: "100vh",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#111827",
        }}
        suppressHydrationWarning
      >
        <div style={{ fontSize: "1.125rem" }} suppressHydrationWarning>{t("admin.checkingPermissions")}</div>
      </div>
    )
  }

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    users: users.filter((u) => u.role === "user").length,
  }

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        minHeight: "100vh",
        background: "#ffffff",
        color: "#111827",
      }}
      suppressHydrationWarning
      onClick={(e) => {
        if (userMenuOpen && !(e.target as HTMLElement).closest('[data-user-menu]')) {
          setUserMenuOpen(false)
        }
      }}
    >
      {/* Minimalist Navbar */}
      <nav
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
        suppressHydrationWarning
      >
        {/* Logo Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "#1f2937",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              fontWeight: 600,
              color: "white",
            }}
          >
            A
          </div>
          <div>
            <h1 style={{ fontSize: "1.125rem", color: "#111827", fontWeight: 600, margin: 0 }} suppressHydrationWarning>
              {t("admin.title")}
            </h1>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.125rem" }} suppressHydrationWarning>
              {t("admin.subtitle")}
            </div>
          </div>
        </div>

        {/* Language Selector and User Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <LanguageSelector />
          
          {/* User Section with Dropdown Menu */}
          <div style={{ position: "relative" }} data-user-menu>
            <div
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                background: "#7c3aed",
                borderRadius: "50%",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)"
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(124, 58, 237, 0.3)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {currentUser?.email?.charAt(0).toUpperCase() || "A"}
              </div>
            </div>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 0.75rem)",
                  right: 0,
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "0.5rem",
                  minWidth: "200px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    padding: "0.75rem",
                    borderBottom: "1px solid #e5e7eb",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.25rem" }} suppressHydrationWarning>
                    {currentUser?.email || "Admin"}
                  </div>
                  <div style={{ fontSize: "0.625rem", color: "#6b7280" }} suppressHydrationWarning>
                    {t("admin.role")}
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout()
                    setUserMenuOpen(false)
                  }}
                  style={{
                    width: "100%",
                    background: "transparent",
                    color: "#dc2626",
                    border: "none",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    textAlign: "left",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fef2f2"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                  }}
                >
                  {t("common.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "2rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.875rem", fontWeight: 600, color: "#111827", margin: 0 }} suppressHydrationWarning>{t("admin.manageUsers")}</h2>
          <Link
            href="/auth/register"
            style={{
              background: "#111827",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#374151"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#111827"
            }}
          >
            {t("admin.createUser")}
          </Link>
        </div>

        {/* Mensagens */}
        {message && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "0.75rem 1rem",
              borderRadius: "6px",
              background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              color: message.type === "success" ? "#166534" : "#991b1b",
              fontSize: "0.875rem",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Estatísticas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
          suppressHydrationWarning
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "1.5rem",
              transition: "border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb"
            }}
          >
            <div style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }} suppressHydrationWarning>
              {t("admin.stats.total")}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827" }} suppressHydrationWarning>
              {stats.total}
            </div>
          </div>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "1.5rem",
              transition: "border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb"
            }}
          >
            <div style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }} suppressHydrationWarning>
              {t("admin.stats.admins")}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 600, color: "#7c3aed" }} suppressHydrationWarning>
              {stats.admins}
            </div>
          </div>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "1.5rem",
              transition: "border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb"
            }}
          >
            <div style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }} suppressHydrationWarning>
              {t("admin.stats.users")}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 600, color: "#111827" }} suppressHydrationWarning>
              {stats.users}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", marginBottom: "1rem" }} suppressHydrationWarning>
            {t("admin.filters.title")}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <label
                htmlFor="search"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#374151",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                {t("admin.filters.searchEmail")}
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("admin.filters.searchPlaceholder")}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "0.875rem",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="role"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#374151",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                {t("admin.filters.filterByRole")}
              </label>
              <select
                id="role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "0.875rem",
                }}
              >
                <option value="all">{t("admin.filters.all")}</option>
                <option value="admin">{t("admin.stats.admins")}</option>
                <option value="user">{t("admin.stats.users")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.5fr 1.5fr 1.5fr",
              gap: "1rem",
              padding: "0.75rem 1rem",
              background: "#f3f4f6",
              borderBottom: "1px solid #e5e7eb",
              fontWeight: 500,
              color: "#374151",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <div suppressHydrationWarning>{t("admin.table.email")}</div>
            <div suppressHydrationWarning>{t("admin.table.role")}</div>
            <div suppressHydrationWarning>{t("admin.table.createdAt")}</div>
            <div style={{ textAlign: "right" }} suppressHydrationWarning>{t("admin.table.actions")}</div>
          </div>
          {filteredUsers.length === 0 ? (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "0.875rem",
              }}
            >
              {t("admin.noUsers")}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.5fr 1.5fr 1.5fr",
                  gap: "1rem",
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid #e5e7eb",
                  alignItems: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
              >
                <div style={{ fontSize: "0.875rem", color: "#111827", fontWeight: 500 }}>
                  {user.email}
                  {currentUser?.id === user.id && (
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "#6b7280" }} suppressHydrationWarning>({t("admin.you")})</span>
                  )}
                </div>
                <div>
                  {editingUser === user.id ? (
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      onBlur={() => setEditingUser(null)}
                      autoFocus
                      style={{
                        padding: "0.25rem 0.5rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        background: "#ffffff",
                        color: "#111827",
                        fontSize: "0.875rem",
                      }}
                    >
                      <option value="user">{t("admin.roleUser")}</option>
                      <option value="admin">{t("admin.roleAdmin")}</option>
                    </select>
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        background: user.role === "admin" ? "#f3e8ff" : "#f3f4f6",
                        color: user.role === "admin" ? "#7c3aed" : "#374151",
                      }}
                    >
                      {user.role === "admin" ? t("admin.roleAdmin") : t("admin.roleUser")}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }} suppressHydrationWarning>
                  {formatDate(user.created_at)}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <button
                    onClick={() => setEditingUser(user.id)}
                    disabled={currentUser?.id === user.id}
                    title={currentUser?.id === user.id ? t("admin.cannotEditSelf") : t("admin.editRole")}
                    style={{
                      background: "transparent",
                      color: "#6b7280",
                      border: "1px solid #d1d5db",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      cursor: currentUser?.id === user.id ? "not-allowed" : "pointer",
                      opacity: currentUser?.id === user.id ? 0.5 : 1,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (currentUser?.id !== user.id) {
                        e.currentTarget.style.background = "#f9fafb"
                        e.currentTarget.style.borderColor = "#9ca3af"
                        e.currentTarget.style.color = "#111827"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentUser?.id !== user.id) {
                        e.currentTarget.style.background = "transparent"
                        e.currentTarget.style.borderColor = "#d1d5db"
                        e.currentTarget.style.color = "#6b7280"
                      }
                    }}
                  >
                    {t("admin.edit")}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={currentUser?.id === user.id || deletingUser === user.id}
                    title={currentUser?.id === user.id ? t("admin.errors.cannotDeleteSelf") : deletingUser === user.id ? t("admin.deleting") : t("admin.delete")}
                    style={{
                      background: "transparent",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      cursor: currentUser?.id === user.id || deletingUser === user.id ? "not-allowed" : "pointer",
                      opacity: currentUser?.id === user.id || deletingUser === user.id ? 0.5 : 1,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (currentUser?.id !== user.id && deletingUser !== user.id) {
                        e.currentTarget.style.background = "#fef2f2"
                        e.currentTarget.style.borderColor = "#fca5a5"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentUser?.id !== user.id && deletingUser !== user.id) {
                        e.currentTarget.style.background = "transparent"
                        e.currentTarget.style.borderColor = "#fecaca"
                      }
                    }}
                  >
                    {deletingUser === user.id ? t("admin.deleting") : t("admin.delete")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info */}
        <div style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "#6b7280" }} suppressHydrationWarning>
          Mostrando {filteredUsers.length} de {users.length} usuário(s)
        </div>
      </main>
    </div>
  )
}

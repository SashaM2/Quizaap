"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"
import { LanguageSelector } from "@/components/language-selector"

export default function RegisterPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function checkAdmin() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (profile && profile.role === "admin") {
          setIsAdmin(true)
        } else {
          router.push("/admin/users")
        }
      } else {
        router.push("/auth/login")
      }
      setCheckingAuth(false)
    }

    checkAdmin()
  }, [router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Create user account
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Update user profile role to 'user' (default is already 'user' from trigger, but we can set it explicitly)
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({ role: "user" })
          .eq("id", data.user.id)

        if (profileError) {
          console.error("Error updating profile:", profileError)
        }

        // Confirmar email automaticamente via API (admin criando usuário)
        try {
          const confirmResponse = await fetch("/api/admin/confirm-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          })

          if (confirmResponse.ok) {
            console.log("Email confirmado automaticamente")
          } else {
            console.warn("Não foi possível confirmar email automaticamente")
          }
        } catch (confirmError) {
          console.warn("Erro ao confirmar email:", confirmError)
        }

        setSuccess(true)
        // Redirecionar para gerenciamento de usuários após 2 segundos
        setTimeout(() => {
          router.push("/admin/users")
        }, 2000)
      }
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.")
      setLoading(false)
    }
  }

  if (!mounted || checkingAuth) {
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
        <div style={{ fontSize: "1.125rem" }} suppressHydrationWarning>
          {t("admin.checkingPermissions") || "Verificando permissões..."}
        </div>
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
          padding: "2rem 1rem",
        }}
        suppressHydrationWarning
      >
        <div
          style={{
            width: "100%",
            maxWidth: "28rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "#991b1b", margin: 0 }} suppressHydrationWarning>
              Acesso negado. Apenas administradores podem criar contas.
            </p>
          </div>
          <Link
            href="/admin/users"
            style={{
              color: "#111827",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            ← Voltar para Gerenciamento de Usuários
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          minHeight: "100vh",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
        }}
        suppressHydrationWarning
      >
        <div
          style={{
            width: "100%",
            maxWidth: "28rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "#166534", margin: 0 }} suppressHydrationWarning>
              Conta criada com sucesso! Redirecionando...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
      suppressHydrationWarning
    >
      {/* Language Selector - Top Right */}
      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 10,
        }}
      >
        <LanguageSelector />
      </div>

      {/* Navbar */}
      <nav
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        suppressHydrationWarning
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "#111827",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              fontWeight: 600,
              color: "white",
            }}
            suppressHydrationWarning
          >
            A
          </div>
          <div>
            <h1 style={{ fontSize: "1.125rem", color: "#111827", fontWeight: 600, margin: 0 }} suppressHydrationWarning>
              {t("admin.title") || "Admin"}
            </h1>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.125rem" }} suppressHydrationWarning>
              {t("admin.subtitle") || "Painel de Administração"}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
        }}
        suppressHydrationWarning
      >
        <div
          style={{
            width: "100%",
            maxWidth: "28rem",
          }}
        >
          <div style={{ marginBottom: "2rem", textAlign: "center" }} suppressHydrationWarning>
            <h2
              style={{
                fontSize: "1.875rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "0.5rem",
                margin: 0,
              }}
              suppressHydrationWarning
            >
              Criar nova conta
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }} suppressHydrationWarning>
              Preencha os dados abaixo para criar um novo usuário
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "2rem",
            }}
          >
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#374151",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: "0.875rem",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#111827"
                  e.currentTarget.style.outline = "none"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db"
                }}
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#374151",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    paddingRight: "2.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    background: "#ffffff",
                    color: "#111827",
                    fontSize: "0.875rem",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#111827"
                    e.currentTarget.style.outline = "none"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db"
                  }}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#6b7280",
                    cursor: "pointer",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#111827"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#6b7280"
                  }}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      style={{ width: "1.25rem", height: "1.25rem" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3.98 8.223m0 0L6.228 6.228M3.98 8.223L6.228 6.228m0 0L9 9m-2.772-2.772L9 9m0 0l3 3m-3-3l-3 3m3-3l3 3m0 0l3-3m-3 3l-3-3"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      style={{ width: "1.25rem", height: "1.25rem" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  color: "#374151",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Confirmar Senha
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    paddingRight: "2.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    background: "#ffffff",
                    color: "#111827",
                    fontSize: "0.875rem",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#111827"
                    e.currentTarget.style.outline = "none"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db"
                  }}
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#6b7280",
                    cursor: "pointer",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#111827"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#6b7280"
                  }}
                >
                  {showConfirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      style={{ width: "1.25rem", height: "1.25rem" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3.98 8.223m0 0L6.228 6.228M3.98 8.223L6.228 6.228m0 0L9 9m-2.772-2.772L9 9m0 0l3 3m-3-3l-3 3m3-3l3 3m0 0l3-3m-3 3l-3-3"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      style={{ width: "1.25rem", height: "1.25rem" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  padding: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                <p style={{ fontSize: "0.875rem", color: "#991b1b", margin: 0 }} suppressHydrationWarning>
                  {error}
                </p>
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: loading ? "#9ca3af" : "#111827",
                  color: "white",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "#374151"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "#111827"
                  }
                }}
              >
                {loading ? "Criando conta..." : "Criar conta"}
              </button>
            </div>

            <div style={{ textAlign: "center" }}>
              <Link
                href="/admin/users"
                style={{
                  color: "#111827",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none"
                }}
              >
                ← Voltar para Gerenciamento de Usuários
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


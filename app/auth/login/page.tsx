"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"
import { LanguageSelector } from "@/components/language-selector"

export default function LoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Verificar se perfil existe, se não, criar automaticamente
        let { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()

        // Se perfil não existe, criar automaticamente via API
        if (!profile) {
          try {
            const response = await fetch("/api/auth/create-profile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: data.user.id,
                email: data.user.email!,
              }),
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
              console.error("Erro ao criar perfil:", result.error)
              setError("Erro ao criar perfil. Tente novamente.")
              setLoading(false)
              return
            }

            profile = result.profile
          } catch (apiError) {
            console.error("Erro na API:", apiError)
            setError("Erro ao criar perfil. Tente novamente.")
            setLoading(false)
            return
          }
        }

        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.")
      setLoading(false)
    }
  }

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
        position: "relative",
      }}
      suppressHydrationWarning
    >
      {/* Language Selector - Top Right */}
      <div
        style={{
          position: "absolute",
          top: "2rem",
          right: "2rem",
        }}
      >
        <LanguageSelector />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
        }}
      >

        {/* Logo/Branding Section */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              background: "#111827",
              borderRadius: "12px",
              marginBottom: "1.5rem",
            }}
          >
            <span style={{ fontSize: "1.5rem", fontWeight: 600, color: "white" }}>Q</span>
          </div>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 600,
              color: "#111827",
              margin: 0,
              marginBottom: "0.5rem",
            }}
            suppressHydrationWarning
          >
            {t("auth.login.title")}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }} suppressHydrationWarning>
            {t("auth.login.subtitle")}
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "2rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                {t("auth.login.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
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
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                {t("auth.login.password")}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    paddingRight: "2.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
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
                    cursor: "pointer",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                    transition: "color 0.2s ease",
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
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#991b1b",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "1.5rem",
              padding: "0.75rem",
              background: loading ? "#9ca3af" : "#111827",
              color: "white",
              border: "none",
              borderRadius: "8px",
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
            {loading ? t("auth.login.submitting") : t("auth.login.submit")}
          </button>

          {/* Register Link */}
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }} suppressHydrationWarning>
              {t("auth.login.noAccount")}{" "}
            </span>
            <Link
              href="/auth/register"
              style={{
                fontSize: "0.875rem",
                color: "#111827",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#374151"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#111827"
              }}
              suppressHydrationWarning
            >
              {t("auth.login.register")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}


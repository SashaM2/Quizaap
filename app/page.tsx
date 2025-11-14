"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { useI18n } from "@/contexts/i18n-context"
import { LanguageSelector } from "@/components/language-selector"

export default function LandingPage() {
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)

    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute("data-animate-section") || entry.target.id
          if (sectionId) {
            setVisibleSections((prev) => new Set([...prev, sectionId]))
          }
        }
      })
    }, observerOptions)

    // Observe all sections after a short delay to ensure DOM is ready
    setTimeout(() => {
      const sections = document.querySelectorAll("[data-animate-section]")
      sections.forEach((section) => observer.observe(section))
    }, 100)

    return () => {
      const sections = document.querySelectorAll("[data-animate-section]")
      sections.forEach((section) => observer.unobserve(section))
    }
  }, [])

    return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #fafafa 0%, #ffffff 50%, #f9fafb 100%)",
        color: "#111827",
        position: "relative",
        overflowX: "hidden",
      }}
      suppressHydrationWarning
    >
      {/* Decorative Background Elements */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          background: "radial-gradient(circle at 20% 50%, rgba(17, 24, 39, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(17, 24, 39, 0.02) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
        suppressHydrationWarning
      />
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .fade-in {
          animation: fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .slide-in-left {
          animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .slide-in-right {
          animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .scale-in {
          animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .float {
          animation: float 4s ease-in-out infinite;
        }

        .delay-100 {
          animation-delay: 0.1s;
          opacity: 0;
        }

        .delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
        }

        .delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }

        .delay-500 {
          animation-delay: 0.5s;
          opacity: 0;
        }

        .delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }

        .delay-700 {
          animation-delay: 0.7s;
          opacity: 0;
        }

        .delay-800 {
          animation-delay: 0.8s;
          opacity: 0;
        }

        .scroll-animate {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .scroll-animate.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Prevent hydration mismatch by starting with consistent state */
        .hydrated-only {
          opacity: 0;
        }

        .hydrated-only.mounted {
          opacity: 1;
        }

        .card-hover {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card-hover:hover {
          transform: translateY(-4px);
        }
      `}</style>

      {/* Navigation */}
      <nav
        style={{
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(229, 231, 235, 0.5)",
          padding: "1.25rem 2rem",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          transition: "all 0.3s ease",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
        suppressHydrationWarning
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          suppressHydrationWarning
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} suppressHydrationWarning>
            <div
              style={{
                width: "44px",
                height: "44px",
                background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "white",
                boxShadow: "0 4px 12px rgba(17, 24, 39, 0.15)",
              }}
              suppressHydrationWarning
            >
              Q
            </div>
            <h1
              style={{
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "#111827",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
              suppressHydrationWarning
            >
              Crivus QuizIQ
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }} suppressHydrationWarning>
            <LanguageSelector />
              <Link
                href="/auth/login"
              style={{
                background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
                color: "white",
                padding: "0.625rem 1.75rem",
                borderRadius: "10px",
                textDecoration: "none",
                fontSize: "0.9375rem",
                fontWeight: 600,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 4px 12px rgba(17, 24, 39, 0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #374151 0%, #4b5563 100%)"
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(17, 24, 39, 0.25)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #111827 0%, #374151 100%)"
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(17, 24, 39, 0.15)"
              }}
                suppressHydrationWarning
              >
              {t("nav.login")}
              </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 2rem", position: "relative", zIndex: 1 }} suppressHydrationWarning>
        <div
          style={{
            padding: "10rem 0 8rem",
            textAlign: "center",
            position: "relative",
          }}
          suppressHydrationWarning
        >
          <div
            className={mounted ? "fade-in-up delay-100" : ""}
            style={{
              marginBottom: "2rem",
            }}
            suppressHydrationWarning
          >
            <h2
              style={{
                fontSize: "clamp(3rem, 6vw, 5rem)",
                fontWeight: 800,
                background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
                marginBottom: "2rem",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
              suppressHydrationWarning
            >
              {t("landing.hero.title")}
              <br />
              <span 
                style={{ 
                  background: "linear-gradient(135deg, #111827 0%, #6b7280 100%)", 
                  WebkitBackgroundClip: "text", 
                  WebkitTextFillColor: "transparent", 
                  backgroundClip: "text",
                  display: "inline-block",
                  animation: mounted ? "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards" : "none",
                  opacity: mounted ? 0 : 1,
                }}
              >
                {t("landing.hero.subtitle")}
              </span>
          </h2>
          </div>

          <p
            className={mounted ? "fade-in-up delay-200" : ""}
            style={{
              fontSize: "1.375rem",
              color: "#4b5563",
              maxWidth: "700px",
              margin: "0 auto 4rem",
              lineHeight: 1.7,
              fontWeight: 400,
            }}
            suppressHydrationWarning
          >
            {t("landing.hero.description")}
          </p>

          <div
            className={mounted ? "fade-in-up delay-300" : ""}
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
            suppressHydrationWarning
          >
            <Link
              href="/auth/login"
              style={{
                background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
                color: "white",
                padding: "1.125rem 3rem",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "1.0625rem",
                fontWeight: 600,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "inline-block",
                boxShadow: "0 8px 24px rgba(17, 24, 39, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #374151 0%, #4b5563 100%)"
                e.currentTarget.style.transform = "translateY(-3px)"
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(17, 24, 39, 0.3)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #111827 0%, #374151 100%)"
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(17, 24, 39, 0.2)"
              }}
              suppressHydrationWarning
            >
              {t("landing.hero.cta")}
            </Link>
            <Link
              href="#features"
              style={{
                background: "white",
                color: "#111827",
                padding: "1.125rem 3rem",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "1.0625rem",
                fontWeight: 600,
                border: "2px solid #e5e7eb",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "inline-block",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#111827"
                e.currentTarget.style.background = "#f9fafb"
                e.currentTarget.style.transform = "translateY(-3px)"
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.1)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.background = "white"
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)"
              }}
              suppressHydrationWarning
            >
              {t("landing.hero.learnMore")}
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div
          id="features"
          data-animate-section="features"
          style={{
            padding: "5rem 0",
            background: "#f9fafb",
            borderRadius: "12px",
            marginTop: "4rem",
          }}
          suppressHydrationWarning
        >
          <h3
            className={mounted && (visibleSections.has("features") || mounted) ? "fade-in-up delay-100" : mounted ? "scroll-animate" : ""}
            style={{
              fontSize: "2.25rem",
              fontWeight: 700,
              textAlign: "center",
              color: "#111827",
              marginBottom: "3.5rem",
            }}
            suppressHydrationWarning
          >
            {t("landing.features.title")}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 2rem",
            }}
            suppressHydrationWarning
          >
            {/* Feature 1 */}
            <div
              className={`${mounted && (visibleSections.has("features") || mounted) ? "fade-in-up delay-200" : mounted ? "scroll-animate" : ""} card-hover`}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "2rem",
              }}
              suppressHydrationWarning
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
                suppressHydrationWarning
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", margin: 0 }}>
                {t("landing.features.analytics.title")}
              </h4>
              <p style={{ fontSize: "0.9375rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                {t("landing.features.analytics.description")}
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className={`${mounted && (visibleSections.has("features") || mounted) ? "fade-in-up delay-300" : mounted ? "scroll-animate" : ""} card-hover`}
              suppressHydrationWarning
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "2rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
                suppressHydrationWarning
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", margin: 0 }}>
                {t("landing.features.leads.title")}
              </h4>
              <p style={{ fontSize: "0.9375rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                {t("landing.features.leads.description")}
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className={`${mounted && (visibleSections.has("features") || mounted) ? "fade-in-up delay-400" : mounted ? "scroll-animate" : ""} card-hover`}
              suppressHydrationWarning
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "2rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
                suppressHydrationWarning
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", margin: 0 }}>
                {t("landing.features.tracking.title")}
              </h4>
              <p style={{ fontSize: "0.9375rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                {t("landing.features.tracking.description")}
              </p>
            </div>

            {/* Feature 4 */}
            <div
              className={`${mounted && (visibleSections.has("features") || mounted) ? "fade-in-up delay-500" : mounted ? "scroll-animate" : ""} card-hover`}
              suppressHydrationWarning
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "2rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
                suppressHydrationWarning
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", margin: 0 }}>
                {t("landing.features.integration.title")}
              </h4>
              <p style={{ fontSize: "0.9375rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                {t("landing.features.integration.description")}
              </p>
            </div>

            {/* Feature 5 */}
            <div
              className={`${mounted && (visibleSections.has("features") || mounted) ? "fade-in-up delay-600" : mounted ? "scroll-animate" : ""} card-hover`}
              suppressHydrationWarning
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "2rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
                suppressHydrationWarning
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", margin: 0 }}>
                {t("landing.features.funnel.title")}
              </h4>
              <p style={{ fontSize: "0.9375rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                {t("landing.features.funnel.description")}
              </p>
            </div>

            {/* Feature 6 */}
            <div
              className={`${mounted && (visibleSections.has("features") || mounted) ? "fade-in-up delay-700" : mounted ? "scroll-animate" : ""} card-hover`}
              suppressHydrationWarning
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "2rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
                suppressHydrationWarning
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="20" x2="12" y2="10" />
                  <line x1="18" y1="20" x2="18" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="16" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", margin: 0 }}>
                {t("landing.features.abandonment.title")}
              </h4>
              <p style={{ fontSize: "0.9375rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                {t("landing.features.abandonment.description")}
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div
          id="how-it-works"
          data-animate-section="how-it-works"
          style={{
            padding: "8rem 0",
            background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
            borderRadius: "32px",
            marginTop: "6rem",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
          }}
          suppressHydrationWarning
        >
          <h3
            className={mounted && (visibleSections.has("how-it-works") || mounted) ? "fade-in-up delay-100" : mounted ? "scroll-animate" : ""}
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              textAlign: "center",
              color: "#111827",
              marginBottom: "4rem",
              letterSpacing: "-0.02em",
            }}
            suppressHydrationWarning
          >
            {t("landing.howItWorks.title")}
          </h3>
          <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 2rem" }} suppressHydrationWarning>
            <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }} suppressHydrationWarning>
              <div
                className={mounted && (visibleSections.has("how-it-works") || mounted) ? "fade-in-up delay-200" : mounted ? "scroll-animate" : ""}
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  alignItems: "flex-start",
                }}
                suppressHydrationWarning
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "56px",
                    height: "56px",
                    background: "#111827",
                    color: "white",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 600,
                  }}
                  suppressHydrationWarning
                >
                  1
                </div>
                <div suppressHydrationWarning>
                  <h4 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem", margin: 0 }}>
                    {t("landing.howItWorks.step1.title")}
                  </h4>
                  <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                    {t("landing.howItWorks.step1.description")}
                  </p>
                </div>
              </div>
              <div
                className={mounted && (visibleSections.has("how-it-works") || mounted) ? "fade-in-up delay-300" : mounted ? "scroll-animate" : ""}
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  alignItems: "flex-start",
                }}
                suppressHydrationWarning
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "56px",
                    height: "56px",
                    background: "#111827",
                    color: "white",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 600,
                  }}
                  suppressHydrationWarning
                >
                  2
                </div>
                <div suppressHydrationWarning>
                  <h4 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem", margin: 0 }}>
                    {t("landing.howItWorks.step2.title")}
                  </h4>
                  <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                    {t("landing.howItWorks.step2.description")}
                  </p>
                </div>
              </div>
              <div
                className={mounted && (visibleSections.has("how-it-works") || mounted) ? "fade-in-up delay-400" : mounted ? "scroll-animate" : ""}
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  alignItems: "flex-start",
                }}
                suppressHydrationWarning
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "56px",
                    height: "56px",
                    background: "#111827",
                    color: "white",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 600,
                  }}
                  suppressHydrationWarning
                >
                  3
                </div>
                <div suppressHydrationWarning>
                  <h4 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem", margin: 0 }}>
                    {t("landing.howItWorks.step3.title")}
                  </h4>
                  <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                    {t("landing.howItWorks.step3.description")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div
          style={{
            padding: "6rem 0",
            background: "linear-gradient(180deg, #f9fafb 0%, #ffffff 100%)",
            borderRadius: "32px",
            marginTop: "6rem",
          }}
          suppressHydrationWarning
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "3rem",
              maxWidth: "1000px",
              margin: "0 auto",
            }}
            suppressHydrationWarning
          >
            <div className={mounted ? "fade-in-up delay-100" : ""} style={{ textAlign: "center" }} suppressHydrationWarning>
              <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem", lineHeight: 1 }} suppressHydrationWarning>
                100%
              </div>
              <div style={{ fontSize: "1rem", color: "#6b7280", fontWeight: 500 }} suppressHydrationWarning>{t("landing.stats.accuracy")}</div>
            </div>
            <div className={mounted ? "fade-in-up delay-200" : ""} style={{ textAlign: "center" }} suppressHydrationWarning>
              <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem", lineHeight: 1 }} suppressHydrationWarning>
                24/7
              </div>
              <div style={{ fontSize: "1rem", color: "#6b7280", fontWeight: 500 }} suppressHydrationWarning>{t("landing.stats.monitoring")}</div>
            </div>
            <div className={mounted ? "fade-in-up delay-300" : ""} style={{ textAlign: "center" }} suppressHydrationWarning>
              <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem", lineHeight: 1 }} suppressHydrationWarning>
                ∞
              </div>
              <div style={{ fontSize: "1rem", color: "#6b7280", fontWeight: 500 }} suppressHydrationWarning>{t("landing.stats.unlimited")}</div>
            </div>
            <div className={mounted ? "fade-in-up delay-400" : ""} style={{ textAlign: "center" }} suppressHydrationWarning>
              <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem", lineHeight: 1 }} suppressHydrationWarning>
                &lt; 1min
              </div>
              <div style={{ fontSize: "1rem", color: "#6b7280", fontWeight: 500 }} suppressHydrationWarning>{t("landing.stats.setup")}</div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div
          id="benefits"
          data-animate-section="benefits"
          style={{
            padding: "5rem 0",
            marginTop: "4rem",
            background: "#f9fafb",
            borderRadius: "12px",
          }}
          suppressHydrationWarning
        >
          <h3
            className={mounted && (visibleSections.has("benefits") || mounted) ? "fade-in-up delay-100" : mounted ? "scroll-animate" : ""}
            style={{
              fontSize: "2.25rem",
              fontWeight: 700,
              textAlign: "center",
              color: "#111827",
              marginBottom: "3.5rem",
            }}
            suppressHydrationWarning
          >
            {t("landing.benefits.title")}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 2rem",
            }}
            suppressHydrationWarning
          >
            <div
              className={`${mounted && (visibleSections.has("benefits") || mounted) ? "fade-in-up delay-200" : mounted ? "scroll-animate" : ""} card-hover`}
              style={{
                padding: "2rem",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
              suppressHydrationWarning
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
                suppressHydrationWarning
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", margin: 0 }}>
                {t("landing.benefits.fast.title")}
              </h4>
              <p style={{ fontSize: "0.9375rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                {t("landing.benefits.fast.description")}
              </p>
            </div>
            <div
              className={`${mounted && (visibleSections.has("benefits") || mounted) ? "fade-in-up delay-300" : mounted ? "scroll-animate" : ""} card-hover`}
              style={{
                padding: "2rem",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
              suppressHydrationWarning
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
                suppressHydrationWarning
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", margin: 0 }}>
                {t("landing.benefits.secure.title")}
              </h4>
              <p style={{ fontSize: "0.9375rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                {t("landing.benefits.secure.description")}
              </p>
            </div>
            <div
              className={`${mounted && (visibleSections.has("benefits") || mounted) ? "fade-in-up delay-400" : mounted ? "scroll-animate" : ""} card-hover`}
              style={{
                padding: "2rem",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
              suppressHydrationWarning
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
                suppressHydrationWarning
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", margin: 0 }}>
                {t("landing.benefits.analytics.title")}
              </h4>
              <p style={{ fontSize: "0.9375rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                {t("landing.benefits.analytics.description")}
              </p>
            </div>
            <div
              className={`${mounted && (visibleSections.has("benefits") || mounted) ? "fade-in-up delay-500" : mounted ? "scroll-animate" : ""} card-hover`}
              style={{
                padding: "2rem",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
              suppressHydrationWarning
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
                suppressHydrationWarning
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", margin: 0 }}>
                {t("landing.benefits.business.title")}
              </h4>
              <p style={{ fontSize: "0.9375rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                {t("landing.benefits.business.description")}
              </p>
            </div>
            <div
              className={`${mounted && (visibleSections.has("benefits") || mounted) ? "fade-in-up delay-600" : mounted ? "scroll-animate" : ""} card-hover`}
              style={{
                padding: "2rem",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
              suppressHydrationWarning
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
                suppressHydrationWarning
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", margin: 0 }}>
                {t("landing.benefits.scalable.title")}
              </h4>
              <p style={{ fontSize: "0.9375rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                {t("landing.benefits.scalable.description")}
              </p>
            </div>
            <div
              className={`${mounted && (visibleSections.has("benefits") || mounted) ? "fade-in-up delay-700" : mounted ? "scroll-animate" : ""} card-hover`}
              style={{
                padding: "2rem",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
              suppressHydrationWarning
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db"
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.08)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
                suppressHydrationWarning
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <h4 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.75rem", margin: 0 }}>
                {t("landing.benefits.results.title")}
              </h4>
              <p style={{ fontSize: "0.9375rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                {t("landing.benefits.results.description")}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div
          style={{
            padding: "6rem 0",
            textAlign: "center",
          }}
          suppressHydrationWarning
        >
          <h3
            className={mounted ? "fade-in-up delay-100" : ""}
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "1rem",
              letterSpacing: "-0.02em",
            }}
            suppressHydrationWarning
          >
            {t("landing.cta.title")}
          </h3>
          <p
            className={mounted ? "fade-in-up delay-200" : ""}
            style={{
              fontSize: "1.25rem",
              color: "#6b7280",
              marginBottom: "2.5rem",
            }}
            suppressHydrationWarning
          >
            {t("landing.cta.description")}
          </p>
          <Link
            href="/auth/login"
            className={mounted ? "fade-in-up delay-300" : ""}
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
              color: "white",
              padding: "1.125rem 3rem",
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "1.0625rem",
              fontWeight: 600,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 8px 24px rgba(17, 24, 39, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #374151 0%, #4b5563 100%)"
              e.currentTarget.style.transform = "translateY(-3px)"
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(17, 24, 39, 0.3)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #111827 0%, #374151 100%)"
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(17, 24, 39, 0.2)"
            }}
            suppressHydrationWarning
          >
            {t("landing.cta.button")}
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "#111827",
          color: "white",
          padding: "3rem 2rem",
          marginTop: "6rem",
          textAlign: "center",
        }}
        suppressHydrationWarning
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }} suppressHydrationWarning>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }} suppressHydrationWarning>
            {t("landing.footer.copyright")}
          </p>
        </div>
      </footer>
      </div>
    )
}

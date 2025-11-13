import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tracking_code: string }> }
) {
  try {
    const supabase = await createClient()
    const { tracking_code } = await params
    const trackingCode = tracking_code.replace(".js", "")

    // Verify tracking code exists
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select("id")
      .eq("tracking_code", trackingCode)
      .single()

    if (error || !quiz) {
      return new NextResponse('console.error("Invalid tracking code");', {
        status: 404,
        headers: {
          "Content-Type": "application/javascript",
        },
      })
    }

    const quizId = quiz.id
    const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    // Generate tracking script
    const script = `
(function() {
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  const QUIZ_ID = "${quizId}";
  const TRACKING_CODE = "${trackingCode}";
  const SESSION_ID = crypto.randomUUID ? crypto.randomUUID() : generateUUID();
  const API_URL = "${apiUrl}";
  
  // Expose to window for lead form widget
  window.QUIZ_ID = QUIZ_ID;
  window.SESSION_ID = SESSION_ID;
  
  let sessionData = {
    quiz_id: QUIZ_ID,
    session_id: SESSION_ID,
    device: getDevice(),
    browser: getBrowser(),
    os: getOS(),
    referrer: document.referrer,
    utm_source: getUTMParam("utm_source"),
    utm_campaign: getUTMParam("utm_campaign"),
    utm_medium: getUTMParam("utm_medium"),
    utm_term: getUTMParam("utm_term"),
    utm_content: getUTMParam("utm_content")
  };
  
  let questionTimings = {};
  let currentQuestion = null;
  let quizStartTime = null;
  let lastActivityTime = Date.now();
  
  // Initialize session
  function initSession() {
    fetch(API_URL + "/api/event", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        session_id: SESSION_ID,
        quiz_id: QUIZ_ID,
        event_type: "quiz_visited",
        ...sessionData
      })
    }).catch(err => console.error("Tracking error:", err));
  }
  
  // Track quiz start
  window.trackQuizStart = function() {
    if (!quizStartTime) {
      quizStartTime = Date.now();
      fetch(API_URL + "/api/event", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          session_id: SESSION_ID,
          quiz_id: QUIZ_ID,
          event_type: "quiz_started",
          created_at: new Date().toISOString()
        })
      }).catch(err => console.error("Tracking error:", err));
    }
  };
  
  // Track question view
  window.trackQuestionView = function(questionId, questionNumber) {
    currentQuestion = { id: questionId, order: questionNumber };
    questionTimings[questionId] = Date.now();
    
    fetch(API_URL + "/api/event", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        session_id: SESSION_ID,
        quiz_id: QUIZ_ID,
        event_type: "question_viewed",
        question_number: questionNumber,
        answer: questionId,
        created_at: new Date().toISOString()
      })
    }).catch(err => console.error("Tracking error:", err));
  };
  
  // Track answer
  window.trackAnswer = function(questionId, answerValue) {
    const timeSpent = Date.now() - (questionTimings[questionId] || Date.now());
    
    fetch(API_URL + "/api/event", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        session_id: SESSION_ID,
        quiz_id: QUIZ_ID,
        event_type: "answer_submitted",
        question_number: currentQuestion?.order,
        answer: answerValue,
        created_at: new Date().toISOString()
      })
    }).catch(err => console.error("Tracking error:", err));
  };
  
  // Track completion
  window.trackQuizComplete = function() {
    const totalTime = Date.now() - quizStartTime;
    fetch(API_URL + "/api/event", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        session_id: SESSION_ID,
        quiz_id: QUIZ_ID,
        event_type: "quiz_completed",
        created_at: new Date().toISOString()
      })
    }).catch(err => console.error("Tracking error:", err));
  };
  
  // Track abandonment
  window.trackAbandon = function(reason = "unknown") {
    const totalTime = Date.now() - (quizStartTime || lastActivityTime);
    fetch(API_URL + "/api/event", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        session_id: SESSION_ID,
        quiz_id: QUIZ_ID,
        event_type: "quiz_abandoned",
        question_number: currentQuestion?.order,
        answer: reason,
        created_at: new Date().toISOString()
      })
    }).catch(err => console.error("Tracking error:", err));
  };
  
  // Utility functions
  function getDevice() {
    return /iPad/.test(navigator.userAgent) ? "tablet" : 
           /Android|webOS|iPhone|IEMobile|Opera Mini/i.test(navigator.userAgent) ? "mobile" : "desktop";
  }
  
  function getBrowser() {
    const ua = navigator.userAgent;
    if (ua.indexOf("Firefox") > -1) return "Firefox";
    if (ua.indexOf("Chrome") > -1) return "Chrome";
    if (ua.indexOf("Safari") > -1) return "Safari";
    if (ua.indexOf("Edge") > -1) return "Edge";
    return "Unknown";
  }
  
  function getOS() {
    if (navigator.userAgent.indexOf("Win") > -1) return "Windows";
    if (navigator.userAgent.indexOf("Mac") > -1) return "MacOS";
    if (navigator.userAgent.indexOf("Linux") > -1) return "Linux";
    if (navigator.userAgent.indexOf("Android") > -1) return "Android";
    if (navigator.userAgent.indexOf("iPhone") > -1) return "iOS";
    return "Unknown";
  }
  
  function getUTMParam(param) {
    const url = new URL(window.location);
    return url.searchParams.get(param) || "";
  }
  
  // Detect unload/abandonment
  window.addEventListener("beforeunload", function() {
    if (quizStartTime && !window.quizCompleted) {
      trackAbandon("page_unload");
    }
  });
  
  // Initialize
  initSession();
})();
`

    return new NextResponse(script, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error generating tracker script:", error)
    return new NextResponse('console.error("Error loading tracker");', {
      status: 500,
      headers: {
        "Content-Type": "application/javascript",
      },
    })
  }
}


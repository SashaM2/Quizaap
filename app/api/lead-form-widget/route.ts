import { NextResponse } from "next/server"

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  // JavaScript code to inject the widget and handle functionality
  const script = `
(function() {
  const API_URL = "${apiUrl}";
  
  // Widget HTML with inline styles matching the template
  const widgetHTML = '<div id="quiz-lead-form-widget" style="display: none; position: fixed; bottom: 20px; right: 20px; background: white; border-radius: 8px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); padding: 20px; width: 100%; max-width: 350px; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, \\'Segoe UI\\', sans-serif;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;"><h3 style="margin: 0; color: #1e40af; font-size: 18px;">Get Your Results</h3><button onclick="closeLeadForm()" style="background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">&times;</button></div><form id="lead-form-inline" style="display: flex; flex-direction: column; gap: 10px;"><input type="text" name="name" placeholder="Your Name" required style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; font-family: inherit;"><input type="email" name="email" placeholder="Your Email" required style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; font-family: inherit;"><input type="tel" name="phone" placeholder="Phone (optional)" style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; font-family: inherit;"><button type="submit" style="padding: 10px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 14px; font-family: inherit;">Get Results</button></form><div id="form-message" style="display: none; margin-top: 10px; padding: 10px; border-radius: 4px; text-align: center; font-size: 14px; font-family: inherit;"></div></div>';
  
  // Inject widget HTML
  const div = document.createElement('div');
  div.innerHTML = widgetHTML;
  document.body.appendChild(div);
  
  // Global functions
  window.showLeadForm = function(quizResult = null) {
    const widget = document.getElementById('quiz-lead-form-widget');
    if (widget) {
      widget.style.display = 'block';
      window.currentQuizResult = quizResult;
    }
  };
  
  window.closeLeadForm = function() {
    const widget = document.getElementById('quiz-lead-form-widget');
    if (widget) {
      widget.style.display = 'none';
    }
  };
  
  // Form submission handler
  const form = document.getElementById('lead-form-inline');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nameInput = form.querySelector('input[name="name"]');
      const emailInput = form.querySelector('input[name="email"]');
      const phoneInput = form.querySelector('input[name="phone"]');
      const messageDiv = document.getElementById('form-message');
      
      if (!nameInput || !emailInput || !messageDiv) return;
      
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput ? phoneInput.value.trim() : '';
      
      if (!name || !email) {
        messageDiv.style.display = 'block';
        messageDiv.style.background = '#fee2e2';
        messageDiv.style.color = '#991b1b';
        messageDiv.textContent = 'Please fill in all required fields.';
        return;
      }
      
      // Get session and quiz IDs from window (set by tracking script)
      const sessionId = window.SESSION_ID || '';
      const quizId = window.QUIZ_ID || '';
      
      try {
        const response = await fetch(API_URL + '/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            quiz_id: quizId,
            name,
            email,
            phone: phone || null,
            quiz_result: window.currentQuizResult || null
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          messageDiv.style.display = 'block';
          messageDiv.style.background = '#d1fae5';
          messageDiv.style.color = '#065f46';
          messageDiv.textContent = 'Thank you! Your lead has been submitted.';
          
          setTimeout(() => {
            window.closeLeadForm();
            form.reset();
            messageDiv.style.display = 'none';
          }, 2000);
        } else {
          throw new Error(result.error || 'Failed to submit lead');
        }
      } catch (error) {
        console.error('Error submitting lead:', error);
        messageDiv.style.display = 'block';
        messageDiv.style.background = '#fee2e2';
        messageDiv.style.color = '#991b1b';
        messageDiv.textContent = 'Error submitting form. Please try again.';
      }
    });
  }
})();
`

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
    },
  })
}


from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
from datetime import datetime
import sqlite3
import json
import uuid
import os
from io import BytesIO
import secrets

app = Flask(__name__)
CORS(app)

# Database initialization
DATABASE = 'quiz_tracker.db'

def init_db():
    """Initialize database with all required tables"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Quizzes table
    c.execute('''CREATE TABLE IF NOT EXISTS quizzes
                 (id TEXT PRIMARY KEY,
                  name TEXT NOT NULL,
                  url TEXT NOT NULL,
                  tracking_code TEXT UNIQUE NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  user_id TEXT)''')
    
    # Sessions table
    c.execute('''CREATE TABLE IF NOT EXISTS sessions
                 (session_id TEXT PRIMARY KEY,
                  quiz_id TEXT NOT NULL,
                  user_id TEXT,
                  device TEXT,
                  browser TEXT,
                  os TEXT,
                  ip_address TEXT,
                  referrer TEXT,
                  utm_source TEXT,
                  timestamp_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(quiz_id) REFERENCES quizzes(id))''')
    
    # Events table
    c.execute('''CREATE TABLE IF NOT EXISTS events
                 (event_id TEXT PRIMARY KEY,
                  session_id TEXT NOT NULL,
                  quiz_id TEXT NOT NULL,
                  event_type TEXT NOT NULL,
                  question_id TEXT,
                  question_order INTEGER,
                  answer_value TEXT,
                  timestamp_event TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  time_spent INTEGER,
                  FOREIGN KEY(session_id) REFERENCES sessions(session_id),
                  FOREIGN KEY(quiz_id) REFERENCES quizzes(id))''')
    
    # Leads table
    c.execute('''CREATE TABLE IF NOT EXISTS leads
                 (lead_id TEXT PRIMARY KEY,
                  session_id TEXT NOT NULL,
                  quiz_id TEXT NOT NULL,
                  name TEXT,
                  email TEXT,
                  phone TEXT,
                  extra_data TEXT,
                  timestamp_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  quiz_result TEXT,
                  FOREIGN KEY(session_id) REFERENCES sessions(session_id),
                  FOREIGN KEY(quiz_id) REFERENCES quizzes(id))''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

@app.route('/api/quiz/register', methods=['POST'])
def register_quiz():
    """Register a new quiz and generate tracking code"""
    data = request.json
    quiz_id = str(uuid.uuid4())
    tracking_code = secrets.token_urlsafe(32)
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''INSERT INTO quizzes (id, name, url, tracking_code)
                 VALUES (?, ?, ?, ?)''',
              (quiz_id, data.get('name', 'Untitled Quiz'), data.get('url', ''), tracking_code))
    conn.commit()
    conn.close()
    
    return jsonify({
        'quiz_id': quiz_id,
        'tracking_code': tracking_code,
        'script_url': f'/api/tracker/{tracking_code}.js'
    }), 201

@app.route('/api/tracker/<tracking_code>.js', methods=['GET'])
def get_tracker_script(tracking_code):
    """Generate dynamic tracking script for the quiz"""
    # Verify tracking code exists
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('SELECT id FROM quizzes WHERE tracking_code = ?', (tracking_code,))
    result = c.fetchone()
    conn.close()
    
    if not result:
        return 'console.error("Invalid tracking code");', 404
    
    quiz_id = result[0]
    
    # Generate tracking script
    script = f'''
(function() {{
  const QUIZ_ID = "{quiz_id}";
  const TRACKING_CODE = "{tracking_code}";
  const SESSION_ID = "{str(uuid.uuid4())}";
  const API_URL = window.location.origin;
  
  let sessionData = {{
    quiz_id: QUIZ_ID,
    session_id: SESSION_ID,
    device: getDevice(),
    browser: getBrowser(),
    os: getOS(),
    ip_address: "",
    referrer: document.referrer,
    utm_source: getUTMParam("utm_source")
  }};
  
  let questionTimings = {{}};
  let currentQuestion = null;
  let quizStartTime = null;
  let lastActivityTime = Date.now();
  
  // Initialize session
  function initSession() {{
    fetch(API_URL + "/api/event", {{
      method: "POST",
      headers: {{"Content-Type": "application/json"}},
      body: JSON.stringify({{
        session_id: SESSION_ID,
        quiz_id: QUIZ_ID,
        event_type: "quiz_visited",
        ...sessionData
      }})
    }}).catch(err => console.error("Tracking error:", err));
  }}
  
  // Track quiz start
  window.trackQuizStart = function() {{
    if (!quizStartTime) {{
      quizStartTime = Date.now();
      fetch(API_URL + "/api/event", {{
        method: "POST",
        headers: {{"Content-Type": "application/json"}},
        body: JSON.stringify({{
          session_id: SESSION_ID,
          quiz_id: QUIZ_ID,
          event_type: "quiz_started",
          timestamp_event: new Date().toISOString()
        }})
      }}).catch(err => console.error("Tracking error:", err));
    }}
  }};
  
  // Track question view
  window.trackQuestionView = function(questionId, questionOrder) {{
    currentQuestion = {{ id: questionId, order: questionOrder }};
    questionTimings[questionId] = Date.now();
    
    fetch(API_URL + "/api/event", {{
      method: "POST",
      headers: {{"Content-Type": "application/json"}},
      body: JSON.stringify({{
        session_id: SESSION_ID,
        quiz_id: QUIZ_ID,
        event_type: "question_viewed",
        question_id: questionId,
        question_order: questionOrder,
        timestamp_event: new Date().toISOString()
      }})
    }}).catch(err => console.error("Tracking error:", err));
  }};
  
  // Track answer
  window.trackAnswer = function(questionId, answerValue) {{
    const timeSpent = Date.now() - (questionTimings[questionId] || Date.now());
    
    fetch(API_URL + "/api/event", {{
      method: "POST",
      headers: {{"Content-Type": "application/json"}},
      body: JSON.stringify({{
        session_id: SESSION_ID,
        quiz_id: QUIZ_ID,
        event_type: "answer_submitted",
        question_id: questionId,
        answer_value: answerValue,
        time_spent: Math.round(timeSpent / 1000),
        timestamp_event: new Date().toISOString()
      }})
    }}).catch(err => console.error("Tracking error:", err));
  }};
  
  // Track completion
  window.trackQuizComplete = function() {{
    const totalTime = Date.now() - quizStartTime;
    fetch(API_URL + "/api/event", {{
      method: "POST",
      headers: {{"Content-Type": "application/json"}},
      body: JSON.stringify({{
        session_id: SESSION_ID,
        quiz_id: QUIZ_ID,
        event_type: "quiz_completed",
        time_spent: Math.round(totalTime / 1000),
        timestamp_event: new Date().toISOString()
      }})
    }}).catch(err => console.error("Tracking error:", err));
  }};
  
  // Track abandonment
  window.trackAbandon = function(reason = "unknown") {{
    const totalTime = Date.now() - (quizStartTime || lastActivityTime);
    fetch(API_URL + "/api/event", {{
      method: "POST",
      headers: {{"Content-Type": "application/json"}},
      body: JSON.stringify({{
        session_id: SESSION_ID,
        quiz_id: QUIZ_ID,
        event_type: "quiz_abandoned",
        question_id: currentQuestion?.id,
        answer_value: reason,
        time_spent: Math.round(totalTime / 1000),
        timestamp_event: new Date().toISOString()
      }})
    }}).catch(err => console.error("Tracking error:", err));
  }};
  
  // Utility functions
  function getDevice() {{
    return /iPad/.test(navigator.userAgent) ? "tablet" : 
           /Android|webOS|iPhone|IEMobile|Opera Mini/i.test(navigator.userAgent) ? "mobile" : "desktop";
  }}
  
  function getBrowser() {{
    const ua = navigator.userAgent;
    if (ua.indexOf("Firefox") > -1) return "Firefox";
    if (ua.indexOf("Chrome") > -1) return "Chrome";
    if (ua.indexOf("Safari") > -1) return "Safari";
    if (ua.indexOf("Edge") > -1) return "Edge";
    return "Unknown";
  }}
  
  function getOS() {{
    if (navigator.userAgent.indexOf("Win") > -1) return "Windows";
    if (navigator.userAgent.indexOf("Mac") > -1) return "MacOS";
    if (navigator.userAgent.indexOf("Linux") > -1) return "Linux";
    if (navigator.userAgent.indexOf("Android") > -1) return "Android";
    if (navigator.userAgent.indexOf("iPhone") > -1) return "iOS";
    return "Unknown";
  }}
  
  function getUTMParam(param) {{
    const url = new URL(window.location);
    return url.searchParams.get(param) || "";
  }}
  
  // Detect unload/abandonment
  window.addEventListener("beforeunload", function() {{
    if (quizStartTime && !window.quizCompleted) {{
      trackAbandon("page_unload");
    }}
  }});
  
  // Initialize
  initSession();
}})();
'''
    
    response = app.make_response(script)
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Cache-Control'] = 'no-cache'
    return response

@app.route('/api/event', methods=['POST'])
def track_event():
    """Track events from quiz"""
    data = request.json
    event_id = str(uuid.uuid4())
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Insert or update session
    if 'session_id' in data and 'quiz_id' in data:
        session_id = data['session_id']
        
        # Check if session exists
        c.execute('SELECT session_id FROM sessions WHERE session_id = ?', (session_id,))
        if not c.fetchone():
            c.execute('''INSERT INTO sessions 
                         (session_id, quiz_id, device, browser, os, ip_address, referrer, utm_source)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                      (session_id, data['quiz_id'], data.get('device'), data.get('browser'),
                       data.get('os'), data.get('ip_address'), data.get('referrer'), data.get('utm_source')))
    
    # Insert event
    c.execute('''INSERT INTO events
                 (event_id, session_id, quiz_id, event_type, question_id, question_order, answer_value, time_spent)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
              (event_id, data.get('session_id'), data.get('quiz_id'), data.get('event_type'),
               data.get('question_id'), data.get('question_order'), data.get('answer_value'), data.get('time_spent')))
    
    conn.commit()
    conn.close()
    
    return jsonify({'event_id': event_id}), 201

@app.route('/api/quiz/<quiz_id>/analytics', methods=['GET'])
def get_analytics(quiz_id):
    """Get comprehensive analytics for a quiz"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Total visits
    c.execute('SELECT COUNT(DISTINCT session_id) FROM sessions WHERE quiz_id = ?', (quiz_id,))
    total_visits = c.fetchone()[0]
    
    # Quiz starts
    c.execute('''SELECT COUNT(DISTINCT session_id) FROM events 
                 WHERE quiz_id = ? AND event_type = "quiz_started"''', (quiz_id,))
    quiz_starts = c.fetchone()[0]
    
    # Quiz completions
    c.execute('''SELECT COUNT(DISTINCT session_id) FROM events
                 WHERE quiz_id = ? AND event_type = "quiz_completed"''', (quiz_id,))
    quiz_completions = c.fetchone()[0]
    
    # Leads
    c.execute('SELECT COUNT(*) FROM leads WHERE quiz_id = ?', (quiz_id,))
    total_leads = c.fetchone()[0]
    
    # Abandonment by question
    c.execute('''SELECT question_id, question_order, COUNT(*) as abandons, AVG(time_spent) as avg_time
                 FROM events WHERE quiz_id = ? AND event_type = "quiz_abandoned"
                 GROUP BY question_id ORDER BY question_order''', (quiz_id,))
    abandonment_data = c.fetchall()
    
    # Question view counts
    c.execute('''SELECT question_id, question_order, COUNT(*) as views
                 FROM events WHERE quiz_id = ? AND event_type = "question_viewed"
                 GROUP BY question_id ORDER BY question_order''', (quiz_id,))
    question_views = {row[0]: row[2] for row in c.fetchall()}
    
    conn.close()
    
    # Calculate rates
    quiz_start_rate = (quiz_starts / total_visits * 100) if total_visits > 0 else 0
    completion_rate = (quiz_completions / quiz_starts * 100) if quiz_starts > 0 else 0
    conversion_rate = (total_leads / total_visits * 100) if total_visits > 0 else 0
    
    # Process abandonment data
    abandonment_list = []
    for q_id, q_order, abandons, avg_time in abandonment_data:
        views = question_views.get(q_id, 0)
        abandon_rate = (abandons / views * 100) if views > 0 else 0
        abandonment_list.append({
            'question_id': q_id,
            'question_order': q_order,
            'views': views,
            'abandons': abandons,
            'abandon_rate': round(abandon_rate, 2),
            'avg_time': round(avg_time, 1) if avg_time else 0
        })
    
    return jsonify({
        'funnel': {
            'total_visits': total_visits,
            'quiz_starts': quiz_starts,
            'quiz_completions': quiz_completions,
            'total_leads': total_leads,
            'quiz_start_rate': round(quiz_start_rate, 2),
            'completion_rate': round(completion_rate, 2),
            'conversion_rate': round(conversion_rate, 2)
        },
        'abandonment': abandonment_list,
        'top_abandonment_questions': sorted(abandonment_list, key=lambda x: x['abandon_rate'], reverse=True)[:3]
    })

@app.route('/api/lead', methods=['POST'])
def submit_lead():
    """Submit lead data"""
    data = request.json
    lead_id = str(uuid.uuid4())
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''INSERT INTO leads
                 (lead_id, session_id, quiz_id, name, email, phone, extra_data, quiz_result)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
              (lead_id, data.get('session_id'), data.get('quiz_id'), data.get('name'),
               data.get('email'), data.get('phone'), json.dumps(data.get('extra_data', {})),
               data.get('quiz_result')))
    conn.commit()
    conn.close()
    
    return jsonify({'lead_id': lead_id}), 201

@app.route('/api/quiz/<quiz_id>/leads', methods=['GET'])
def get_leads(quiz_id):
    """Get all leads for a quiz"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''SELECT lead_id, session_id, name, email, phone, quiz_result, timestamp_submitted
                 FROM leads WHERE quiz_id = ?
                 ORDER BY timestamp_submitted DESC''', (quiz_id,))
    
    leads = []
    for row in c.fetchall():
        leads.append({
            'lead_id': row[0],
            'session_id': row[1],
            'name': row[2],
            'email': row[3],
            'phone': row[4],
            'quiz_result': row[5],
            'timestamp': row[6]
        })
    
    conn.close()
    return jsonify(leads)

@app.route('/api/lead/<lead_id>', methods=['GET'])
def get_lead_details(lead_id):
    """Get detailed lead information"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Get lead info
    c.execute('''SELECT lead_id, session_id, quiz_id, name, email, phone, extra_data, quiz_result, timestamp_submitted
                 FROM leads WHERE lead_id = ?''', (lead_id,))
    lead_row = c.fetchone()
    
    if not lead_row:
        conn.close()
        return jsonify({'error': 'Lead not found'}), 404
    
    # Get session events
    c.execute('''SELECT event_type, question_id, question_order, answer_value, time_spent, timestamp_event
                 FROM events WHERE session_id = ?
                 ORDER BY timestamp_event''', (lead_row[1],))
    events = [{'type': e[0], 'question': e[1], 'order': e[2], 'answer': e[3], 'time': e[4], 'timestamp': e[5]} 
              for e in c.fetchall()]
    
    conn.close()
    
    return jsonify({
        'lead_id': lead_row[0],
        'session_id': lead_row[1],
        'quiz_id': lead_row[2],
        'name': lead_row[3],
        'email': lead_row[4],
        'phone': lead_row[5],
        'extra_data': json.loads(lead_row[6]) if lead_row[6] else {},
        'quiz_result': lead_row[7],
        'timestamp': lead_row[8],
        'user_journey': events
    })

@app.route('/api/quiz/<quiz_id>/leads/export', methods=['GET'])
def export_leads(quiz_id):
    """Export leads as CSV"""
    import csv
    from io import StringIO
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''SELECT name, email, phone, quiz_result, timestamp_submitted
                 FROM leads WHERE quiz_id = ?
                 ORDER BY timestamp_submitted DESC''', (quiz_id,))
    
    leads = c.fetchall()
    conn.close()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['Name', 'Email', 'Phone', 'Quiz Result', 'Submitted At'])
    for lead in leads:
        writer.writerow(lead)
    
    output.seek(0)
    return output.getvalue(), 200, {
        'Content-Disposition': f'attachment; filename=leads_{quiz_id}.csv',
        'Content-Type': 'text/csv'
    }

@app.route('/dashboard', methods=['GET'])
def dashboard():
    """Serve dashboard"""
    return render_template('dashboard.html')

@app.route('/leads', methods=['GET'])
def leads_page():
    """Serve leads management page"""
    return render_template('leads.html')

@app.route('/', methods=['GET'])
def index():
    """Serve home page"""
    return render_template('index.html')

@app.route('/api/lead-form-widget.js', methods=['GET'])
def get_lead_form_widget():
    """Serve embeddable lead form widget"""
    with open('templates/lead-form-widget.html', 'r', encoding='utf-8') as f:
        widget_html = f.read()
    
    # Wrap HTML in JavaScript for embedding
    script = f"""
(function() {{
    const div = document.createElement('div');
    div.innerHTML = `{widget_html}`;
    document.body.appendChild(div);
}})();
"""
    response = app.make_response(script)
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Cache-Control'] = 'no-cache'
    return response

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

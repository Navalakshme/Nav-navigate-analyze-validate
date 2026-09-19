# NAV — Navigate, Analyze, Validate
### AI Candidate Intelligence & Evidence Agent

> **Turn candidate information into confident hiring decisions.**  
> NAV investigates what is supported by evidence, identifies what remains uncertain, and prepares recruiters to validate candidate qualifications through targeted interviews.

---

## 🌟 Core Philosophy
- **Evidence Over Assumptions:** AI maps every requirement to verifiable claims in resumes and interview transcripts.
- **Explainable & Traceable:** Every insight cites exact source documents, sections, and reasoning.
- **Human in the Loop:** NAV **never** makes autonomous hire/reject decisions or computes arbitrary percentage scores. The human recruiter remains the decision-maker.

---

## 🏛️ Architecture & Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Recharts, Zustand
- **Backend:** FastAPI (Python 3.12), Pydantic v2, Uvicorn
- **AI Engine:** Google Gemini 2.0 Flash (`google-generativeai`)
- **Document Parsing:** `pdfplumber`, `python-docx`
- **Database & Storage:** Supabase (PostgreSQL with RLS & Audit Trail)
- **Deployment:** Vercel (Frontend), Railway (Backend)

---

## 🤖 8-Stage Agentic Pipeline

1. **Requirement Analyst:** Parses job descriptions and extracts structured skills, qualifications, experience criteria, and expected evidence.
2. **Candidate Investigator:** Extracts verifiable skills, projects, employment history, and unverified claims from candidate resumes.
3. **Evidence Mapper:** Maps candidate profile against role requirements with status `VERIFIED`, `NEEDS_VALIDATION`, or `MISSING`.
4. **Gap Investigator:** Identifies missing information, weak evidence, and claims needing deeper validation.
5. **Interview Strategist:** Generates role-specific, candidate-tailored interview questions targeting identified gaps.
6. **Follow-Up Agent:** Listens to candidate responses and dynamically generates drill-down follow-up questions for vague answers.
7. **Interview Analyst:** Validates post-interview claims, extracts new evidence, detects contradictions, and spots unanswered areas.
8. **Report Generator:** Assembles standardized recruiter intelligence reports with audit trails and human decision sections.

---

## 🚀 Quickstart (Local Development)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` in `backend/`:
```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://jgufoicvimrnxzytydtm.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_URL=http://localhost:5173
PORT=8000
```

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` in `frontend/`:
```env
VITE_SUPABASE_URL=https://jgufoicvimrnxzytydtm.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

Start Vite dev server:
```bash
npm run dev
```

Visit: `http://localhost:5173`

---

## 🗄️ Database Setup (Supabase)

Run the SQL statements in [`supabase_schema.sql`](./supabase_schema.sql) in the **Supabase SQL Editor**:
- Creates `sessions`, `candidates`, `audit_trail`, and `reports` tables.
- Enables Row Level Security (RLS) policies.

---

## 🚢 Deployment

- **Frontend (Vercel):** Connect your GitHub repo to Vercel, select the `frontend` root directory, set framework preset to `Vite`.
- **Backend (Railway):** Connect your GitHub repo to Railway, set root directory to `backend`, deploy with `railway.toml`.

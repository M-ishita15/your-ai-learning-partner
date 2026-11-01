# Coherence — Your AI Learning Partner

**Learn smarter. Stay in sync with your lectures. Never get spoiled by AI.**

Coherence helps students learn from lecture videos without spoilers. Its AI tutor answers only from the part of the video you have actually watched, cites exact timestamps, and refuses to answer when the information isn't available yet.

It also helps students revise difficult topics, practise mock interviews, take quizzes, and explain concepts in their own words.

> Built for the **AHGV Buildverse Hackathon** — Problem Statement 1: AI Learning Assistant with AI Mock Interview extension.

---

## 🚀 Project Links

- **Live Application:** https://your-ai-learning-partner.lovable.app
- **Source Code:** https://github.com/M-ishita15/your-ai-learning-partner

## 👥 Team CodeHEIST

- Manan Jain
- Ishita Mishra
- Sneha
- Pranjal Sharma

---

## 🎯 1. The Problem

Students spend hours watching educational videos, but often face these problems:

- Finding the exact moment where a concept was explained is difficult.
- Generic AI answers may not be related to the lecture.
- AI can reveal information from parts of a video the student hasn't watched yet.
- Students lack a structured revision system.
- Students rarely practise explaining concepts aloud, which is important for interviews.

## 💡 2. What Coherence Does

Coherence provides an AI-powered learning environment with the following features:

| Feature | Description |
|---|---|
| 🎓 Watched-Only AI Tutor | Answers using only transcript content up to the learner's verified watch position. |
| ⏱️ Timestamp Citations | Every answer references the relevant moments in the lecture. |
| 🛡️ Honest Refusal | Refuses to guess when the watched content doesn't contain the answer. |
| 🔍 Where Later? Hint | Shows where a topic is covered later without revealing its content. |
| 📝 Quizzes | Generates multiple-choice questions for each lesson. |
| 🎤 Mock Interviews | Conducts three AI-generated interview questions and provides a scorecard. |
| 📊 Shareable Scorecard | Provides a public read-only link to interview results. |
| 💬 Explain It Back | Lets students explain concepts in their own words and receive feedback. |
| 🔄 Smart Revision | Uses spaced repetition and flashcards to revisit difficult topics. |
| 📈 Learning History | Tracks previous attempts and learning progress. |
| 📚 Add Your Own Lesson | Generates summaries, topic markers and quizzes from a supplied transcript. |

## 🛠️ 3. Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start |
| Frontend | React 19 |
| Routing | TanStack Router |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI / shadcn-style components |
| Backend & Database | Supabase Postgres via Lovable Cloud |
| Authentication | Supabase Auth |
| AI Integration | Vercel AI SDK |
| AI Gateway | Lovable AI Gateway |
| Validation | Zod |
| Database Migrations | Drizzle |
| Testing | Vitest, Testing Library |
| Deployment | Lovable |

## ⚙️ 4. How the AI Tutor Works

One of Coherence's main features is its watched-only AI tutor.

Unlike conventional AI tutors, Coherence ensures that students receive answers based only on the content they have already watched.

### Workflow

1. The learner asks a question.
2. The server checks the learner's recorded watch progress.
3. Only transcript chunks up to that point are searched.
4. The AI generates an answer using the retrieved excerpts.
5. Every timestamp citation is verified against the original transcript excerpts.
6. Verified answers are displayed with timestamp references.
7. If the answer is unavailable or cannot be verified, the tutor refuses to guess.

This prevents premature spoilers and encourages genuine learning.

## 🖥️ 5. Application Pages

| Route | Function | Access |
|---|---|---|
| `/` | Home, statistics and lessons | Public |
| `/auth` | Sign in / Sign up | Public |
| `/workspace` | Video player, transcript and AI tutor | Required |
| `/interview` | Mock interviews and scorecards | Required |
| `/revise` | Revision queue and flashcards | Required |
| `/history` | Previous attempts and progress trends | Required |
| `/scorecard/:token` | Shared read-only scorecard | Public |

**Demo Lesson:** MIT OpenCourseWare — Quantum Mechanics.

## 🔐 6. Safety & Fairness

Coherence incorporates several security and fairness mechanisms:

- AI prompts and gateway calls run exclusively on the server.
- Transcript and learner inputs are treated as data, not instructions.
- Quiz correctness, interview scores and revision scheduling are handled server-side.
- Shared scorecards use token-scoped, read-only functions.
- Each user is limited to 20 AI requests per 10 minutes.
- AI-generated answers are checked against the actual transcript excerpts.

## 💻 7. Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/M-ishita15/your-ai-learning-partner
```

Navigate to the project directory:

```bash
https://your-ai-learning-partner.lovable.app/
```

Install dependencies:

```bash
npm install --legacy-peer-deps
```

Start the development server:

```bash
npm run dev
```

**Note:** AI features require the server-side AI key configured in Lovable Cloud. Environment variables and local setup details are documented in `SETUP.md`.

For additional technical details, refer to:

- `SETUP.md` — Installation and running instructions.
- `API.md` — Server functions and data.

## ⚠️ 8. Known Limitations

- The sample MIT transcript is not yet the authentic caption file. Replacing it requires an admin account and a supplied transcript.
- Voice input for interview answers has not been verified end-to-end; typed answers are tested.
- AI features require a server-side AI key configured in Lovable Cloud, which is not stored in the repository.

## 🔮 9. Future Scope

Potential improvements include:

- Automatic caption import for any YouTube video.
- PDF and presentation slide support.
- Voice-based mock interviews with spoken feedback.
- Teacher dashboard for class-level learning progress.

---

## 🏛️ Institution

**Maharaja Surajmal Institute of Technology (MSIT)**  
GGSIPU, Delhi, India.

---

*Coherence — Making learning more interactive, structured and personalized.*

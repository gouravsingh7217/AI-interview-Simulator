# 🤖 AI Interview Simulator

An AI-powered interview preparation platform designed to help students and job seekers improve their technical knowledge, communication skills, and interview confidence through personalized mock interviews.

The platform uses the **Mistral AI model** to generate interview questions, evaluate user responses, provide scores, and suggest improved answers with personalized feedback.

## 🚀 Features

- **User Authentication:** Secure registration and login using JWT-based authentication.
- **Resume-Based Interviews:** Generate personalized interview questions based on the user's resume.
- **Topic-Based Interviews:** Practice specific technical subjects such as Python, OOPS, DBMS, and Operating Systems.
- **Job Description-Based Interviews:** Generate relevant interview questions based on a given job description.
- **Company-Based Preparation:** Prepare for interviews based on a selected target company.
- **Mixed Interview Mode:** Practice a combination of technical and general interview questions.
- **AI-Powered Evaluation:** Evaluate user responses and generate scores out of 10.
- **Detailed Feedback:** Identify mistakes and receive suggestions for improving answers.
- **Answer Improvement:** Get AI-generated improved versions of submitted answers.
- **Communication Analysis:** Receive feedback on grammar, clarity, and answer presentation.
- **Interview History:** Review previous interview sessions and track performance.

## 🛠️ Tech Stack

### Frontend
- React.js
- JavaScript
- HTML
- CSS

### Backend
- Python
- FastAPI
- REST APIs

### Database
- MySQL
- PyMySQL

### Authentication & Security
- JWT (JSON Web Tokens)
- Password Hashing

### AI / LLM Integration
- **Mistral AI:** Large Language Model used for generating interview questions, evaluating responses, and providing personalized feedback.
- **LangChain:** Used for integrating and interacting with the language model.
- **Hugging Face:** Used to access the Mistral model.

## 🧠 AI Integration – Mistral AI

The application uses the Mistral AI model as its core intelligence to provide an interactive and personalized mock interview experience.

### How Mistral AI Works in the Project

1. **Question Generation:** Generates relevant interview questions based on the selected interview mode and user-provided information.
2. **Answer Evaluation:** Analyzes user responses to understand their correctness, relevance, and quality.
3. **Scoring:** Generates a score out of 10 based on the quality of the response.
4. **Personalized Feedback:** Identifies mistakes and provides suggestions to improve answers.
5. **Answer Improvement:** Generates improved versions of user responses to demonstrate better ways of answering interview questions.
6. **Communication Feedback:** Evaluates grammar, clarity, and the overall presentation of answers.

Mistral AI helps transform traditional interview preparation into an interactive experience with instant AI-powered evaluation.

## 🏗️ System Architecture

The application follows a frontend-backend architecture.

1. **Frontend (React):** Provides the user interface for authentication, selecting interview modes, answering questions, and viewing feedback.
2. **Backend (FastAPI):** Handles API requests, authentication, interview session management, and communication with the AI model.
3. **Database (MySQL):** Stores user information, interview sessions, responses, and performance-related data.
4. **AI Integration (Mistral AI):** Generates interview questions, evaluates answers, and provides personalized feedback.

## ⚙️ How It Works

1. Register or log in to the application.
2. Select an interview preparation mode:
   - Resume-Based Interview
   - Topic-Based Interview
   - Job Description-Based Interview
   - Company-Based Interview
   - Mixed Interview
3. Start the mock interview.
4. Answer AI-generated interview questions.
5. The backend sends the relevant information and user response to the Mistral AI model.
6. The AI evaluates the response and generates a score and feedback.
7. Receive an improved answer and suggestions.
8. Review previous interview sessions and identify areas for improvement.

## 📂 Project Structure

```text
AI-Interview-Assistant/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
└── README.md
```

## 🔧 Installation and Setup

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd AI-Interview-Assistant
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment.

**Windows:**

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables in your `.env` file, including database credentials, JWT configuration, and AI model access credentials.

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local frontend URL displayed in your terminal.

## 🔐 Security

- JWT-based authentication for protected API endpoints.
- Password hashing for secure password storage.
- Backend validation of incoming requests.
- Environment variables for sensitive configuration.
- Protected endpoints to restrict unauthorized access.

## 🎯 Project Objective

The main objective of this project is to make interview preparation more accessible, interactive, and effective.

By integrating Mistral AI with a modern web application, the platform allows users to practice different types of interviews, receive instant feedback, identify weaknesses, and continuously improve their technical and communication skills.

## 👨‍💻 Author

**Gaurav Singh**

B.Tech – Computer Science and Engineering  
Graphic Era Hill University, Dehradun


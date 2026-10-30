from pydantic import BaseModel, EmailStr


class InterviewRequest(BaseModel):
    message: str
    interview_type: str
    difficulty: str
    follow_up_mode: str


class InterviewAnswer(BaseModel):
    answer: str
    sessionid: str


class AnswerEvaluation(BaseModel):
    grade: float
    feedback: str
    technical_knowledge: str
    communication: str
    grammar: str
    better_answer: str
    next_question: str
    next_difficulty: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
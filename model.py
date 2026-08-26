from pydantic import BaseModel

class InterviewRequest(BaseModel):
    message:str

class InterviewAnswer(BaseModel):
    answer:str
    sessionid:str

class AnswerEvaluation(BaseModel):
    grade: float
    feedback: str
    technical_knowledge: str
    communication: str
    grammar: str
    better_answer: str
    next_question: str

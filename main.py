from fastapi import FastAPI
from model import InterviewRequest ,InterviewAnswer
from service import ask_llm ,llm_evaluation,interview_history,is_end_request,generate_final_report
import uuid
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get('/')
def home():
    return {'message':'ai interviewer is running'}

@app.post('/interview/start')
def InterviewStart(request:InterviewRequest):
    sessionid=str(uuid.uuid4())
    response=ask_llm(sessionid,request.message)
    return {
        "sessionid":sessionid,
        "response":response
    }

@app.post('/interview/answer')
def evaluate_answer(answer:InterviewAnswer):
    if is_end_request(answer.answer):
        report=generate_final_report(answer.sessionid)
        return{
            "message":"interview ended",
            "report": report
        }
    response=llm_evaluation(answer.sessionid,answer.answer)
    return{
        "response":response
        }
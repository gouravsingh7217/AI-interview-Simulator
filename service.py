import os
import json

from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from model import AnswerEvaluation


# ---------------- LOAD ENVIRONMENT VARIABLES ----------------

load_dotenv()

hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")

if not hf_token:
    raise ValueError("HUGGINGFACEHUB_API_TOKEN is missing")


# ---------------- LLM SETUP ----------------

llm = HuggingFaceEndpoint(
    repo_id="Qwen/Qwen3-4B-Instruct-2507",
    task="text-generation",
    huggingfacehub_api_token=hf_token
)

model = ChatHuggingFace(llm=llm)


# ---------------- INTERVIEW START PROMPT ----------------

prompt = PromptTemplate(
    template="""
You are an AI interviewer conducting a technical interview.

The user's interview request is:
{message}

Your task is to understand the user's request and start the interview.

INTERVIEW RULES:

1. Ask exactly ONE interview question at a time.
2. Never ask multiple interview questions in the same response.
3. Start the interview immediately.
4. Do not explain the interview rules to the user.
5. Do not ask the user which difficulty level they want.
6. If the user specifies a difficulty level such as easy, medium, or hard, follow that level.
7. If the user does NOT specify a difficulty level, automatically start with an EASY beginner-level question.
8. Gradually increase the difficulty based on the user's answers.
9. If the user specifies a company, ask questions relevant to that company's interview style.
10. If the user asks for previous-year or company-style questions, ask questions similar in concept and difficulty to those types of questions.
11. Do not give the answer to the question.
12. Wait for the user's answer before evaluating it.
13. After the user answers, the evaluation process will analyze the answer and generate the next question.
14. Keep the interview focused on the topics requested by the user.
15. If multiple topics are requested, cover them one by one.
16. Do not move to another topic too quickly.
17. Questions should be technically accurate and suitable for a real technical interview.

DIFFICULTY PROGRESSION:

If no difficulty is specified:

- Start with an easy/basic question.
- After a good answer, ask a slightly more difficult question.
- After a weak answer, ask another question at a similar or slightly easier level.
- Gradually move from basic concepts to intermediate and advanced concepts.

IMPORTANT:

The FIRST question must be easy if the user has not specified a difficulty level.

For example, if the user says:
"Take my interview on OS"

Do NOT ask:
"What difficulty level do you want?"

Instead, ask something like:
"What is an operating system?"

If the user says:
"Take my interview on DBMS"

Start with a basic DBMS question such as:
"What is a DBMS and why is it used?"

If the user says:
"Take my interview on OS and DBMS"

Start with one easy question from OS or DBMS and ask only that question.

If the user says:
"Take my medium-level interview on OS"

Start directly with a medium-level OS question.

If the user says:
"Take my Cognizant interview on OS and DBMS"

Ask questions relevant to a Cognizant-style technical interview, starting at an appropriate basic level unless the user specifies otherwise.

OUTPUT RULE:

Return ONLY the interview question.

Do not return:
- explanations
- answers
- multiple questions
- difficulty questions
- interview instructions
- evaluation
- feedback

Start the interview now by asking exactly ONE question.
""",
    input_variables=["message"]
)


# ---------------- INTERVIEW HISTORY ----------------

interview_history = {}

chain = prompt | model


# ---------------- START INTERVIEW ----------------

def ask_llm(sessionid: str, message: str):

    response = chain.invoke({
        "message": message
    })

    question = response.content

    interview_history[sessionid] = [
        {
            "question": question,
            "answer": None
        }
    ]

    return question


# ---------------- EVALUATE ANSWER ----------------

def llm_evaluation(sessionid: str, answer: str):

    print("Received session:", sessionid)
    print("Available sessions:", interview_history)

    if sessionid not in interview_history:
        return "Invalid session ID"

    history = interview_history[sessionid]

    last_question = history[-1]["question"]

    history[-1]["answer"] = answer


    evaluation_template = f"""
You are an AI interviewer.

Previous question:
{last_question}

User's answer:
{answer}

Evaluate the user's answer specifically against the previous question.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "grade": 0,
    "feedback": "",
    "technical_knowledge": "",
    "communication": "",
    "grammar": "",
    "better_answer": "",
    "next_question": ""
}}

Rules:

1. grade must be a number from 0 to 10.
2. Evaluate the answer specifically against the previous question.
3. Give useful technical feedback.
4. Give communication feedback.
5. Give grammar feedback.
6. Provide a better version of the answer.
7. next_question must contain exactly ONE interview question.
8. The next question must remain related to the same topic.
9. Do not provide the answer to the next question.
10. Return only JSON.
11. Do not use markdown.
12. Do not wrap the JSON in ```json.
"""


    response = model.invoke(
        evaluation_template
    )


    data = json.loads(
        response.content
    )


    evaluation = AnswerEvaluation(
        **data
    )


    next_question = (
        evaluation.next_question
    )


    history.append(
        {
            "question": next_question,
            "answer": None
        }
    )


    return response


# ---------------- END REQUEST DETECTION ----------------

def is_end_request(message: str):

    end_words = [
        "end interview",
        "end this interview",
        "end my interview",
        "stop interview",
        "stop this interview",
        "finish interview",
        "finish this interview",
        "let's end",
        "lets end",
        "quit interview"
    ]

    message = message.lower()

    return any(
        word in message
        for word in end_words
    )


# ---------------- FINAL REPORT ----------------

def generate_final_report(sessionid: str):

    if sessionid not in interview_history:
        return "Invalid session ID"


    history = interview_history[
        sessionid
    ]


    conversation = ""


    for item in history:

        if item["answer"] is not None:

            conversation += f"""
Question: {item["question"]}
Answer: {item["answer"]}
"""


    report_prompt = f"""
You are an AI interview evaluator.

Below is the complete interview history:

{conversation}

Analyze the candidate's overall interview performance.

Return ONLY valid JSON in this exact structure:

{{
    "overall_score": 0,
    "technical_score": 0,
    "communication_score": 0,
    "grammar_score": 0,
    "strengths": [],
    "weaknesses": [],
    "topics_to_improve": [],
    "final_feedback": ""
}}

Rules:

1. All scores must be from 0 to 10.
2. Evaluate only from the interview history provided.
3. strengths should contain the candidate's strongest areas.
4. weaknesses should contain the areas where the candidate struggled.
5. topics_to_improve should contain technical topics that should be revised.
6. final_feedback should give concise overall advice.
7. Return only valid JSON.
8. Do not use markdown.
"""


    response = model.invoke(
        report_prompt
    )


    print(
        "FINAL REPORT FUNCTION CALLED"
    )

    print(
        "Conversation:",
        conversation
    )

    print(
        "LLM response:",
        response.content
    )


    data = json.loads(
        response.content
    )


    print(
        "Parsed data:",
        data
    )


    return data
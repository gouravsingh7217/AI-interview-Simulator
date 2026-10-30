import os
import json

from dotenv import load_dotenv

from langchain_huggingface import (
    HuggingFaceEndpoint,
    ChatHuggingFace
)

from langchain_core.prompts import (
    ChatPromptTemplate
)


# =========================================================
# ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

HF_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN")

if not HF_TOKEN:
    raise ValueError(
        "HF_TOKEN not found. Add HF_TOKEN to your .env file."
    )


# =========================================================
# HUGGING FACE LLM
# =========================================================

llm = HuggingFaceEndpoint(
    repo_id="deepseek-ai/DeepSeek-V4-Flash-0731",
    task="text-generation",
    huggingfacehub_api_token=HF_TOKEN,
    temperature=0.1,
    max_new_tokens=2000
)

model = ChatHuggingFace(
    llm=llm
)


# =========================================================
# PROMPT
# =========================================================

prompt = ChatPromptTemplate.from_messages([
    (
        "human",
        "{message}"
    )
])


# =========================================================
# CHAINS
# =========================================================

chain = prompt | model

evaluation_chain = prompt | model


# =========================================================
# INTERVIEW HISTORY
# =========================================================

interview_history = {}


# =========================================================
# END INTERVIEW DETECTION
# =========================================================

def is_end_request(answer: str):

    end_commands = [
        "end interview",
        "end my interview",
        "stop interview",
        "finish interview",
        "quit interview",
        "exit interview"
    ]

    cleaned_answer = answer.lower().strip()

    return cleaned_answer in end_commands


# =========================================================
# START INTERVIEW
# =========================================================

def ask_llm(
    sessionid: str,
    message: str,
    interview_type: str,
    difficulty: str,
    follow_up_mode: str
):

    # -----------------------------------------------------
    # PREPARE CONTEXT BASED ON INTERVIEW TYPE
    # -----------------------------------------------------

    if interview_type == "topic":

        context = f"""
Interview type: Topic Based Interview

Topic:
{message}
"""

    elif interview_type == "resume":

        context = f"""
Interview type: Resume Based Interview

Candidate Resume:
{message}
"""

    elif interview_type == "company":

        context = f"""
Interview type: Company Specific Interview

Company:
{message}
"""

    elif interview_type == "jd":

        context = f"""
Interview type: Job Description Based Interview

Job Description:
{message}
"""

    elif interview_type == "mixed":

        context = """
Interview type: Mixed Technical Interview

Topics:
- Data Structures and Algorithms
- Operating Systems
- DBMS
- Computer Networks
- Object-Oriented Programming
"""

    else:

        context = f"""
Interview Context:
{message}
"""


    # -----------------------------------------------------
    # ADAPTIVE STARTING DIFFICULTY
    # -----------------------------------------------------

    if difficulty == "adaptive":

        current_difficulty = "medium"

    else:

        current_difficulty = difficulty


    # -----------------------------------------------------
    # FIRST QUESTION PROMPT
    # -----------------------------------------------------

    prompt_message = f"""
You are an experienced technical interviewer interviewing a
fresher software engineering candidate.

{context}

Current difficulty:
{current_difficulty}

Question style:
{follow_up_mode}


INTERVIEW RULES:

1. Ask ONLY ONE question.

2. Do not provide the answer.

3. Do not provide hints unless necessary.

4. Keep the question appropriate for a fresher candidate.


DIFFICULTY RULES:

Easy:
- Definitions
- Basic concepts
- Simple examples

Medium:
- Conceptual understanding
- Comparisons
- Practical scenarios
- Basic implementation reasoning

Hard:
- Implementation details
- Debugging
- Edge cases
- Architecture
- Trade-offs
- Deep technical reasoning


QUESTION STYLE RULES:

normal:
Ask a normal interview question and move naturally
through the interview.

follow_up:
Questions should probe deeper into concepts discussed
in the candidate's previous answer.

cross:
Challenge the candidate's statements using questions
such as:
- Why?
- How?
- What if?
- What are the trade-offs?
- What happens in this scenario?


INTERVIEW TYPE RULES:

Resume:
Ask questions primarily from:
- Candidate projects
- Technologies
- Architecture
- Implementation
- Technical decisions
- Challenges
- Resume claims

Topic:
Stay within the selected topic.

Company:
Ask fresher-level questions appropriate for the
selected company.

JD:
Focus on technologies, responsibilities and skills
mentioned in the job description.

Mixed:
Ask questions across:
DSA, OS, DBMS, Computer Networks and OOP.


IMPORTANT:

Do not repeat questions.

Start the interview now.

Ask ONLY the FIRST interview question.
"""


    # -----------------------------------------------------
    # CALL LLM
    # -----------------------------------------------------

    response = chain.invoke({
        "message": prompt_message
    })

    question = response.content.strip()


    # -----------------------------------------------------
    # SAVE SESSION
    # -----------------------------------------------------

    interview_history[sessionid] = {

        "interview_type": interview_type,

        "context": message,

        "difficulty": current_difficulty,

        "follow_up_mode": follow_up_mode,

        "questions": [
            {
                "question": question,
                "answer": None
            }
        ]
    }


    return question


# =========================================================
# EVALUATE ANSWER
# =========================================================

def llm_evaluation(
    sessionid: str,
    answer: str
):

    # =====================================================
    # GET SESSION
    # =====================================================

    session = interview_history.get(sessionid)

    if not session:
        return {
            "error": "Invalid session"
        }


    interview_type = session["interview_type"]
    context = session["context"]
    difficulty = session["difficulty"]
    follow_up_mode = session["follow_up_mode"]
    questions = session["questions"]


    # =====================================================
    # GET CURRENT QUESTION
    # =====================================================

    current_question = questions[-1]["question"]


    # =====================================================
    # BUILD PREVIOUS INTERVIEW HISTORY
    # =====================================================

    previous_questions = ""

    for item in questions:

        previous_questions += (
            f"\nQuestion: {item['question']}\n"
        )

        if item["answer"] is not None:

            previous_questions += (
                f"Answer: {item['answer']}\n"
            )


    # =====================================================
    # MAIN EVALUATION PROMPT
    # =====================================================

    evaluation_prompt = f"""
You are an experienced technical interviewer.

Evaluate the candidate's answer.

Interview type:
{interview_type}

Interview context:
{context}

Current difficulty:
{difficulty}

Question style:
{follow_up_mode}

Previous interview:
{previous_questions}

Current question:
{current_question}

Candidate answer:
{answer}


TASK:

Evaluate the candidate's answer and generate the next
interview question.


GRADING:

Give a grade between 0 and 10.

Consider:

- Technical correctness
- Conceptual understanding
- Completeness
- Communication
- Grammar


DIFFICULTY ADAPTATION:

If the answer is strong:

easy -> medium
medium -> hard
hard -> hard


If the answer is partially correct:

Keep approximately the same difficulty.


If the answer is weak:

hard -> medium
medium -> easy
easy -> easy


QUESTION STYLE:

If style is "follow_up":

Generate a question directly related to something
the candidate said in the answer.


If style is "cross":

Challenge the candidate's answer.

Ask things like:

Why?
How?
What if?
What are the trade-offs?
What happens in another scenario?


If style is "normal":

Ask the next relevant interview question normally.


INTERVIEW TYPE RULES:

resume:
Continue asking from the candidate's resume,
projects and technologies.

topic:
Stay within the selected topic.

jd:
Stay focused on the job description.

company:
Ask questions appropriate for that company.

mixed:
Move naturally between DSA, OS, DBMS,
Computer Networks and OOP.


IMPORTANT:

Do NOT repeat previous questions.

Generate exactly ONE next question.

next_difficulty MUST be exactly:

easy

OR

medium

OR

hard


Keep the response concise.

feedback: maximum 2 sentences.

technical_knowledge: maximum 2 sentences.

communication: maximum 1 sentence.

grammar: maximum 1 sentence.

better_answer: maximum 120 words.

next_question: maximum 2 sentences.

Do not give lengthy explanations.

Make sure the complete JSON is finished before ending your response.


Return ONLY valid JSON.

Do NOT use markdown.

Do NOT use ```json.

Use exactly this structure:

{{
    "grade": 0,
    "feedback": "",
    "technical_knowledge": "",
    "communication": "",
    "grammar": "",
    "better_answer": "",
    "next_question": "",
    "next_difficulty": "medium"
}}
"""


    # =====================================================
    # CALL EVALUATION MODEL
    # =====================================================

    response = evaluation_chain.invoke({
        "message": evaluation_prompt
    })

    response_text = response.content.strip()

    print(
        "RAW EVALUATION RESPONSE:",
        repr(response_text)
    )


    # =====================================================
    # RETRY IF MODEL RETURNS EMPTY RESPONSE
    # =====================================================

    if not response_text:

        print(
            "Empty response received. Retrying evaluation..."
        )

        retry_prompt = f"""
Evaluate this technical interview answer.

Question:
{current_question}

Candidate answer:
{answer}

Current difficulty:
{difficulty}


Return ONLY JSON in this exact format:

{{
    "grade": 0,
    "feedback": "",
    "technical_knowledge": "",
    "communication": "",
    "grammar": "",
    "better_answer": "",
    "next_question": "",
    "next_difficulty": "medium"
}}


Rules:

grade must be between 0 and 10.

next_difficulty must be exactly:
easy
medium
or
hard.

Give concise feedback.

Provide a better answer.

Generate exactly one next interview question.

Do not use markdown.

Return JSON only.
"""

        response = evaluation_chain.invoke({
            "message": retry_prompt
        })

        response_text = response.content.strip()

        print(
            "RETRY RESPONSE:",
            repr(response_text)
        )


    # =====================================================
    # IF RESPONSE IS STILL EMPTY
    # =====================================================

    if not response_text:

        raise ValueError(
            "LLM returned an empty response "
            "while evaluating the answer."
        )


    # =====================================================
    # CLEAN MODEL RESPONSE
    # =====================================================

    response_text = response_text.strip()


    # Remove ```json
    if response_text.startswith("```json"):

        response_text = response_text[7:]


    # Remove ```
    elif response_text.startswith("```"):

        response_text = response_text[3:]


    # Remove ending ```
    if response_text.endswith("```"):

        response_text = response_text[:-3]


    response_text = response_text.strip()


    # =====================================================
    # EXTRA JSON CLEANING
    # =====================================================

    # Sometimes model writes text before JSON.
    # Extract only content between first { and last }.

    first_brace = response_text.find("{")
    last_brace = response_text.rfind("}")


    if first_brace != -1 and last_brace != -1:

        response_text = response_text[
            first_brace:last_brace + 1
        ]


    print(
        "CLEANED EVALUATION JSON:",
        repr(response_text)
    )


    # =====================================================
    # PARSE JSON
    # =====================================================

    try:

        evaluation = json.loads(
            response_text
        )

    except json.JSONDecodeError as error:

        print(
            "EVALUATION JSON ERROR:",
            error
        )

        print(
            "RAW JSON TEXT:",
            repr(response_text)
        )

        raise


    # =====================================================
    # VALIDATE / PROVIDE DEFAULT VALUES
    # =====================================================

    evaluation.setdefault(
        "grade",
        0
    )

    evaluation.setdefault(
        "feedback",
        "No feedback generated."
    )

    evaluation.setdefault(
        "technical_knowledge",
        "Not evaluated."
    )

    evaluation.setdefault(
        "communication",
        "Not evaluated."
    )

    evaluation.setdefault(
        "grammar",
        "Not evaluated."
    )

    evaluation.setdefault(
        "better_answer",
        ""
    )

    evaluation.setdefault(
        "next_question",
        ""
    )

    evaluation.setdefault(
        "next_difficulty",
        difficulty
    )


    # =====================================================
    # VALIDATE GRADE
    # =====================================================

    try:

        evaluation["grade"] = float(
            evaluation["grade"]
        )

    except (ValueError, TypeError):

        evaluation["grade"] = 0


    # Keep grade between 0 and 10

    evaluation["grade"] = max(
        0,
        min(
            10,
            evaluation["grade"]
        )
    )


    # =====================================================
    # SAVE CURRENT ANSWER
    # =====================================================

    questions[-1]["answer"] = answer


    # =====================================================
    # UPDATE DIFFICULTY
    # =====================================================

    allowed_difficulties = [
        "easy",
        "medium",
        "hard"
    ]


    next_difficulty = evaluation.get(
        "next_difficulty"
    )


    if next_difficulty not in allowed_difficulties:

        next_difficulty = difficulty

        evaluation[
            "next_difficulty"
        ] = difficulty


    session[
        "difficulty"
    ] = next_difficulty


    # =====================================================
    # SAVE NEXT QUESTION
    # =====================================================

    next_question = evaluation.get(
        "next_question",
        ""
    )


    if next_question:

        questions.append({
            "question": next_question,
            "answer": None
        })


    # =====================================================
    # CONVERT EVALUATION BACK TO JSON
    # =====================================================

    # Your frontend currently expects:
    #
    # data.response.content
    #
    # Therefore we keep response.content.

    response.content = json.dumps(
        evaluation
    )


    # =====================================================
    # DEBUG
    # =====================================================

    print(
        "GRADE:",
        evaluation["grade"]
    )

    print(
        "NEXT DIFFICULTY:",
        evaluation["next_difficulty"]
    )

    print(
        "NEXT QUESTION:",
        evaluation["next_question"]
    )


    # =====================================================
    # RETURN RESPONSE
    # =====================================================

    return response


    # -----------------------------------------------------
    # CALL EVALUATION LLM
    # -----------------------------------------------------

    response = evaluation_chain.invoke({
        "message": evaluation_prompt
    })


    # -----------------------------------------------------
    # CLEAN JSON RESPONSE
    # -----------------------------------------------------

    response_text = response.content.strip()

    if response_text.startswith("```json"):

        response_text = response_text[7:]

    elif response_text.startswith("```"):

        response_text = response_text[3:]


    if response_text.endswith("```"):

        response_text = response_text[:-3]


    response_text = response_text.strip()


    try:

        evaluation = json.loads(
            response_text
        )

    except json.JSONDecodeError as error:

        print(
            "EVALUATION JSON ERROR:",
            error
        )

        print(
            "RAW LLM RESPONSE:",
            response.content
        )

        raise


    # -----------------------------------------------------
    # SAVE ANSWER
    # -----------------------------------------------------

    questions[-1]["answer"] = answer


    # -----------------------------------------------------
    # UPDATE DIFFICULTY
    # -----------------------------------------------------

    allowed_difficulties = [
        "easy",
        "medium",
        "hard"
    ]


    next_difficulty = evaluation.get(
        "next_difficulty"
    )


    if next_difficulty in allowed_difficulties:

        session["difficulty"] = next_difficulty


    # -----------------------------------------------------
    # SAVE NEXT QUESTION
    # -----------------------------------------------------

    next_question = evaluation.get(
        "next_question",
        ""
    )


    if next_question:

        questions.append({
            "question": next_question,
            "answer": None
        })


    # -----------------------------------------------------
    # IMPORTANT:
    # FRONTEND CURRENTLY EXPECTS data.response.content
    # -----------------------------------------------------

    response.content = json.dumps(
        evaluation
    )


    return response


# =========================================================
# FINAL INTERVIEW REPORT
# =========================================================

def generate_final_report(
    sessionid: str
):

    if sessionid not in interview_history:

        return {
            "error": "Invalid session ID"
        }


    session = interview_history[
        sessionid
    ]


    history = session[
        "questions"
    ]


    conversation = ""


    # -----------------------------------------------------
    # BUILD COMPLETE INTERVIEW
    # -----------------------------------------------------

    for item in history:

        if item["answer"] is not None:

            conversation += f"""

Question:
{item["question"]}

Answer:
{item["answer"]}

"""


    if not conversation.strip():

        return {
            "error":
            "No completed interview answers found"
        }


    # -----------------------------------------------------
    # FINAL REPORT PROMPT
    # -----------------------------------------------------

    report_prompt = f"""
You are an AI technical interview evaluator.

Analyze the candidate's complete interview
performance.


Interview type:

{session["interview_type"]}


Original interview context:

{session["context"]}


Final difficulty reached:

{session["difficulty"]}


Question style:

{session["follow_up_mode"]}


COMPLETE INTERVIEW:

{conversation}


Generate the final interview report.


Return ONLY valid JSON.

Do NOT use markdown.

Use exactly this structure:

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


RULES:

1. All scores must be between 0 and 10.

2. Evaluate only based on the interview history.

3. Consider the difficulty of the questions.

4. Consider how the candidate handled
follow-up or cross questions.

5. strengths should contain the candidate's
strongest areas.

6. weaknesses should contain areas where the
candidate struggled.

7. topics_to_improve should contain technical
topics the candidate should revise.

8. final_feedback should be concise and actionable.

9. Return valid JSON only.
"""


    # -----------------------------------------------------
    # CALL MODEL
    # -----------------------------------------------------

    response = model.invoke(
        report_prompt
    )


    response_text = response.content.strip()


    # -----------------------------------------------------
    # REMOVE POSSIBLE MARKDOWN
    # -----------------------------------------------------

    if response_text.startswith("```json"):

        response_text = response_text[7:]

    elif response_text.startswith("```"):

        response_text = response_text[3:]


    if response_text.endswith("```"):

        response_text = response_text[:-3]


    response_text = response_text.strip()


    # -----------------------------------------------------
    # PARSE JSON
    # -----------------------------------------------------

    try:

        data = json.loads(
            response_text
        )

    except json.JSONDecodeError as error:

        print(
            "FINAL REPORT JSON ERROR:",
            error
        )

        print(
            "RAW FINAL REPORT:",
            response.content
        )

        raise


    print(
        "FINAL REPORT FUNCTION CALLED"
    )


    return data
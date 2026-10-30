from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    UploadFile,
    File
)

from fastapi.middleware.cors import CORSMiddleware

from pypdf import PdfReader

import io
import json
import uuid
import schemas


from schemas import (
    InterviewRequest,
    InterviewAnswer,
    RegisterRequest,
    LoginRequest
)


from service import (
    ask_llm,
    llm_evaluation,
    interview_history,
    is_end_request,
    generate_final_report
)


from database import get_connection


from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)



# =========================================================
# DEBUG
# =========================================================

print(
    "USING SCHEMAS FILE:",
    schemas.__file__
)

print(
    "INTERVIEW REQUEST FIELDS:",
    InterviewRequest.model_fields
)



# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="AI Interview Assistant API"
)



# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)



# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "message":
            "AI Interview Assistant is running"
    }



# =========================================================
# RESTORE INTERVIEW SESSION FROM MYSQL
# =========================================================

def restore_interview_session(
    session_id: str
):

    connection = get_connection()

    try:

        with connection.cursor() as cursor:


            # -------------------------------------------------
            # GET INTERVIEW
            # -------------------------------------------------

            cursor.execute(
                """
                SELECT
                    session_id,
                    interview_type,
                    context,
                    difficulty,
                    follow_up_mode,
                    status

                FROM interviews

                WHERE session_id = %s
                """,
                (
                    session_id,
                )
            )


            interview = cursor.fetchone()


            if not interview:

                return None



            # -------------------------------------------------
            # DO NOT RESTORE COMPLETED INTERVIEW
            # -------------------------------------------------

            if (
                interview["status"]
                == "completed"
            ):

                return None



            # -------------------------------------------------
            # GET QUESTIONS
            # -------------------------------------------------

            cursor.execute(
                """
                SELECT
                    question,
                    answer,
                    difficulty

                FROM interview_questions

                WHERE session_id = %s

                ORDER BY id ASC
                """,
                (
                    session_id,
                )
            )


            database_questions = (
                cursor.fetchall()
            )



            # -------------------------------------------------
            # RECREATE SERVICE.PY QUESTION STRUCTURE
            # -------------------------------------------------

            questions = []


            for item in database_questions:

                questions.append(
                    {
                        "question":
                            item["question"],

                        "answer":
                            item["answer"]
                    }
                )



            if not questions:

                return None



            # -------------------------------------------------
            # RECREATE SESSION
            # -------------------------------------------------

            restored_session = {

                "interview_type":
                    interview[
                        "interview_type"
                    ],

                "context":
                    interview[
                        "context"
                    ],

                "difficulty":
                    interview[
                        "difficulty"
                    ],

                "follow_up_mode":
                    interview[
                        "follow_up_mode"
                    ],

                "questions":
                    questions
            }


            print(
                "RESTORED SESSION:",
                session_id
            )


            return restored_session


    finally:

        connection.close()



# =========================================================
# VERIFY INTERVIEW OWNERSHIP
# =========================================================

def verify_interview_owner(
    session_id: str,
    user_id: int
):

    connection = get_connection()

    try:

        with connection.cursor() as cursor:


            cursor.execute(
                """
                SELECT
                    id,
                    status

                FROM interviews

                WHERE session_id = %s
                AND user_id = %s
                """,
                (
                    session_id,
                    user_id
                )
            )


            interview = cursor.fetchone()


            if not interview:

                raise HTTPException(
                    status_code=404,
                    detail=
                        "Interview not found"
                )


            return interview


    finally:

        connection.close()



# =========================================================
# START INTERVIEW
# =========================================================

@app.post("/interview/start")
def start_interview(
    request: InterviewRequest,
    user_id: int = Depends(
        get_current_user
    )
):

    print(
        "INTERVIEW STARTED BY USER:",
        user_id
    )



    # -------------------------------------------------
    # CREATE SESSION ID
    # -------------------------------------------------

    session_id = str(
        uuid.uuid4()
    )



    # -------------------------------------------------
    # GENERATE FIRST QUESTION
    # -------------------------------------------------

    try:

        first_question = ask_llm(
            session_id,
            request.message,
            request.interview_type,
            request.difficulty,
            request.follow_up_mode
        )


    except Exception as error:

        print(
            "START INTERVIEW LLM ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=
                "Unable to generate interview question"
        )



    # -------------------------------------------------
    # GET ACTUAL STARTING DIFFICULTY
    # adaptive -> medium inside service.py
    # -------------------------------------------------

    current_difficulty = (
        interview_history[
            session_id
        ].get(
            "difficulty",
            request.difficulty
        )
    )



    # -------------------------------------------------
    # SAVE INTERVIEW + FIRST QUESTION
    # -------------------------------------------------

    connection = get_connection()


    try:

        with connection.cursor() as cursor:


            # ---------------------------------------------
            # SAVE INTERVIEW
            # ---------------------------------------------

            cursor.execute(
                """
                INSERT INTO interviews
                (
                    user_id,
                    session_id,
                    interview_type,
                    context,
                    difficulty,
                    follow_up_mode,
                    status
                )

                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    user_id,
                    session_id,
                    request.interview_type,
                    request.message,
                    current_difficulty,
                    request.follow_up_mode,
                    "active"
                )
            )



            # ---------------------------------------------
            # SAVE FIRST QUESTION
            # ANSWER NULL = CURRENT PENDING QUESTION
            # ---------------------------------------------

            cursor.execute(
                """
                INSERT INTO interview_questions
                (
                    session_id,
                    question,
                    answer,
                    grade,
                    feedback,
                    difficulty
                )

                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    session_id,
                    first_question,
                    None,
                    None,
                    None,
                    current_difficulty
                )
            )


        connection.commit()


    except Exception as error:

        connection.rollback()


        # Remove session created in RAM
        interview_history.pop(
            session_id,
            None
        )


        print(
            "START INTERVIEW DATABASE ERROR:",
            error
        )


        raise HTTPException(
            status_code=500,
            detail=
                "Unable to save interview"
        )


    finally:

        connection.close()



    return {

        "sessionid":
            session_id,

        "response":
            first_question
    }



# =========================================================
# ANSWER INTERVIEW
# =========================================================

@app.post("/interview/answer")
def evaluate_answer(
    answer: InterviewAnswer,
    user_id: int = Depends(
        get_current_user
    )
):

    print(
        "ANSWER SUBMITTED BY USER:",
        user_id
    )



    # -------------------------------------------------
    # VERIFY OWNERSHIP
    # -------------------------------------------------

    interview = verify_interview_owner(
        answer.sessionid,
        user_id
    )



    # -------------------------------------------------
    # PREVENT ANSWERING COMPLETED INTERVIEW
    # -------------------------------------------------

    if (
        interview["status"]
        == "completed"
    ):

        raise HTTPException(
            status_code=400,
            detail=
                "Interview already completed"
        )



    # =====================================================
    # RESTORE FROM MYSQL IF SERVER RESTARTED
    # =====================================================

    if (
        answer.sessionid
        not in interview_history
    ):

        print(
            "SESSION NOT FOUND IN RAM."
        )

        print(
            "RESTORING SESSION FROM MYSQL..."
        )


        restored_session = (
            restore_interview_session(
                answer.sessionid
            )
        )


        if not restored_session:

            raise HTTPException(
                status_code=404,
                detail=
                    "Unable to restore interview session"
            )


        interview_history[
            answer.sessionid
        ] = restored_session



    session = interview_history.get(
        answer.sessionid
    )


    if not session:

        raise HTTPException(
            status_code=404,
            detail=
                "Interview session not found"
        )



    # =====================================================
    # END INTERVIEW
    # =====================================================

    if is_end_request(
        answer.answer
    ):


        print(
            "ENDING INTERVIEW:",
            answer.sessionid
        )



        # -------------------------------------------------
        # GENERATE FINAL REPORT
        # -------------------------------------------------

        try:

            report = (
                generate_final_report(
                    answer.sessionid
                )
            )


        except Exception as error:

            print(
                "FINAL REPORT ERROR:",
                error
            )

            raise HTTPException(
                status_code=500,
                detail=
                    "Unable to generate final report"
            )



        # -------------------------------------------------
        # MAKE SURE REPORT IS VALID
        # -------------------------------------------------

        if (
            not isinstance(
                report,
                dict
            )
        ):

            raise HTTPException(
                status_code=500,
                detail=
                    "Invalid final report"
            )



        if "error" in report:

            raise HTTPException(
                status_code=400,
                detail=
                    report["error"]
            )



        connection = get_connection()


        try:

            with connection.cursor() as cursor:


                # -----------------------------------------
                # COMPLETE INTERVIEW
                # -----------------------------------------

                cursor.execute(
                    """
                    UPDATE interviews

                    SET status = %s

                    WHERE session_id = %s
                    AND user_id = %s
                    """,
                    (
                        "completed",
                        answer.sessionid,
                        user_id
                    )
                )



                # -----------------------------------------
                # DELETE CURRENT UNANSWERED QUESTION
                # User ended interview instead of answering
                # -----------------------------------------

                cursor.execute(
                    """
                    DELETE FROM
                        interview_questions

                    WHERE session_id = %s
                    AND answer IS NULL
                    """,
                    (
                        answer.sessionid,
                    )
                )



                # -----------------------------------------
                # SAVE FINAL REPORT
                # -----------------------------------------

                cursor.execute(
                    """
                    INSERT INTO interview_reports
                    (
                        session_id,
                        overall_score,
                        technical_score,
                        communication_score,
                        grammar_score,
                        strengths,
                        weaknesses,
                        topics_to_improve,
                        final_feedback
                    )

                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )

                    ON DUPLICATE KEY UPDATE

                        overall_score =
                            VALUES(
                                overall_score
                            ),

                        technical_score =
                            VALUES(
                                technical_score
                            ),

                        communication_score =
                            VALUES(
                                communication_score
                            ),

                        grammar_score =
                            VALUES(
                                grammar_score
                            ),

                        strengths =
                            VALUES(
                                strengths
                            ),

                        weaknesses =
                            VALUES(
                                weaknesses
                            ),

                        topics_to_improve =
                            VALUES(
                                topics_to_improve
                            ),

                        final_feedback =
                            VALUES(
                                final_feedback
                            )
                    """,
                    (
                        answer.sessionid,

                        report.get(
                            "overall_score"
                        ),

                        report.get(
                            "technical_score"
                        ),

                        report.get(
                            "communication_score"
                        ),

                        report.get(
                            "grammar_score"
                        ),

                        json.dumps(
                            report.get(
                                "strengths",
                                []
                            )
                        ),

                        json.dumps(
                            report.get(
                                "weaknesses",
                                []
                            )
                        ),

                        json.dumps(
                            report.get(
                                "topics_to_improve",
                                []
                            )
                        ),

                        report.get(
                            "final_feedback"
                        )
                    )
                )


            connection.commit()


        except Exception as error:

            connection.rollback()

            print(
                "FINAL REPORT DATABASE ERROR:",
                error
            )

            raise HTTPException(
                status_code=500,
                detail=
                    "Unable to save final report"
            )


        finally:

            connection.close()



        # -------------------------------------------------
        # DELETE FINISHED SESSION FROM RAM
        # -------------------------------------------------

        interview_history.pop(
            answer.sessionid,
            None
        )



        return {

            "message":
                "interview ended",

            "report":
                report
        }



    # =====================================================
    # NORMAL ANSWER
    # =====================================================

    questions = session.get(
        "questions",
        []
    )


    if not questions:

        raise HTTPException(
            status_code=400,
            detail=
                "No interview question available"
        )



    # -------------------------------------------------
    # CURRENT QUESTION
    # -------------------------------------------------

    current_question = (
        questions[-1][
            "question"
        ]
    )


    current_difficulty = (
        session.get(
            "difficulty",
            "medium"
        )
    )



    print(
        "CURRENT QUESTION:",
        current_question
    )


    print(
        "CURRENT DIFFICULTY:",
        current_difficulty
    )



    # =====================================================
    # EVALUATE WITH LLM
    # =====================================================

    try:

        response = llm_evaluation(
            answer.sessionid,
            answer.answer
        )


        # Current frontend expects response.content
        evaluation = json.loads(
            response.content
        )


    except json.JSONDecodeError as error:

        print(
            "EVALUATION JSON ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=
                "Invalid evaluation response"
        )


    except Exception as error:

        print(
            "EVALUATION ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=
                "Unable to evaluate answer"
        )



    # -------------------------------------------------
    # NEXT QUESTION
    # -------------------------------------------------

    next_question = (
        evaluation.get(
            "next_question"
        )
    )



    # -------------------------------------------------
    # NEXT DIFFICULTY
    # service.py already updates session difficulty
    # -------------------------------------------------

    next_difficulty = (
        interview_history[
            answer.sessionid
        ].get(
            "difficulty",
            current_difficulty
        )
    )



    print(
        "ANSWER:",
        answer.answer
    )


    print(
        "GRADE:",
        evaluation.get(
            "grade"
        )
    )


    print(
        "NEXT QUESTION:",
        next_question
    )


    print(
        "NEXT DIFFICULTY:",
        next_difficulty
    )



    # =====================================================
    # SAVE ANSWER + NEXT QUESTION
    # =====================================================

    connection = get_connection()


    try:

        with connection.cursor() as cursor:


            # -----------------------------------------
            # FIND PENDING QUESTION
            # -----------------------------------------

            cursor.execute(
                """
                SELECT id

                FROM interview_questions

                WHERE session_id = %s
                AND answer IS NULL

                ORDER BY id DESC

                LIMIT 1
                """,
                (
                    answer.sessionid,
                )
            )


            pending_question = (
                cursor.fetchone()
            )



            # -----------------------------------------
            # UPDATE CURRENT PENDING QUESTION
            # -----------------------------------------

            if pending_question:


                cursor.execute(
                    """
                    UPDATE interview_questions

                    SET
                        answer = %s,
                        grade = %s,
                        feedback = %s,
                        difficulty = %s

                    WHERE id = %s
                    """,
                    (
                        answer.answer,

                        evaluation.get(
                            "grade"
                        ),

                        evaluation.get(
                            "feedback"
                        ),

                        current_difficulty,

                        pending_question[
                            "id"
                        ]
                    )
                )



            # -----------------------------------------
            # FALLBACK FOR OLD INTERVIEWS
            # -----------------------------------------

            else:


                cursor.execute(
                    """
                    INSERT INTO interview_questions
                    (
                        session_id,
                        question,
                        answer,
                        grade,
                        feedback,
                        difficulty
                    )

                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    """,
                    (
                        answer.sessionid,

                        current_question,

                        answer.answer,

                        evaluation.get(
                            "grade"
                        ),

                        evaluation.get(
                            "feedback"
                        ),

                        current_difficulty
                    )
                )



            # -----------------------------------------
            # SAVE NEXT QUESTION AS PENDING
            # -----------------------------------------

            if (
                next_question
                and next_question.strip()
            ):


                cursor.execute(
                    """
                    INSERT INTO interview_questions
                    (
                        session_id,
                        question,
                        answer,
                        grade,
                        feedback,
                        difficulty
                    )

                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    """,
                    (
                        answer.sessionid,
                        next_question,
                        None,
                        None,
                        None,
                        next_difficulty
                    )
                )



            # -----------------------------------------
            # UPDATE INTERVIEW DIFFICULTY
            # -----------------------------------------

            cursor.execute(
                """
                UPDATE interviews

                SET difficulty = %s

                WHERE session_id = %s
                AND user_id = %s
                """,
                (
                    next_difficulty,
                    answer.sessionid,
                    user_id
                )
            )


        connection.commit()


        print(
            "ANSWER SAVED SUCCESSFULLY"
        )



    except Exception as error:

        connection.rollback()


        print(
            "ANSWER DATABASE ERROR:",
            error
        )


        raise HTTPException(
            status_code=500,
            detail=
                "Unable to save interview answer"
        )


    finally:

        connection.close()



    return {

        "response":
            response
    }



# =========================================================
# REGISTER
# =========================================================

@app.post("/auth/register")
def register(
    user: RegisterRequest
):

    connection = get_connection()


    try:

        with connection.cursor() as cursor:


            # -----------------------------------------
            # CHECK EXISTING USER
            # -----------------------------------------

            cursor.execute(
                """
                SELECT id

                FROM users

                WHERE email = %s
                """,
                (
                    user.email,
                )
            )


            existing_user = (
                cursor.fetchone()
            )


            if existing_user:

                raise HTTPException(
                    status_code=400,
                    detail=
                        "Email already registered"
                )



            # -----------------------------------------
            # HASH PASSWORD
            # -----------------------------------------

            hashed_password = (
                hash_password(
                    user.password
                )
            )



            # -----------------------------------------
            # CREATE USER
            # -----------------------------------------

            cursor.execute(
                """
                INSERT INTO users
                (
                    name,
                    email,
                    password_hash
                )

                VALUES
                (
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    user.name,
                    user.email,
                    hashed_password
                )
            )


        connection.commit()



        return {
            "message":
                "User registered successfully"
        }


    except HTTPException:

        connection.rollback()

        raise


    except Exception as error:

        connection.rollback()

        print(
            "REGISTER ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=
                "Unable to register user"
        )


    finally:

        connection.close()



# =========================================================
# LOGIN
# =========================================================

@app.post("/auth/login")
def login(
    user: LoginRequest
):

    connection = get_connection()


    try:

        with connection.cursor() as cursor:


            cursor.execute(
                """
                SELECT
                    id,
                    name,
                    email,
                    password_hash

                FROM users

                WHERE email = %s
                """,
                (
                    user.email,
                )
            )


            existing_user = (
                cursor.fetchone()
            )



            if not existing_user:

                raise HTTPException(
                    status_code=401,
                    detail=
                        "Invalid email or password"
                )



            password_correct = (
                verify_password(
                    user.password,
                    existing_user[
                        "password_hash"
                    ]
                )
            )



            if not password_correct:

                raise HTTPException(
                    status_code=401,
                    detail=
                        "Invalid email or password"
                )



            access_token = (
                create_access_token(
                    existing_user[
                        "id"
                    ]
                )
            )



            return {

                "access_token":
                    access_token,

                "token_type":
                    "bearer"
            }


    finally:

        connection.close()



# =========================================================
# PROTECTED TEST
# =========================================================

@app.get("/protected")
def protected_route(
    user_id: int = Depends(
        get_current_user
    )
):

    return {

        "message":
            "You are authenticated",

        "user_id":
            user_id
    }



# =========================================================
# CURRENT USER
# =========================================================

@app.get("/me")
def get_me(
    user_id: int = Depends(
        get_current_user
    )
):

    connection = get_connection()


    try:

        with connection.cursor() as cursor:


            cursor.execute(
                """
                SELECT
                    id,
                    name,
                    email

                FROM users

                WHERE id = %s
                """,
                (
                    user_id,
                )
            )


            user = cursor.fetchone()



            if not user:

                raise HTTPException(
                    status_code=404,
                    detail=
                        "User not found"
                )



            return user


    finally:

        connection.close()



# =========================================================
# RESUME UPLOAD
# =========================================================

@app.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: int = Depends(
        get_current_user
    )
):

    print(
        "RESUME UPLOADED BY USER:",
        user_id
    )



    # -------------------------------------------------
    # ONLY PDF
    # -------------------------------------------------

    if (
        file.content_type
        != "application/pdf"
    ):

        raise HTTPException(
            status_code=400,
            detail=
                "Only PDF files are supported"
        )



    try:

        contents = await file.read()


        pdf = PdfReader(
            io.BytesIO(
                contents
            )
        )


        resume_text = ""



        for page in pdf.pages:


            text = (
                page.extract_text()
            )


            if text:

                resume_text += (
                    text + "\n"
                )



        if not resume_text.strip():

            raise HTTPException(
                status_code=400,
                detail=
                    "Could not extract text from resume"
            )



        return {

            "filename":
                file.filename,

            "resume_text":
                resume_text
        }



    except HTTPException:

        raise



    except Exception as error:

        print(
            "RESUME UPLOAD ERROR:",
            error
        )


        raise HTTPException(
            status_code=500,
            detail=
                "Unable to process resume"
        )



# =========================================================
# GET PREVIOUS INTERVIEWS
# =========================================================

@app.get("/interviews")
def get_interviews(
    user_id: int = Depends(
        get_current_user
    )
):

    connection = get_connection()


    try:

        with connection.cursor() as cursor:


            cursor.execute(
                """
                SELECT
                    i.id,
                    i.session_id,
                    i.interview_type,
                    i.context,
                    i.difficulty,
                    i.follow_up_mode,
                    i.status,
                    i.created_at,
                    r.overall_score

                FROM interviews AS i

                LEFT JOIN
                    interview_reports AS r

                ON
                    i.session_id =
                    r.session_id

                WHERE
                    i.user_id = %s

                ORDER BY
                    i.created_at DESC
                """,
                (
                    user_id,
                )
            )


            interviews = (
                cursor.fetchall()
            )


    finally:

        connection.close()



    return {

        "interviews":
            interviews
    }



# =========================================================
# GET INTERVIEW DETAILS
# =========================================================

@app.get(
    "/interviews/{session_id}"
)
def get_interview_details(
    session_id: str,
    user_id: int = Depends(
        get_current_user
    )
):

    connection = get_connection()


    try:

        with connection.cursor() as cursor:


            # -----------------------------------------
            # INTERVIEW INFORMATION
            # -----------------------------------------

            cursor.execute(
                """
                SELECT
                    id,
                    session_id,
                    interview_type,
                    context,
                    difficulty,
                    follow_up_mode,
                    status,
                    created_at

                FROM interviews

                WHERE session_id = %s
                AND user_id = %s
                """,
                (
                    session_id,
                    user_id
                )
            )


            interview = (
                cursor.fetchone()
            )



            if not interview:

                raise HTTPException(
                    status_code=404,
                    detail=
                        "Interview not found"
                )



            # -----------------------------------------
            # ANSWERED QUESTIONS
            # -----------------------------------------

            cursor.execute(
                """
                SELECT
                    id,
                    question,
                    answer,
                    grade,
                    feedback,
                    difficulty,
                    created_at

                FROM interview_questions

                WHERE session_id = %s
                AND answer IS NOT NULL

                ORDER BY id ASC
                """,
                (
                    session_id,
                )
            )


            questions = (
                cursor.fetchall()
            )



            # -----------------------------------------
            # FINAL REPORT
            # -----------------------------------------

            cursor.execute(
                """
                SELECT
                    overall_score,
                    technical_score,
                    communication_score,
                    grammar_score,
                    strengths,
                    weaknesses,
                    topics_to_improve,
                    final_feedback,
                    created_at

                FROM interview_reports

                WHERE session_id = %s
                """,
                (
                    session_id,
                )
            )


            report = (
                cursor.fetchone()
            )



            # -----------------------------------------
            # CONVERT JSON STRINGS TO PYTHON LISTS
            # -----------------------------------------

            if report:


                # Strengths
                try:

                    report[
                        "strengths"
                    ] = json.loads(
                        report.get(
                            "strengths"
                        )
                        or "[]"
                    )

                except (
                    json.JSONDecodeError,
                    TypeError
                ):

                    report[
                        "strengths"
                    ] = []



                # Weaknesses
                try:

                    report[
                        "weaknesses"
                    ] = json.loads(
                        report.get(
                            "weaknesses"
                        )
                        or "[]"
                    )

                except (
                    json.JSONDecodeError,
                    TypeError
                ):

                    report[
                        "weaknesses"
                    ] = []



                # Topics
                try:

                    report[
                        "topics_to_improve"
                    ] = json.loads(
                        report.get(
                            "topics_to_improve"
                        )
                        or "[]"
                    )

                except (
                    json.JSONDecodeError,
                    TypeError
                ):

                    report[
                        "topics_to_improve"
                    ] = []



    finally:

        connection.close()



    return {

        "interview":
            interview,

        "questions":
            questions,

        "report":
            report
    }
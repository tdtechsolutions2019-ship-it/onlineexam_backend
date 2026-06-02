const db = require("../../../db");
const { sendResponse } = require("../../../helper/response");
const { getMongoDB } = require("../../../mongo");

const getQuestion = async (req, res) => {
  const { language, examid } = req.query;

  try {
    let queField = "question_en";
    let optField = "option_en";

    if (language === "gujrati") {
      queField = "question_gu";
      optField = "option_gu";
    }
    //Fecth exam info

    const [exam] = await db.query(
      "SELECT id,title,duration FROM exam Where id = ?",
      [examid],
    );
    if (exam.length === 0)
      return res.status(404).json({ message: "Exam not found" });

    //Fetch Questions
    const [questions] = await db.query(
      `SELECT id,${queField} as question FROM question_description WHERE exam_id = ?`,
      [examid],
    );

    //Fetch Options
    for (let q of questions) {
      const [opts] = await db.query(
        `SELECT id, ${optField} as optionText FROM options WHERE question_id = ?`,
        [q.id],
      );
      q.options = opts;
    }

    res.status(200).json({
      message: "Questions fetched successfully",
      language: language || "english",
      duration: exam[0].duration,
      examTitle: exam[0].title,
      data: questions,
    });
  } catch (error) {
    console.log("errorrr ----->", error);
  }
};

const getAllExam = async (req, res) => {
  try {
    const [exam] = await db.query("SELECT id,title,duration FROM exam");
    res.status(200).json({
      message: "Exam details",
      data: exam,
    });
  } catch (error) {
    console.log("errorrr", error);
  }
};

//---------old code----------

// const saveAttampt = async (req, res) => {
//   const { session_id, student_id, examId } = req.body;

//   try {
//     const mongo = getMongoDB();

//     // get answers
//     const examData = await mongo.collection("saveAnswer").findOne({
//       session_id,
//       student_id,
//       userexamId: examId,
//     });

//     // get question order/session data
//     const sessionData = await mongo.collection("exam_sessions").findOne({
//       session_id,
//       student_id,
//     });

//     if (!examData) {
//       return sendResponse(res, 404, "Exam session not found");
//     }

//     const { userexamId, answers, examdate } = examData;

//     // question IDs from session
//     const questionOrder = sessionData?.question_order || [];

//     const insertData = [];

//     for (const questionId in answers) {
//       const ans = answers[questionId];

//       insertData.push([
//         userexamId,
//         questionId,
//         ans.answer,
//         ans.timeTaken,
//         ans.totalTimeTaken,
//         examdate,
//         "1",
//         new Date(),
//         JSON.stringify(questionOrder), // save once in each row
//       ]);
//     }

//     await db.query(
//       `
//       INSERT INTO userexam
//       (
//         ExamLoginID,
//         QuestionID,
//         AnswerID,
//         TimeTaken,
//         totalTimeTaken,
//         examdate,
//         isExamFinished,
//         Examendtime,
//         questions
//       )
//       VALUES ?
//       `,
//       [insertData],
//     );

//     await mongo.collection("exam_sessions").deleteOne({ session_id });
//     await mongo.collection("saveAnswer").deleteOne({ session_id });

//     return sendResponse(res, 200, "Exam submitted successfully");
//   } catch (error) {
//     console.log(error);
//     return sendResponse(res, 500, "Internal Server Error");
//   }
// };

//---------- New code without unblock student------------

// const saveAttampt = async (req, res) => {
//   const { session_id, student_id, examId } = req.body;

//   try {
//     const mongo = getMongoDB();

//     const examData = await mongo.collection("saveAnswer").findOne({
//       session_id,
//       student_id,
//       userexamId: examId,
//     });

//     const sessionData = await mongo.collection("exam_sessions").findOne({
//       session_id,
//       student_id,
//     });

//     if (!examData) {
//       return sendResponse(res, 404, "Exam session not found");
//     }

//     const { userexamId, answers, examdate } = examData;

//     const questionOrder = sessionData?.question_order || [];

//     const insertData = [];

//     for (const questionId in answers) {
//       const ans = answers[questionId];

//       insertData.push([
//         userexamId,
//         questionId,
//         ans.answer,
//         ans.timeTaken,
//         ans.totalTimeTaken,
//         examdate,
//         "1",
//         new Date(),
//         JSON.stringify(questionOrder),
//       ]);
//     }

//     // save answers
//     await db.query(
//       `
//       INSERT INTO userexam
//       (
//         ExamLoginID,
//         QuestionID,
//         AnswerID,
//         TimeTaken,
//         totalTimeTaken,
//         examdate,
//         isExamFinished,
//         Examendtime,
//         questions
//       )
//       VALUES ?
//       `,
//       [insertData],
//     );

//     // generate report automatically
//     await db.query(`CALL GenerateExamSummary(?)`, [userexamId]);

//     // cleanup
//     await mongo.collection("exam_sessions").deleteOne({ session_id });

//     await mongo.collection("saveAnswer").deleteOne({ session_id });

//     return sendResponse(res, 200, "Exam submitted successfully");
//   } catch (error) {
//     console.log(error);

//     return sendResponse(res, 500, "Internal Server Error");
//   }
// };

//---------- New code with unblock student------------
const saveAttampt = async (req, res) => {
  const { session_id, student_id, examId } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const mongo = getMongoDB();

    const examData = await mongo.collection("saveAnswer").findOne({
      session_id,
      student_id,
      userexamId: examId,
    });

    const sessionData = await mongo.collection("exam_sessions").findOne({
      session_id,
      student_id,
    });

    if (!examData) {
      await connection.rollback();
      return sendResponse(res, 404, "Exam session not found");
    }

    const { userexamId, answers, examdate } = examData;

    const questionOrder = sessionData?.question_order || [];

    const insertData = [];

    for (const questionId in answers) {
      const ans = answers[questionId];

      insertData.push([
        userexamId,
        questionId,
        ans.answer,
        ans.timeTaken,
        ans.totalTimeTaken,
        examdate,
        "1",
        new Date(),
        JSON.stringify(questionOrder),
      ]);
    }

    // Save answers
    await connection.query(
      `INSERT INTO userexam
      (
        ExamLoginID,
        QuestionID,
        AnswerID,
        TimeTaken,
        totalTimeTaken,
        examdate,
        isExamFinished,
        Examendtime,
        questions
      )
      VALUES ?`,
      [insertData],
    );

    // Generate result report
    await connection.query(`CALL GenerateExamSummary(?)`, [userexamId]);

    // Unblock student
    await connection.query(
      `UPDATE student
       SET isblocked = ?, updated_at = NOW()
       WHERE id = ?`,
      [0, student_id],
    );

    // Store release history
    await connection.query(
      `INSERT INTO releasehistory
      (student_id, releaseDate)
      VALUES (?, CURDATE())`,
      [student_id],
    );

    await connection.commit();

    // Mongo cleanup after SQL success
    await mongo.collection("exam_sessions").deleteOne({ session_id });

    await mongo.collection("saveAnswer").deleteOne({ session_id });

    return sendResponse(res, 200, "Exam submitted successfully");
  } catch (error) {
    await connection.rollback();

    console.log(error);

    return sendResponse(res, 500, "Internal Server Error");
  } finally {
    connection.release();
  }
};

const GetQuestions = async (req, res) => {
  const { studentId, language_id } = req.params; // ✅ Fixed typo
  console.log("language_id", language_id);
  try {
    /* 1️⃣ Get complexity setting */
    const [setting] = await db.query(
      `SELECT value 
       FROM setting 
       WHERE isdeleted = '0' 
       AND \`key\` = 'complexityLevel'`,
    );

    if (!setting.length || !setting[0].value) {
      return sendResponse(res, 404, "Complexity setting not found", null);
    }

    let complexity;
    try {
      complexity = JSON.parse(setting[0].value);
    } catch (e) {
      return sendResponse(res, 500, "Invalid complexity setting format", null);
    }

    /* 2️⃣ Get student's course subjects + weightage */
    const [subjects] = await db.query(
      `SELECT 
          cs.subject_id,
          cs.no_of_questions,
          ci.exam_duration_in_hours
       FROM student s
       JOIN course_subject_weightage cs 
            ON s.course_code = cs.course_id
       JOIN course_info ci 
            ON ci.id = s.course_code
       WHERE s.id = ?
       AND s.isdeleted = '0'`,
      [studentId],
    );

    if (!subjects.length) {
      return sendResponse(res, 404, "No subjects found for student", null);
    }

    const examDuration = subjects[0].exam_duration_in_hours;

    /* 3️⃣ Build dynamic UNION ALL query — single DB call instead of nested loops */
    const unionParts = [];
    const params = [];

    for (const subject of subjects) {
      const total = subject.no_of_questions;

      // ✅ Use remainder for difficult to avoid rounding mismatch
      const easyCount = Math.round((total * complexity.easy) / 100);
      const moderateCount = Math.round((total * complexity.moderate) / 100);
      const difficultCount = total - easyCount - moderateCount;

      const levels = [
        { level: "easy", count: easyCount },
        { level: "moderate", count: moderateCount },
        { level: "difficult", count: difficultCount },
      ];

      for (const lvl of levels) {
        if (lvl.count <= 0) continue; // ✅ skip zero or negative

        unionParts.push(`
          (SELECT 
              q.subject_id,
              q.id         AS question_id,
              qd.question,
              qd.option1,
              qd.option2,
              qd.option3,
              qd.option4,
              q.weightage
           FROM question q
           JOIN question_description qd 
                ON q.id = qd.question_id
           WHERE q.subject_id = ?
           AND   qd.language_id = ?
           AND   q.weightage  = ?
           AND   q.isdeleted  = '0'
           ORDER BY RAND()
           LIMIT ?)`);

        params.push(subject.subject_id, language_id, lvl.level, lvl.count);
      }
    }

    if (!unionParts.length) {
      return sendResponse(res, 404, "No questions configured", null);
    }

    /* 4️⃣ Execute single query */
    const finalQuery = unionParts.join(" UNION ALL ");
    const [allQuestions] = await db.query(finalQuery, params);

    if (!allQuestions.length) {
      return sendResponse(res, 404, "No questions found", null);
    }

    /* 5️⃣ Format response */
    const response = {
      exam_duration_in_hours: examDuration,
      total_questions: allQuestions.length,
      language_id: language_id,
      questions: allQuestions.map((q) => ({
        subject_id: q.subject_id,
        question_id: q.question_id,
        question: q.question,
        options: [q.option1, q.option2, q.option3, q.option4],
      })),
    };

    return sendResponse(res, 200, "Questions fetched successfully", response);
  } catch (error) {
    console.error("GetQuestions error:", error);
    return sendResponse(res, 500, "Internal Server Error", null);
  }
};

const ResumeExam = async (req, res) => {
  const { session_id, student_id, examId } = req.params;

  try {
    const mongo = getMongoDB();

    // 1️⃣ get session
    const sessionData = await mongo
      .collection("exam_sessions")
      .findOne({ session_id });

    // 2️⃣ get answers
    const answerData = await mongo
      .collection("saveAnswer")
      .findOne({ session_id });

    if (!sessionData) {
      return sendResponse(res, 404, "Session not found");
    }

    const { question_order, exam_duration_in_hours, created_at } = sessionData;

    // 3️⃣ fetch questions from mysql
    const [questions] = await db.query(
      `SELECT 
          q.subject_id,
          q.id AS question_id,
          qd.question,
          qd.option1,
          qd.option2,
          qd.option3,
          qd.option4
       FROM question q
       JOIN question_description qd
       ON q.id = qd.question_id
       WHERE q.id IN (?)`,
      [question_order],
    );

    // 4️⃣ keep same order
    const orderedQuestions = question_order.map((id) => {
      const q = questions.find((x) => x.question_id === id);

      return {
        subject_id: q.subject_id,
        question_id: q.question_id,
        question: q.question,
        options: [q.option1, q.option2, q.option3, q.option4].filter(
          (opt) => opt && opt.trim() !== "",
        ),
      };
    });

    // 5️⃣ detect current question
    const answeredQuestions = answerData?.answers
      ? Object.keys(answerData.answers).map(Number)
      : [];

    let current_question = 0;

    if (answeredQuestions.length > 0) {
      const lastAnsweredId = answeredQuestions[answeredQuestions.length - 1];
      current_question = question_order.indexOf(lastAnsweredId) + 1;
    }

    // 6️⃣ calculate remaining time
    const startTime = new Date(created_at).getTime();
    const totalExamTime = exam_duration_in_hours * 3600; // 2 hours = 7200 sec

    let usedTime = 0;

    if (answerData?.answers) {
      usedTime = Object.values(answerData.answers).reduce(
        (sum, ans) => sum + (ans.timeTaken || 0),
        0,
      );
    }

    const remainingTime = totalExamTime - usedTime;

    const now = Date.now();
    const passed = Math.floor((now - startTime) / 1000);

    // const remainingTime = totalTime - passed;

    return sendResponse(res, 200, "Resume exam", {
      exam_duration_in_hours,
      total_questions: orderedQuestions.length,
      questions: orderedQuestions,
      answers: answerData?.answers || {},
      remaining_time: remainingTime > 0 ? remainingTime : 0,
      current_question,
    });
  } catch (error) {
    console.log(error);
    return sendResponse(res, 500, "Internal Server Error");
  }
};

module.exports = {
  getQuestion,
  saveAttampt,
  getAllExam,
  GetQuestions,
  ResumeExam,
};

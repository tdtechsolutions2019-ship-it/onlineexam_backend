const { v4: uuidv4 } = require("uuid");
const { getMongoDB } = require("../../mongo");
const { sendResponse } = require("../../helper/response");

const StoreQuestions = async (req, res) => {
  const { userId, student_id, questions, exam_duration_in_hours, sessionId } =
    req.body;

  try {
    const questionOrder = questions.map((q) => q.question_id);

    const mongo = getMongoDB();

    await mongo.collection("exam_sessions").insertOne({
      session_id: sessionId,
      userId,
      student_id,
      exam_duration_in_hours,
      question_order: questionOrder,
      created_at: new Date(),
    });

    res.json({
      session_id: sessionId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Start exam failed" });
  }
};

const SaveAnswer = async (req, res) => {
  const {
    session_id,
    userexamId,
    questionId,
    answerId,
    timeTaken,
    totalTimeTaken,
    student_id,
    examdate,
  } = req.body;

  try {
    const mongo = getMongoDB();
  
    const existingSession = await mongo
      .collection("saveAnswer")
      .findOne({ session_id: session_id });

    
    // 👉 If session does not exist → INSERT
    if (!existingSession) {
      await mongo.collection("saveAnswer").insertOne({
        session_id: session_id,
        userexamId: userexamId,
        student_id: student_id,
        examdate: examdate,
        answers: {
          [questionId]: {
            answer: answerId,
            timeTaken: timeTaken,
            totalTimeTaken: totalTimeTaken,
          },
        },
      });
    }

    // 👉 If session exists → UPDATE
    else {
      await mongo.collection("saveAnswer").updateOne(
        { session_id: session_id },
        {
          $set: {
            [`answers.${questionId}`]: {
              answer: answerId,
              timeTaken: timeTaken,
              totalTimeTaken: totalTimeTaken,
            },
          },
        },
      );
    }

    return sendResponse(res, 200, "Answer saved successfully");
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};
module.exports = { StoreQuestions, SaveAnswer };

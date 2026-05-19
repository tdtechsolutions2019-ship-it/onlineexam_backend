const db = require("../../db");
const { QuestionQuery } = require("../../helper/queries");
const { sendResponse } = require("../../helper/response");

// rows = result from SQL query
const formatQuestionData = (rows) => {
  if (!rows.length) return null;

  const first = rows[0];
  console.log("first", first);
  const obj = {
    question_type: first.question_type,
    subject_id: first.subject_id,
    weightage: first.weightage,
    status: first.status,
    answer: first.answer ?? "",
    translations: rows.map((row) => ({
      language_id: row.language_id,
      question: row.question,
      option1: row.option1,
      option2: row.option2,
      option3: row.option3,
      option4: row.option4,
      sameasenglish: row.sameasenglish, // true for all except English
    })),
  };

  return obj;
};

// Separate function to get options based on question type
const getOptionsByType = (question_type, translation) => {
  switch (parseInt(question_type)) {
    case 1: // MCQ
      return {
        option1: translation.option1,
        option2: translation.option2,
        option3: translation.option3,
        option4: translation.option4,
      };
    case 2: // True/False
      return {
        option1: translation.option1,
        option2: translation.option2,
        option3: null,
        option4: null,
      };
    case 3: // Descriptive
      return {
        option1: null,
        option2: null,
        option3: null,
        option4: null,
      };
    default:
      return {
        option1: null,
        option2: null,
        option3: null,
        option4: null,
      };
  }
};
const addQuestion = async (req, res) => {
  const { question_type, subject_id, weightage, status, answer, translations } =
    req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(QuestionQuery.addQuestion, [
      question_type,
      subject_id,
      weightage,
      status,
      answer,
    ]);

    const que_id = result.insertId;
    for (const translation of translations) {
      console.log("translation", translation.question);
      if (translation.question !== "") {
        console.log("translation", translation);
        await connection.query(QuestionQuery.addqueinqdescription, [
          que_id,
          translation.question,
          translation.option1,
          translation.option2,
          translation.option3,
          translation.option4,
          translation.language_id,
          answer,
          translation.sameasenglish === true ? "1" : "0",
        ]);
      }
    }
    await connection.commit();
    return sendResponse(res, 200, "Question Added Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const getQuestion = async (req, res) => {
  try {
    const [result] = await db.query(QuestionQuery.getquestions);
    return sendResponse(res, 200, "Get All Question Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const getQuestionCSV = async (req, res) => {
  try {
    const [result] = await db.query(QuestionQuery.getquestions);

    // CSV Header
    let csv = "id,question,subject_name,question_type,status\n";

    // Convert rows
    result.forEach((row) => {
      csv += `${row.id},"${row.question}","${row.subject_name}",${row.question_type},${row.status}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("questions.csv");

    return res.send(csv);
  } catch (error) {
    console.log("error", error);
    return res.status(500).send("Server Error");
  }
};

const getQuestionById = async (req, res) => {
  const { id } = req.params;
  try {
    const [matchId] = await db.query(QuestionQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Question is not found");
    }
    const [question] = await db.query(QuestionQuery.getQuestionbyid, [id]);

    const result = formatQuestionData(question);

    return sendResponse(res, 200, "Get Question Successfully!!", result);
  } catch (error) {
    console.log("Error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { question_type, subject_id, weightage, status, answer, translations } =
    req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [matchId] = await connection.query(QuestionQuery.MatchId, [id]);

    if (matchId.length === 0) {
      return sendResponse(res, 400, "Question is not found");
    }
    const [updatequestion] = await connection.query(
      QuestionQuery.updateQuestion,
      [question_type, subject_id, weightage, status, id],
    );

    for (const translation of translations) {
      if (translation.question === "") continue;

      const [matchLanguageid] = await connection.query(
        QuestionQuery.MatchIdLanguageId,
        [id, translation.language_id],
      );

      const { option1, option2, option3, option4 } = getOptionsByType(
        question_type,
        translation,
      );

      if (matchLanguageid.length > 0) {
        // Record exists — UPDATE
        await connection.query(QuestionQuery.updatequedescription, [
          translation.question,
          option1,
          option2,
          option3,
          option4,
          answer,
          translation.sameasenglish === true ? "1" : "0",
          id,
          translation.language_id,
        ]);
      } else {
        // Record missing — INSERT
        await connection.query(QuestionQuery.addqueinqdescription, [
          id,
          translation.question,
          option1,
          option2,
          option3,
          option4,
          translation.language_id,
          answer,
          translation.sameasenglish === true ? "1" : "0",
        ]);
      }
    }
    await connection.commit();
    return sendResponse(res, 200, "Question Updated Successfully!!");
  } catch (error) {
    await connection.rollback();
    console.log("Error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const deleteQuestion = async (req, res) => {
  const { id } = req.params;
  try {
    const [matchId] = await db.query(QuestionQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Question is not found");
    }
    const [deletequestion] = await db.query(QuestionQuery.deleteQuestion, [id]);
    const [deletequestiondescription] = await db.query(
      QuestionQuery.deletequedescription,
      [id],
    );
    return sendResponse(res, 200, "Question Deleted Successfully!!");
  } catch (error) {
    console.log("Error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

module.exports = {
  addQuestion,
  getQuestion,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionCSV,
};

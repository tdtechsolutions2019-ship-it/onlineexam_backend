const db = require("../db");
const multer = require("multer");
const xlsx = require("xlsx");
const { sendResponse } = require("../helper/response");
const { QuestionQuery } = require("../helper/queries");
const languageMap = {
  English: 1,
  Gujarati: 2,
  Hindi: 3,
};

const uploadFile = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return sendResponse(res, 400, "No file uploaded");
    }

    // ✅ Correct method
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return sendResponse(res, 400, "No data found in file");
    }

    // ✅ Fetch countries
    const [countries] = await db.execute(
      "SELECT id, country_name FROM country",
    );

    const countryMap = {};
    countries.forEach((c) => {
      countryMap[c.country_name.toLowerCase()] = c.id;
    });

    const values = [];

    data.forEach((row, index) => {
      if (!row.country_name || !row.state_name) {
        throw new Error(`Missing data at row ${index + 2}`);
      }

      const countryId = countryMap[row.country_name.trim().toLowerCase()];

      if (!countryId) {
        throw new Error(
          `Invalid country '${row.country_name}' at row ${index + 2}`,
        );
      }
      let statusValue = "1"; // default

      if (row.status !== undefined && row.status !== null) {
        const statusStr = String(row.status).toLowerCase().trim();
        statusValue = "1";

        // if (statusStr === "active" || statusStr === "1") {
        // } else if (statusStr === "inactive" || statusStr === "0") {
        //   statusValue = "0";
        // } else {
        //   throw new Error(`Invalid status '${row.status}' at row ${index + 2}`);
        // }
      }
      values.push([
        countryId,
        row.state_name.trim(),
        row.gst_code ? row.gst_code.trim() : null,
        statusValue,
      ]);
    });
    const placeholders = values.map(() => "(?, ?, ?, ?)").join(",");
    const flatValues = values.flat();

    // ✅ Insert AFTER processing
    const query = `
      INSERT INTO states (country_id, state_name, gst_code, status)
      VALUES ${placeholders}
    `;

    const [result] = await db.execute(query, flatValues);

    return sendResponse(res, 200, "Data inserted successfully", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, error.message || "Server Error");
  }
};

const uploadQuestionFile = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const [historyResult] = await connection.query(
      `
      INSERT INTO question_import_history
      (file_name,total_rows,valid_rows,invalid_rows,created_by)
      VALUES(?,?,?,?,?)
      `,
      [req.file.originalname, 0, 0, 0, req.user?.id || 1],
    );

    const importId = historyResult.insertId;

    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
    });

    let groupedQuestions = {};
    const invalidQuestionCodes = new Set();
    const uniqueQuestions = new Set();

    const sheetNames = ["English", "Gujarati", "Hindi"];

    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];

      if (!sheet) continue;

      const rows = xlsx.utils.sheet_to_json(sheet);

      // MAX 100 questions per sheet
      if (rows.length > 100) {
        return sendResponse(
          res,
          400,
          `${sheetName} sheet exceeds maximum limit of 100 questions`,
        );
      }

      for (const row of rows) {
        try {
          const code = row.question_code?.toString().trim();

          if (!code) {
            throw new Error("Question code missing");
          }

          uniqueQuestions.add(code);

          let question_type = row.question_type
            ?.toString()
            .trim()
            .toLowerCase();

          let weightage_type = row.weightage?.toString().trim().toLowerCase();

          const questionTypeMap = {
            mcq: "1",
            truefalse: "2",
            "true false": "2",
            descriptive: "3",
          };

          const weightageTypeMap = {
            easy: "Easy",
            moderate: "Moderate",
            difficult: "Difficult",
          };

          question_type = questionTypeMap[question_type];

          if (!question_type) {
            throw new Error("Invalid Question Type");
          }

          weightage_type = weightageTypeMap[weightage_type];

          if (!weightage_type) {
            throw new Error("Invalid Weightage Type");
          }

          if (row.question_type?.trim().toLowerCase() === "mcq") {
            if (!row.option1 || !row.option2 || !row.option3 || !row.option4) {
              throw new Error("MCQ options missing");
            }
          }

          if (row.question_type?.trim().toLowerCase() === "truefalse") {
            if (!row.option1 || !row.option2) {
              throw new Error("True/False options missing");
            }
          }

          if (invalidQuestionCodes.has(code)) {
            continue;
          }

          if (!groupedQuestions[code]) {
            groupedQuestions[code] = {
              question_type,
              subject_id: row.subject_id,

              weightage: weightage_type,

              status: row.status,

              answer: row.answer,

              translations: [],
            };
          }

          let option1 = row.option1 || null;

          let option2 = row.option2 || null;

          let option3 = row.option3 || null;

          let option4 = row.option4 || null;

          if (question_type == "3") {
            option1 = null;
            option2 = null;
            option3 = null;
            option4 = null;
          }

          if (question_type == "2") {
            option1 = "True";
            option2 = "False";
            option3 = null;
            option4 = null;
          }

          groupedQuestions[code].translations.push({
            question: row.question,
            option1,
            option2,
            option3,
            option4,
            language_id: languageMap[sheetName],
            sameasenglish: "0",
          });
        } catch (error) {
          const code = row.question_code?.toString().trim();

          if (code && !invalidQuestionCodes.has(code)) {
            invalidQuestionCodes.add(code);

            invalidRows++;
          }

          delete groupedQuestions[code];

          await connection.query(
            `
            INSERT INTO
            question_import_details
            (
              import_id,
              row_no,
              question_text,
              status,
              message
            )
            VALUES
            (?,?,?,?,?)
            `,
            [
              importId,
              uniqueQuestions.size,
              row.question || "",
              "Failed",
              error.message,
            ],
          );
        }
      }
    }

    for (const key in groupedQuestions) {
      if (invalidQuestionCodes.has(key)) continue;

      try {
        const questionData = groupedQuestions[key];

        const [result] = await connection.query(QuestionQuery.addQuestion, [
          questionData.question_type,
          questionData.subject_id,
          questionData.weightage,
          questionData.status,
          questionData.answer,
        ]);

        const que_id = result.insertId;

        for (const translation of questionData.translations) {
          await connection.query(QuestionQuery.addqueinqdescription, [
            que_id,
            translation.question,
            translation.option1,
            translation.option2,
            translation.option3,
            translation.option4,
            translation.language_id,
            questionData.answer,
            translation.sameasenglish,
          ]);
        }

        validRows++;
      } catch (error) {
        if (!invalidQuestionCodes.has(key)) {
          invalidRows++;
        }
      }
    }

    totalRows = uniqueQuestions.size;

    await connection.query(
      `
      UPDATE question_import_history
      SET
      total_rows=?,
      valid_rows=?,
      invalid_rows=?
      WHERE id=?
      `,
      [totalRows, validRows, invalidRows, importId],
    );

    return sendResponse(
      res,
      200,
      `${validRows} questions imported, ${invalidRows} failed`,
    );
  } catch (error) {
    console.log(error);

    return sendResponse(res, 500, error.message);
  } finally {
    connection.release();
  }
};

const getImportHistoryforque = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const [result] = await connection.query(
      `SELECT * FROM question_import_history`,
    );
    return sendResponse(res, 200, "Get Import History Successfully!!", result);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  } finally {
    connection.release();
  }
};
const getImportHistorydetailsforque = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    const [result] = await connection.query(
      `SELECT * FROM question_import_details WHERE import_id = ?`,
      [id],
    );
    return sendResponse(
      res,
      200,
      "Get Import HistoryDetails Successfully!!",
      result,
    );
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, error.message);
  } finally {
    connection.release();
  }
};

module.exports = {
  uploadFile,
  uploadQuestionFile,
  getImportHistoryforque,
  getImportHistorydetailsforque,
};

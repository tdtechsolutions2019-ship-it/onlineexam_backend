const db = require("../../db");
const { sendResponse } = require("../../helper/response");

const getExamReports = async (req, res) => {
  const { exam_date, exam_time, center_id } = req.query;

  try {
    let whereConditions = [];
    let queryParams = [];

    // Dynamic filters
    if (exam_date) {
      whereConditions.push("exs.exam_date = ?");
      queryParams.push(exam_date);
    }

    if (exam_time) {
      whereConditions.push("exs.exam_time = ?");
      queryParams.push(exam_time);
    }

    if (center_id) {
      whereConditions.push("exs.center_id = ?");
      queryParams.push(center_id);
    }

    const query = `
SELECT 
    ex.id AS exam_login_id,
    s.id,
    s.identity_no,
    s.student_name,
    s.registration_month,
    s.registration_year,
    exs.exam_date,
    exs.exam_time,
    ex.student_id,
    c.center_name,
    c.center_code,
    cs.course_name,
    cs.course_code,

    MAX(uex.Examendtime) AS Examendtime

FROM exam_login ex

INNER JOIN exam_schedule exs 
    ON ex.schedule_id = exs.id

INNER JOIN student s 
    ON s.id = ex.student_id

INNER JOIN center_info c 
    ON c.id = exs.center_id

INNER JOIN course_info cs
    ON s.course_code = cs.id    

LEFT JOIN userexam uex
    ON uex.ExamLoginId = ex.id

WHERE EXISTS (
    SELECT 1
    FROM userexam ue
    WHERE ue.ExamLoginId = ex.id
)

${whereConditions.length > 0 ? `AND ${whereConditions.join(" AND ")}` : ""}

GROUP BY
    ex.id,
    s.id,
    s.identity_no,
    s.student_name,
    s.registration_month,
    s.registration_year,
    exs.exam_date,
    exs.exam_time,
    ex.student_id,
    c.center_name,
    c.center_code,
    cs.course_name,
    cs.course_code

ORDER BY exs.exam_date DESC
`;

    const [rows] = await db.query(query, queryParams);
    return sendResponse(res, 200, "Get StudentList Successfully!!", rows);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const getAppearReports = async (req, res) => {
  const { exam_date, center_id, course_id, status } = req.query;

  try {
    let whereConditions = [];
    let queryParams = [];

    whereConditions.push("s.isblocked = '1'");
    // Exam Date Filter
    if (exam_date) {
      whereConditions.push("exs.exam_date = ?");
      queryParams.push(exam_date);
    }

    // Center Filter
    if (center_id) {
      whereConditions.push("exs.center_id = ?");
      queryParams.push(center_id);
    }

    // Course Filter
    if (course_id) {
      whereConditions.push("cs.id = ?");
      queryParams.push(course_id);
    }

    // Status Filter
    if (status === "Appeared") {
      whereConditions.push("uex.ExamLoginId IS NOT NULL");
    }

    if (status === "Not Appeared") {
      whereConditions.push("uex.ExamLoginId IS NULL");
    }

    const query = `
      SELECT 
          ex.id AS exam_login_id,
          s.id,
          s.identity_no,
          s.student_name,
          s.registration_month,
          s.registration_year,
          exs.exam_date,
          exs.exam_time,
          ex.student_id,
          c.center_name,
          c.center_code,
          cs.course_name,
          cs.course_code,

          MAX(uex.Examendtime) AS Examendtime,

          CASE 
              WHEN COUNT(uex.ExamLoginId) > 0
              THEN 'Appeared'
              ELSE 'Not Appeared'
          END AS exam_status

      FROM exam_login ex

      INNER JOIN exam_schedule exs 
          ON ex.schedule_id = exs.id

      INNER JOIN student s 
          ON s.id = ex.student_id

      INNER JOIN center_info c 
          ON c.id = exs.center_id

      INNER JOIN course_info cs
          ON s.course_code = cs.id    

      LEFT JOIN userexam uex
          ON uex.ExamLoginId = ex.id

      ${
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : ""
      }

      GROUP BY
          ex.id,
          s.id,
          s.identity_no,
          s.student_name,
          s.registration_month,
          s.registration_year,
          exs.exam_date,
          exs.exam_time,
          ex.student_id,
          c.center_name,
          c.center_code,
          cs.course_name,
          cs.course_code

      ORDER BY exs.exam_date DESC
    `;

    const [rows] = await db.query(query, queryParams);

    return sendResponse(res, 200, "Get Student List Successfully!!", rows);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const releaseStudent = async (req, res) => {
  const { studentslist } = req.body;
  console.log("studentslist", studentslist);
  try {
    for (const student_id of studentslist) {
      const [result] = await db.query(
        `UPDATE student SET isblocked = ?, updated_at = NOW() WHERE id = ?`,
        ["0", student_id.student_id],
      );

      const [result1] = await db.query(
        `INSERT INTO releasehistory (student_id, releaseDate) VALUES (?, CURDATE())`,
        [student_id.student_id],
      );
    }
    return sendResponse(res, 200, "Students are released successfully");
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const reschedualStudent = async (req, res) => {
  const { center_id } = req.params;
  console.log("center_id", center_id);
  try {
    const [result] = await db.query(
      `SELECT
    s.id AS student_id,
    s.identity_no,
    s.student_name,
    s.registration_month,
    s.registration_year,
    s.course_code,
    rh.releaseDate,
    er.new_exam_date,
    er.new_exam_time,
    ci.course_name,
    ci.course_code,
    cen.center_name
FROM student s
JOIN exam_reschedule_history er
    ON er.student_id = s.id
LEFT JOIN releasehistory rh
    ON rh.student_id = s.id
LEFT JOIN course_info ci ON ci.id = s.course_code   
LEFT JOIN  center_info cen ON cen.id = s.center_code
WHERE er.center_id= ? `,
      [center_id],
    );
    return sendResponse(res, 200, "Get StudentList Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

// const resultReport = async (req, res) => {
//   const { start_date, exam_scheduale_date, center_id, course_id, student_id } =
//     req.query;

//   try {
//     let whereConditions = [];
//     let queryParams = [];

//     whereConditions.push("ue.isExamFinished='1'");

//     // Student filter
//     if (student_id) {
//       whereConditions.push("s.id = ?");
//       queryParams.push(student_id);
//     }

//     // Center filter
//     if (center_id) {
//       whereConditions.push("cen.id = ?");
//       queryParams.push(center_id);
//     }

//     // Course filter
//     if (course_id) {
//       whereConditions.push("ci.id = ?");
//       queryParams.push(course_id);
//     }

//     // Exam schedule date filter
//     if (exam_scheduale_date) {
//       whereConditions.push("DATE(es.exam_date)=?");
//       queryParams.push(exam_scheduale_date);
//     }

//     // Start date filter
//     if (start_date) {
//       whereConditions.push("DATE(ue.Examendtime)>=?");
//       queryParams.push(start_date);
//     }

//     const whereClause =
//       whereConditions.length > 0
//         ? `WHERE ${whereConditions.join(" AND ")}`
//         : "";

//     const query = `
// SELECT
//     s.id AS student_id,
//     s.identity_no,
//     s.student_name,
//     s.course_code,

//     ci.course_name,

//     cen.center_name,
//     cen.center_code,

//     el.schedule_id,
//     es.exam_time,

//     MAX(JSON_LENGTH(ue.questions)) AS total_questions,

//     ci.total_marks,

//     COUNT(DISTINCT ue.QuestionId) AS attempted_questions,

//     COUNT(
//         DISTINCT CASE
//             WHEN q.question_type='Descriptive'
//             THEN ue.QuestionId
//         END
//     ) AS descriptive_questions,

//     SUM(
//         CASE
//             WHEN ue.AnswerId = qd.answer
//             THEN 1
//             ELSE 0
//         END
//     ) AS correct_answers,

//     SUM(
//         CASE
//             WHEN ue.AnswerId <> qd.answer
//                  AND ue.AnswerId IS NOT NULL
//             THEN 1
//             ELSE 0
//         END
//     ) AS wrong_answers,

//     SUM(
//         CASE
//             WHEN ue.AnswerId = qd.answer
//             THEN 1
//             ELSE 0
//         END
//     ) AS obtained_marks,

//     ROUND(
//         (
//             SUM(
//                 CASE
//                     WHEN ue.AnswerId = qd.answer
//                     THEN 1
//                     ELSE 0
//                 END
//             )
//             /
//             NULLIF(MAX(JSON_LENGTH(ue.questions)),0)
//         ) * 100,
//         2
//     ) AS percentage,

//     MAX(ue.Examendtime) AS Examendtime,

//     el.id AS ExamLoginId

// FROM student s

// INNER JOIN exam_login el
//     ON el.student_id = s.id

// LEFT JOIN exam_schedule es
//     ON es.id = el.schedule_id

// INNER JOIN userexam ue
//     ON ue.ExamLoginId = el.id

// LEFT JOIN question q
//     ON q.id = ue.QuestionId

// LEFT JOIN (
//     SELECT
//         question_id,
//         MAX(answer) AS answer
//     FROM question_description
//     GROUP BY question_id
// ) qd
// ON qd.question_id = ue.QuestionId

// LEFT JOIN course_info ci
//     ON ci.id = s.course_code

// LEFT JOIN center_info cen
//     ON cen.id = s.center_code

// ${whereClause}

// GROUP BY
//     s.id,
//     s.identity_no,
//     s.student_name,
//     s.course_code,
//     ci.course_name,
//     cen.center_name,
//     cen.center_code,
//     el.schedule_id,
//     es.exam_time,
//     ci.total_marks,
//     el.id
// `;

//     const [result] = await db.query(query, queryParams);

//     return sendResponse(res, 200, "Get StudentList Successfully!!", result);
//   } catch (error) {
//     console.log("error", error);
//     return sendResponse(res, 500, "Server Error", error);
//   }
// };


const resultReport = async (req, res) => {
  const { start_date, exam_scheduale_date, center_id, course_id, student_id } =
    req.query;

  try {
    let whereConditions = [];
    let queryParams = [];

    if (student_id) {
      whereConditions.push("s.id = ?");
      queryParams.push(student_id);
    }

    if (center_id) {
      whereConditions.push("cen.id = ?");
      queryParams.push(center_id);
    }

    if (course_id) {
      whereConditions.push("ci.id = ?");
      queryParams.push(course_id);
    }

    if (exam_scheduale_date) {
      whereConditions.push("DATE(es.exam_date)=?");
      queryParams.push(exam_scheduale_date);
    }

    if (start_date) {
      whereConditions.push("DATE(ue.Examendtime)>=?");
      queryParams.push(start_date);
    }

    whereConditions.push("ue.isExamFinished='1'");

    const whereClause = whereConditions.length
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    const query = `

SELECT

    s.id AS student_id,

    s.identity_no,

    s.student_name,

    s.course_code,

    ci.course_name,

    cen.center_name,

    cen.center_code,

    el.schedule_id,

    es.exam_time,

    MAX(JSON_LENGTH(ue.questions))
    AS total_questions,

    ci.total_marks,

    COALESCE(
      srr.attempted_questions,
      0
    ) AS attempted_questions,

    COALESCE(
      srr.correct_answers,
      0
    ) AS correct_answers,

    (
      COALESCE(
        srr.attempted_questions,
        0
      )
      -
      COALESCE(
        srr.correct_answers,
        0
      )
    ) AS wrong_answers,

    COALESCE(
      srr.correct_answers,
      0
    ) AS obtained_marks,

    ROUND(
      (
        COALESCE(
          srr.correct_answers,
          0
        )
        /
        NULLIF(
          MAX(JSON_LENGTH(ue.questions)),
          0
        )
      ) * 100,
      2
    ) AS percentage,

    MAX(ue.Examendtime)
    AS Examendtime,

    el.id AS ExamLoginId


FROM student s

INNER JOIN exam_login el
ON el.student_id=s.id

INNER JOIN userexam ue
ON ue.ExamLoginId=el.id


LEFT JOIN
(
    SELECT

        student_login,

        SUM(attempted_que)
        AS attempted_questions,

        SUM(correct_ans)
        AS correct_answers

    FROM save_result_report

    GROUP BY student_login

) srr

ON srr.student_login=el.id


LEFT JOIN exam_schedule es
ON es.id=el.schedule_id

LEFT JOIN course_info ci
ON ci.id=s.course_code

LEFT JOIN center_info cen
ON cen.id=s.center_code

${whereClause}

GROUP BY

s.id,
s.identity_no,
s.student_name,
s.course_code,
ci.course_name,
cen.center_name,
cen.center_code,
el.schedule_id,
es.exam_time,
ci.total_marks,
el.id,
srr.attempted_questions,
srr.correct_answers

`;

    const [result] = await db.query(query, queryParams);

    return sendResponse(res, 200, "Get StudentList Successfully!!", result);
  } catch (error) {
    console.log("resultReport error:", error);

    return sendResponse(res, 500, "Server Error", error);
  }
};
const downloadController = async (req, res) => {
  // 1. Destructure ExamLoginId from the POST request body
  const { ExamLoginId } = req.body;

  try {
    if (!ExamLoginId) {
      return sendResponse(res, 400, "Exam Login ID is required", null);
    }

    const sql = `
      SELECT 
    ue.ExamLoginId,
    ue.QuestionId,
    ue.AnswerId,

    q.question,
    q.option1,
    q.option2,
    q.option3,
    q.option4,

    q.answer AS correct_answer

FROM userexam ue

JOIN (
    SELECT
        question_id,
        MAX(question) AS question,
        MAX(option1) AS option1,
        MAX(option2) AS option2,
        MAX(option3) AS option3,
        MAX(option4) AS option4,
        MAX(answer) AS answer
    FROM question_description
    GROUP BY question_id
) q
ON ue.QuestionId = q.question_id

WHERE ue.ExamLoginId = '8';
    `;
    // const sql = `
    //   SELECT
    //       ue.ExamLoginId,
    //       ue.QuestionId,
    //       ue.AnswerId,
    //       q.question,
    //       q.option1,
    //       q.option2,
    //       q.option3,
    //       q.option4,
    //       q.Answer AS correct_answer
    //   FROM userexam ue
    //   JOIN question_description q
    //       ON ue.QuestionId = q.question_id
    //   WHERE ue.ExamLoginId = ?;
    // `;

    // Execute database query
    const [rows] = await db.query(sql, [ExamLoginId]);

    if (!rows || rows.length === 0) {
      return sendResponse(res, 404, "No exam data found for this ID", null);
    }

    // 💡 Helper function to strip out HTML tags using Regex
    const stripHtml = (htmlString) => {
      if (!htmlString) return "";
      // Removes anything matching <...>, then trims whitespace
      return htmlString.replace(/<[^>]*>/g, "").trim();
    };

    // Format data and clean HTML tags for Excel compliance
    const formattedData = rows.map((item) => ({
      question: stripHtml(item.question),
      option1: stripHtml(item.option1),
      option2: stripHtml(item.option2),
      option3: stripHtml(item.option3),
      option4: stripHtml(item.option4),
      selected_answer: item.AnswerId,
      correct_answer: item.correct_answer,
      // String comparison protection for database variations
      is_correct: String(item.AnswerId) === String(item.correct_answer),
    }));

    // Send cleaned success response
    return sendResponse(res, 200, "Download Success", formattedData);
  } catch (error) {
    console.error("Download Error:", error);
    return sendResponse(res, 500, "Internal Server Error", error.message);
  }
};

const ViewResultReport = async (req, res) => {
  const { ExamLoginid } = req.params;
  try {
    const [result] = await db.query(
      `
SELECT
          srr.subject_id,

          sub.subject_name,

          tq.total_questions,

          srr.attempted_que
          AS attempted_questions,

          srr.correct_ans
          AS correct_answers,

          (
             srr.attempted_que -
             srr.correct_ans
          ) AS wrong_answers,

          ROUND(
            (
              srr.correct_ans /
              NULLIF(
                 tq.total_questions,
                 0
              )
            )*100,
            2
          ) AS percentage

      FROM save_result_report srr

      LEFT JOIN subject sub
      ON sub.id=srr.subject_id

      LEFT JOIN
      (
            SELECT
              q.subject_id,

              COUNT(DISTINCT q.id)
              AS total_questions

            FROM question q

            INNER JOIN userexam ux

            ON JSON_CONTAINS(
                ux.questions,
                JSON_ARRAY(q.id)
            )

            WHERE ux.ExamLoginID=?

            GROUP BY q.subject_id

      ) tq

      ON tq.subject_id=srr.subject_id

      WHERE srr.student_login=?
`,
      [ExamLoginid, ExamLoginid],
    );
    return sendResponse(res, 200, "Get Result Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const saveResultReport = async (req, res) => {
  try {
    const { ExamLoginid, subjects } = req.body;

    for (const item of subjects) {
      const { subject_id, attempted_questions, correct_answers } = item;

      const [studentexist] = await db.query(
        `SELECT id
         FROM save_result_report
         WHERE student_login = ?
         AND subject_id = ?`,
        [ExamLoginid, subject_id],
      );

      if (studentexist.length > 0) {
        await db.query(
          `UPDATE save_result_report
           SET attempted_que=?,
               correct_ans=?
           WHERE student_login=?
           AND subject_id=?`,
          [attempted_questions, correct_answers, ExamLoginid, subject_id],
        );
      } else {
        await db.query(
          `INSERT INTO save_result_report
          (
            student_login,
            subject_id,
            attempted_que,
            correct_ans
          )
          VALUES (?,?,?,?)`,
          [ExamLoginid, subject_id, attempted_questions, correct_answers],
        );
      }
    }

    return sendResponse(res, 200, "Report saved successfully");
  } catch (error) {
    console.log(error);

    return sendResponse(res, 500, "Something went wrong", error);
  }
};
module.exports = {
  getExamReports,
  getAppearReports,
  releaseStudent,
  reschedualStudent,
  resultReport,
  downloadController,
  ViewResultReport,
  saveResultReport,
};

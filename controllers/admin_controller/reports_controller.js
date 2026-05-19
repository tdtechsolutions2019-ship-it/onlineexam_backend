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

const resultReport = async (req, res) => {
  const { start_date, exam_scheduale_date, center_id, course_id, student_id } =
    req.query;
  try {
    let whereConditions = [];
    let queryParams = [];

    whereConditions.push("ue.isExamFinished = '1'");
    // Student filter
    if (student_id) {
      whereConditions.push("s.id = ?");
      queryParams.push(student_id);
    }

    // Center filter
    if (center_id) {
      whereConditions.push("cen.id = ?");
      queryParams.push(center_id);
    }

    // Course filter
    if (course_id) {
      whereConditions.push("ci.id = ?");
      queryParams.push(course_id);
    }

    // Exam schedule date
    if (exam_scheduale_date) {
      whereConditions.push("DATE(es.exam_date) = ?");
      queryParams.push(exam_scheduale_date);
    }

    // Start date filter
    if (start_date) {
      whereConditions.push("DATE(ue.Examendtime) >= ?");
      queryParams.push(start_date);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const query = `
SELECT
    s.id AS student_id,
    s.identity_no,
    s.student_name,
    s.course_code,
    ci.course_name,
    ci.course_code,
    cen.center_name,
    cen.center_code,
    el.schedule_id,
    es.exam_time,
    ci.total_questions,
    ci.total_marks,
    COUNT(ue.QuestionId) AS total_questions_Attempted,
    MAX(ue.Examendtime) AS Examendtime,
    el.id AS ExamLoginId

FROM student s

INNER JOIN exam_login el
    ON el.student_id = s.id

LEFT JOIN exam_schedule es
    ON es.id = el.schedule_id

LEFT JOIN userexam ue
    ON ue.ExamLoginId = el.id

LEFT JOIN course_info ci
    ON ci.id = s.course_code

LEFT JOIN center_info cen
    ON cen.id = s.center_code

${whereClause}

GROUP BY
    s.id,
    s.identity_no,
    s.student_name,
    s.course_code,
    ci.course_name,
    ci.course_code,
    cen.center_name,
    cen.center_code,
    el.schedule_id,
    es.exam_time,
    ci.total_questions,
    ci.total_marks,
    el.id
`;
    const [result] = await db.query(query, queryParams);
    return sendResponse(res, 200, "Get StudentList Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};
module.exports = {
  getExamReports,
  getAppearReports,
  releaseStudent,
  reschedualStudent,
  resultReport,
};

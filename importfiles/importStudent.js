const db = require("../db");
const xlsx = require("xlsx");
const { sendResponse } = require("../helper/response");

const uploadStudentFile = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return sendResponse(res, 400, "No file uploaded");
    }

    // ✅ Read Excel
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return sendResponse(res, 400, "No data found in file");
    }

    // ✅ Fetch master data
    const [centers] = await db.execute(
      "SELECT id, center_code FROM center_info WHERE isdeleted = '0'",
    );

    const [courses] = await db.execute(
      "SELECT id, course_code FROM course_info WHERE isdeleted = '0'",
    );

    // ✅ Create maps
    const centerMap = {};
    centers.forEach((c) => {
      centerMap[c.center_code.trim().toLowerCase()] = c.id;
    });

    const courseMap = {};
    courses.forEach((c) => {
      courseMap[c.course_code.trim().toLowerCase()] = c.id;
    });

    const values = [];

    // ✅ Loop rows
    data.forEach((row, index) => {
      // Required fields
      if (
        !row.identity_no ||
        !row.student_name ||
        !row.center_code ||
        !row.course_code
      ) {
        throw new Error(`Missing required fields at row ${index + 2}`);
      }

      // Convert codes → IDs
      const centerId = centerMap[row.center_code.trim().toLowerCase()];
      const courseId = courseMap[row.course_code.trim().toLowerCase()];

      if (!centerId) {
        throw new Error(
          `Invalid center_code '${row.center_code}' at row ${index + 2}`,
        );
      }

      if (!courseId) { 
        throw new Error(
          `Invalid course_code '${row.course_code}' at row ${index + 2}`,
        );
      }

      // ✅ Status handling
      let statusValue = "1";
      if (row.status !== undefined && row.status !== null) {
        const statusStr = String(row.status).toLowerCase().trim();

        if (statusStr === "active" || statusStr === "1") {
          statusValue = "1";
        } else if (statusStr === "inactive" || statusStr === "0") {
          statusValue = "0";
        } else {
          throw new Error(`Invalid status '${row.status}' at row ${index + 2}`);
        }
      }

      // ✅ Push values
      values.push([
        row.identity_no.trim(),
        centerId,
        row.student_name.trim(),
        courseId,
        row.joining_month || null,
        row.joining_year || null,
        row.registration_month || null,
        row.registration_year || null,
        row.parents_email ? row.parents_email.trim() : null,
        row.parents_contact ? row.parents_contact.trim() : null,
        statusValue,
      ]);
    });

    // ✅ Bulk insert
    const placeholders = values
      .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .join(",");
    const flatValues = values.flat();

    const query = `
      INSERT INTO student (
        identity_no,
        center_code,
        student_name,
        course_code,
        joining_month,
        joining_year,
        registration_month,
        registration_year,
        parents_email,
        parents_contact,
        status
      )
      VALUES ${placeholders}
    `;

    const [result] = await db.execute(query, flatValues);

    return sendResponse(res, 200, "Students imported successfully", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, error.message || "Server Error");
  }
};

module.exports = { uploadStudentFile };

const db = require("../../db");
const { sendResponse } = require("../../helper/response");
const { StudentQuery } = require("../../helper/queries");

const addStudent = async (req, res) => {
  const {
    identity_no,
    center_code,
    student_name,
    course_code,
    joining_time,
    registration_time,
    parents_email,
    parents_contact,
    status,
  } = req.body;
  const profile_photo = req.files?.profile_photo?.[0];
  try {
    let joining_year = null;
    let joining_month = null;

    if (joining_time) {
      const [year, month] = joining_time.split("-");
      joining_year = year; // "2026"
      joining_month = parseInt(month); // "01"
    }
    let registration_month = null;
    let registration_year = null;

    if (registration_time) {
      const [year, month] = joining_time.split("-");
      registration_year = year; // "2026"
      registration_month = parseInt(month); // "01"
    }
    const [result] = await db.query(StudentQuery.addstudent, [
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
      status,
      profile_photo ? `/uploads/studentPhotos/${profile_photo.filename}` : null,
    ]);

    sendResponse(res, 200, "Student Added Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const getStudentbySearch = async (req, res) => {
  const data = req.query;

  try {
    const name = data.name ? `%${data.name}%` : null;
    const center = data.center_code ? `%${data.center_code}%` : null;
    const course = data.course_code ? `%${data.course_code}%` : null;
    const status = data.status ? `%${data.status}%` : null;

    // ✅ joining FROM-TO
    let joining_from_year = null;
    let joining_from_month = null;
    let joining_to_year = null;
    let joining_to_month = null;

    if (data.joining_from) {
      const [year, month] = data.joining_from.split("-");
      joining_from_year = parseInt(year);
      joining_from_month = parseInt(month);
    }

    if (data.joining_to) {
      const [year, month] = data.joining_to.split("-");
      joining_to_year = parseInt(year);
      joining_to_month = parseInt(month);
    }

    // ✅ registration FROM-TO (recommended)
    let registration_from_year = null;
    let registration_from_month = null;
    let registration_to_year = null;
    let registration_to_month = null;

    if (data.registration_from) {
      const [year, month] = data.registration_from.split("-");
      registration_from_year = parseInt(year);
      registration_from_month = parseInt(month);
    }

    if (data.registration_to) {
      const [year, month] = data.registration_to.split("-");
      registration_to_year = parseInt(year);
      registration_to_month = parseInt(month);
    }

    const [result] = await db.query(StudentQuery.getstudentbysearch, [
      name,
      name,
      center,
      center,
      course,
      course,
      status,
      status,

      // ✅ joining FROM (4 params)
      joining_from_year,
      joining_from_year,
      joining_from_year,
      joining_from_month,

      // ✅ joining TO (4 params)
      joining_to_year,
      joining_to_year,
      joining_to_year,
      joining_to_month,

      // ✅ registration FROM (4 params)
      registration_from_year,
      registration_from_year,
      registration_from_year,
      registration_from_month,

      // ✅ registration TO (4 params)
      registration_to_year,
      registration_to_year,
      registration_to_year,
      registration_to_month,
    ]);
    const BASE_URL = `${req.protocol}://${req.get("host")}`;
    // ✅ Image formatter (same as yours)
    const formatImage = (imagePath) => {
      if (!imagePath) return null;
      const name = imagePath.split("/").pop();
      return {
        name,
        url: `${BASE_URL}${imagePath}`,
      };
    };
    // ✅ Apply to all students
    const students = result.map((student) => ({
      ...student,
      profile_photo: formatImage(student.profile_photo),
    }));
    sendResponse(res, 200, "Get All Student Successfully!!", students);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const getStudent = async (req, res) => {
  try {
    const [result] = await db.query(StudentQuery.getstudent);
    const BASE_URL = `${req.protocol}://${req.get("host")}`;

    // ✅ Image formatter (same as yours)
    const formatImage = (imagePath) => {
      if (!imagePath) return null;

      const name = imagePath.split("/").pop();

      return {
        name,
        url: `${BASE_URL}${imagePath}`,
      };
    };

    // ✅ Apply to all students
    const students = result.map((student) => ({
      ...student,
      profile_photo: formatImage(student.profile_photo),
    }));
    console.log("students", students);
    sendResponse(res, 200, "Get All Student Successfully!!", students);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const getStudentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [matchId] = await db.query(StudentQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      return sendResponse(res, 400, "Student is not found");
    }
    const [result] = await db.query(StudentQuery.getStudentById, [id]);

    const StudentData = result[0];
    const BASE_URL = `${req.protocol}://${req.get("host")}`;
    console.log("BASE_URL", BASE_URL);
    // ✅ Image formatter (Keep this!)
    const formatImage = (imagePath) => {
      if (!imagePath) return null;
      const name = imagePath.split("/").pop();
      return {
        name,
        url: `${BASE_URL}${imagePath}`,
      };
    };
    console.log("StudentData", formatImage(StudentData.profile_photo));
    const studentData = {
      ...StudentData,
      profile_photo: formatImage(StudentData.profile_photo),
    };
    // result[0].profile_photo = formatImage(result[0].profile_photo);

    return sendResponse(res, 200, "Get Student Successfully!!", studentData);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};

const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    // Check country is exist
    const [matchId] = await db.query(StudentQuery.MatchId, [id]);
    console.log("matchId", matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Student is not found");
    }
    const result = await db.query(StudentQuery.DeleteStudent, [id]);
    sendResponse(res, 200, "student Deleted Successfully!!", {
      canDelete: true,
    });
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const updateStudent = async (req, res) => {
  const { id } = req.params;

  const {
    identity_no,
    center_code,
    student_name,
    course_code,
    joining_time, // ✅ new
    registration_time, // ✅ new
    parents_email,
    parents_contact,
    status,
  } = req.body;

  const profile_photo = req.files?.profile_photo?.[0];

  try {
    const [matchId] = await db.query(StudentQuery.MatchId, [id]);

    if (matchId.length === 0) {
      return sendResponse(res, 400, "Student is not found");
    }

    // ✅ Split joining_time
    let joining_month = null;
    let joining_year = null;

    if (joining_time) {
      const [year, month] = joining_time.split("-");
      joining_year = year;
      joining_month = parseInt(month);
    }

    // ✅ Split registration_time
    let registration_month = null;
    let registration_year = null;

    if (registration_time) {
      const [year, month] = registration_time.split("-");
      registration_year = year;
      registration_month = parseInt(month);
    }

    const result = await db.query(StudentQuery.Updatestudent, [
      identity_no,
      center_code,
      student_name,
      course_code,
      joining_month, // ✅ from split
      joining_year,
      registration_month,
      registration_year,
      parents_email,
      parents_contact,
      status,
      profile_photo ? `/uploads/studentPhotos/${profile_photo.filename}` : null,
      id,
    ]);

    sendResponse(res, 200, "Student Updated Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

module.exports = {
  addStudent,
  getStudent,
  deleteStudent,
  updateStudent,
  getStudentById,
  getStudentbySearch,
};

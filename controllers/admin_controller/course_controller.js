const db = require("../../db");
const { CourseSubjectQuery, CourseQuery } = require("../../helper/queries");
const { sendResponse } = require("../../helper/response");

const addCourse = async (req, res) => {
  const {
    course_name,
    course_code,
    course_duration_in_months,
    total_questions,
    total_marks,
    exam_duration_in_hours,
    status,
    subjects,
  } = req.body;

  const connection = await db.getConnection();

  try {
    // ✅ 1. Basic validation (OUTSIDE transaction)

    const alphaNumericRegex = /^[A-Za-z0-9]+$/;

    if (!alphaNumericRegex.test(course_code)) {
      return sendResponse(res, 400, "Course code must be alphanumeric");
    }

    const hasValidSubject = subjects?.some(
      (s) => s.subject && s.subject.trim() !== "",
    );

    if (!hasValidSubject) {
      return sendResponse(res, 400, "Please select at least one subject");
    }

    const invalidSubject = subjects.find(
      (s) =>
        s.subject &&
        s.subject.trim() !== "" &&
        (s.weight === undefined || s.weight === null || s.weight === ""),
    );

    if (invalidSubject) {
      return sendResponse(
        res,
        400,
        "Please add weightage for all selected subjects",
      );
    }

    // ✅ 2. Start transaction
    await connection.beginTransaction();

    // ✅ 3. Check duplicate course code
    const [existingCourse] = await connection.query(
      "SELECT id FROM course_info WHERE course_code = ?",
      [course_code],
    );

    if (existingCourse.length > 0) {
      await connection.rollback();
      return sendResponse(res, 400, "Course code already exists");
    }

    // ✅ 4. Insert course
    const [result] = await connection.query(CourseQuery.addCourse, [
      course_name,
      course_code,
      course_duration_in_months,
      total_questions,
      total_marks,
      exam_duration_in_hours,
      status,
    ]);

    const courseId = result.insertId;

    // ✅ 5. Insert subjects (only valid ones)
    for (const subject of subjects) {
      if (!subject.subject || subject.subject.trim() === "") continue;

      await connection.query(CourseSubjectQuery.addCourseSubject, [
        subject.subject,
        courseId,
      ]);

      await connection.query(CourseSubjectQuery.addsubjectinweightage, [
        subject.subject,
        courseId,
        subject.weight,
        total_questions,
      ]);
    }

    // ✅ 6. Commit
    await connection.commit();

    return sendResponse(res, 200, "Course Added Successfully!!");
  } catch (error) {
    console.log("error", error);

    // 🔥 Always rollback on error
    await connection.rollback();

    return sendResponse(res, 500, "Server Error", error);
  } finally {
    // 🔥 Always release connection
    connection.release();
  }
};

const getCourse = async (req, res) => {
  try {
    const [result] = await db.query(CourseQuery.getCourse);
    
    return sendResponse(res, 200, "Get All Course Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};

const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    // Check country is exist
    const [matchId] = await db.query(CourseQuery.MatchId, [id]);
    console.log("matchId", matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Course is not found");
    }

    const result = await db.query(CourseQuery.deleteCourse, [id]);
    const [userdata] = await db.query(CourseSubjectQuery.deleteSubject, [id]);

    // const userresult = await db.query(UsersQuery.DeleteUser, [
    //   userdata[0].user_id,
    // ]);

    return sendResponse(res, 200, "Course  Deleted Successfully!!");
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const updateCourse = async (req, res) => {
  const {
    course_name,
    course_code,
    course_duration_in_months,
    total_questions,
    total_marks,
    exam_duration_in_hours,
    status,
    subjects,
  } = req.body;

  const { id } = req.params;
  const connection = await db.getConnection();
  const course_id = id;

  try {
    // ✅ STEP 1: Validate )
    const invalidSubject = subjects.find(
      (s) =>
        s.subject &&
        s.subject.trim() !== "" &&
        (s.weight === undefined || s.weight === null || s.weight === ""),
    );

    if (invalidSubject) {
      return sendResponse(
        res,
        400,
        "Please add weightage for all selected subjects",
      );
    }

    // ✅ STEP 2: Start transaction
    await connection.beginTransaction();

    // ✅ Check course exists
    const [matchId] = await connection.query(CourseQuery.MatchId, [id]);

    if (matchId.length === 0) {
      await connection.rollback(); // 🔥 VERY IMPORTANT
      return sendResponse(res, 400, "Course is not found");
    }

    // ✅ Update course
    await connection.query(CourseQuery.updateCourse, [
      course_name,
      course_code,
      course_duration_in_months,
      total_questions,
      total_marks,
      exam_duration_in_hours,
      status,
      course_id,
    ]);

    // ✅ Delete old mapping
    await connection.query(CourseSubjectQuery.updateDeleteSubject, [course_id]);
    await connection.query(CourseSubjectQuery.updateDeleteSubjectWeightage, [
      course_id,
    ]);

    // ✅ Insert new subjects
    for (const subject of subjects) {
      if (!subject.subject || subject.subject.trim() === "") continue;

      await connection.query(CourseSubjectQuery.addCourseSubject, [
        subject.subject,
        course_id,
      ]);

      await connection.query(CourseSubjectQuery.addsubjectinweightage, [
        subject.subject,
        course_id,
        subject.weight,
        total_questions,
      ]);
    }

    // ✅ Commit
    await connection.commit();

    return sendResponse(res, 200, "Course Updated Successfully!!");
  } catch (error) {
    console.log("error", error);

    // 🔥 ALWAYS rollback on error
    await connection.rollback();

    return sendResponse(res, 500, "Server Error", error);
  } finally {
    connection.release(); // ✅ release connection
  }
};

const getCourseByid = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(CourseQuery.getCourseById, [id]);
    console.log("rows", rows);
    if (rows.length === 0) {
      return sendResponse(res, 404, "Course not found");
    }
    // console.log("rows", rows);
    // 🧠 Transform data
    const course = {
      course_name: rows[0].course_name,
      course_code: rows[0].course_code,
      course_duration_in_months: rows[0].course_duration_in_months,
      total_questions: rows[0].total_questions,
      total_marks: rows[0].total_marks,
      exam_duration_in_hours: rows[0].exam_duration_in_hours,
      status: rows[0].status,
      subjects: rows.map((r) => ({
        subject: r.subject_id?.toString(),
        weight: r.weightage,
      })),
    };

    return sendResponse(res, 200, "Get Course Successfully!!", course);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};

module.exports = {
  addCourse,
  getCourse,
  deleteCourse,
  updateCourse,
  getCourseByid,
};

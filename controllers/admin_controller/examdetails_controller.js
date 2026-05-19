const db = require("../../db");
const { QuestionQuery, examschedualQuery } = require("../../helper/queries");
const { sendResponse } = require("../../helper/response");
const { generatePassword } = require("../../middleware/errorhandlemiddleware");
const {
  sendLoginEmail,
  sendStudentExamEmail,
} = require("../../middleware/sendEmail");

const GetStudetlist = async (req, res) => {
  const { center_id } = req.params;
  try {
    const [result] = await db.query(examschedualQuery.getstudentslist, [
      center_id,
    ]);
    return sendResponse(res, 200, "Get StudentList Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const addexamschedual = async (req, res) => {
  const { exam_date, exam_time, center_id, student_list } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Get buffer time
    const [settingResult] = await connection.query(
      "SELECT value FROM setting WHERE `key`='settimeforexam' LIMIT 1",
    );

    const buffer_time = settingResult.length
      ? Number(settingResult[0].value)
      : 0;

    const parseTimeToMinutes = (timeStr) => {
      const hasAmPm = timeStr.includes("AM") || timeStr.includes("PM");

      if (!hasAmPm) {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
      }

      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (modifier === "PM" && hours !== 12) hours += 12;

      if (modifier === "AM" && hours === 12) hours = 0;

      return hours * 60 + minutes;
    };

    const convertTo24Hour = (timeStr) => {
      if (!timeStr) return null;

      if (!timeStr.includes("AM") && !timeStr.includes("PM")) {
        return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      }

      const [time, modifier] = timeStr.split(" ");

      let [hours, minutes] = time.split(":").map(Number);

      if (modifier === "PM" && hours !== 12) hours += 12;

      if (modifier === "AM" && hours === 12) hours = 0;

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0",
      )}:00`;
    };

    const today = new Date().toLocaleDateString("en-CA");

    // validate slot
    if (exam_date === today) {
      const now = new Date();

      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}`;

      const isValid =
        parseTimeToMinutes(currentTime) <=
        parseTimeToMinutes(exam_time) - buffer_time;

      if (!isValid) {
        return sendResponse(
          res,
          400,
          `Schedule at least ${buffer_time} minutes before exam time`,
        );
      }
    }

    // create schedule
    const [scheduleResult] = await connection.query(
      examschedualQuery.addexamschedual,
      [exam_date, exam_time, center_id, "1"],
    );

    const schedual_id = scheduleResult.insertId;

    const studentCredentials = [];

    for (const student of student_list) {
      const [existingSchedule] = await connection.query(
        `
          SELECT
            el.id as exam_login_id,
            el.schedule_id,
            el.password,
            es.exam_date,
            es.exam_time
          FROM exam_login el
          JOIN exam_schedule es
          ON es.id=el.schedule_id
          WHERE el.student_id=?
          ORDER BY el.id DESC
          LIMIT 1
        `,
        [student.id],
      );

      let password = generatePassword(10);

      let isRescheduled = false;

      if (existingSchedule.length > 0) {
        isRescheduled = true;

        const oldData = existingSchedule[0];

        // keep old password
        password = oldData.password;

        // save history
        await connection.query(
          `
          INSERT INTO exam_reschedule_history(
            student_id,
            old_schedule_id,
            new_schedule_id,
            exam_login_id,
            old_exam_date,
            old_exam_time,
            new_exam_date,
            new_exam_time,
            center_id
          )
          VALUES(?,?,?,?,?,?,?,?,?)
        `,
          [
            student.id,
            oldData.schedule_id,
            schedual_id,
            student.identity_no,
            oldData.exam_date,
            convertTo24Hour(oldData.exam_time),
            exam_date,
            convertTo24Hour(exam_time),
            center_id,
          ],
        );

        // update login
        await connection.query(
          `
          UPDATE exam_login
          SET schedule_id=?
          WHERE id=?
        `,
          [schedual_id, oldData.exam_login_id],
        );
      } else {
        await connection.query(examschedualQuery.addintoexamlogin, [
          schedual_id,
          student.id,
          student.identity_no,
          password,
        ]);
      }

      await connection.query(
        `
        UPDATE student
        SET isblocked='1',
        updated_at=NOW()
        WHERE id=?
      `,
        [student.id],
      );

      studentCredentials.push({
        identity_no: student.identity_no,
        password,
        exam_date,
        exam_time,
        isRescheduled,
      });
    }

    const [centerEmail] = await connection.query(
      examschedualQuery.getemailfromcenter,
      [center_id],
    );

    await connection.commit();

    // background email
    setImmediate(async () => {
      try {
        for (const student of studentCredentials) {
          await sendStudentExamEmail(
            centerEmail[0].email,

            student.identity_no,

            student.password,

            student.exam_date,

            student.exam_time,

            student.isRescheduled,
          );
        }

        console.log("All emails sent");
      } catch (err) {
        console.error("Email sending failed:", err);
      }
    });

    return sendResponse(res, 200, "Add Exam Schedule Successfully!!");
  } catch (error) {
    await connection.rollback();

    return sendResponse(res, 500, "Server Error", error);
  }
};
const GetScheduleList = async (req, res) => {
  try {
    const [result] = await db.query(examschedualQuery.getschedualList);

    return sendResponse(res, 200, "Get ScheduleList Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const getschedualbySearch = async (req, res) => {
  const data = req.query;

  try {
    const center = data.center_code ? `%${data.center_code}%` : null;
    const status = data.status ? `%${data.status}%` : null;

    const examdate_from = data.examdate_from || null;
    const examdate_to = data.examdate_to || null;

    const [result] = await db.query(examschedualQuery.getschedualbySearch, [
      center,
      center,
      status,
      status,
      examdate_from,
      examdate_from,
      examdate_to,
      examdate_to,
    ]);

    sendResponse(res, 200, "Get All Schedule Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const GetexamschedualebyId = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(examschedualQuery.getschedualbyid, [id]);
    const [getstudents] = await db.query(examschedualQuery.getstudentid, [id]);

    const studentIds = getstudents.map((item) => item.student_id);

    if (studentIds.length === 0) {
      return sendResponse(res, 200, "No students found", []);
    }

    const [getstudentsdetails] = await db.query(
      examschedualQuery.getselectedstudentlist,
      [id],
    );
    const data = { ...result[0], students: getstudentsdetails };
    return sendResponse(res, 200, "Get ScheduleList Successfully!!", data);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const deleteExamschedual = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [matchId] = await connection.query(examschedualQuery.MatchId, [id]);
    if (matchId.length === 0) {
      return sendResponse(res, 400, "Scheduled Exam is not found");
    }
    const [deleteExamschedual] = await connection.query(
      examschedualQuery.DeleteExamSchedule,
      [id],
    );
    const [deleteExamslogin] = await connection.query(
      examschedualQuery.Deleteexamlogin,
      [id],
    );
    await connection.commit();
    return sendResponse(res, 200, "Delete Scheduled Exam Successfully!!");
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const downloadStudentsCSV = async (req, res) => {
  try {
    const scheduleId = req.params.scheduleId;

    const [rows] = await db.query(
      `SELECT 
        schedule_id,
        student_id,
        username,
        password,
        student.student_name
      FROM exam_login
      INNER JOIN student 
        ON student.id = exam_login.student_id
      WHERE exam_login.isdeleted='0'
      AND exam_login.schedule_id=?`,
      [scheduleId],
    );

    let csv = "Sr.No,Student Name,Username,Password\n";

    rows.forEach((row, index) => {
      csv += `${index + 1},${row.student_name},${row.username},${row.password}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("students_list.csv");

    return res.send(csv);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};
module.exports = {
  GetStudetlist,
  addexamschedual,
  GetScheduleList,
  GetexamschedualebyId,
  deleteExamschedual,
  downloadStudentsCSV,
  getschedualbySearch,
};

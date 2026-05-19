const bycrpt = require("bcryptjs");
const jwttoken = require("jsonwebtoken");
const db = require("../../db");
const { sendResponse } = require("../../helper/response");
const { RolesQuery } = require("../../helper/queries");

//Register
const register = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const [result] = await db.query("SELECT * FROM users WHERE email = ? ", [
      email,
    ]);
    if (result.length > 0)
      return res.status(400).json({ message: "User already exixst" });

    const hashedPassword = await bycrpt.hash(password, 10);
    const [data] = await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
    );
    console.log("dataaa", data);
    res.status(200).json({
      message: "User Register!!!",
      data: data,
    });
  } catch (error) {
    console.log("errorr--->>", error);
  }
};

// Login

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("emaill", email);
  try {
    const [result] = await db.query("SELECT * FROM users WHERE email = ? ", [
      email,
    ]);

    if (result.length === 0) return sendResponse(res, 400, "User not fount");
    const user = result[0];
    const isMatch = await bycrpt.compare(password, user.password);

    if (!isMatch) return sendResponse(res, 400, "Invalid Credentials");
    const [access] = await db.query(RolesQuery.GetRoleAccess, [user.role_id]);
    const permissions = {};
    access.forEach((row) => {
      permissions[row.module_name] = {
        id: row.module_id,
        module: row.module_name,
        view: row.can_view === "1",
        add: row.can_add === "1",
        edit: row.can_update === "1",
        delete: row.can_delete === "1",
        import: row.can_import === "1",
        export: row.can_export === "1",
      };
    });

    const token = jwttoken.sign(
      {
        name: user.first_name + " " + user.last_name,
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
        permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    // ❗ Remove old token (logout previous device)
    await db.query("DELETE FROM user_token WHERE user_id = ?", [user.id]);

    // Save new token
    await db.query(
      "INSERT INTO user_token (user_id, token, expiry_time) VALUES (?, ?, NOW() + INTERVAL 1 DAY)",
      [user.id, token],
    );
    return sendResponse(res, 200, "Login Scussfully!!", token);
  } catch (error) {
    console.log("errorr-->>>", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};

// Student Login
const Studentlogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [result] = await db.query(
      "SELECT * FROM exam_login WHERE username = ?",
      [username],
    );

    if (result.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result[0];
    const [logindatetime] = await db.query(
      `SELECT id, exam_date, exam_time FROM exam_schedule WHERE id = ?`,
      [user.schedule_id],
    );

    const [student] = await db.query(
      `SELECT s.id, s.student_name, c.course_code FROM student s JOIN course_info c ON s.course_code = c.id WHERE s.id = ?;`,
      [user.student_id],
    );
    const [loginid] = await db.query(
      `SELECT el.id FROM exam_login el INNER JOIN userexam s ON s.ExamLoginId = el.id WHERE isExamFinished = '1' AND el.student_id = ?;`,
      [user.student_id],
    );
    if (loginid.length > 0) {
      return res
        .status(400)
        .json({ message: "Your exam has already been submitted." });
    }

    // const examTime = new Date(logindatetime[0].exam_date);
    // const now = new Date();

    // // check if same date
    // const examDate = examTime.toDateString();
    // const currentDate = now.toDateString();

    // if (examDate !== currentDate) {
    //   return res.status(400).json({
    //     message: "You can login only on exam date",
    //   });
    // }

    // // login window (exam time + 10 minutes)
    // const loginDeadline = new Date(examTime.getTime() + 10 * 60 * 1000);

    // if (now < examTime) {
    //   return res.status(400).json({
    //     message: "Exam has not started yet",
    //   });
    // }

    // if (now > loginDeadline) {
    //   return res.status(400).json({
    //     message: "Login time is over",
    //   });
    // }

    if (password !== user.password) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwttoken.sign(
      {
        id: user.id,
        username: user.username,
        student_id: user.student_id,
        examdate: logindatetime[0].exam_date,
        student,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.status(200).json({ message: "Login Scussfully!!", data: token });
  } catch (error) {
    console.log("errorr-->>>", error);
  }
};

module.exports = { login, register, Studentlogin };

export const CountryQuery = {
  Add_Conuntry:
    "INSERT INTO country (country_name, country_code, currency_code, status) VALUES (?, ?, ?, ?)",
  GetCountry:
    "SELECT id,country_name,country_code,currency_code,status FROM country WHERE is_deleted = '0'",
  GetCountryByID:
    "SELECT id,country_name,country_code,currency_code,status FROM country WHERE is_deleted = '0' AND id = ?",
  MatchId: "SELECT * FROM country WHERE id = ?",
  Updatecountry:
    "UPDATE country SET country_name = ?, country_code = ?, currency_code = ?, status = ? WHERE id = ?",
  DeleteCountry:
    "UPDATE country SET is_deleted = '1', deleted_at = NOW() WHERE id = ?",
  StateExist: "SELECT * FROM states WHERE country_id = ?",
};

export const StatesQuery = {
  Add_State:
    "INSERT INTO states (country_id, state_name, gst_code, status) VALUES (?, ?, ?, ?)",
  GetState:
    "SELECT c.id AS country_id,c.country_name,JSON_ARRAYAGG(JSON_OBJECT('id', s.id,'state_name', s.state_name,'gst_code', s.gst_code, 'status', s.status )) AS states FROM country c JOIN states s ON c.id = s.country_id WHERE s.isdeleted = '0' AND c.is_deleted = '0' GROUP BY c.id;",
  MatchId: "SELECT * FROM states WHERE id = ?",
  GetStateByID:
    "SELECT s.id,s.country_id,c.country_name,s.state_name,s.gst_code,s.status FROM states s JOIN country c ON s.country_id = c.id WHERE isdeleted = '0' AND s.id = ?",
  Updatestate:
    "UPDATE states SET country_id = ?, state_name = ?, gst_code = ?, status = ? WHERE id = ?",
  DeleteState:
    "UPDATE states SET isdeleted = '1', deleted_at = NOW() WHERE id = ?",
};

export const RolesQuery = {
  addinroletable: `INSERT INTO roles (role_name,role_code, role_description, status)
   VALUES (?, ?, ?, ?)`,
  MatchId: "SELECT * FROM roles WHERE id = ?",
  addinroleaccess: `INSERT INTO role_access 
  (role_id, module_id, module_name, can_view, can_add, can_update, can_delete, can_import, can_export)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  GetRoles:
    "SELECT id,role_name,role_code,status FROM roles WHERE isdeleted = '0' AND id <> 0",
  GetRoleAccess: "SELECT * FROM role_access WHERE role_id = ?",
  DeleteRole:
    "UPDATE roles SET isdeleted = '1', deleted_at = NOW() WHERE id = ? AND is_system <> 1",
};

export const RetestQuery = {
  addRetest: "INSERT INTO setting (`key`, `value`) VALUES (?, ?)",
  updateRetest: "UPDATE setting SET `value` = ? WHERE `key` = ?",
  getRetest: "SELECT id, `key`, `value` FROM setting WHERE isdeleted = '0'",
};
export const CenterInfoQuery = {
  addincenterinfo: `INSERT INTO center_info (center_name, user_id, center_code, email, address, contact_person1, contact_person2, mobile, phone, country_id, state_id, status,center_logo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
  MatchId: "SELECT * FROM center_info WHERE id = ?",
  getCenterinfo: `SELECT * FROM center_info WHERE isdeleted = '0' AND id = ?`,
  updateCenterInfo: `UPDATE center_info SET center_name = ?, center_code = ?, email = ?, address = ?, contact_person1 = ?, contact_person2 = ?, mobile = ?, phone = ?, country_id = ?, state_id = ?, status = ?, center_logo = COALESCE(?, center_logo)WHERE id = ?
`,
  DeleteCenterInfo:
    "UPDATE center_info SET isdeleted = '1', deleted_at = NOW() WHERE id = ?",
  GetUserId: "SELECT user_id FROM center_info WHERE id = ?",
};

export const UsersQuery = {
  addinuserstable: `INSERT INTO users (role_id,role_name,first_name,email,password,phone,status) VALUES (?,?,?,?,?,?,?)`,
  adduser: `INSERT INTO users (center_id, role_id,role_name,first_name,last_name,email,password,phone,status,username) VALUES (?,?,?,?,?,?,?,?,?,?)`,
  updateuser: `UPDATE users  SET center_id = ?, role_id = ?,  role_name = ?, first_name = ?, last_name = ?,  email = ?,  phone = ?, status = ?, username = ? WHERE id = ?`,
  updateCenterId: `UPDATE users SET center_id = ? WHERE id = ?`,
  updateCenterUser: `UPDATE users SET first_name = ?,email = ?,phone = ?,status = ? WHERE id = ?`,
  DeleteUser:
    "UPDATE users SET isdeleted = '1', deleted_at = NOW() WHERE id = ?",
  getUser:
    "SELECT id, role_name, username, first_name, last_name, email, status FROM users WHERE isdeleted = '0' AND id <> 0",
  getUserById: `SELECT id,center_id,usertype, role_id,role_name,username,first_name,last_name,email,phone,status FROM users WHERE isdeleted = '0' AND id = ?`,
  MatchId: "SELECT * FROM users WHERE id = ?",
  addUserPhoto: `UPDATE users SET  user_img = COALESCE(?, user_img) WHERE id = ?`,
  getUserPhoto: `  SELECT user_img FROM users WHERE isdeleted = '0' AND id = ?`,
};

export const StudentQuery = {
  addstudent: `INSERT INTO student (identity_no, center_code, student_name, course_code, joining_month, joining_year, registration_month, registration_year, parents_email, parents_contact, status, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  getstudentbysearch: `SELECT s.*,
c.course_code,
  ct.center_code
FROM student s
LEFT JOIN course_info c  ON s.course_code = c.id
LEFT JOIN center_info ct ON s.center_code = ct.id
WHERE s.isdeleted = '0'
AND (? IS NULL OR s.student_name LIKE ?)
AND (? IS NULL OR ct.id LIKE ?)
AND (? IS NULL OR c.id LIKE ?)
AND (? IS NULL OR s.status LIKE ?)
AND (
  ? IS NULL 
  OR (
    s.joining_year > ? 
    OR (s.joining_year = ? AND s.joining_month >= ?)
  )
)
AND (
  ? IS NULL 
  OR (
    s.joining_year < ? 
    OR (s.joining_year = ? AND s.joining_month <= ?)
  )
)
AND (
  ? IS NULL 
  OR (
    s.registration_year > ? 
    OR (s.registration_year = ? AND s.registration_month >= ?)
  )
)
AND (
  ? IS NULL 
  OR (
    s.registration_year < ? 
    OR (s.registration_year = ? AND s.registration_month <= ?)
  )
);`,

  getstudent: `SELECT 
            s.*,
            c.course_code,
            ct.center_code
          FROM student s
          LEFT JOIN course_info c ON s.course_code = c.id
          LEFT JOIN center_info ct ON s.center_code = ct.id
          WHERE s.isdeleted = '0';`,
  MatchId: "SELECT * FROM student WHERE id = ?",
  DeleteStudent:
    "UPDATE student SET isdeleted = '1', deleted_at = NOW() WHERE id = ?",
  Updatestudent: `UPDATE student SET identity_no = ?, center_code = ?, student_name = ?, course_code = ?, joining_month = ?, joining_year = ?, registration_month = ?, registration_year = ?, parents_email = ?, parents_contact = ?,  status = ?, profile_photo = COALESCE(?, profile_photo) WHERE id = ? `,
  getStudentById: `SELECT * FROM student WHERE isdeleted = '0' AND id = ?`,
};

export const SubjectQuery = {
  addsubject: `INSERT INTO subject (subject_name, description, status) VALUES (?, ?, ?)`,
  getsubject: `SELECT * FROM subject WHERE isdeleted = '0'`,
  MatchId: "SELECT * FROM subject WHERE id = ?",
  getSubjectByid: `SELECT * FROM subject WHERE isdeleted = '0' AND id = ?`,
  updateSubject: `UPDATE subject SET subject_name = ?, description = ?, status = ? WHERE id = ?`,
  deleteSubject: `UPDATE subject SET isdeleted = '1', deleted_at = NOW() WHERE id = ?`,
};

export const CourseQuery = {
  addCourse: `INSERT INTO course_info (course_name, course_code, course_duration_in_months,total_questions,total_marks,exam_duration_in_hours,status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  getCourse: `SELECT * FROM course_info WHERE isdeleted = '0'`,
  MatchId: "SELECT * FROM course_info WHERE id = ?",
  deleteCourse: `UPDATE course_info SET isdeleted = '1', deleted_at = NOW() WHERE id = ?`,
  updateCourse: `UPDATE course_info SET course_name = ?, course_code = ?, course_duration_in_months = ?, total_questions = ?,  total_marks = ?, exam_duration_in_hours = ?, status = ? WHERE id = ?`,
  getCourseById: `SELECT c.*, cs.subject_id, cs.weightage FROM course_info c LEFT JOIN course_subject_weightage cs ON c.id = cs.course_id WHERE c.id = ? AND c.isdeleted = '0'`,
};

export const CourseSubjectQuery = {
  addCourseSubject: `INSERT INTO course_subject (subject_id, course_id) VALUES (?,?)`,
  deleteSubject: `UPDATE course_subject SET isdeleted = '1', deleted_at = NOW() WHERE course_id = ?`,
  updateDeleteSubject: `DELETE FROM course_subject WHERE course_id = ?`,
  updateDeleteSubjectWeightage: `DELETE FROM course_subject_weightage WHERE course_id = ?`,
  addsubjectinweightage: `INSERT INTO course_subject_weightage (subject_id,course_id,weightage,no_of_questions) VALUES (?,?,?,?)`,
};

export const QuestionQuery = {
  MatchId: "SELECT * FROM question WHERE id = ?",
  addQuestion: `INSERT INTO question (question_type, subject_id, weightage, status) VALUES (?, ?, ?, ?)`,
  addqueinqdescription: `INSERT INTO question_description (question_id, question,option1,option2,option3,option4,language_id,answer,sameasenglish) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  getquestions: `SELECT q.id, qd.question, s.subject_name, q.question_type, q.status FROM question q LEFT JOIN question_description qd ON q.id = qd.question_id AND qd.language_id = 1 LEFT JOIN subject s ON q.subject_id = s.id WHERE q.isdeleted = '0' AND s.isdeleted = '0' ORDER BY q.id ASC;`,
  getQuestionbyid: `SELECT q.id, q.question_type, q.subject_id, q.weightage, q.status, qd.language_id, qd.question, qd.option1, qd.option2, qd.option3, qd.option4, qd.answer, qd.sameasenglish FROM question q JOIN question_description qd ON q.id = qd.question_id WHERE q.id = ?`,
  updateQuestion: `UPDATE question SET question_type = ?, subject_id = ?, weightage = ?, status = ? WHERE id = ?`,
  updatequedescription: `UPDATE question_description SET question = ?, option1 = ?, option2 = ?, option3 = ?, option4 = ?, answer = ?, sameasenglish = ? WHERE question_id = ? AND language_id = ?`,
  deleteQuestion: `UPDATE question SET isdeleted = '1' WHERE id = ?`,
  deletequedescription: `UPDATE question_description SET isdeleted = '1' WHERE question_id = ?`,
  MatchIdLanguageId:
    "SELECT * FROM question_description WHERE question_id = ? AND language_id = ?",
};

export const examschedualQuery = {
  getstudentslist: `SELECT s.id, s.identity_no, s.student_name, s.joining_month, s.joining_year,s.isblocked, c.course_code FROM student s JOIN course_info c ON s.course_code = c.id WHERE s.center_code = ? AND s.isdeleted = '0';`,
  addexamschedual: `INSERT INTO exam_schedule (exam_date, exam_time, center_id,status) VALUES (?, ?, ?, ?)`,
  addintoexamlogin: `INSERT INTO exam_login (schedule_id, student_id, username, password) VALUES (?, ?, ?, ?)`,
  getemailfromcenter: `SELECT email FROM center_info WHERE id = ?`,
  getschedualList: `SELECT s.id,s.exam_date,s.exam_time,c.center_name,s.status FROM exam_schedule s JOIN center_info c ON s.center_id = c.id WHERE s.isdeleted = '0'`,
  getschedualbyid: `SELECT exam_date,exam_time,center_id FROM exam_schedule WHERE isdeleted = '0' AND id = ?`,
  getstudentid: `SELECT student_id  FROM exam_login WHERE isdeleted = '0' AND schedule_id = ?`,
  getselectedstudentlist: `SELECT schedule_id,student_id,username,password ,student.student_name FROM exam_login INNER JOIN student ON student.id = exam_login.student_id  WHERE exam_login.isdeleted='0' AND exam_login.schedule_id=?`,
  MatchId: "SELECT * FROM exam_schedule WHERE id = ?",
  DeleteExamSchedule:
    "UPDATE exam_schedule SET isdeleted = '1', deleted_at = NOW() WHERE id = ?",
  Deleteexamlogin: `UPDATE exam_login SET isdeleted = '1' WHERE schedule_id = ?`,
  getschedualbySearch: `SELECT 
  s.id,
  s.exam_date,
  s.exam_time,
  c.center_name,
  s.status
FROM exam_schedule s
JOIN center_info c ON s.center_id = c.id
WHERE s.isdeleted = '0'
AND (? IS NULL OR c.id LIKE ?)
AND (? IS NULL OR s.status LIKE ?)
AND (? IS NULL OR DATE(s.exam_date) >= ?)
AND (? IS NULL OR DATE(s.exam_date) <= ?)`,
};

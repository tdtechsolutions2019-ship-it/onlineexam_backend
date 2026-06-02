const express = require("express");
require("./db"); //db connection
require("dotenv").config();
const cors = require("cors");
const authrouter = require("./routes/auth_routers/auth_routes");
const getquerouter = require("./routes/exam_routes/exam_routes");
const getcountryrouter = require("./routes/admin_routes/country_routes");
const getstaterouter = require("./routes/admin_routes/state_routes");
const getRoleRouter = require("./routes/admin_routes/role_routes");
const getRetestRouter = require("./routes/admin_routes/retest_routes");
const getStudentRouter = require("./routes/admin_routes/student_routes");
const importFileRouter = require("./routes/admin_routes/importFile_routes");
const centerInfoRouter = require("./routes/admin_routes/centerInfo_routes");
const subjectRouter = require("./routes/admin_routes/subject_routes");
const courseRouter = require("./routes/admin_routes/course_routes");
const userRouter = require("./routes/admin_routes/user_routes");
const questionRouter = require("./routes/admin_routes/question_route");
const examscheduleRouter = require("./routes/admin_routes/examschedule_routes");
const storequestion = require("./routes/question_storeinmongo/question_storeinmongo");
const reportsRouter = require("./routes/admin_routes/reports_routes");
const { errorHandler } = require("./middleware/errorhandlemiddleware");
const path = require("path");
const { connectMongo, connectMongoDB } = require("./mongo");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.url);
  next();
});
app.use(
  cors({
    origin: [
      "https://onlineexam-studentlogin.vercel.app",
      "https://onlineexamdashboard.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ], // change to live url, // change to live url
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
    credentials: true,
  }),
);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/auth", authrouter);
app.use("/api/exam", getquerouter);
app.use("/api/storequestion", storequestion);
app.use("/api/admin/country", getcountryrouter);
app.use("/api/admin/state", getstaterouter);
app.use("/api/admin/role", getRoleRouter);
app.use("/api/admin/import", importFileRouter);
app.use("/api/admin/retest", getRetestRouter);
app.use("/api/admin/centerInfo", centerInfoRouter);
app.use("/api/admin/student", getStudentRouter);
app.use("/api/admin/user", userRouter);
app.use("/api/admin/question", questionRouter);
app.use("/api/admin/subject", subjectRouter);
app.use("/api/admin/course", courseRouter);
app.use("/api/admin/examschedule", examscheduleRouter);
app.use("/api/admin/reportsRouter", reportsRouter);

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Node js code deployed...");
});

app.use(errorHandler);

const startServer = async () => {
  await connectMongoDB();
  app.listen(port, () => console.log(`Server running on port ${port}`));
};

startServer();

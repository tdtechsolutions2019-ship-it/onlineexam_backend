const jwttoken = require("jsonwebtoken");
const db = require("../db");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied" });
  }
  // const token = authHeader;
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwttoken.verify(token, process.env.JWT_SECRET);

    // Check token in DB
    // const [rows] = await db.query(
    //   "SELECT * FROM user_token WHERE user_id = ? AND token = ?",
    //   [decoded.id, token],
    // );

    // if (rows.length === 0) {
    //   return res.status(401).json({
    //     message: "You are logged in from another device",
    //   });
    // }

    req.user = decoded;
    next();
  } catch (err) {
    console.log("err", err);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = verifyToken;

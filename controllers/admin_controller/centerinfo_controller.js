const db = require("../../db");
const bcrypt = require("bcrypt");
const { generatePassword } = require("../../middleware/errorhandlemiddleware");
const { sendResponse } = require("../../helper/response");
const { sendLoginEmail } = require("../../middleware/sendEmail");
const { CenterInfoQuery, UsersQuery } = require("../../helper/queries");

const addCenterInfo = async (req, res) => {
  const {
    center_name,
    center_code,
    email,
    address,
    contact_person1,
    contact_person2,
    mobile,
    phone,
    country_id,
    state_id,
    status,
  } = req.body;
  const center_logo = req.files?.center_logo?.[0];
  const connection = await db.getConnection(); // for transaction

  try {
    await connection.beginTransaction();
    const alphaNumericRegex = /^[A-Za-z0-9]+$/;

    if (!alphaNumericRegex.test(center_code)) {
      return sendResponse(res, 400, "Center code must be alphanumeric");
    }

    // 2️⃣ Check duplicate center code
    const [existingCenter] = await connection.query(
      "SELECT id FROM center_info WHERE center_code = ?",
      [center_code],
    );

    if (existingCenter.length > 0) {
      return sendResponse(res, 400, "Center code already exists");
    }
    const plainPassword = generatePassword(10);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const [creteUser] = await connection.query(UsersQuery.addinuserstable, [
      "1",
      "CenterOwner",
      contact_person1,
      email,
      hashedPassword,
      phone,
      status,
    ]);
    const userId = creteUser.insertId;
    const [result] = await connection.query(CenterInfoQuery.addincenterinfo, [
      center_name,
      userId,
      center_code,
      email,
      address,
      contact_person1,
      contact_person2,
      mobile,
      phone,
      country_id,
      state_id,
      status,
      center_logo ? `/uploads/centerLogos/${center_logo.filename}` : null,
    ]);

    const centerId = result.insertId;
    const [userupdate] = await connection.query(UsersQuery.updateCenterId, [
      centerId,
      userId,
    ]);
    console.log("userupdate", userupdate);
    await connection.commit();
    await sendLoginEmail(email, plainPassword);
    return sendResponse(res, 200, "Center Info Added Successfully!!");
  } catch (error) {
    await connection.rollback();

    console.log(error);

    return sendResponse(res, 500, "Internal Server Error", error);
  } finally {
    connection.release();
  }
};

const getCentreInfo = async (req, res) => {
  try {
    const [result] = await db.query(
      ` SELECT 
        c.*, 
        s.state_name
      FROM center_info c
      LEFT JOIN states s ON c.state_id = s.id
      WHERE c.isdeleted = '0'`,
    );

    return sendResponse(res, 200, "Get All Center Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};

const getCenterInfoBYId = async (req, res) => {
  const { id } = req.params;
  try {
    const [matchId] = await db.query(CenterInfoQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      return sendResponse(res, 400, "Center is not found");
    }
    const [result] = await db.query(CenterInfoQuery.getCenterinfo, [id]);

    const Centerdata = result[0];
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
    console.log("Centerdata", formatImage(Centerdata.center_logo));
    const centerInfo = {
      ...Centerdata,
      center_logo: formatImage(Centerdata.center_logo),
    };
    result[0].center_logo = formatImage(result[0].center_logo);

    return sendResponse(res, 200, "Get Center Successfully!!", centerInfo);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};

const updateCenterInfo = async (req, res) => {
  const { id } = req.params;
  const {
    center_name,
    center_code,
    email,
    address,
    contact_person1,
    contact_person2,
    mobile,
    phone,
    country_id,
    state_id,
    status,
    user_id,
  } = req.body;

  const center_logo = req.files?.center_logo?.[0];
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // check duplicate email
    const [existingUser] = await connection.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, user_id],
    );

    if (existingUser.length > 0) {
      return sendResponse(res, 400, "Email already exists");
    }

    // update center
    await connection.query(CenterInfoQuery.updateCenterInfo, [
      center_name,
      center_code,
      email,
      address,
      contact_person1,
      contact_person2,
      mobile,
      phone,
      country_id,
      state_id,
      status,
      center_logo ? `/uploads/centerLogos/${center_logo.filename}` : null,
      id,
    ]);

    // update user
    await db.query(UsersQuery.updateCenterUser, [
      contact_person1,
      email,
      phone,
      status,
      user_id,
    ]);
    await connection.commit();
    return sendResponse(res, 200, "Center Info Updated Successfully!!");
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};

const deleteCenter = async (req, res) => {
  const { id } = req.params;
  try {
    // Check country is exist
    const [matchId] = await db.query(CenterInfoQuery.MatchId, [id]);
    console.log("matchId", matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Center is not found");
    }

    const result = await db.query(CenterInfoQuery.DeleteCenterInfo, [id]);

    const [userdata] = await db.query(CenterInfoQuery.GetUserId, [id]);
    console.log("userId", userdata[0].user_id);
    const userresult = await db.query(UsersQuery.DeleteUser, [
      userdata[0].user_id,
    ]);

    return sendResponse(res, 200, "Center Deleted Successfully!!");
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};
module.exports = {
  addCenterInfo,
  getCentreInfo,
  getCenterInfoBYId,
  updateCenterInfo,
  deleteCenter,
};

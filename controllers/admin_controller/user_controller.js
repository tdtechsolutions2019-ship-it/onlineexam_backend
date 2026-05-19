const db = require("../../db");
const { UsersQuery } = require("../../helper/queries");
const { sendResponse } = require("../../helper/response");
const { generatePassword } = require("../../middleware/errorhandlemiddleware");
const { sendLoginEmail } = require("../../middleware/sendEmail");
const bcrypt = require("bcrypt");

const addUser = async (req, res) => {
  const {
    center_id,
    role,
    first_name,
    last_name,
    email,
    role_name,
    phone,
    status,
    username,
    
  } = req.body;
  try {
    const [existingUser] = await db.query(
      `SELECT id FROM users WHERE email = ? OR username = ? OR phone = ?`,
      [email, username, phone],
    );

    if (existingUser.length > 0) {
      return sendResponse(
        res,
        400,
        "Email or Username or Mobile number already exists",
      );
    }
    const plainPassword = generatePassword(10);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const [result] = await db.query(UsersQuery.adduser, [
      center_id,
      role,
      role_name,
      first_name,
      last_name,
      email,
      hashedPassword,
      phone,
      status,
      username,
    ]);
    await sendLoginEmail(email, plainPassword);
    return sendResponse(res, 200, "User Added Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};

const getUser = async (req, res) => {
  try {
    const [result] = await db.query(UsersQuery.getUser);
    return sendResponse(res, 200, "Get All User Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [matchId] = await db.query(UsersQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "User is not found");
    }
    const [result] = await db.query(UsersQuery.getUserById, [id]);
    return sendResponse(res, 200, "Get User Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    center_id,
    role,
    role_name,
    first_name,
    last_name,
    email,
    phone,
    status,
    username,
  } = req.body;

  try {
    // build duplicate check dynamically
    let conditions = [];
    let values = [];

    if (email && email.trim() !== "") {
      conditions.push("email = ?");
      values.push(email);
    }

    if (username && username.trim() !== "") {
      conditions.push("username = ?");
      values.push(username);
    }

    if (phone && phone.trim() !== "") {
      conditions.push("phone = ?");
      values.push(phone);
    }

    if (conditions.length > 0) {
      const query = `
        SELECT id FROM users
        WHERE (${conditions.join(" OR ")})
        AND id != ?
      `;

      values.push(id);

      const [existingUser] = await db.query(query, values);
      console.log("existingUser", existingUser);

      if (existingUser.length > 0) {
        return sendResponse(
          res,
          400,
          "Email or Username or Mobile number already exists",
        );
      }
    }

    const [result] = await db.query(UsersQuery.updateuser, [
      center_id,
      role,
      role_name,
      first_name,
      last_name,
      email,
      phone || null,
      status,
      username || null,
      id,
    ]);

    return sendResponse(res, 200, "User Updated Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Check country is exist
    const [matchId] = await db.query(UsersQuery.MatchId, [id]);
    console.log("matchId", matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "State is not found");
    }
    const result = await db.query(UsersQuery.DeleteUser, [id]);
    sendResponse(res, 200, "State Deleted Successfully!!", {
      canDelete: true,
    });
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const addUserPhoto = async (req, res) => {
  const { id } = req.params;
 
  const user_img = req.files?.user_img?.[0];

  try {
    const [matchId] = await db.query(UsersQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "user is not found");
    }
    const [result] = await db.query(UsersQuery.addUserPhoto, [
      user_img ? `/uploads/userPhotos/${user_img.filename}` : null,
      id,
    ]);

    sendResponse(res, 200, "User Updated Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const getUserPhoto = async (req, res) => {
  const { id } = req.params;
  try {
    const [matchId] = await db.query(UsersQuery.MatchId, [id]);
   
    if (matchId.length === 0) {
      return sendResponse(res, 400, "User is not found");
    }
    const [result] = await db.query(UsersQuery.getUserPhoto, [id]);
   
    const UserData = result[0];
    const BASE_URL = `${req.protocol}://${req.get("host")}`;

    // ✅ Image formatter (Keep this!)
    const formatImage = (imagePath) => {
      if (!imagePath) return null;
      const name = imagePath.split("/").pop();
      return {
        name,
        url: `${BASE_URL}${imagePath}`,
      };
    };
   
    const userData = {
      ...UserData,
      user_img: formatImage(UserData.user_img),
    };
    result[0].user_img = formatImage(result[0].user_img);

    return sendResponse(res, 200, "Get User Successfully!!", userData);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Internal Server Error", error);
  }
};
module.exports = {
  addUser,
  getUser,
  getUserById,
  updateUser,
  deleteUser,
  addUserPhoto,
  getUserPhoto,
};

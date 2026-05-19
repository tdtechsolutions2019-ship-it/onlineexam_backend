const db = require("../../db");
const { RetestQuery } = require("../../helper/queries");
const { sendResponse } = require("../../helper/response");

const addRetest = async (req, res) => {
  try {
    const data = req.body;

    let result;

    for (const [key, value] of Object.entries(data)) {
      const val = typeof value === "object" ? JSON.stringify(value) : value;
      [result] = await db.query(RetestQuery.addRetest, [key, val]);
    }

    sendResponse(res, 200, "Retest Added Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};
const UpdateRetest = async (req, res) => {
  const { settings } = req.body;
  console.log("settings", settings);
  try {
    const data = settings;

    console.log("data", data);
    let result;

    for (const [key, value] of Object.entries(data)) {
      console.log("1111", key, value);
      const val =
        typeof value.value === "object"
          ? JSON.stringify(value.value)
          : value.value;
      console.log("valll", val, value.key);
      [result] = await db.query(RetestQuery.updateRetest, [val, value.key]);
    }

    sendResponse(res, 200, "Retest Added Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const getRetest = async (req, res) => {
  try {
    const [result] = await db.query(RetestQuery.getRetest);
    sendResponse(res, 200, "Get All Country Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

module.exports = { addRetest, getRetest, UpdateRetest };

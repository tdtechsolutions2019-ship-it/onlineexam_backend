const db = require("../../db");
const { CountryQuery } = require("../../helper/queries");
const { sendResponse } = require("../../helper/response");

const addCountry = async (req, res) => {
  console.log("11111");

  const { country_name, country_code, currency_code, status } = req.body;

  console.log("2222", req.body);

  try {
    const [result] = await db.query(CountryQuery.Add_Conuntry, [
      country_name,
      country_code,
      currency_code,
      status,
    ]);

    sendResponse(res, 200, "Country Added Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const getCountry = async (req, res) => {
  try {
    const [result] = await db.query(CountryQuery.GetCountry);
    sendResponse(res, 200, "Get All Country Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const getCountrybyId = async (req, res) => {
  const { id } = req.params;
  try {
    const [matchId] = await db.query(CountryQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Country is not found");
    }
    const [result] = await db.query(CountryQuery.GetCountryByID, [id]);
    sendResponse(res, 200, "Get Country Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};
const updateCountry = async (req, res) => {
  const { id } = req.params;
  const { country_name, country_code, currency_code, status } = req.body;
  try {
    const [matchId] = await db.query(CountryQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Country is not found");
    }
    const result = await db.query(CountryQuery.Updatecountry, [
      country_name,
      country_code,
      currency_code,
      status,
      id,
    ]);

    sendResponse(res, 200, "Country Updated Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};
const deleteContry = async (req, res) => {
  const { id } = req.params;
  try {
    // Check country is exist
    const [matchId] = await db.query(CountryQuery.MatchId, [id]);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Country is not found");
    }

    // check state is exist
    const [statewxist] = await db.query(CountryQuery.StateExist, [id]);
    console.log("statewxist", statewxist);
    if (statewxist.length > 0) {
      sendResponse(
        res,
        400,
        "Cannot delete country because states exist for this country",
        [],
        false,
      );
      return;
    }
    const result = await db.query(CountryQuery.DeleteCountry, [id]);
    sendResponse(res, 200, "Country Deleted Successfully!!",[], true);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};
module.exports = {
  addCountry,
  getCountry,
  updateCountry,
  deleteContry,
  getCountrybyId,
};

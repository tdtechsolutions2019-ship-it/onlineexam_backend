const db = require("../../db");
const { CountryQuery, StatesQuery } = require("../../helper/queries");
const { sendResponse } = require("../../helper/response");

const addState = async (req, res) => {
  console.log("11111");
  const { country_id, states } = req.body;

  console.log("2222", req.body);

  try {
    let result;
    for (const state of states) {
      [result] = await db.query(StatesQuery.Add_State, [
        country_id,
        state.state_name,
        state.gst_code,
        state.status,
      ]);
    }

    sendResponse(res, 200, "State Added Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const getState = async (req, res) => {
  try {
    const [result] = await db.query(StatesQuery.GetState);
    sendResponse(res, 200, "Get All State Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};
const getStatebyId = async (req, res) => {
  const { id } = req.params;
  try {
    const [matchId] = await db.query(StatesQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "State is not found");
    }
    const [result] = await db.query(StatesQuery.GetStateByID, [id]);
    sendResponse(res, 200, "Get State Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};
const updateState = async (req, res) => {
  const { id } = req.params;
  const { country_id, states, status } = req.body;
  try {
    const [matchId] = await db.query(StatesQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "State is not found");
    }
    let result;
    for (const state of states) {
      [result] = await db.query(StatesQuery.Updatestate, [
        country_id,
        state.state_name,
        state.gst_code,
        state.status,
        state.id,
      ]);
    }
    
    sendResponse(res, 200, "State Updated Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};
const deleteState = async (req, res) => {
  const { id } = req.params;
  try {
    // Check country is exist
    const [matchId] = await db.query(StatesQuery.MatchId, [id]);
    console.log("matchId", matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "State is not found");
    }
    const result = await db.query(StatesQuery.DeleteState, [id]);
    sendResponse(res, 200, "State Deleted Successfully!!", {
      canDelete: true,
    });
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};
module.exports = { addState, getState, updateState, deleteState, getStatebyId };
  
const db = require("../../db");
const { SubjectQuery } = require("../../helper/queries");
const { sendResponse } = require("../../helper/response");

const addSubject = async (req, res) => {
  console.log("11111");

  const { subject_name,description,status } = req.body;

  

  try {
    const [result] = await db.query(SubjectQuery.addsubject, [
      subject_name,
      description,
      status,
    ]);

    sendResponse(res, 200, "Subject Added Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const getSubject = async (req, res) => {
  try {
    const [result] = await db.query(SubjectQuery.getsubject);
    sendResponse(res, 200, "Get All Subject Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};
const getSubjectByid = async (req, res) => {
  const { id } = req.params;
  try {
    const [matchId] = await db.query(SubjectQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Subject is not found");
    }
    const [result] = await db.query(SubjectQuery.getSubjectByid, [id]);
    sendResponse(res, 200, "Get Subject Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};
const updateSubject = async (req, res) => {
  const { id } = req.params;
  const { subject_name, description, status } = req.body;
  try {
    const [matchId] = await db.query(SubjectQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Subject is not found");
    }
    const [result] = await db.query(SubjectQuery.updateSubject, [
      subject_name,
      description,
      status,
      id,
    ]);

    sendResponse(res, 200, "Subject Updated Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};

const deleteSubject = async (req, res) => {
  const { id } = req.params;
  try {
    // Check country is exist
    const [matchId] = await db.query(SubjectQuery.MatchId, [id]);
    console.log("matchId", matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Subject is not found");
    }
    const result = await db.query(SubjectQuery.deleteSubject, [id]);
    sendResponse(res, 200, "Subject Deleted Successfully!!", {
      canDelete: true,
    });
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};
module.exports = {
  addSubject,
  getSubject,
  getSubjectByid,
  updateSubject,
  deleteSubject,
};
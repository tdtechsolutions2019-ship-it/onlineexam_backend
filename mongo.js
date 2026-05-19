const { MongoClient } = require("mongodb");

let db = null;

const connectMongoDB = async () => {
  const client = new MongoClient(process.env.MONGO_URL);
  await client.connect();
  db = client.db("exam_temp");
  console.log("MongoDB connected");
};
const getMongoDB = () => {
  if (!db)
    throw new Error("MongoDB not initialized. Call connectMongoDB first.");
  return db;
};

module.exports = { connectMongoDB, getMongoDB };

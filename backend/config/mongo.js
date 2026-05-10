const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || process.env.DB_NAME || 'inkbound';

let client;
let db;

async function connectMongo() {
  if (db) return db;
  client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(MONGO_DB_NAME);
  return db;
}

async function closeMongo() {
  if (client) await client.close();
  client = null;
  db = null;
}

module.exports = {
  connectMongo,
  closeMongo,
  MONGO_URI,
  MONGO_DB_NAME,
};

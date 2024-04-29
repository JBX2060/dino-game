const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const uri = "mongodb+srv://jbx2060:b8tHS7h90rKifwIx@rwar-prod.aplmdir.mongodb.net/?retryWrites=true&w=majority&appName=rwar-prod";
const dbName = "rwar"; // call the db name rwar
const collectionName = "accounts"; // call collection name accounts ( IF U DO NOT CALL THEM THAT IT WILL NOT WORK - pixey)
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const databaseFilePath = path.join(__dirname, "database.json");

if (fs.existsSync(databaseFilePath)) {
  const databaseData = fs.readFileSync(databaseFilePath, "utf8");
  try {
    database = JSON.parse(databaseData);
    if (Array.isArray(database)) database = { accounts: [], links: [] }; // remove after first run
  } catch (e) {
    database = {};
  }
}

(async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB.");
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    for (const accountId of database.accounts) {
      const document = database[accountId];

      if (!document) {
        console.error(`Document for accountId ${accountId} not found.`);
        continue;
      }

      const existingDocument = await collection.findOne({
        username: accountId,
      });

      if (existingDocument) {
        const updatedDocument = { ...existingDocument, ...document };
        await collection.updateOne(
          { username: accountId },
          { $set: updatedDocument }
        );
        console.log(`Updated document for accountId ${accountId}.`);
      } else {
        await collection.insertOne(document);
        console.log(`Added new document for accountId ${accountId}.`);
      }
    }
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
})();

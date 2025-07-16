const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

// MongoDB connection URI
const uri = "mongodb+srv://outbound:dhivash88@cluster0.qyahf1c.mongodb.net/testDB?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

// Endpoint to insert agentId and selectedNumber
app.post("/add-user", async (req, res) => {
  try {
    // Extract agentId and number
    const { agentId, selectedNumber } = req.body;
    console.log("Received payload:", req.body);

    if (!agentId || !selectedNumber) {
      return res.status(400).json({ error: "Missing agentId or selectedNumber" });
    }

    // Connect to MongoDB (connect only once)
    if (!client.topology?.isConnected()) {
      await client.connect();
    }

    const db = client.db("outbound");
    const collection = db.collection("outbound");

    // Insert into MongoDB
    const result = await collection.insertOne({
      agentId,
      selectedNumber,
      createdAt: new Date(),
    });

    res.status(200).json({ message: "Data inserted", id: result.insertedId });
  } catch (err) {
    console.error("Error saving data:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// Start server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

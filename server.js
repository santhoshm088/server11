const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

// MongoDB connection URI
const uri = "mongodb+srv://outbound:dhivash88@cluster0.qyahf1c.mongodb.net/testDB?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

// Endpoint to insert or update agentId and selectedNumber
app.post("/add-user", async (req, res) => {
  try {
    const { agentId, selectedNumber } = req.body;
    console.log("Received payload:", req.body);

    if (!agentId || !selectedNumber) {
      return res.status(400).json({ error: "Missing agentId or selectedNumber" });
    }

    // Connect to MongoDB if not connected already
    if (!client.topology?.isConnected()) {
      await client.connect();
    }

    const db = client.db("outbound");
    const collection = db.collection("outbound");

    // Check if agent already exists
    const existingAgent = await collection.findOne({ agentId });

    if (existingAgent) {
      // Update selectedNumber if agent exists
      const updateResult = await collection.updateOne(
        { agentId },
        { $set: { selectedNumber, updatedAt: new Date() } }
      );
      console.log("Updated existing agent:", updateResult);
      return res.status(200).json({ message: "Number updated for existing agent", agentId });
    } else {
      // Insert new record if agent not found
      const insertResult = await collection.insertOne({
        agentId,
        selectedNumber,
        createdAt: new Date(),
      });
      console.log("Inserted new agent:", insertResult);
      return res.status(200).json({ message: "New agent added", id: insertResult.insertedId });
    }
  } catch (err) {
    console.error("Error saving data:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// Start server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

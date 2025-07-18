const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

// MongoDB connection URI
const uri = "mongodb+srv://outbound:dhivash88@cluster0.qyahf1c.mongodb.net/testDB?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

app.post("/add-user", async (req, res) => {
  try {
    let { agentId, selectedNumber } = req.body;
    console.log("Original Agent ARN:", agentId);

    if (!agentId || !selectedNumber) {
      return res.status(400).json({ error: "Missing agentId or selectedNumber" });
    }

    // Extract only the last part of the ARN (agentId)
    const parts = agentId.split("/");
    agentId = parts[parts.length - 1]; // Only the ID, not the full ARN
    console.log("Extracted Agent ID:", agentId);

    // Connect to MongoDB if not already connected
    if (!client.topology?.isConnected()) {
      await client.connect();
    }

    const db = client.db("outbound");
    const collection = db.collection("outbound");

    // Check if agent already exists
    const existingAgent = await collection.findOne({ agentId });

    if (existingAgent) {
      // Update number
      const updateResult = await collection.updateOne(
        { agentId },
        { $set: { selectedNumber, updatedAt: new Date() } }
      );
      return res.status(200).json({ message: "Number updated", agentId });
    } else {
      // Insert new
      const insertResult = await collection.insertOne({
        agentId,
        selectedNumber,
        createdAt: new Date(),
      });
      return res.status(200).json({ message: "Agent added", id: insertResult.insertedId });
    }
  } catch (err) {
    console.error("Error saving data:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});



app.get("/config/agent/callerId", async (req, res) => {
  const { agentArn } = req.query;

  if (!agentArn) {
    return res.status(400).json({ error: "Missing agentArn" });
  }

  const agentId = agentArn.split("/").pop(); // Extract last part

  try {
    if (!client.topology?.isConnected()) {
      await client.connect();
    }

    const db = client.db("outbound");
    const collection = db.collection("outbound");

    const agent = await collection.findOne({ agentId });

    if (agent && agent.selectedNumber) {
      return res.status(200).json({ outboundNumber: agent.selectedNumber });
    } else {
      return res.status(404).json({ error: "Outbound number not found for this agent" });
    }
  } catch (err) {
    console.error("Error fetching outbound number:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});


app.post("/get-user", async (req, res) => {

   const { agentId } = req.body;
  
  try {
    if (!client.topology?.isConnected()) {
      await client.connect();
    }

    const db = client.db("outbound");
    const collection = db.collection("outbound");

    const agent = await collection.findOne({ agentId });

    if (agent && agent.selectedNumber) {
      return res.status(200).json({ selectedNumber: agent.selectedNumber });
    } else {
      return res.status(404).json({ error: "Outbound number not found for this agent" });
    }
  } catch (err) {
    console.error("Error fetching outbound number:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));







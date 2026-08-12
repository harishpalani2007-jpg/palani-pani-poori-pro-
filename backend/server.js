const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "PALANI PANI POORI Backend is running 🔥"
    });
});

const PORT = 5000;

async function startServer() {
    try {
        console.log("Connecting to MongoDB...");

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000
        });

        console.log("MongoDB Connected Successfully ✅");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} 🚀`);
        });

    } catch (error) {
        console.log("MongoDB Connection Error ❌");
        console.log(error.message);
    }
}

startServer();
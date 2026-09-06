const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "20kb" }));

/* =========================
   REVIEW SCHEMA
========================= */

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

const Review = mongoose.model("Review", reviewSchema);


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.json({
    message: "PALANI PANI POORI Backend is running 🔥"
  });
});


/* =========================
   ADD REVIEW
========================= */

app.post("/api/reviews", async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const comment = String(req.body.comment ?? "").trim();
    const rating = Number(req.body.rating);

    // Name validation
    if (!name) {
      return res.status(400).json({
        message: "Please enter your name."
      });
    }

    if (name.length > 50) {
      return res.status(400).json({
        message: "Name must be 50 characters or less."
      });
    }

    // Rating validation
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Please select a rating between 1 and 5 stars."
      });
    }

    // Comment validation
    if (!comment) {
      return res.status(400).json({
        message: "Please write a review."
      });
    }

    if (comment.length > 500) {
      return res.status(400).json({
        message: "Review must be 500 characters or less."
      });
    }

    // Save review
    const review = await Review.create({
      name,
      rating,
      comment
    });

    res.status(201).json({
      message: "Thank you! Your review has been submitted ⭐",
      review: {
        id: review._id,
        name: review.name,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      }
    });

  } catch (error) {
    console.error("Review submission error:", error);

    res.status(500).json({
      message: "Unable to submit review. Please try again."
    });
  }
});


/* =========================
   GET REVIEWS
========================= */

app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(reviews);

  } catch (error) {
    console.error("Get reviews error:", error);

    res.status(500).json({
      message: "Unable to load reviews."
    });
  }
});


/* =========================
   REVIEW STATISTICS
========================= */

app.get("/api/reviews/stats", async (req, res) => {
  try {
    const result = await Review.aggregate([
      {
        $group: {
          _id: null,

          total: {
            $sum: 1
          },

          average: {
            $avg: "$rating"
          },

          five: {
            $sum: {
              $cond: [{ $eq: ["$rating", 5] }, 1, 0]
            }
          },

          four: {
            $sum: {
              $cond: [{ $eq: ["$rating", 4] }, 1, 0]
            }
          },

          three: {
            $sum: {
              $cond: [{ $eq: ["$rating", 3] }, 1, 0]
            }
          },

          two: {
            $sum: {
              $cond: [{ $eq: ["$rating", 2] }, 1, 0]
            }
          },

          one: {
            $sum: {
              $cond: [{ $eq: ["$rating", 1] }, 1, 0]
            }
          }
        }
      }
    ]);

    if (!result.length) {
      return res.json({
        total: 0,
        average: 0,
        distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        }
      });
    }

    const stats = result[0];

    res.json({
      total: stats.total,
      average: Number(stats.average.toFixed(1)),

      distribution: {
        5: stats.five,
        4: stats.four,
        3: stats.three,
        2: stats.two,
        1: stats.one
      }
    });

  } catch (error) {
    console.error("Review stats error:", error);

    res.status(500).json({
      message: "Unable to load rating statistics."
    });
  }
});


/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;


/* =========================
   MONGODB CONNECTION
========================= */

async function startServer() {
  try {
    console.log("=================================");
    console.log("Starting PALANI PANI POORI Backend");
    console.log("=================================");

    // Check whether Render received the environment variable
    console.log(
      "MONGODB_URI exists:",
      Boolean(process.env.MONGODB_URI)
    );

    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is missing!");
      console.error(
        "Please add MONGODB_URI in Render → Environment."
      );
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("MongoDB Connected Successfully ✅");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);
      console.log(`Port: ${PORT}`);
    });

  } catch (error) {
    console.error("=================================");
    console.error("MongoDB Connection Error ❌");
    console.error("=================================");

    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code || "N/A");

    console.error("---------------------------------");
    console.error(
      "MongoDB connection failed. Check:"
    );
    console.error("1. MONGODB_URI in Render Environment");
    console.error("2. MongoDB Atlas Database User");
    console.error("3. MongoDB Atlas Network Access");
    console.error("4. MongoDB cluster status");
    console.error("---------------------------------");

    process.exit(1);
  }
}

startServer();
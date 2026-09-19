const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());
app.use(express.json({ limit: "20kb" }));

/* =========================
   MONGODB CONNECTION
========================= */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully ✅");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error ❌");
    console.error(error.message);
  });

/* =========================
   REVIEW MODEL
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
    message: "PALANI PANI POORI Backend is running 🔥",
    database:
      mongoose.connection.readyState === 1
        ? "MongoDB Connected"
        : "MongoDB Disconnected"
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

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Please select a rating between 1 and 5 stars."
      });
    }

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

    const review = await Review.create({
      name,
      rating,
      comment
    });

    res.status(201).json({
      message: "Thank you! Your review has been submitted ⭐",
      review
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

    const total = await Review.countDocuments();

    if (total === 0) {
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

    const stats = await Review.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: "$rating" }
        }
      }
    ]);

    const ratingDistribution = await Review.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      }
    ]);

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    ratingDistribution.forEach((item) => {
      distribution[item._id] = item.count;
    });

    res.json({
      total,

      average: Number(
        stats[0].average.toFixed(1)
      ),

      distribution
    });

  } catch (error) {

    console.error("Review stats error:", error);

    res.status(500).json({
      message: "Unable to load rating statistics."
    });
  }
});

/* =========================
   404
========================= */

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found."
  });
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log("=================================");
  console.log("Starting PALANI PANI POORI Backend");
  console.log("=================================");

  console.log(`Server running on port ${PORT} 🚀`);

});
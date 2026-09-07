const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20kb" }));

/* =========================
   TEMPORARY REVIEW STORAGE
   MongoDB இல்லாமல் வேலை செய்யும்
========================= */

let reviews = [];

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

app.post("/api/reviews", (req, res) => {
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

    // Create review
    const review = {
      id: Date.now().toString(),
      name,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    // Add newest review first
    reviews.unshift(review);

    // Keep maximum 100 reviews
    reviews = reviews.slice(0, 100);

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

app.get("/api/reviews", (req, res) => {
  try {
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

app.get("/api/reviews/stats", (req, res) => {
  try {
    const total = reviews.length;

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

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    let totalRating = 0;

    reviews.forEach((review) => {
      totalRating += review.rating;
      distribution[review.rating]++;
    });

    const average = Number((totalRating / total).toFixed(1));

    res.json({
      total,
      average,
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
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("=================================");
  console.log("Starting PALANI PANI POORI Backend");
  console.log("=================================");
  console.log("MongoDB: DISABLED");
  console.log(`Server running on port ${PORT} 🚀`);
});
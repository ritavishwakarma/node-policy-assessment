const ScheduledPost = require("../models/ScheduledPost");

const createPost = async (req, res) => {
  try {
    const { message, day, time } = req.body;

    if (!message || !day || !time) {
      return res.status(400).json({
        message: "message, day and time are required"
      });
    }

    const scheduledAt = new Date(`${day}T${time}:00`);

    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({
        message: "Invalid day or time"
      });
    }

    if (scheduledAt <= new Date()) {
      return res.status(400).json({
        message: "Scheduled time must be in the future"
      });
    }

    const scheduledPost = await ScheduledPost.create({
      message,
      scheduledAt
    });

    return res.status(201).json({
      message: "Post scheduled successfully",
      post: scheduledPost
    });
  } catch (error) {
    console.error("Post scheduling error:", error);

    return res.status(500).json({
      message: "Failed to schedule post",
      error: error.message
    });
  }
};

module.exports = {
  createPost
};
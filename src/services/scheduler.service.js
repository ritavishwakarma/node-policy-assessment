const cron = require("node-cron");

const ScheduledPost = require("../models/ScheduledPost");
const Post = require("../models/Post");

const startScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const scheduledPosts = await ScheduledPost.find({
        status: "PENDING",
        scheduledAt: {
          $lte: now
        }
      });

      for (const scheduledPost of scheduledPosts) {
        // Lock the scheduled post first
        const lockedPost =
          await ScheduledPost.findOneAndUpdate(
            {
              _id: scheduledPost._id,
              status: "PENDING"
            },
            {
              $set: {
                status: "COMPLETED"
              }
            },
            {
              new: true
            }
          );

        // Another scheduler/process already handled it
        if (!lockedPost) {
          continue;
        }

        await Post.create({
  message: lockedPost.message,
  scheduledPostId: lockedPost._id,
  postedAt: new Date()
});

        console.log(
          `Post inserted: ${lockedPost.message}`
        );
      }
    } catch (error) {
      console.error(
        "Scheduler error:",
        error.message
      );
    }
  });

  console.log("Post scheduler started");
};

module.exports = {
  startScheduler
};
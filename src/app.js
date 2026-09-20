const express = require("express");

const uploadRoutes = require("./routes/upload.routes");
const policyRoutes = require("./routes/policy.routes");
const postRoutes = require("./routes/post.routes");

const app = express();

app.use(express.json());

app.use("/api/upload", uploadRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/posts", postRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "OK"
  });
});

module.exports = app;
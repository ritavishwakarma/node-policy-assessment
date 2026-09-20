require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const {
  startCpuMonitor
} = require("./services/cpuMonitor.service");
const {
  startScheduler
} = require("./services/scheduler.service");
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );

      startCpuMonitor();
      startScheduler();
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer();
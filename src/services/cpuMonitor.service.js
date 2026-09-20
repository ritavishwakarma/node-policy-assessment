const os = require("os");

const getCpuTimes = () => {
  const cpus = os.cpus();

  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    const times = cpu.times;

    idle += times.idle;

    total +=
      times.user +
      times.nice +
      times.sys +
      times.idle +
      times.irq;
  }

  return {
    idle,
    total
  };
};

const calculateCpuUsage = (start, end) => {
  const idleDifference = end.idle - start.idle;
  const totalDifference = end.total - start.total;

  if (totalDifference === 0) {
    return 0;
  }

  return (
    100 -
    (idleDifference / totalDifference) * 100
  );
};

const startCpuMonitor = () => {
  let previousCpu = getCpuTimes();

  setInterval(() => {
    const currentCpu = getCpuTimes();

    const cpuUsage = calculateCpuUsage(
      previousCpu,
      currentCpu
    );

    previousCpu = currentCpu;

    console.log(
      `CPU Usage: ${cpuUsage.toFixed(2)}%`
    );

    if (cpuUsage >= 70) {
      console.log(
        "CPU usage exceeded 70%. Restarting server..."
      );

      process.exit(1);
    }
  }, 5000);
};

module.exports = {
  startCpuMonitor
};
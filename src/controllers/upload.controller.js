// const path = require("path");
// const { Worker } = require("worker_threads");

// const { importData } = require("../services/import.service");

// const uploadFile = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         message: "Please upload a CSV file"
//       });
//     }

//     const filePath = path.resolve(req.file.path);

//     const worker = new Worker(
//       path.resolve(
//         __dirname,
//         "../workers/csv.worker.js"
//       ),
//       {
//         workerData: {
//           filePath
//         }
//       }
//     );

//     worker.on("message", async (result) => {
//       if (!result.success) {
//         return res.status(500).json({
//           message: "File processing failed",
//           error: result.error
//         });
//       }

//       try {
//         const importResult = await importData(
//           result.rows
//         );

//         return res.status(200).json({
//           message: "File uploaded successfully",
//           totalRows: importResult.totalRows,
//           importedPolicies:
//             importResult.importedPolicies
//         });
//       } catch (error) {
//         return res.status(500).json({
//           message: "Database import failed",
//           error: error.message
//         });
//       }
//     });

//     worker.on("error", (error) => {
//       return res.status(500).json({
//         message: "Worker failed",
//         error: error.message
//       });
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Upload failed",
//       error: error.message
//     });
//   }
// };

// module.exports = {
//   uploadFile
// };
const path = require("path");
const { Worker } = require("worker_threads");

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a CSV file"
      });
    }

    const filePath = path.resolve(req.file.path);

    const worker = new Worker(
      path.resolve(
        __dirname,
        "../workers/csv.worker.js"
      ),
      {
        workerData: {
          filePath,
          mongoUri: process.env.MONGO_URI
        }
      }
    );

    worker.on("message", (result) => {
      if (!result.success) {
        return res.status(500).json({
          message: "File processing failed",
          error: result.error
        });
      }

      return res.status(200).json({
        message: "File uploaded successfully",
        totalRows: result.totalRows,
        importedPolicies: result.importedPolicies
      });
    });

    worker.on("error", (error) => {
      return res.status(500).json({
        message: "Worker failed",
        error: error.message
      });
    });
  } catch (error) {
    return res.status(500).json({
      message: "Upload failed",
      error: error.message
    });
  }
};

module.exports = {
  uploadFile
};
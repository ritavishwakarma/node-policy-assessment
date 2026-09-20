// const { parentPort, workerData } = require("worker_threads");
// const fs = require("fs");
// const csv = require("csv-parser");

// const rows = [];

// fs.createReadStream(workerData.filePath)
//   .pipe(csv())
//   .on("data", (row) => {
//     rows.push(row);
//   })
//   .on("end", () => {
//     parentPort.postMessage({
//       success: true,
//       rows
//     });
//   })
//   .on("error", (error) => {
//     parentPort.postMessage({
//       success: false,
//       error: error.message
//     });
//   });
const { parentPort, workerData } = require("worker_threads");
const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");

const Agent = require("../models/Agent");
const User = require("../models/User");
const Account = require("../models/Account");
const Lob = require("../models/Lob");
const Carrier = require("../models/Carrier");
const Policy = require("../models/Policy");

const importData = async (rows) => {
  let importedPolicies = 0;

  const agentCache = new Map();
  const userCache = new Map();
  const accountCache = new Map();
  const lobCache = new Map();
  const carrierCache = new Map();

  for (const row of rows) {
    try {
      const agentName = row.agent?.trim();

      if (!agentName) {
        continue;
      }

      // Agent
      let agentId = agentCache.get(agentName);

      if (!agentId) {
        const agent = await Agent.findOneAndUpdate(
          { name: agentName },
          { $set: { name: agentName } },
          { upsert: true, returnDocument: "after" }
        );

        agentId = agent._id;
        agentCache.set(agentName, agentId);
      }

      // User
      const firstName = row.firstname?.trim();

      if (!firstName) {
        continue;
      }

      const email = row.email?.trim();
      const userKey = `${firstName}_${email || ""}`;

      let userId = userCache.get(userKey);

      if (!userId) {
        const user = await User.findOneAndUpdate(
          {
            firstName,
            email
          },
          {
            $set: {
              firstName,
              dob: row.dob ? new Date(row.dob) : null,
              address: row.address?.trim(),
              phone: row.phone?.trim(),
              state: row.state?.trim(),
              zipCode: row.zip?.trim(),
              email,
              gender: row.gender?.trim(),
              userType: row.userType?.trim(),
              agentId
            }
          },
          {
            upsert: true,
returnDocument: "after"          }
        );

        userId = user._id;
        userCache.set(userKey, userId);
      }

      // Account
      const accountName = row.account_name?.trim();
      let accountId = null;

      if (accountName) {
        const accountKey = `${accountName}_${userId}`;

        accountId = accountCache.get(accountKey);

        if (!accountId) {
          const account = await Account.findOneAndUpdate(
            {
              name: accountName,
              userId
            },
            {
              $set: {
                name: accountName,
                userId
              }
            },
            {
              upsert: true,
returnDocument: "after"            }
          );

          accountId = account._id;
          accountCache.set(accountKey, accountId);
        }
      }

      // LOB / Policy Category
      const categoryName = row.category_name?.trim();
      let categoryId = null;

      if (categoryName) {
        categoryId = lobCache.get(categoryName);

        if (!categoryId) {
          const lob = await Lob.findOneAndUpdate(
            { categoryName },
            { $set: { categoryName } },
            {
              upsert: true,
              returnDocument: "after"
            }
          );

          categoryId = lob._id;
          lobCache.set(categoryName, categoryId);
        }
      }

      // Carrier
      const companyName = row.company_name?.trim();
      let carrierId = null;

      if (companyName) {
        carrierId = carrierCache.get(companyName);

        if (!carrierId) {
          const carrier = await Carrier.findOneAndUpdate(
            { companyName },
            { $set: { companyName } },
            {
              upsert: true,
              returnDocument: "after"
            }
          );

          carrierId = carrier._id;
          carrierCache.set(companyName, carrierId);
        }
      }

      // Policy
      const policyNumber = row.policy_number?.trim();

      if (!policyNumber) {
        continue;
      }

      await Policy.findOneAndUpdate(
        {
          policyNumber
        },
        {
          $set: {
            policyNumber,
            policyStartDate: row.policy_start_date
              ? new Date(row.policy_start_date)
              : null,
            policyEndDate: row.policy_end_date
              ? new Date(row.policy_end_date)
              : null,
            categoryId,
            carrierId,
            userId
          }
        },
        {
          upsert: true,
returnDocument: "after"        }
      );

      importedPolicies++;
    } catch (error) {
      console.error(
        `Failed to process policy ${row.policy_number}:`,
        error.message
      );
    }
  }

  return {
    totalRows: rows.length,
    importedPolicies
  };
};

const startWorker = async () => {
  try {
    await mongoose.connect(workerData.mongoUri);

    console.log("Worker MongoDB connected");

    const rows = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(workerData.filePath)
        .pipe(csv())
        .on("data", (row) => {
          rows.push(row);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    const result = await importData(rows);

    parentPort.postMessage({
      success: true,
      ...result
    });

    await mongoose.disconnect();
  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message
    });
  }
};

startWorker();
const Agent = require("../models/Agent");
const User = require("../models/User");
const Account = require("../models/Account");
const Lob = require("../models/Lob");
const Carrier = require("../models/Carrier");
const Policy = require("../models/Policy");

const importData = async (rows) => {
  let importedPolicies = 0;

  // Cache existing IDs to avoid repeated DB queries
  const agentCache = new Map();
  const userCache = new Map();
  const accountCache = new Map();
  const lobCache = new Map();
  const carrierCache = new Map();

  for (const row of rows) {
    try {
      /*
       * 1. AGENT
       */
      const agentName = row.agent?.trim();

      if (!agentName) {
        continue;
      }

      let agentId = agentCache.get(agentName);

      if (!agentId) {
        const agent = await Agent.findOneAndUpdate(
          { name: agentName },
          { $set: { name: agentName } },
          {
            upsert: true,
            new: true
          }
        );

        agentId = agent._id;
        agentCache.set(agentName, agentId);
      }

      /*
       * 2. USER
       */
      const firstName = row.firstname?.trim();

      if (!firstName) {
        continue;
      }

      // Email is useful for identifying the same user
      const userKey = `${firstName}_${row.email || ""}`;

      let userId = userCache.get(userKey);

      if (!userId) {
        const user = await User.findOneAndUpdate(
          {
            firstName,
            email: row.email?.trim()
          },
          {
            $set: {
              firstName,
              dob: row.dob ? new Date(row.dob) : null,
              address: row.address?.trim(),
              phone: row.phone?.trim(),
              state: row.state?.trim(),
              zipCode: row.zip?.trim(),
              email: row.email?.trim(),
              gender: row.gender?.trim(),
              userType: row.userType?.trim(),
              agentId
            }
          },
          {
            upsert: true,
            new: true
          }
        );

        userId = user._id;
        userCache.set(userKey, userId);
      }

      /*
       * 3. ACCOUNT
       */
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
              new: true
            }
          );

          accountId = account._id;
          accountCache.set(accountKey, accountId);
        }
      }

      /*
       * 4. LOB
       */
      const categoryName = row.category_name?.trim();

      let categoryId = null;

      if (categoryName) {
        categoryId = lobCache.get(categoryName);

        if (!categoryId) {
          const lob = await Lob.findOneAndUpdate(
            {
              categoryName
            },
            {
              $set: {
                categoryName
              }
            },
            {
              upsert: true,
              new: true
            }
          );

          categoryId = lob._id;
          lobCache.set(categoryName, categoryId);
        }
      }

      /*
       * 5. CARRIER
       */
      const companyName = row.company_name?.trim();

      let carrierId = null;

      if (companyName) {
        carrierId = carrierCache.get(companyName);

        if (!carrierId) {
          const carrier = await Carrier.findOneAndUpdate(
            {
              companyName
            },
            {
              $set: {
                companyName
              }
            },
            {
              upsert: true,
              new: true
            }
          );

          carrierId = carrier._id;
          carrierCache.set(companyName, carrierId);
        }
      }

      /*
       * 6. POLICY
       */
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
          new: true
        }
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

module.exports = {
  importData
};
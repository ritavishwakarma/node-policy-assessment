const User = require("../models/User");
const Policy = require("../models/Policy");

const searchPoliciesByUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        message: "username is required"
      });
    }

    const users = await User.find({
      firstName: {
        $regex: username,
        $options: "i"
      }
    });

    if (!users.length) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const userIds = users.map((user) => user._id);

    const policies = await Policy.find({
      userId: { $in: userIds }
    })
      .populate("categoryId", "categoryName")
      .populate("carrierId", "companyName")
      .populate("userId", "firstName email");

    return res.status(200).json({
      username,
      totalPolicies: policies.length,
      policies
    });
  } catch (error) {
    console.error("Policy search error:", error);

    return res.status(500).json({
      message: "Failed to search policies",
      error: error.message
    });
  }
};

const getAggregatedPolicies = async (req, res) => {
  try {
    const result = await Policy.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $lookup: {
          from: "lobs",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "carriers",
          localField: "carrierId",
          foreignField: "_id",
          as: "carrier"
        }
      },
      {
        $unwind: {
          path: "$carrier",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$user._id",
          username: {
            $first: "$user.firstName"
          },
          email: {
            $first: "$user.email"
          },
          totalPolicies: {
            $sum: 1
          },
          policies: {
            $push: {
              policyNumber: "$policyNumber",
              policyStartDate: "$policyStartDate",
              policyEndDate: "$policyEndDate",
              category: "$category.categoryName",
              carrier: "$carrier.companyName"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          username: 1,
          email: 1,
          totalPolicies: 1,
          policies: 1
        }
      }
    ]);

    return res.status(200).json({
      totalUsers: result.length,
      users: result
    });
  } catch (error) {
    console.error("Aggregation error:", error);

    return res.status(500).json({
      message: "Failed to aggregate policies",
      error: error.message
    });
  }
};

module.exports = {
  searchPoliciesByUsername,
  getAggregatedPolicies
};
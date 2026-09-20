const express = require("express");

const {
  searchPoliciesByUsername,
    getAggregatedPolicies
} = require("../controllers/policy.controller");

const router = express.Router();

router.get("/search", searchPoliciesByUsername);

router.get("/aggregate", getAggregatedPolicies);


module.exports = router;
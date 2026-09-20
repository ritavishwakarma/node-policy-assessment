const express = require("express");
const multer = require("multer");

const {
  uploadFile
} = require("../controllers/upload.controller");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",

  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${file.originalname}`
    );
  }
});

const upload = multer({
  storage
});

router.post(
  "/",
  upload.single("file"),
  uploadFile
);

module.exports = router;
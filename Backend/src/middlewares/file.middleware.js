const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),//file is stored temporarily in RAM as a buffer inside req.file
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    // Only allow PDF files
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only PDF files are allowed."), false);
        }
    }
});

module.exports = upload;
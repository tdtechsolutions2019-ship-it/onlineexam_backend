import multer from "multer";
import path from "path";

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads";

    if (file.fieldname === "center_logo") {
      uploadPath = "uploads/centerLogos";
    } else if (file.fieldname === "profile_photo") {
      uploadPath = "uploads/studentPhotos";
    }
    else if (file.fieldname === "user_img") {
      uploadPath = "uploads/userPhotos";
    }
    cb(null, path.join(process.cwd(), uploadPath));
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// file filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

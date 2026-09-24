import multer from "multer";
import type { Request, Response, NextFunction } from "express";

const storage = multer.diskStorage({});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, and PNG images are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB in bytes
  }
});

const handleUploadError = (req: Request, res: Response, next: NextFunction) => {
  upload.single("coverImage")(req, res, (err) => {
    if (err) {
      if (err.message === "Only JPG, JPEG, and PNG images are allowed") {
        return res.status(400).json({
          success: false,
          errors: [{ field: "coverImage", message: "Only JPG, JPEG, and PNG images are allowed" }]
        });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          errors: [{ field: "coverImage", message: "Image size must be less than 5MB" }]
        });
      }
      return res.status(400).json({
        success: false,
        errors: [{ field: "coverImage", message: err.message }]
      });
    }
    next();
  });
};

const uploadSingle = (fieldName = "image") => (req: Request, res: Response, next: NextFunction) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err.message === "Only JPG, JPEG, and PNG images are allowed") {
        return res.status(400).json({
          success: false,
          errors: [{ field: fieldName, message: "Only JPG, JPEG, and PNG images are allowed" }]
        });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          errors: [{ field: fieldName, message: "Image size must be less than 5MB" }]
        });
      }
      return res.status(400).json({
        success: false,
        errors: [{ field: fieldName, message: err.message }]
      });
    }
    if (Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

export { handleUploadError, uploadSingle };
export default upload;

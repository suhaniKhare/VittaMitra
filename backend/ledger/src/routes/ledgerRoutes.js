import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { processVoiceTransaction } from '../controllers/ledgerController.js';

const router = express.Router();

// Define uploads directory path
const UPLOAD_DIR = './uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.wav';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter (accept common audio formats)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg', 'application/octet-stream'];
  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Translate voice to ledger endpoint
router.post('/translate-voice', upload.single('audio'), processVoiceTransaction);

export default router;

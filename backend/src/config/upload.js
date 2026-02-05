import multer from 'multer';
import path from 'path';
import fs from 'fs';

// гарантируем, что папка uploads существует
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// нормализация строки → безопасное имя файла
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // пробелы → -
    .replace(/[^\w\-]+/g, '')   // убираем всё лишнее
    .replace(/\-\-+/g, '-');    // -- → -
}

// дата + время
function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');

  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds())
  ].join('-');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    // имя берём из body
    // и у students, и у teachers поле называется fullName
    const fullName = req.body?.fullName || 'unknown';

    const safeName = slugify(fullName);
    const ext = path.extname(file.originalname).toLowerCase();

    const finalName = `${safeName}-${timestamp()}${ext}`;

    cb(null, finalName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only images allowed'));
      return;
    }
    cb(null, true);
  }
});

export default upload;

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const app = express();

// MongoDB Connection
mongoose.connect('mongodb+srv://alok1993:Linux1998@cluster0.kzdim.mongodb.net/csvuploadapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a CSV model
const CsvModel = mongoose.model('Csv', {
  filename: String,
  data: Array,
});

app.get('/csv/:id', async (req, res) => {
    const csvFile = await CsvModel.findById(req.params.id);
  
    if (!csvFile) {
      return res.status(404).send('CSV file not found');
    }
  
    res.render('csv', { data: csvFile.data });
  });
  

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Serve static files
app.use(express.static('public'));

// Routes
app.get('/', async (req, res) => {
  const csvFiles = await CsvModel.find();
  res.render('index', { csvFiles });
});

app.post('/upload', upload.single('csvFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No files were uploaded.');
  }

  const data = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      data.push(row);
    })
    .on('end', async () => {
      // Save CSV data to MongoDB
      const csvModel = new CsvModel({
        filename: req.file.filename,
        data: data,
      });
      await csvModel.save();

      fs.unlinkSync(req.file.path); // Delete the uploaded CSV file

      res.redirect('/');
    });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

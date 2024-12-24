const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const app = express();
const Book = require('./config/db');  
const mongoose = require('mongoose');
require("dotenv").config();
const https = require("https");

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());


// Serve the uploads folder as a static directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // append timestamp to avoid name collisions
    }
});

const upload = multer({ storage: storage });

// Home route
app.get('/', async (req, res) => {
    try {
        // Fetch books from the MongoDB database
        const books = await Book.find();  // Now using async/await
        res.render('index', { books: books });
    } catch (err) {
        console.log(err);
        res.status(500).send('An error occurred while fetching books.');
    }
});

// Add book 
app.get('/add', (req, res) => {
    res.render('addBook');
});

// Handle review submission
app.post("/add", upload.single("cover"), async (req, res) => {
    try {
      const genresArray = req.body.genres
        ? req.body.genres.split(",").map((genre) => genre.trim())
        : [];
      const book = new Book({
        title: req.body.title,
        content: req.body.content,
        author: req.body.author,
        reviewer: req.body.reviewer,
        genres: genresArray,
        verdict: req.body.verdict,
        cover: req.file ? "/uploads/" + req.file.filename : null,
      });
  
      await book.save();
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.status(500).send("An error occurred while adding the book.");
    }
  });


// Single book route
app.get('/books/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        
        // Check if the ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookId) || bookId === '0') {
            return res.status(400).send('Invalid book ID format');
        }

        const book = await Book.findById(bookId);  // Find the book by ID

        if (!book) {
            return res.status(404).send('Book not found');
        }
        
        res.render('book', { book: book });
    } catch (err) {
        console.log(err);
        res.status(500).send('An error occurred while fetching the book.');
    }
});

app.post('/books/:bookId/upvote', async (req, res) => {
    const bookId = req.params.bookId;
    const userId = req.body.userId;  // Assuming userId is sent from the client

    try {
        // Ensure bookId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ success: false, message: 'Invalid book ID format' });
        }

        // Attempt to find the book
        const book = await Book.findById(bookId);

        // Check if the book exists
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        // Check if the user has already voted
        if (book.voters.includes(userId)) {
            return res.status(400).json({ success: false, message: 'You have already upvoted this book.' });
        }

        // Add user to voters and increment aura points
        book.voters.push(userId);
        book.auraPoints += 1;
        await book.save();  // Save the updated book document

        // Respond with the new aura points
        res.json({ success: true, newAuraPoints: book.auraPoints });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: 'Error updating aura points' });
    }
});

app.get("/apiKey", (req, res) => {
    res.json({ apiKey: process.env.OPENAI_API_KEY });
  });
  
  app.get("/bookRec", (req, res) => {
    res.render("bookRec");
  });
  
  app.post("/api/chat", (req, res) => {
    console.log("Request received with prompt:", req.body.prompt);
    const { prompt } = req.body;
  
    const data = JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
  
    const options = {
      hostname: "api.openai.com",
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Length": Buffer.byteLength(data),
      },
    };
  
    const request = https.request(options, (response) => {
      let body = "";
  
      response.on("data", (chunk) => {
        body += chunk;
      });
  
      response.on("end", () => {
        console.log("Response from OpenAI:", body); // Log the entire response
        const result = JSON.parse(body);
        console.log("Parsed result:", result); // Log the parsed result
  
        // Check if the choices array exists and has at least one element
        if (result.choices && result.choices.length > 0) {
          res.json(result.choices[0].message.content);
        } else {
          console.error("No choices available in response:", result);
          res.status(500).json({ error: "No choices available in response." });
        }
      });
    });
  
    request.on("error", (error) => {
      console.error("Error with the request:", error);
      res.status(500).json({ error: "Error fetching AI response" });
    });
  
    // Write data to request body
    request.write(data);
    request.end();
  });
  

app.listen(3000, () => {
    console.log('Server is listening on PORT 3000');
});

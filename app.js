const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const app = express();
const Book = require('./config/db');  // Assuming the model is in the config folder
const mongoose = require('mongoose');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

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
app.post('/add', upload.single('cover'), async (req, res) => {
    try {
        
        // console.log('Genres received from form:', req.body.genres);  // Specific check for genres
        
        // Split the genres string into an array, trimming spaces
        const genresArray = req.body.genres ? req.body.genres.split(',').map(genre => genre.trim()) : [];
        // console.log('Parsed genres array:', genresArray);

        const book = new Book({
            title: req.body.title,
            content: req.body.content,
            author: req.body.author,
            reviewer: req.body.reviewer,
            genres: genresArray, 
            verdict,
            cover: req.file ? '/uploads/' + req.file.filename : null
        });

        await book.save();  // Save book to the database
        res.redirect('/');
    } catch (err) {
        console.log(err);
        res.status(500).send('An error occurred while adding the book.');
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

app.listen(3000, () => {
    console.log('Server is listening on PORT 3000');
});

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/bookDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Failed to connect to MongoDB', err));

const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    reviewer: String,
    content: String,
    genres: [String],
    verdict: String,
    cover: String, 
    auraPoints: { type: Number, default: 0},
    voters: { type: [String], default: [] }
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;

function upvoteBook(bookId) {
    let userId = localStorage.getItem('userId');

    if (!userId) {
        userId = `user_${Date.now()}`;  // Generate a new unique ID
        localStorage.setItem('userId', userId);  // Store it
    }

    fetch(`/books/${bookId}/upvote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            document.querySelector(`#aura-count-${bookId}`).innerText = data.newAuraPoints;
            document.querySelector(`#sparkles-icon-${bookId}`).style.color = "#FFD700"; 

            // Store the upvote in localStorage
            const votedBooks = JSON.parse(localStorage.getItem('votedBooks')) || {};
            votedBooks[bookId] = true;  // Mark this book as upvoted
            localStorage.setItem('votedBooks', JSON.stringify(votedBooks));
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error("Error:", error));
}


window.onload = function() {
    const userId = getCurrentUserId();  // Function to get the logged-in user's ID
    const bookId = '<%= book._id %>';  // This will only work if bookId is globally accessible or passed somehow

    // Check localStorage for upvote status
    const votedBooks = JSON.parse(localStorage.getItem('votedBooks')) || {};
    if (votedBooks[bookId]) {
        document.querySelector(`#sparkles-icon-${bookId}`).style.color = 'gold';  // Set to gold if already voted
    }

    fetch(`/books/${bookId}`)
        .then(response => response.json())
        .then(book => {
            // Check if the current user has voted for this book (optional, in case server needs to validate)
            if (book.voters.includes(userId)) {
                document.querySelector(`#sparkles-icon-${bookId}`).style.color = 'gold';  // Set to gold if already voted
            }
        });
};
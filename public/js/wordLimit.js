document.addEventListener("DOMContentLoaded", () => {
    const wordLimit = 350; 
    const bookContentTextarea = document.getElementById("content");
    const wordCountMessage = document.getElementById("wordCount");
    const submitButton = document.querySelector(".publish-btn");

    const updateWordCount = () => {
        const content = bookContentTextarea.value.trim();
        const wordCount = content.length === 0 ? 0 : content.split(/\s+/).filter(Boolean).length;

        if (wordCount > wordLimit) {
            wordCountMessage.textContent = `Word limit exceeded!`;
            wordCountMessage.style.color = "red";
            submitButton.disabled = true; 
        } else {
            wordCountMessage.textContent = `${wordCount}/${wordLimit}`;
            wordCountMessage.style.color = "#8d8989";
            submitButton.disabled = false; 
        }
    };

    bookContentTextarea.addEventListener("input", updateWordCount);

    updateWordCount();
});

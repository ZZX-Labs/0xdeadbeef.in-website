// Ensure the background audio is unmuted after the page loads
document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('background-audio');

    // Remove mute after page load (allows autoplay if user interaction is required)
    audio.muted = false;

    // Optionally, you can set volume, or handle user interactions for audio control.
    audio.volume = 0.5; // Set volume to 50%
});

// If you plan to add interactive functions like a pause button or audio control,
// you can add event listeners here in the future. For example:

// document.getElementById("pause-button").addEventListener("click", function() {
//     const audio = document.getElementById('background-audio');
//     audio.pause();
// });

document.querySelectorAll('.button').forEach(button => {
    button.onmouseover = () => button.style.backgroundColor = '#0056b3';
    button.onmouseout = () => button.style.backgroundColor = '#007bff';
});

// JavaScript for handling the background audio
document.addEventListener("DOMContentLoaded", () => {
    const audio = document.getElementById("background-audio");

    // Set the audio volume (range 0.0 to 1.0)
    audio.volume = 0.5;

    console.log("Background audio loaded and set to loop.");
});

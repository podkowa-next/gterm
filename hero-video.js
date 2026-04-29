// Select all videos with data attribute wb-embed="video"
const videos = document.querySelectorAll('[wb-embed="video"]');

// Pause all videos on initial load
videos.forEach((video) => {
  video.pause();
});

// Scroll-based play/pause control
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      const button = document.querySelector(`.play-pause-btn[data-video-id="${video.getAttribute('data-video-id')}"]`);

      if (entry.intersectionRatio > 0.2) {
        video.play();
        // Update button state to "playing"
        button?.classList.add('playing');
      } else {
        video.pause();
        // Update button state to "paused"
        button?.classList.remove('playing');
      }
    });
  },
  {
    threshold: 0.2, // Play when at least 20% of the video is visible
  }
);

// Attach observer to videos
videos.forEach((video) => {
  observer.observe(video);
});

// Add click event listeners to play/pause buttons
const buttons = document.querySelectorAll('.play-pause-btn');

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const videoId = button.getAttribute('data-video-id');
    const video = document.querySelector(`[wb-embed="video"][data-video-id="${videoId}"]`);

    if (video) {
      if (video.paused) {
        video.muted = false;
        video.play();
        button.classList.add('playing'); // Add "playing" class to button
      } else {
        video.pause();
        button.classList.remove('playing'); // Remove "playing" class from button
      }
    }
  });
});
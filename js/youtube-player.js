/**
 * youtube-player.js - Curated Morning Meditation YouTube Embed Player
 * Handles playlist curation, custom YouTube URL parsing, and embedded playback.
 */

class YouTubeMeditationPlayer {
  constructor() {
    this.currentVideoId = null;
    this.curatedList = [
      {
        id: '1ZYbU82GVz4',
        title: '5분 아침 리셋 명상 (마음 안정과 긍정 에너지)',
        category: '호흡 명상',
        duration: '5 min'
      },
      {
        id: 'hlWiI4xVXKY',
        title: '432Hz 아침의 기적 — 긍정 에너지와 집중을 위한 주파수',
        category: '주파수 힐링',
        duration: '10 min'
      },
      {
        id: '2OEL4P1Rz04',
        title: '햇살 비치는 숲속 아침 새소리 & 잔잔한 앰비언트',
        category: '자연의 소리',
        duration: '15 min'
      },
      {
        id: 'lTRiuFIWV54',
        title: '하루를 차분하게 여는 어쿠스틱 피아노 모닝 리추얼',
        category: '피아노 음악',
        duration: '8 min'
      }
    ];
  }

  // Parse YouTube ID from various URL formats
  extractVideoId(input) {
    if (!input) return null;
    input = input.trim();
    // Raw 11 char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return input;
    }
    // youtu.be/ID
    const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    // youtube.com/watch?v=ID
    const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];

    // youtube.com/embed/ID
    const embedMatch = input.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    return null;
  }

  getCuratedPlaylist() {
    return this.curatedList;
  }

  // Generate embed IFrame HTML string
  getEmbedHtml(videoId) {
    if (!videoId) videoId = this.curatedList[0].id;
    this.currentVideoId = videoId;

    return `
      <div class="video-container">
        <iframe 
          id="yt-iframe"
          src="https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1" 
          title="Morning Meditation Music" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>
    `;
  }
}

// Global instance
window.youtubePlayer = new YouTubeMeditationPlayer();

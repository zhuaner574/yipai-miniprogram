const MOOD_LABELS = {
  great: '很开心',
  progress: '有进步',
  calm: '平静',
  tired: '有点累',
  frustrated: '沮丧'
}

const MOOD_IMAGES = {
  great: '/assets/moods/paipai-great.png',
  progress: '/assets/moods/paipai-progress.png',
  calm: '/assets/moods/paipai-calm.png',
  tired: '/assets/moods/paipai-tired.png',
  frustrated: '/assets/moods/paipai-frustrated.png'
}

function moodLabel(mood) {
  return MOOD_LABELS[mood] || '平静'
}

function moodImage(mood) {
  return MOOD_IMAGES[mood] || MOOD_IMAGES.calm
}

module.exports = {
  MOOD_LABELS,
  MOOD_IMAGES,
  moodLabel,
  moodImage
}

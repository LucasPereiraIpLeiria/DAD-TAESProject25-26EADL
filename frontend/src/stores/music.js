import { defineStore } from 'pinia'
import bgmMusic from '@/assets/sounds/ambience.mp3' 

let audio = null

export const useMusicStore = defineStore('music', {
  state: () => ({
    enabled: false,    
    isPlaying: false,  
    volume: 0.45,
  }),

  actions: {
    ensureAudio() {
      if (!audio) {
        audio = new Audio(bgmMusic)
        audio.loop = true
        audio.volume = this.volume
      }
    },

    async play() {
      this.ensureAudio()

      try {
        await audio.play()
        audio.volume = this.volume
        this.isPlaying = true
      } catch (err) {
        console.warn('Audio play bloqueado:', err)
      }
    },

    stop() {
      if (audio) {
        audio.pause()
      }
      this.isPlaying = false
    },

    async toggle() {
      if (!this.isPlaying) {
        this.enabled = true
        localStorage.setItem('music_enabled', 'true')
        await this.play()
        return
      }

      this.enabled = false
      localStorage.setItem('music_enabled', 'false')
      this.stop()
    },

    loadFromStorage() {
      const saved = localStorage.getItem('music_enabled')
      this.enabled = saved === 'true'
    },
  },
})

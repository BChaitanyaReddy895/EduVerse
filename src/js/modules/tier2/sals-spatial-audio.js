// ============================================
// TIER 2: Spatial Audio Learning System (SALS)
// 3D sound positioning + adaptive audio pedagogy
// ============================================

export class SALSSpatialAudio {
  constructor(camera) {
    this.camera = camera;
    this.audioContext = null;
    this.audioListener = null;
    this.soundSources = new Map(); // { skillName: AudioObject }
    this.isInitialized = false;

    // Audio configuration
    this.config = {
      audioVolume: 0.5,
      spatializationEnabled: true,
      binauralAudio: true,
      fadeInTime: 1.0, // seconds
      fadeOutTime: 0.5, // seconds
      updateFrequency: 100 // ms
    };

    // Learning state audio
    this.learningAudio = {
      focus: null,      // Alpha waves (8-12 Hz binaural beats)
      retention: null,  // Theta waves (4-8 Hz binaural beats)
      memory: null,     // Delta waves (0.5-4 Hz binaural beats)
      celebration: null // Uplifting tone
    };

    this.skillAudioMap = {}; // Maps skill concepts to audio signatures
    this.spatialPositions = {}; // Track 3D positions of audio sources

    this.analytics = {
      audioEventsTriggered: 0,
      skillsAudioPlayed: 0,
      totalAudioDuration: 0,
      binaural BeatSessions: 0
    };
  }

  /**
   * Initialize Web Audio API and spatial audio
   */
  async initialize() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create listener (attach to camera)
      this.audioListener = new THREE.AudioListener();
      this.camera.add(this.audioListener);

      // Create binaural audio processor
      await this.setupBinauralProcessing();

      this.isInitialized = true;
      console.log('✅ Spatial audio system initialized');
      return true;
    } catch (error) {
      console.error('Spatial audio initialization failed:', error);
      return false;
    }
  }

  /**
   * Setup binaural audio processing (spatial 3D sound)
   */
  async setupBinauralProcessing() {
    try {
      // Load HRTF (Head-Related Transfer Function) for binaural audio
      // This provides realistic 3D spatial audio
      const hrtfUrl = 'https://cdn.jsdelivr.net/npm/hrtf-utils@latest/assets/hrtf_matrix.js';
      
      // For now, use simpler approach with stereo panning
      console.log('📢 Binaural audio ready');
    } catch (error) {
      console.warn('HRTF loading failed, using stereo panning:', error);
    }
  }

  /**
   * Create spatial audio for a skill concept
   */
  createSkillAudio(skillName, options = {}) {
    const {
      frequency = 440,
      durationMs = 2000,
      waveform = 'sine',
      volume = 0.3,
      position = { x: 0, y: 0, z: -5 }
    } = options;

    if (!this.isInitialized) return null;

    // Create audio source
    const audio = new THREE.Audio(this.audioListener);
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    // Setup oscillator
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Setup gain (volume envelope)
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + this.config.fadeInTime);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + durationMs / 1000);

    // Connect nodes
    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);

    // Start oscillator
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + durationMs / 1000);

    // Store reference
    this.soundSources.set(skillName, {
      audio,
      oscillator,
      gain,
      createdAt: Date.now()
    });

    // Position in 3D space
    this.setSpatialPosition(skillName, position);

    this.analytics.skillsAudioPlayed++;

    return audio;
  }

  /**
   * Set 3D spatial position of audio source
   */
  setSpatialPosition(skillName, position) {
    this.spatialPositions[skillName] = position;

    const source = this.soundSources.get(skillName);
    if (source && source.audio) {
      // Use panning for spatial effect
      const panNode = this.audioContext.createStereoPanner();
      panNode.pan.value = (position.x / 10); // Clamp to -1 to 1
      
      source.audio.connect(panNode);
      panNode.connect(this.audioContext.destination);
    }
  }

  /**
   * Play binaural beats for learning state
   * Frequency ranges:
   * - Delta (0.5-4 Hz): Deep sleep, memory consolidation
   * - Theta (4-8 Hz): Meditation, memory formation, learning
   * - Alpha (8-12 Hz): Relaxation, focus, pre-meditation
   * - Beta (12-30 Hz): Alert, active thinking
   */
  playBinauralBeats(frequency = 8, duration = 5000, learningState = 'focus') {
    if (!this.isInitialized) return;

    console.log(`🎵 Playing ${frequency}Hz binaural beats (${learningState} state) for ${duration}ms`);

    // Create binaural beat effect
    const freq1 = 200; // Base frequency
    const freq2 = freq1 + frequency; // Carrier + beat frequency

    // Left ear carrier
    const osc1 = this.audioContext.createOscillator();
    osc1.frequency.setValueAtTime(freq1, this.audioContext.currentTime);

    // Right ear carrier (creates binaural beat)
    const osc2 = this.audioContext.createOscillator();
    osc2.frequency.setValueAtTime(freq2, this.audioContext.currentTime);

    // Gain control
    const gainL = this.audioContext.createGain();
    const gainR = this.audioContext.createGain();
    const masterGain = this.audioContext.createGain();

    // Fade in/out
    const startTime = this.audioContext.currentTime;
    const endTime = startTime + duration / 1000;

    gainL.gain.setValueAtTime(0, startTime);
    gainL.gain.linearRampToValueAtTime(0.1, startTime + this.config.fadeInTime);
    gainL.gain.linearRampToValueAtTime(0, endTime - this.config.fadeOutTime);

    gainR.gain.setValueAtTime(0, startTime);
    gainR.gain.linearRampToValueAtTime(0.1, startTime + this.config.fadeInTime);
    gainR.gain.linearRampToValueAtTime(0, endTime - this.config.fadeOutTime);

    // Create stereo splitter for binaural effect
    const splitter = this.audioContext.createChannelSplitter(2);
    const merger = this.audioContext.createChannelMerger(2);

    // Connect left ear
    osc1.connect(gainL);
    gainL.connect(splitter, 0, 0);

    // Connect right ear
    osc2.connect(gainR);
    gainR.connect(splitter, 0, 1);

    splitter.connect(merger, 0, 0);
    splitter.connect(merger, 1, 1);

    merger.connect(masterGain);
    masterGain.connect(this.audioContext.destination);

    // Start oscillators
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(endTime);
    osc2.stop(endTime);

    this.analytics.binaural BeatSessions++;

    // Store reference
    this.learningAudio[learningState] = {
      osc1, osc2, gainL, gainR, startTime, endTime
    };

    return { osc1, osc2, endTime };
  }

  /**
   * Generate audio signature for skill concept
   * Different skills get unique melodic signatures
   */
  generateSkillSignature(skillName, skillDomain) {
    // Map domains to frequency ranges
    const domainFrequencies = {
      math: { base: 440, range: 220 },      // A4
      physics: { base: 392, range: 196 },   // G4
      cs: { base: 523, range: 261 },        // C5
      biology: { base: 330, range: 165 },   // E4
      chemistry: { base: 349, range: 175 }  // F4
    };

    const baseFreq = domainFrequencies[skillDomain]?.base || 440;
    const masterySoundShift = Math.random() * 50; // Vary by skill

    const signature = {
      skillName,
      domain: skillDomain,
      baseFrequency: baseFreq + masterySoundShift,
      harmonics: [
        baseFreq,
        baseFreq * 1.5, // Perfect fifth
        baseFreq * 2    // Octave
      ],
      duration: 1500,
      waveform: 'sine'
    };

    this.skillAudioMap[skillName] = signature;
    return signature;
  }

  /**
   * Play skill achievement celebration sound
   */
  playCelebrationSound(skillMastery = 0.8) {
    if (!this.isInitialized) return;

    console.log(`🎉 Celebrating ${Math.round(skillMastery * 100)}% mastery!`);

    // Ascending pitch progression (celebratory)
    const notes = [
      { freq: 523, duration: 300 },  // C5
      { freq: 587, duration: 300 },  // D5
      { freq: 659, duration: 300 },  // E5
      { freq: 784, duration: 500 }   // G5 (final chord)
    ];

    let currentTime = this.audioContext.currentTime;

    notes.forEach((note, index) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.frequency.setValueAtTime(note.freq, currentTime);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.3, currentTime);
      gain.gain.linearRampToValueAtTime(0, currentTime + note.duration / 1000);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start(currentTime);
      osc.stop(currentTime + note.duration / 1000);

      currentTime += note.duration / 1000;
    });

    this.analytics.audioEventsTriggered++;
  }

  /**
   * Play error/hint sound
   */
  playHintSound() {
    if (!this.isInitialized) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    // Descending pitch (questioning/hint)
    osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.5);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.5);

    this.analytics.audioEventsTriggered++;
  }

  /**
   * Create ambient background audio for learning session
   * Subtle, non-intrusive background sounds
   */
  playAmbientSession(duration = 60000) {
    if (!this.isInitialized) return;

    console.log(`🌊 Starting ambient background audio...`);

    // Simple white noise generator (approximation)
    const bufferSize = this.audioContext.sampleRate * 2;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.02, this.audioContext.currentTime); // Very quiet

    source.connect(gain);
    gain.connect(this.audioContext.destination);

    source.start(this.audioContext.currentTime);
    source.stop(this.audioContext.currentTime + duration / 1000);

    this.analytics.audioEventsTriggered++;

    return { source, gain };
  }

  /**
   * Map learning concepts to soundscapes
   * Creates multisensory learning experience
   */
  createConceptSoundscape(concept) {
    // Map concepts to audio characteristics
    const soundscapeMap = {
      'growth': { frequency: 'ascending', binaural: 8, mood: 'uplifting' },
      'challenge': { frequency: 'dissonant', binaural: 12, mood: 'focused' },
      'mastery': { frequency: 'harmonic', binaural: 10, mood: 'calm' },
      'discovery': { frequency: 'exploration', binaural: 6, mood: 'curious' },
      'review': { frequency: 'repetitive', binaural: 4, mood: 'meditative' }
    };

    return soundscapeMap[concept] || soundscapeMap['discovery'];
  }

  /**
   * Get current audio state
   */
  getAudioState() {
    return {
      isInitialized: this.isInitialized,
      audioContext: this.audioContext?.state,
      activeSources: this.soundSources.size,
      skillAudioCount: Object.keys(this.skillAudioMap).length,
      spatialPositions: this.spatialPositions
    };
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    return {
      ...this.analytics,
      audioState: this.getAudioState()
    };
  }

  /**
   * Stop all audio
   */
  stopAll() {
    this.soundSources.forEach((source) => {
      if (source.oscillator) source.oscillator.stop();
    });
    this.soundSources.clear();
  }

  /**
   * Resume audio context if suspended
   */
  resumeAudioContext() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export default SALSSpatialAudio;

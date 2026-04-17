// ============================================
// Mobile Optimization & Responsive System v1.0
// Mobile-first responsive design & performance
// ============================================

export class MobileOptimizationSystem {
  constructor() {
    this.deviceInfo = this.detectDevice();
    this.settings = {
      autoQualityAdjustment: true,
      reducedAnimations: this.deviceInfo.isMobile,
      offlineMode: false,
      batteryOptimization: this.deviceInfo.lowBattery,
      responsiveLayout: true,
      mobileFirstDesign: this.deviceInfo.isMobile,
      touchOptimized: this.deviceInfo.touchEnabled,
      networkAwareness: true
    };

    this.setupMediaQueries();
    this.setupPerformanceOptimization();
    this.setupBatteryMonitoring();
    
    console.log('📱 Mobile Optimization initialized for:', this.deviceInfo);
  }

  // Detect device type
  detectDevice() {
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipod|blackberry|windows phone/.test(ua);
    const isTablet = /ipad|android/.test(ua) && !/mobile|phone/.test(ua);
    const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isStandalone = window.navigator.standalone === true;
    
    const info = {
      isMobile,
      isTablet,
      touchEnabled,
      isStandalone,
      userAgent: ua,
      pixelRatio: window.devicePixelRatio,
      screenSize: this.getScreenSize(),
      lowBattery: false,
      highLatency: false,
      effectiveType: this.getNetworkSpeed()
    };

    // Check battery status
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        info.lowBattery = battery.level < 0.2;
      });
    }

    return info;
  }

  getScreenSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (width <= 480) return 'mobile';
    if (width <= 768) return 'tablet';
    if (width <= 1024) return 'desktop';
    return 'large-desktop';
  }

  getNetworkSpeed() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return conn.effectiveType; // '4g', '3g', '2g', etc.
    }
    return 'unknown';
  }

  // Setup responsive media queries
  setupMediaQueries() {
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile-first base styles */
      :root {
        --btn-size: 44px; /* Touch target minimum */
        --spacing: 16px;
        --font-size-base: 16px;
        --layout-cols: 1;
      }

      /* Tablet breakpoint (768px) */
      @media (min-width: 768px) {
        :root {
          --btn-size: 40px;
          --spacing: 20px;
          --layout-cols: 2;
        }
      }

      /* Desktop breakpoint (1024px) */
      @media (min-width: 1024px) {
        :root {
          --btn-size: 36px;
          --spacing: 24px;
          --layout-cols: 3;
        }
      }

      /* Touch-optimized buttons */
      button, [role="button"], a.button {
        min-height: var(--btn-size);
        min-width: var(--btn-size);
        padding: 12px 16px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      /* Prevent zoom on input focus */
      input, textarea, select {
        font-size: 16px;
      }

      /* Responsive text */
      body {
        font-size: var(--font-size-base);
      }

      h1 { font-size: 24px; }
      h2 { font-size: 20px; }
      h3 { font-size: 18px; }

      @media (min-width: 768px) {
        h1 { font-size: 32px; }
        h2 { font-size: 24px; }
        h3 { font-size: 20px; }
      }

      /* Reduced motion for battery saving */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* Flexible layout grid */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing);
      }

      @media (max-width: 480px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }

      /* Responsive canvas */
      canvas {
        max-width: 100%;
        height: auto;
      }

      /* Safe area insets for notched devices */
      body {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
      }
    `;
    
    document.head.appendChild(style);
  }

  // Performance optimization for low-end devices
  setupPerformanceOptimization() {
    if (this.deviceInfo.isMobile) {
      // Reduce animation frame rate on mobile
      window.ANIMATION_FRAME_RATE = 30; // Instead of 60
      
      // Reduce shadow quality
      window.SHADOW_QUALITY = 'low';
      
      // Disable some visual effects
      window.DISABLE_BLOOM = true;
      window.DISABLE_PARTICLES = false; // Keep some particles
      window.PARTICLE_COUNT_MOBILE = 200; // Reduced from 500+
    }

    // Network-aware quality adjustment
    if (this.deviceInfo.effectiveType === '3g' || this.deviceInfo.effectiveType === '2g') {
      window.TEXTURE_QUALITY = 'low';
      window.DISABLE_COMPLEX_SHADERS = true;
    }
  }

  // Battery monitoring
  setupBatteryMonitoring() {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2 && !battery.charging) {
            this.enableBatteryMode();
          }
        });
      });
    }

    // Fallback: detect activity level
    let lastActivityTime = Date.now();
    document.addEventListener('touchmove', () => {
      lastActivityTime = Date.now();
    });
  }

  // Enable battery saving mode
  enableBatteryMode() {
    this.settings.batteryOptimization = true;
    
    // Stop animations
    window.PAUSE_ANIMATIONS = true;
    
    // Reduce polling frequency
    window.CONTROLLER_POLL_INTERVAL = 100; // Increased from 16ms
    
    // Disable background effects
    window.DISABLE_BLOOM = true;
    window.DISABLE_GLOW = true;
    
    console.log('🔋 Battery saving mode enabled');
  }

  // Setup offline content caching
  setupOfflineMode() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => {
          console.log('✅ Service Worker registered for offline support');
        })
        .catch(err => {
          console.log('❌ Service Worker registration failed:', err);
        });
    }

    // Cache API for offline support
    this.cacheManager = new Map();
  }

  // Adaptive quality based on device
  getRecommendedQuality() {
    const screenSize = this.getScreenSize();
    
    const qualityMap = {
      'mobile': {
        renderScale: 0.75,
        maxParticles: 200,
        shadowQuality: 'low',
        textureQuality: 'medium'
      },
      'tablet': {
        renderScale: 0.85,
        maxParticles: 500,
        shadowQuality: 'medium',
        textureQuality: 'high'
      },
      'desktop': {
        renderScale: 1.0,
        maxParticles: 1000,
        shadowQuality: 'high',
        textureQuality: 'high'
      },
      'large-desktop': {
        renderScale: 1.25,
        maxParticles: 2000,
        shadowQuality: 'ultra',
        textureQuality: 'ultra'
      }
    };

    return qualityMap[screenSize] || qualityMap['mobile'];
  }

  // Touch-optimized layout
  createTouchOptimizedUI(container) {
    const ui = document.createElement('div');
    ui.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      max-width: 100vw;
      overflow-x: hidden;
    `;

    // Navigation buttons with touch-friendly spacing
    const navButtons = document.createElement('div');
    navButtons.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: space-between;
      margin-bottom: 16px;
    `;

    ['Previous', 'Next', 'Quiz'].forEach(label => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = `
        flex: 1;
        min-height: 44px;
        min-width: 44px;
        padding: 12px;
        border: 2px solid #3B82F6;
        background: #0a1929;
        color: white;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        touch-action: manipulation;
      `;
      navButtons.appendChild(btn);
    });

    ui.appendChild(navButtons);
    return ui;
  }

  // Network status monitoring
  setupNetworkMonitoring() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      
      conn.addEventListener('change', () => {
        this.deviceInfo.effectiveType = conn.effectiveType;
        console.log('📡 Network changed to:', conn.effectiveType);
        
        if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
          this.enableLowBandwidthMode();
        }
      });
    }
  }

  enableLowBandwidthMode() {
    window.DISABLE_STREAMING = true;
    window.REDUCE_TEXTURE_SIZE = true;
    window.COMPRESS_ASSETS = true;
    console.log('📵 Low bandwidth mode enabled');
  }

  // Viewport configuration
  setupViewportMeta() {
    let viewport = document.querySelector('meta[name="viewport"]');
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
  }

  // Get device capabilities
  getCapabilities() {
    return {
      screen: {
        size: this.deviceInfo.screenSize,
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio
      },
      input: {
        touch: this.deviceInfo.touchEnabled,
        mouse: true,
        keyboard: true,
        controller: 'gamepad' in navigator
      },
      performance: {
        memory: performance.memory?.jsHeapSizeLimit,
        cores: navigator.hardwareConcurrency,
        network: this.deviceInfo.effectiveType
      },
      features: {
        webxr: 'xr' in navigator,
        webgl: !!document.createElement('canvas').getContext('webgl2'),
        speechRecognition: 'webkitSpeechRecognition' in window,
        serviceWorker: 'serviceWorker' in navigator
      }
    };
  }

  // Responsive layout system
  setupResponsiveLayout() {
    const style = document.createElement('style');
    style.textContent = `
      /* Three-tier layout */
      .lesson-container {
        display: grid;
        gap: 16px;
      }

      /* Desktop: 2 columns (70% canvas, 30% info) */
      @media (min-width: 1024px) {
        .lesson-container {
          grid-template-columns: 7fr 3fr;
        }
      }

      /* Tablet: stacked or 1.5 columns */
      @media (min-width: 768px) and (max-width: 1023px) {
        .lesson-container {
          grid-template-columns: 1fr;
        }
      }

      /* Mobile: full width stacked */
      @media (max-width: 767px) {
        .lesson-container {
          grid-template-columns: 1fr;
        }

        .canvas-panel {
          min-height: 400px;
          width: 100vw;
          margin-left: calc(-50vw + 50%);
        }

        .info-panel {
          padding: 16px;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

export function createMobileOptimizationSystem() {
  return new MobileOptimizationSystem();
}

// ============================================
// Accessibility System v1.0
// Color blind modes, text sizing, keyboard nav
// ============================================

export class AccessibilitySystem {
  constructor() {
    this.settings = {
      textSize: 100, // percentage
      colorBlindMode: 'normal', // normal, protanopia, deuteranopia, tritanopia, achromatopsia
      highContrast: false,
      reducedMotion: false,
      screenReaderMode: false,
      keyboardNavigation: false,
      darkMode: true,
      fontSize: 'medium'
    };
    
    this.keyboardBindings = new Map();
    this.focusedElement = null;
    
    this.loadSettings();
    this.setupKeyboardNavigation();
    
    console.log('♿ Accessibility System initialized');
  }

  // Text sizing
  setTextSize(percentage) {
    this.settings.textSize = Math.max(70, Math.min(200, percentage));
    this.applyTextSize();
    this.saveSettings();
  }

  applyTextSize() {
    const scale = this.settings.textSize / 100;
    document.documentElement.style.fontSize = `${16 * scale}px`;
    
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const computed = window.getComputedStyle(el);
      const originalSize = computed.fontSize;
      // Font size is already scaled by documentElement
    });
  }

  // Color blind mode
  setColorBlindMode(mode) {
    this.settings.colorBlindMode = mode;
    this.applyColorBlindFilter();
    this.saveSettings();
  }

  applyColorBlindFilter() {
    let filterString = '';
    
    switch (this.settings.colorBlindMode) {
      case 'protanopia': // Red-blind
        filterString = 'url(#protanopia-filter)';
        break;
      case 'deuteranopia': // Green-blind
        filterString = 'url(#deuteranopia-filter)';
        break;
      case 'tritanopia': // Blue-blind
        filterString = 'url(#tritanopia-filter)';
        break;
      case 'achromatopsia': // Complete color blindness
        filterString = 'grayscale(100%)';
        break;
      default:
        filterString = 'none';
    }
    
    const svg = document.getElementById('color-filters');
    if (svg) {
      document.body.style.filter = filterString;
    }
  }

  // High contrast mode
  setHighContrast(enabled) {
    this.settings.highContrast = enabled;
    
    if (enabled) {
      document.body.classList.add('high-contrast');
      document.body.style.background = '#000000';
      document.body.style.color = '#FFFFFF';
      document.querySelectorAll('*').forEach(el => {
        el.style.borderColor = '#FFFFFF';
      });
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    this.saveSettings();
  }

  // Reduced motion
  setReducedMotion(enabled) {
    this.settings.reducedMotion = enabled;
    
    if (enabled) {
      document.documentElement.style.setProperty('--duration', '0.01s');
      document.querySelectorAll('[animate]').forEach(el => {
        el.style.animation = 'none';
      });
    } else {
      document.documentElement.style.setProperty('--duration', '0.3s');
    }
    
    this.saveSettings();
  }

  // Screen reader mode
  setScreenReaderMode(enabled) {
    this.settings.screenReaderMode = enabled;
    
    if (enabled) {
      // Add ARIA labels
      this.addScreenReaderDescriptions();
      document.body.setAttribute('role', 'main');
    }
    
    this.saveSettings();
  }

  addScreenReaderDescriptions() {
    // Add descriptions for interactive elements
    document.querySelectorAll('button').forEach(btn => {
      if (!btn.getAttribute('aria-label')) {
        btn.setAttribute('aria-label', btn.textContent || btn.getAttribute('title'));
      }
    });
    
    document.querySelectorAll('[role="navigation"]').forEach(nav => {
      if (!nav.getAttribute('aria-label')) {
        nav.setAttribute('aria-label', 'Navigation');
      }
    });
  }

  // Keyboard navigation
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (!this.settings.keyboardNavigation) return;
      
      switch (e.key) {
        case 'ArrowRight':
          this.moveFocus('next');
          e.preventDefault();
          break;
        case 'ArrowLeft':
          this.moveFocus('previous');
          e.preventDefault();
          break;
        case 'Enter':
        case ' ':
          this.activateFocused();
          e.preventDefault();
          break;
        case 'Tab':
          // Natural tab behavior
          break;
        case 'Escape':
          this.clearFocus();
          break;
      }
    });
  }

  enableKeyboardNavigation(enabled) {
    this.settings.keyboardNavigation = enabled;
    
    if (enabled) {
      document.querySelectorAll('button, a, [role="button"]').forEach(el => {
        el.setAttribute('tabindex', '0');
      });
      
      // Show focus indicators
      const style = document.createElement('style');
      style.textContent = `
        *:focus-visible {
          outline: 3px solid #FFD60A !important;
          outline-offset: 2px !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    this.saveSettings();
  }

  moveFocus(direction) {
    const focusableElements = Array.from(
      document.querySelectorAll('button, a, [role="button"], input, textarea')
    );
    
    const currentIndex = focusableElements.indexOf(document.activeElement);
    let nextIndex;
    
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % focusableElements.length;
    } else {
      nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
    }
    
    focusableElements[nextIndex]?.focus();
  }

  activateFocused() {
    const focused = document.activeElement;
    if (focused && typeof focused.click === 'function') {
      focused.click();
    }
  }

  clearFocus() {
    document.activeElement?.blur();
  }

  // Dark mode toggle
  setDarkMode(enabled) {
    this.settings.darkMode = enabled;
    
    if (enabled) {
      document.body.style.background = '#0a1929';
      document.body.style.color = '#ffffff';
    } else {
      document.body.style.background = '#ffffff';
      document.body.style.color = '#000000';
    }
    
    this.saveSettings();
  }

  // Font size presets
  setFontSize(preset) {
    const sizes = {
      'small': 85,
      'medium': 100,
      'large': 115,
      'xlarge': 130
    };
    
    this.settings.fontSize = preset;
    this.setTextSize(sizes[preset] || 100);
  }

  // Get current settings
  getSettings() {
    return { ...this.settings };
  }

  // Save to localStorage
  saveSettings() {
    localStorage.setItem('eduverse_accessibility', JSON.stringify(this.settings));
  }

  // Load from localStorage
  loadSettings() {
    const stored = localStorage.getItem('eduverse_accessibility');
    if (stored) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
        this.applySettings();
      } catch (err) {
        console.error('Error loading accessibility settings:', err);
      }
    }
  }

  // Apply all settings
  applySettings() {
    this.applyTextSize();
    this.applyColorBlindFilter();
    this.setHighContrast(this.settings.highContrast);
    this.setReducedMotion(this.settings.reducedMotion);
    this.setDarkMode(this.settings.darkMode);
    
    if (this.settings.screenReaderMode) {
      this.addScreenReaderDescriptions();
    }
  }

  // Create accessibility panel UI
  createAccessibilityPanel() {
    const panel = document.createElement('div');
    panel.id = 'accessibility-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(10,25,41,0.95);
      border: 2px solid #3B82F6;
      border-radius: 12px;
      padding: 20px;
      z-index: 10000;
      max-width: 300px;
      font-family: Arial, sans-serif;
      color: white;
    `;

    panel.innerHTML = `
      <div style="margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0;">♿ Accessibility</h3>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 5px;">Text Size:</label>
        <input type="range" min="70" max="200" value="${this.settings.textSize}" 
          onchange="window.accessibility.setTextSize(this.value)"
          style="width: 100%; cursor: pointer;">
        <small>${this.settings.textSize}%</small>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 5px;">Font Size:</label>
        <select onchange="window.accessibility.setFontSize(this.value)"
          style="width: 100%; padding: 5px; background: #1e3a8a; color: white; border: 1px solid #3B82F6;">
          <option value="small">Small</option>
          <option value="medium" selected>Medium</option>
          <option value="large">Large</option>
          <option value="xlarge">X-Large</option>
        </select>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 5px;">Color Blind Mode:</label>
        <select onchange="window.accessibility.setColorBlindMode(this.value)"
          style="width: 100%; padding: 5px; background: #1e3a8a; color: white; border: 1px solid #3B82F6;">
          <option value="normal">Normal</option>
          <option value="protanopia">Protanopia (Red)</option>
          <option value="deuteranopia">Deuteranopia (Green)</option>
          <option value="tritanopia">Tritanopia (Blue)</option>
          <option value="achromatopsia">Achromatopsia</option>
        </select>
      </div>

      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button onclick="window.accessibility.setHighContrast(!window.accessibility.settings.highContrast)"
          style="flex: 1; padding: 8px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          🔆 Contrast
        </button>
        <button onclick="window.accessibility.setReducedMotion(!window.accessibility.settings.reducedMotion)"
          style="flex: 1; padding: 8px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          ⏹️ Motion
        </button>
        <button onclick="window.accessibility.setDarkMode(!window.accessibility.settings.darkMode)"
          style="flex: 1; padding: 8px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          🌙 Dark
        </button>
      </div>

      <div style="margin-top: 12px;">
        <button onclick="window.accessibility.enableKeyboardNavigation(!window.accessibility.settings.keyboardNavigation)"
          style="width: 100%; padding: 10px; background: #8B5CF6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          ⌨️ Keyboard Nav ${window.accessibility.settings.keyboardNavigation ? '✓' : ''}
        </button>
      </div>
    `;

    return panel;
  }
}

export function createAccessibilitySystem() {
  return new AccessibilitySystem();
}

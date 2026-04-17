// ============================================
// Multi-Modal Interaction System v1.0
// Gesture recognition + Voice commands
// ============================================

export class GestureRecognizer {
  constructor(element) {
    this.element = element;
    this.touches = new Map();
    this.gestures = [];
    
    this.element.addEventListener('touchstart', (e) => this.onTouchStart(e), false);
    this.element.addEventListener('touchmove', (e) => this.onTouchMove(e), false);
    this.element.addEventListener('touchend', (e) => this.onTouchEnd(e), false);
    
    console.log('👆 Gesture Recognizer initialized');
  }

  onTouchStart(event) {
    for (let touch of event.touches) {
      this.touches.set(touch.identifier, {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: Date.now()
      });
    }
  }

  onTouchMove(event) {
    for (let touch of event.touches) {
      const t = this.touches.get(touch.identifier);
      if (t) {
        t.currentX = touch.clientX;
        t.currentY = touch.clientY;
      }
    }
  }

  onTouchEnd(event) {
    for (let touch of event.changedTouches) {
      const t = this.touches.get(touch.identifier);
      if (t) {
        const gesture = this.recognizeGesture(t);
        if (gesture) {
          console.log(`👆 Gesture detected: ${gesture.type}`);
          this.gestures.push(gesture);
          this.fireGestureEvent(gesture);
        }
      }
      this.touches.delete(touch.identifier);
    }
  }

  recognizeGesture(touch) {
    const dx = touch.currentX - touch.startX;
    const dy = touch.currentY - touch.startY;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const duration = Date.now() - touch.startTime;
    
    // Swipe detection
    if (distance > 50 && duration < 500) {
      const angle = Math.atan2(dy, dx);
      
      if (Math.abs(angle) < Math.PI / 4) {
        return { type: 'swipe', direction: 'right', distance, velocity: distance / duration };
      } else if (Math.abs(angle - Math.PI) < Math.PI / 4) {
        return { type: 'swipe', direction: 'left', distance, velocity: distance / duration };
      } else if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) {
        return { type: 'swipe', direction: 'down', distance, velocity: distance / duration };
      } else if (angle > -3 * Math.PI / 4 && angle < -Math.PI / 4) {
        return { type: 'swipe', direction: 'up', distance, velocity: distance / duration };
      }
    }
    
    // Tap detection
    if (distance < 10 && duration < 300) {
      return { type: 'tap', position: { x: touch.startX, y: touch.startY } };
    }
    
    // Long press
    if (distance < 20 && duration > 500) {
      return { type: 'longpress', position: { x: touch.startX, y: touch.startY } };
    }
    
    return null;
  }

  fireGestureEvent(gesture) {
    const event = new CustomEvent('gesture', { detail: gesture });
    this.element.dispatchEvent(event);
  }

  getLastGesture() {
    return this.gestures[this.gestures.length - 1] || null;
  }

  clearGestures() {
    this.gestures = [];
  }
}

export class VoiceCommandRecognizer {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('⚠️ Speech Recognition not supported');
      this.supported = false;
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.supported = true;
    this.isListening = false;
    this.commands = new Map();
    
    this.setupRecognition();
    console.log('🎤 Voice Command Recognizer initialized');
  }

  setupRecognition() {
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.language = 'en-US';
    
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('🎤 Listening...');
    };
    
    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        this.processCommand(finalTranscript);
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('🎤 Speech recognition error:', event.error);
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      console.log('🎤 Stopped listening');
    };
  }

  registerCommand(pattern, callback) {
    this.commands.set(pattern.toLowerCase(), callback);
  }

  processCommand(transcript) {
    const text = transcript.toLowerCase();
    console.log(`🎤 Command: "${text}"`);
    
    for (const [pattern, callback] of this.commands.entries()) {
      if (text.includes(pattern)) {
        console.log(`✅ Matched command: ${pattern}`);
        callback(text);
        return;
      }
    }
    
    console.log('❌ No command matched');
  }

  start() {
    if (this.supported && !this.isListening) {
      this.recognition.start();
    }
  }

  stop() {
    if (this.supported && this.isListening) {
      this.recognition.stop();
    }
  }

  toggleListening() {
    this.isListening ? this.stop() : this.start();
  }
}

export class ControllerInput {
  constructor() {
    this.controllers = new Map();
    this.setupGamepad();
    console.log('🎮 Controller Input initialized');
  }

  setupGamepad() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log(`🎮 Controller connected: ${e.gamepad.id}`);
      this.controllers.set(e.gamepad.index, {
        id: e.gamepad.index,
        buttons: new Array(e.gamepad.buttons.length).fill(0),
        axes: new Array(e.gamepad.axes.length).fill(0)
      });
    });
    
    window.addEventListener('gamepaddisconnected', (e) => {
      console.log(`🎮 Controller disconnected: ${e.gamepad.id}`);
      this.controllers.delete(e.gamepad.index);
    });
  }

  updateState() {
    const gamepads = navigator.getGamepads();
    
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp) continue;
      
      const controller = this.controllers.get(i);
      if (!controller) continue;
      
      // Update buttons
      for (let j = 0; j < gp.buttons.length; j++) {
        controller.buttons[j] = gp.buttons[j].pressed ? 1 : 0;
      }
      
      // Update axes
      for (let j = 0; j < gp.axes.length; j++) {
        controller.axes[j] = gp.axes[j];
      }
    }
  }

  getControllerState(index = 0) {
    return this.controllers.get(index) || null;
  }

  isButtonPressed(index, buttonIndex) {
    const controller = this.getControllerState(index);
    return controller ? controller.buttons[buttonIndex] === 1 : false;
  }

  getAnalogStick(index, stickIndex = 0) {
    const controller = this.getControllerState(index);
    if (!controller) return { x: 0, y: 0 };
    
    const xAxis = stickIndex === 0 ? 0 : 2;
    const yAxis = stickIndex === 0 ? 1 : 3;
    
    return {
      x: controller.axes[xAxis] || 0,
      y: controller.axes[yAxis] || 0
    };
  }
}

export class MultiModalInteraction {
  constructor(container) {
    this.container = container;
    this.gestureRecognizer = new GestureRecognizer(container);
    this.voiceRecognizer = new VoiceCommandRecognizer();
    this.controllerInput = new ControllerInput();
    this.callbacks = new Map();
    
    this.setupListeners();
    
    console.log('🎯 Multi-Modal Interaction System initialized');
  }

  setupListeners() {
    // Gesture events
    this.container.addEventListener('gesture', (e) => {
      const gesture = e.detail;
      this.fireCallback('gesture', gesture);
    });
    
    // Gamepad polling
    setInterval(() => {
      this.controllerInput.updateState();
      this.checkControllerInput();
    }, 16); // 60 FPS
  }

  checkControllerInput() {
    const state = this.controllerInput.getControllerState(0);
    if (!state) return;
    
    // Check common buttons
    if (state.buttons[0]) this.fireCallback('controller', { type: 'button', id: 'a' });
    if (state.buttons[1]) this.fireCallback('controller', { type: 'button', id: 'b' });
    if (state.buttons[2]) this.fireCallback('controller', { type: 'button', id: 'x' });
    if (state.buttons[3]) this.fireCallback('controller', { type: 'button', id: 'y' });
    
    // Analog sticks
    const leftStick = this.controllerInput.getAnalogStick(0, 0);
    if (Math.abs(leftStick.x) > 0.5) {
      this.fireCallback('controller', { 
        type: 'stick', 
        id: 'left',
        direction: leftStick.x > 0 ? 'right' : 'left'
      });
    }
  }

  registerCallback(eventType, callback) {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }
    this.callbacks.get(eventType).push(callback);
  }

  fireCallback(eventType, data) {
    const callbacks = this.callbacks.get(eventType) || [];
    callbacks.forEach(cb => cb(data));
  }

  registerVoiceCommand(pattern, callback) {
    this.voiceRecognizer.registerCommand(pattern, callback);
  }

  startVoiceListening() {
    this.voiceRecognizer.start();
  }

  stopVoiceListening() {
    this.voiceRecognizer.stop();
  }
}

export function createMultiModalInteraction(container) {
  return new MultiModalInteraction(container);
}

// ============================================
// EduVerse — Shared Utilities
// ============================================

// --- Storage ---
export const storage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(`eduverse_${key}`);
      return val ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(`eduverse_${key}`, JSON.stringify(value)); }
    catch (e) { console.warn('Storage write failed:', e); }
  },
  remove(key) {
    localStorage.removeItem(`eduverse_${key}`);
  }
};

// --- Graph Utilities ---
export class Graph {
  constructor() {
    this.adjacencyList = new Map();
  }

  addNode(id, data = {}) {
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, { data, edges: [] });
    }
  }

  addEdge(from, to, weight = 1, type = 'default') {
    if (this.adjacencyList.has(from)) {
      this.adjacencyList.get(from).edges.push({ to, weight, type });
    }
  }

  getNeighbors(id) {
    return this.adjacencyList.has(id) ? this.adjacencyList.get(id).edges : [];
  }

  // Cycle detection via DFS backtracking
  findCycles(maxLength = 6) {
    const cycles = [];
    const nodes = [...this.adjacencyList.keys()];

    for (const start of nodes) {
      const visited = new Set();
      const path = [];
      this._dfs(start, start, visited, path, cycles, maxLength);
    }
    return this._deduplicateCycles(cycles);
  }

  _dfs(current, target, visited, path, cycles, maxLength) {
    if (path.length > maxLength) return;
    path.push(current);
    visited.add(current);

    for (const edge of this.getNeighbors(current)) {
      if (edge.to === target && path.length > 2) {
        cycles.push([...path]);
      } else if (!visited.has(edge.to)) {
        this._dfs(edge.to, target, visited, path, cycles, maxLength);
      }
    }

    path.pop();
    visited.delete(current);
  }

  _deduplicateCycles(cycles) {
    const seen = new Set();
    return cycles.filter(cycle => {
      const normalized = [...cycle].sort().join(',');
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  // Modified Dijkstra for knowledge path optimization
  findOptimalPath(start, end, weightFn) {
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set(this.adjacencyList.keys());

    for (const node of unvisited) {
      distances.set(node, Infinity);
    }
    distances.set(start, 0);

    while (unvisited.size > 0) {
      let current = null;
      let minDist = Infinity;
      for (const node of unvisited) {
        if (distances.get(node) < minDist) {
          minDist = distances.get(node);
          current = node;
        }
      }
      if (current === null || current === end) break;
      unvisited.delete(current);

      for (const edge of this.getNeighbors(current)) {
        const w = weightFn ? weightFn(edge) : edge.weight;
        const alt = distances.get(current) + (1 / w);
        if (alt < distances.get(edge.to)) {
          distances.set(edge.to, alt);
          previous.set(edge.to, current);
        }
      }
    }

    // Reconstruct path
    const path = [];
    let current = end;
    while (current && current !== start) {
      path.unshift(current);
      current = previous.get(current);
    }
    if (current === start) path.unshift(start);
    return path;
  }
}

// --- Animation Helpers ---
export function animateValue(element, start, end, duration = 1000, suffix = '') {
  const range = end - start;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + range * easeProgress);
    element.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

export function staggerAnimation(container, selector, delay = 50) {
  const elements = container.querySelectorAll(selector);
  elements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * delay);
  });
}

// --- Toast Notifications ---
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// --- Debounce ---
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// --- Format Helpers ---
export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// --- NLP Utilities for Communication Module ---
export function calculateTypeTokenRatio(text) {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;
  const uniqueWords = new Set(words);
  return uniqueWords.size / words.length;
}

export function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  let count = 0;
  const vowels = 'aeiouy';
  let prevVowel = false;
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  if (word.endsWith('e') && count > 1) count--;
  return Math.max(1, count);
}

export function fleschReadingEase(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (sentences.length === 0 || words.length === 0) return 0;
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const asl = words.length / sentences.length;
  const asw = totalSyllables / words.length;
  return Math.max(0, Math.min(100, 206.835 - 1.015 * asl - 84.6 * asw));
}

export function detectFillerWords(text) {
  const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'right', 'so', 'well'];
  const words = text.toLowerCase().split(/\s+/);
  let count = 0;
  const found = [];
  fillers.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) { count += matches.length; found.push(...matches); }
  });
  return { count, ratio: words.length > 0 ? count / words.length : 0, words: found };
}

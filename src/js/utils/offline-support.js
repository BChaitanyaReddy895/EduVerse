// ============================================
// Offline Support & Content Caching v1.0
// Service worker integration & local storage
// ============================================

export class OfflineSupportSystem {
  constructor() {
    this.cacheVersion = 'eduverse-v5-cache-1';
    this.contentCache = new Map();
    this.apiCache = new Map();
    this.isOnline = navigator.onLine;
    
    this.setupNetworkMonitoring();
    this.registerServiceWorker();
    this.loadCachedContent();
    
    console.log('📴 Offline Support System initialized');
  }

  // Setup network monitoring
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🟢 Online');
      this.syncCachedData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('🔴 Offline - using cached content');
      this.notifyOfflineMode();
    });
  }

  // Register service worker
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('⚠️ Service Workers not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ Service Worker registered');
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        console.log('📦 New service worker version available');
      });
    } catch (err) {
      console.log('❌ Service Worker registration failed:', err);
    }
  }

  // Cache concept content
  async cacheConcept(topic, conceptData) {
    const key = `concept_${topic}`;
    
    this.contentCache.set(key, {
      data: conceptData,
      timestamp: Date.now(),
      size: JSON.stringify(conceptData).length
    });

    // Also store in IndexedDB for large amounts of data
    if ('indexedDB' in window) {
      this.storeInIndexedDB(key, conceptData);
    }

    this.saveToLocalStorage();
  }

  // Cache API response
  async cacheAPIResponse(url, response) {
    const key = `api_${this.hashUrl(url)}`;
    
    this.apiCache.set(key, {
      url,
      data: response,
      timestamp: Date.now(),
      ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    this.saveToLocalStorage();
  }

  // Get cached content
  async getCachedContent(key) {
    // Check memory cache first
    if (this.contentCache.has(key)) {
      return this.contentCache.get(key).data;
    }

    // Check localStorage
    const stored = localStorage.getItem(`eduverse_cache_${key}`);
    if (stored) {
      return JSON.parse(stored);
    }

    // Check IndexedDB
    if ('indexedDB' in window) {
      return await this.getFromIndexedDB(key);
    }

    return null;
  }

  // Cache quiz data
  cacheQuizzes(quizzes) {
    const key = 'quizzes_all';
    
    this.contentCache.set(key, {
      data: quizzes,
      timestamp: Date.now()
    });

    localStorage.setItem(`eduverse_cache_${key}`, JSON.stringify(quizzes));
  }

  // Prefetch content for offline use
  async prefetchContent(topics) {
    console.log('📥 Prefetching content for offline use...');

    for (const topic of topics) {
      try {
        const response = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${topic}&prop=extracts&exintro=true&explaintext=true&format=json&origin=*`
        );

        if (response.ok) {
          const data = await response.json();
          await this.cacheConcept(topic, data);
          console.log(`✅ Cached: ${topic}`);
        }
      } catch (err) {
        console.log(`⚠️ Failed to prefetch ${topic}:`, err);
      }
    }

    console.log('✅ Prefetching complete');
  }

  // Sync cached data when back online
  async syncCachedData() {
    console.log('🔄 Syncing cached data...');

    const cacheEntries = Array.from(this.apiCache.entries());
    
    for (const [key, cache] of cacheEntries) {
      try {
        const response = await fetch(cache.url);
        if (response.ok) {
          const newData = await response.json();
          cache.data = newData;
          cache.timestamp = Date.now();
          console.log(`✅ Synced: ${cache.url}`);
        }
      } catch (err) {
        console.log(`⚠️ Failed to sync ${cache.url}`);
      }
    }

    this.saveToLocalStorage();
  }

  // IndexedDB operations
  async storeInIndexedDB(key, value) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EduVerseDB', 1);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        store.put({ key, value, timestamp: Date.now() });
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  async getFromIndexedDB(key) {
    return new Promise((resolve) => {
      const request = indexedDB.open('EduVerseDB', 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const getRequest = store.get(key);

        getRequest.onsuccess = () => {
          resolve(getRequest.result?.value || null);
        };

        getRequest.onerror = () => resolve(null);
      };

      request.onerror = () => resolve(null);
    });
  }

  // Local storage management
  saveToLocalStorage() {
    const cacheData = {
      content: Array.from(this.contentCache.entries()),
      api: Array.from(this.apiCache.entries()),
      timestamp: Date.now()
    };

    try {
      localStorage.setItem('eduverse_offline_cache', JSON.stringify(cacheData));
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        console.warn('⚠️ Storage quota exceeded, clearing old cache');
        this.clearOldCache();
      }
    }
  }

  loadCachedContent() {
    const stored = localStorage.getItem('eduverse_offline_cache');
    
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.contentCache = new Map(data.content || []);
        this.apiCache = new Map(data.api || []);
        console.log('✅ Loaded cached content');
      } catch (err) {
        console.log('⚠️ Error loading cache:', err);
      }
    }
  }

  // Clear old cache entries
  clearOldCache() {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    for (const [key, cache] of this.apiCache.entries()) {
      if (now - cache.timestamp > maxAge) {
        this.apiCache.delete(key);
      }
    }

    this.saveToLocalStorage();
  }

  // Get storage usage
  getStorageInfo() {
    if (!navigator.storage?.estimate) {
      return null;
    }

    return navigator.storage.estimate().then(estimate => {
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentage: Math.round((estimate.usage / estimate.quota) * 100)
      };
    });
  }

  // Hash URL for cache key
  hashUrl(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  // Offline notification
  notifyOfflineMode() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #f97316;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      z-index: 9999;
      animation: slideDown 0.3s ease-out;
    `;
    notification.textContent = '📴 You are offline. Using cached content.';
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
  }

  // Export data for backup
  async exportData() {
    const exportData = {
      version: this.cacheVersion,
      timestamp: Date.now(),
      content: Array.from(this.contentCache.entries()),
      api: Array.from(this.apiCache.entries())
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eduverse-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Import data from backup
  async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.contentCache = new Map(data.content || []);
          this.apiCache = new Map(data.api || []);
          this.saveToLocalStorage();
          console.log('✅ Data imported successfully');
          resolve();
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  // Clear all cache
  clearAllCache() {
    this.contentCache.clear();
    this.apiCache.clear();
    localStorage.removeItem('eduverse_offline_cache');
    console.log('✅ Cache cleared');
  }
}

export function createOfflineSupportSystem() {
  return new OfflineSupportSystem();
}

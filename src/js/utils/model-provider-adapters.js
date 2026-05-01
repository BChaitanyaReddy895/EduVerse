export class ModelProviderAdapters {
  constructor(configUrl = '/data/provider-config.json') {
    this.configUrl = configUrl;
    this.config = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    try {
      const res = await fetch(this.configUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`provider config ${res.status}`);
      this.config = await res.json();
    } catch (error) {
      console.warn('[ModelProviders] Provider config unavailable, adapters disabled:', error);
      this.config = { enabled: false, providers: [] };
    } finally {
      this.initialized = true;
    }
  }

  async tryGenerateFromProviders({ concept, imageData = null, timeoutMs = 7000 } = {}) {
    await this.initialize();
    if (!this.config?.enabled) return null;

    const providers = Array.isArray(this.config.providers) ? this.config.providers : [];
    const ordered = providers
      .filter((p) => p && p.enabled !== false)
      .sort((a, b) => {
        const ap = Number.isFinite(a.priority) ? a.priority : 999;
        const bp = Number.isFinite(b.priority) ? b.priority : 999;
        if (ap !== bp) return ap - bp;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });

    for (const provider of ordered) {
      try {
        const result = await this._queryProvider(provider, { concept, imageData, timeoutMs });
        if (result?.url) {
          return {
            ...result,
            provider: provider.name || provider.type || 'provider',
          };
        }
      } catch (error) {
        console.warn(`[ModelProviders] ${provider.name || provider.type} failed:`, error);
      }
    }
    return null;
  }

  async _queryProvider(provider, { concept, imageData, timeoutMs }) {
    const type = String(provider.type || 'json_glb_endpoint');
    const endpoint = String(provider.endpoint || '').trim();
    if (!endpoint) return null;

    const providerName = String(provider.name || '').toLowerCase();
    const imageDataStr = typeof imageData === 'string' ? imageData.trim() : '';

    // Guard: do not call STL converter unless we actually have an STL URL/base64.
    // Otherwise it spams 400 errors during normal concept retrieval.
    if (providerName.includes('stltoglbconverter')) {
      const looksLikeStlUrl = /\.stl(\?|#|$)/i.test(imageDataStr);
      const looksLikeBase64 = imageDataStr.length > 256 && !imageDataStr.startsWith('http');
      if (!looksLikeStlUrl && !looksLikeBase64) return null;
      return await this._fetchJsonWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(looksLikeStlUrl ? { stl_url: imageDataStr } : { stl_base64: imageDataStr }),
        },
        Math.max(timeoutMs, 20000)
      ).then((data) => ({
        url: data?.glb_url || data?.url || data?.model_url || '',
        modelName: data?.model_name || concept,
        description: data?.description || `Converted STL model for ${concept}`,
        domain: data?.domain || 'OPEN_SOURCE',
        category: data?.category || 'STL_CONVERTED',
        keywords: Array.isArray(data?.keywords) ? data.keywords : [concept],
        source: data?.source || provider.name || 'STL Converter',
        license: data?.license || provider.license || 'User-supplied STL license',
        previewUrl: data?.preview_url || data?.previewUrl || '',
      }));
    }

    const payload = { concept, image_data: imageDataStr || null };

    let request;
    if (type === 'query_get') {
      const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}concept=${encodeURIComponent(concept)}`;
      request = this._fetchJsonWithTimeout(url, { method: 'GET' }, timeoutMs);
    } else {
      request = this._fetchJsonWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        // Auto open-model fetch may do multiple network calls + conversion server-side.
        Math.max(timeoutMs, providerName.includes('autoopenmodelwikidatacommons') ? 20000 : timeoutMs)
      );
    }

    const data = await request;
    const url = data?.glb_url || data?.url || data?.model_url || '';
    if (!url) return null;

    return {
      url,
      modelName: data?.model_name || provider.defaultModelName || concept,
      description: data?.description || provider.defaultDescription || `Generated 3D model for ${concept}`,
      domain: data?.domain || provider.defaultDomain || 'GENERAL',
      category: data?.category || provider.defaultCategory || 'EXTERNAL',
      keywords: Array.isArray(data?.keywords) ? data.keywords : [concept],
      source: data?.source || provider.name || 'External 3D Provider',
      license: data?.license || provider.license || 'See provider terms',
      previewUrl: data?.preview_url || data?.previewUrl || '',
    };
  }

  async _fetchJsonWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status} ${text}`.trim());
      }
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }
}

export const modelProviderAdapters = new ModelProviderAdapters();

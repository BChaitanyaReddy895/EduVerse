import { store } from './data-store.js';

const CACHE_KEY = 'concept_knowledge_cache_v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

class ConceptKnowledgeEngine {
  constructor() {
    this.memoryCache = new Map();
    this._hydrate();
  }

  _hydrate() {
    const raw = store.get(CACHE_KEY, {});
    Object.entries(raw || {}).forEach(([key, value]) => {
      this.memoryCache.set(key, value);
    });
  }

  _persist() {
    const serializable = {};
    for (const [k, v] of this.memoryCache.entries()) serializable[k] = v;
    store.set(CACHE_KEY, serializable);
  }

  _normalizeConcept(concept) {
    return String(concept || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  _extractModelComponents(modelResult) {
    if (!modelResult?.model3D) return [];
    const names = [];
    modelResult.model3D.traverse((child) => {
      if (!child?.isMesh) return;
      const n = String(child.name || '')
        .replace(/[_\-]+/g, ' ')
        .replace(/\d+/g, '')
        .trim()
        .toLowerCase();
      if (n && n.length > 2) names.push(n);
    });
    return Array.from(new Set(names)).slice(0, 20);
  }

  async getConceptKnowledge(concept, { modelResult = null, fallbackDescription = '' } = {}) {
    const key = this._normalizeConcept(concept);
    if (!key) {
      return this._buildFallbackKnowledge('concept', [], fallbackDescription);
    }

    const cached = this.memoryCache.get(key);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.payload;
    }

    const modelComponents = this._extractModelComponents(modelResult);
    let knowledge = null;
    try {
      knowledge = await this._fetchWikipediaSummary(key);
    } catch (error) {
      console.warn('[Knowledge] Wikipedia summary fetch failed:', error);
    }

    const payload =
      knowledge || this._buildFallbackKnowledge(key, modelComponents, fallbackDescription);

    if (!payload.key_components?.length && modelComponents.length > 0) {
      payload.key_components = modelComponents.slice(0, 8);
    }

    payload.references = Array.isArray(payload.references) ? payload.references : [];
    payload.references = payload.references.slice(0, 5);

    this.memoryCache.set(key, { cachedAt: Date.now(), payload });
    this._persist();
    return payload;
  }

  async _fetchWikipediaSummary(concept) {
    const title = encodeURIComponent(concept.replace(/\s+/g, '_'));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Wikipedia ${response.status}`);
    const data = await response.json();

    const extract = String(data.extract || '').trim();
    if (!extract) throw new Error('Empty summary');

    const sentences = extract
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const keyComponents = this._extractNounLikeTerms(extract).slice(0, 8);
    const functions = sentences
      .filter((s) => /\b(used|helps|enables|allows|involves|supports|stores|processes|predicts)\b/i.test(s))
      .slice(0, 3);

    return {
      source: 'wikipedia',
      definition: sentences[0] || extract,
      key_components: keyComponents,
      functions: functions.length ? functions : sentences.slice(1, 3),
      misconceptions: [
        `Do not confuse ${concept} with similarly named but different systems.`,
      ],
      references: data.content_urls?.desktop?.page
        ? [{ title: data.title || concept, url: data.content_urls.desktop.page }]
        : [],
    };
  }

  _extractNounLikeTerms(text) {
    const lowered = String(text || '').toLowerCase();
    const stopwords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'such', 'used', 'using',
      'are', 'was', 'were', 'also', 'can', 'its', 'their', 'have', 'has', 'had', 'which',
      'when', 'where', 'what', 'how', 'than', 'then', 'them', 'they', 'been', 'being',
    ]);
    return Array.from(
      new Set(
        lowered
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 3 && !stopwords.has(w))
      )
    );
  }

  _buildFallbackKnowledge(concept, components = [], description = '') {
    return {
      source: 'fallback',
      definition: description || `${concept} is an educational concept visualized for interactive AR learning.`,
      key_components: components.slice(0, 8),
      functions: [
        `Understand the structure and behavior of ${concept}.`,
        `Observe the model interactively to build conceptual clarity.`,
      ],
      misconceptions: [
        'Visual similarity does not always mean functional similarity.',
      ],
      references: [],
    };
  }
}

export const conceptKnowledgeEngine = new ConceptKnowledgeEngine();

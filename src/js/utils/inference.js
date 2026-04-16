// ============================================
// EduVerse — Trained Model Inference Engine
// Loads HNS-KGT, ACD-BKT, EWGH from JSON
// ============================================

let modelData = null;
let modelLoaded = false;

/**
 * Load the trained models JSON exported from the Colab notebook.
 * Falls back to /models/trained_models.json (Vite serves from /public).
 */
export async function loadTrainedModels() {
  if (modelLoaded) return modelData;
  try {
    const res = await fetch('/models/trained_models.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    modelData = await res.json();
    modelLoaded = true;
    console.log(`%c[EduVerse AI] Models loaded v${modelData.version}`, 'color:#10B981;font-weight:bold');
    console.log(`  Knowledge Graph: ${modelData.knowledge_graph.nodes.length} nodes, ${modelData.knowledge_graph.edges.length} edges`);
    console.log(`  Algorithms: HNS-KGT, ACD-BKT, EWGH`);
    return modelData;
  } catch (e) {
    console.warn('[EduVerse AI] Could not load trained models, using built-in fallback:', e.message);
    return null;
  }
}

export function getModelData() { return modelData; }
export function isModelLoaded() { return modelLoaded; }

// =============================================
// HNS-KGT: Hybrid Neuro-Symbolic Inference
// =============================================
class NeuralAttention {
  constructor(W1, b1, W2, b2) {
    this.W1 = W1; this.b1 = b1; this.W2 = W2; this.b2 = b2;
  }

  forward(features) {
    // features: [mastery_src, mastery_tgt, edge_weight, recency_src, recency_tgt]
    const hidden = this.b1.map((b, j) => {
      let sum = b || 0;
      for (let i = 0; i < features.length; i++) {
        if (this.W1[i] && this.W1[i][j] !== undefined) sum += features[i] * this.W1[i][j];
      }
      return Math.tanh(sum);
    });
    let out = this.b2[0] || 0;
    for (let j = 0; j < hidden.length; j++) {
      if (this.W2[j] && this.W2[j][0] !== undefined) out += hidden[j] * this.W2[j][0];
    }
    return 1 / (1 + Math.exp(-out)); // sigmoid
  }
}

export class HNS_KGT_Inference {
  constructor(graphData, attentionWeights) {
    this.nodes = graphData.nodes.map(n => ({
      ...n,
      label: n.label || n.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
    this.edges = graphData.edges;
    this.attention = new NeuralAttention(
      attentionWeights.W1, attentionWeights.b1,
      attentionWeights.W2, attentionWeights.b2
    );
    this.mastery = {};
    this.recency = {};
    this.nodes.forEach(n => { this.mastery[n.id] = 0; this.recency[n.id] = 0; });
  }

  setStudentState(masteryDict, recencyDict) {
    Object.entries(masteryDict).forEach(([k, v]) => { if (k in this.mastery) this.mastery[k] = v; });
    if (recencyDict) Object.entries(recencyDict).forEach(([k, v]) => { if (k in this.recency) this.recency[k] = v; });
  }

  computeAttentionWeights() {
    const weights = {};
    this.edges.forEach(e => {
      const feat = [
        this.mastery[e.from] || 0, this.mastery[e.to] || 0,
        e.weight, this.recency[e.from] || 0, this.recency[e.to] || 0
      ];
      weights[`${e.from}->${e.to}`] = this.attention.forward(feat);
    });
    return weights;
  }

  symbolicCheck(nodeId) {
    for (const e of this.edges) {
      if (e.to === nodeId && e.type === 'prerequisite') {
        const minMastery = e.weight * 0.4;
        if ((this.mastery[e.from] || 0) < minMastery) return { ready: false, blocker: e.from };
      }
    }
    return { ready: true, blocker: null };
  }

  getDescendants(nodeId, visited = new Set()) {
    const desc = new Set();
    this.edges.filter(e => e.from === nodeId && !visited.has(e.to)).forEach(e => {
      desc.add(e.to); visited.add(e.to);
      this.getDescendants(e.to, visited).forEach(d => desc.add(d));
    });
    return desc;
  }

  recommend(n = 5) {
    const attWeights = this.computeAttentionWeights();
    const scores = [];

    this.nodes.forEach(node => {
      const m = this.mastery[node.id] || 0;
      if (m >= 0.8) return;

      const { ready } = this.symbolicCheck(node.id);
      const downstream = this.getDescendants(node.id).size;

      const incoming = this.edges.filter(e => e.to === node.id);
      const attScores = incoming.map(e => attWeights[`${e.from}->${e.to}`] || 0.5);
      const attAvg = attScores.length > 0 ? attScores.reduce((a, b) => a + b, 0) / attScores.length : 0.5;

      const readyBonus = ready ? 1.5 : 0.5;
      const impact = 1 + downstream * 0.3;
      const priority = attAvg * readyBonus * impact * (1 - m);

      scores.push({ node: node.id, label: node.label, priority, mastery: m, ready, attScore: attAvg, downstream });
    });

    return scores.sort((a, b) => b.priority - a.priority).slice(0, n);
  }

  findOptimalPath(targetId) {
    const attWeights = this.computeAttentionWeights();
    const openSet = [{ cost: 0, node: targetId, path: [targetId] }];
    const visited = new Set();
    let bestPath = [targetId], bestCost = Infinity;

    while (openSet.length > 0) {
      const { cost, node, path } = openSet.shift();
      if (visited.has(node) || path.length > 8) continue;
      visited.add(node);

      const { ready } = this.symbolicCheck(node);
      if (ready && (this.mastery[node] || 0) < 0.6 && cost < bestCost) {
        bestPath = path; bestCost = cost;
      }

      this.edges.filter(e => e.to === node && !visited.has(e.from)).forEach(e => {
        const att = attWeights[`${e.from}->${e.to}`] || 0.5;
        const edgeCost = (1 - att) * (1 - (this.mastery[e.from] || 0));
        openSet.push({ cost: cost + edgeCost, node: e.from, path: [e.from, ...path] });
      });

      openSet.sort((a, b) => a.cost - b.cost);
    }
    return bestPath;
  }

  findBottlenecks() {
    return this.nodes
      .filter(n => (this.mastery[n.id] || 0) < 0.4)
      .map(n => ({ ...n, mastery: this.mastery[n.id] || 0, downstream: this.getDescendants(n.id).size }))
      .filter(n => n.downstream > 0)
      .sort((a, b) => b.downstream - a.downstream);
  }
}

// =============================================
// ACD-BKT: Bayesian Knowledge Tracing
// =============================================
export class ACD_BKT_Inference {
  constructor(params) {
    this.pInit = params.p_init;
    this.pLearn = params.p_learn;
    this.pGuess = params.p_guess;
    this.pSlip = params.p_slip;
    this.skills = {};
  }

  initSkill(skillId) {
    if (!this.skills[skillId]) {
      this.skills[skillId] = {
        knowledge: this.pInit,
        decayAlpha: 2.0, decayBeta: 5.0,
        lastPracticed: Date.now() / 1000,
        practiceCount: 0
      };
    }
  }

  getDecayRate(skillId) {
    this.initSkill(skillId);
    const s = this.skills[skillId];
    return s.decayAlpha / (s.decayAlpha + s.decayBeta);
  }

  update(skillId, correct) {
    this.initSkill(skillId);
    const s = this.skills[skillId];
    const now = Date.now() / 1000;

    // Apply temporal decay
    const dt = (now - s.lastPracticed) / 3600; // hours
    if (dt > 0) {
      const decay = this.getDecayRate(skillId);
      const retention = Math.exp(-decay * dt * 0.01);
      const practiceBonus = 1 - Math.exp(-0.1 * s.practiceCount);
      s.knowledge *= retention + (1 - retention) * practiceBonus * 0.3;
    }

    s.lastPracticed = now;
    s.practiceCount++;

    // BKT update
    const p = s.knowledge;
    let posterior;
    if (correct) {
      posterior = ((1 - this.pSlip) * p) / ((1 - this.pSlip) * p + this.pGuess * (1 - p));
    } else {
      posterior = (this.pSlip * p) / (this.pSlip * p + (1 - this.pGuess) * (1 - p));
    }

    s.knowledge = posterior + (1 - posterior) * this.pLearn;

    // Update decay prior
    if (correct) { s.decayAlpha += 0.1; s.decayBeta += 0.5; }
    else { s.decayAlpha += 0.5; s.decayBeta += 0.1; }

    return s.knowledge;
  }

  getKnowledge(skillId) {
    this.initSkill(skillId);
    return this.skills[skillId].knowledge;
  }

  predictFuture(skillId, hoursAhead) {
    this.initSkill(skillId);
    const s = this.skills[skillId];
    const decay = this.getDecayRate(skillId);
    const bonus = 1 - Math.exp(-0.1 * s.practiceCount);
    const retention = Math.exp(-decay * hoursAhead * 0.01);
    return s.knowledge * (retention + (1 - retention) * bonus * 0.3);
  }
}

// =============================================
// BACP: Background-Adaptive Normalization
// =============================================
export class BACP_Inference {
  constructor(baselines) {
    this.baselines = baselines;
  }

  normalize(rawScore, domain, background) {
    let baseline = 50; // default
    let count = 0;

    for (const [bgKey, bgValue] of Object.entries(background)) {
      if (this.baselines[bgKey] && this.baselines[bgKey][bgValue]) {
        const domainBaseline = this.baselines[bgKey][bgValue][domain];
        if (domainBaseline) { baseline += domainBaseline; count++; }
      }
    }

    if (count > 0) baseline /= count;
    // BACP score = raw score adjusted by how much above/below baseline
    const adjustment = rawScore - baseline;
    return Math.max(0, Math.min(100, 50 + adjustment * 1.2));
  }

  getPercentile(rawScore, domain, background) {
    const normalized = this.normalize(rawScore, domain, background);
    return Math.round(normalized);
  }
}

// =============================================
// Unified Inference API
// =============================================
let hnsInstance = null;
let bktInstance = null;
let bacpInstance = null;

export async function initializeInference() {
  const data = await loadTrainedModels();
  if (!data) return false;

  hnsInstance = new HNS_KGT_Inference(data.knowledge_graph, data.hns_kgt_attention);
  bktInstance = new ACD_BKT_Inference(data.acd_bkt_params);
  bacpInstance = new BACP_Inference(data.bacp_baselines);

  console.log('%c[EduVerse AI] Inference engines initialized', 'color:#7C3AED;font-weight:bold');
  return true;
}

export function getHNS() { return hnsInstance; }
export function getBKT() { return bktInstance; }
export function getBACP() { return bacpInstance; }

/**
 * Main inference function — call this from AI Assistant.
 * Takes student mastery and returns full analysis.
 */
export function runInference(mastery, background = {}) {
  if (!hnsInstance || !bktInstance) return null;

  hnsInstance.setStudentState(mastery);

  const recommendations = hnsInstance.recommend(5);
  const bottlenecks = hnsInstance.findBottlenecks();

  // Find optimal path to weakest high-level skill
  const weakHighLevel = hnsInstance.nodes
    .filter(n => n.level >= 3 && (mastery[n.id] || 0) < 0.5)
    .sort((a, b) => (mastery[a.id] || 0) - (mastery[b.id] || 0));

  const optimalPath = weakHighLevel.length > 0
    ? hnsInstance.findOptimalPath(weakHighLevel[0].id)
    : [];

  // BKT predictions
  const futureKnowledge = {};
  Object.keys(mastery).forEach(skill => {
    futureKnowledge[skill] = {
      current: bktInstance.getKnowledge(skill),
      in24h: bktInstance.predictFuture(skill, 24),
      in72h: bktInstance.predictFuture(skill, 72)
    };
  });

  // BACP normalization
  const bacpScores = {};
  if (bacpInstance && background) {
    const domains = ['math', 'science', 'language', 'cs', 'soft'];
    domains.forEach(d => {
      const domainSkills = hnsInstance.nodes.filter(n => n.domain === d);
      const avgScore = domainSkills.length > 0
        ? domainSkills.reduce((s, n) => s + (mastery[n.id] || 0), 0) / domainSkills.length * 100
        : 0;
      bacpScores[d] = {
        raw: Math.round(avgScore),
        percentile: bacpInstance.getPercentile(avgScore, d, background)
      };
    });
  }

  return { recommendations, bottlenecks, optimalPath, futureKnowledge, bacpScores };
}

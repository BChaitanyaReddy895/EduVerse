// ============================================
// EduVerse — Skill Barter Marketplace (Real-Time)
// Working forms, real matching, exchange tracking
// ============================================

import { store } from '../utils/data-store.js';
import { Graph, showToast, staggerAnimation } from '../utils/helpers.js';

export function renderSkillBarter(container) {
  store.logSession('skill_barter', 1);
  const listings = store.getBarterListings();
  const exchanges = store.getBarterExchanges();
  const barterGraph = buildBarterGraph(listings);
  const cycles = barterGraph.findCycles(5);

  container.innerHTML = `
    <div class="skill-barter-page">
      <div class="section-header">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div class="section-title">Skill Barter Marketplace</div>
          <span class="badge badge-primary">Cyclic Resolution</span>
        </div>
        <div class="section-subtitle">Add your skills, find matches, and exchange knowledge peer-to-peer. The algorithm finds N-way barter cycles in real-time.</div>
      </div>
      <div style="padding:var(--space-4);background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-md);margin-bottom:var(--space-4);font-size:var(--text-sm)">
        💡 <strong>How it works:</strong> Add what you can teach and what you want to learn → the graph coloring algorithm finds direct matches and multi-way exchange cycles → click "Request Exchange" to connect.
      </div>
      <!-- Add Skill Form -->
      <div class="glass-card" id="add-skill-form">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4)">
          <h3 style="font-weight:700; margin:0;">➕ Add Your Skill Listing</h3>
          <button class="btn btn-secondary btn-sm" id="auto-sync-ai" style="background:var(--bg-tertiary); border:1px solid #7C3AED; color:#7C3AED;">
             🧠 Auto-Sync from AI Knowledge Graph
          </button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
          <div class="input-group"><label class="input-label">Your Name</label><input class="input-field" id="barter-name" placeholder="Your name" value="${store.getStudent()?.name||''}"/></div>
          <div class="input-group"><label class="input-label">Skill You Can Teach</label><input class="input-field" id="barter-offering" placeholder="e.g. Mechanical Engineering"/></div>
          <div class="input-group"><label class="input-label">Your Proficiency</label>
            <select class="input-field" id="barter-offer-level"><option>Beginner</option><option>Intermediate</option><option selected>Advanced</option></select>
          </div>
          <div class="input-group"><label class="input-label">Skill You Want to Learn</label><input class="input-field" id="barter-seeking" placeholder="e.g. Fluid Dynamics"/></div>
          <div class="input-group"><label class="input-label">Seeking Level</label>
            <select class="input-field" id="barter-seek-level"><option selected>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
          </div>
          <div class="input-group"><label class="input-label">Tags (comma-separated)</label><input class="input-field" id="barter-tags" placeholder="e.g. Engineering, Physics" value="Engineering, STEM"/></div>
        </div>
        <button class="btn btn-primary" id="submit-listing" style="margin-top:var(--space-4)">📝 Publish Listing</button>
      </div>
      <!-- Network -->
      <div class="barter-network-container"><canvas class="barter-network-canvas" id="barter-canvas"></canvas>
        <div class="barter-network-stats">
          <div class="barter-stat"><span class="barter-stat-value">${listings.length}</span> Users</div>
          <div class="barter-stat"><span class="barter-stat-value">${cycles.length}</span> Cycles</div>
          <div class="barter-stat"><span class="barter-stat-value">${exchanges.length}</span> Exchanges</div>
        </div>
      </div>
      <!-- Cycle viz -->
      ${cycles.length > 0 ? `<div class="cycle-viz">
        <div class="cycle-viz-header"><span style="font-size:20px">🔄</span><div><div class="cycle-viz-title">Detected Barter Cycles</div><div style="font-size:var(--text-xs);color:var(--text-secondary)">N-way exchanges found by graph algorithm</div></div></div>
        ${cycles.map(cycle => renderCyclePath(cycle, listings)).join('')}
      </div>` : ''}
      <!-- Listings -->
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
          <div class="section-title" style="font-size:var(--text-lg)">All Listings (${listings.length})</div>
          <button class="btn btn-secondary btn-sm" id="find-matches">🔍 Run Matching Algorithm</button>
        </div>
        <div class="barter-grid"><div>${listings.slice(0, Math.ceil(listings.length/2)).map(u => renderListing(u)).join('')}</div><div>${listings.slice(Math.ceil(listings.length/2)).map(u => renderListing(u)).join('')}</div></div>
      </div>
      <!-- Matches -->
      <div class="match-results" id="match-results" style="display:none">
        <div class="match-results-header"><span style="font-size:20px">✨</span><div class="match-results-title">Computed Matches</div></div>
        <div id="match-list"></div>
      </div>
      <!-- Exchange History -->
      ${exchanges.length > 0 ? `<div class="glass-card">
        <h3 style="font-weight:700;margin-bottom:var(--space-4)">📋 Your Exchange Requests</h3>
        ${exchanges.map(ex => `
          <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);background:var(--bg-tertiary);border-radius:var(--radius-md);margin-bottom:var(--space-2)">
            <span class="badge ${ex.status==='pending'?'badge-warning':ex.status==='accepted'?'badge-success':'badge-error'}">${ex.status}</span>
            <span style="font-size:var(--text-sm)">${ex.offering} ⇌ ${ex.seeking}</span>
            <span style="font-size:var(--text-xs);color:var(--text-muted);margin-left:auto">${new Date(ex.createdAt).toLocaleDateString()}</span>
          </div>`).join('')}
      </div>` : ''}
    </div>`;

  setupBarterEvents(container, listings);
  drawBarterNetwork(listings);
}

function renderListing(u) {
  const colors = ['#7C3AED','#06B6D4','#10B981','#F59E0B','#EF4444','#3B82F6'];
  const color = u.color || colors[Math.abs(u.id.charCodeAt(3)) % colors.length];
  const avatar = u.avatar || u.name?.split(' ').map(w=>w[0]).join('').slice(0,2) || '??';
  return `
    <div class="skill-listing">
      <div class="skill-listing-header">
        <div class="skill-listing-user"><div class="skill-listing-avatar" style="background:${color}">${avatar}</div><div class="skill-listing-name">${u.name}</div></div>
        ${u.rating > 0 ? `<div class="skill-listing-rating">⭐ ${u.rating}</div>` : ''}
      </div>
      <div class="skill-listing-exchange">
        <div class="skill-offering"><div class="skill-offering-label">Offering</div><div class="skill-offering-value">${u.offering}</div></div>
        <div class="skill-exchange-arrow">⇌</div>
        <div class="skill-seeking"><div class="skill-seeking-label">Seeking</div><div class="skill-seeking-value">${u.seeking}</div></div>
      </div>
      ${u.tags?.length ? `<div class="skill-listing-tags">${u.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>` : ''}
      <div class="skill-listing-actions">
        <button class="btn btn-primary btn-sm exchange-btn" data-id="${u.id}">Request Exchange</button>
        ${u.id?.startsWith('bl_') && u.id.length > 10 ? `<button class="btn btn-ghost btn-sm remove-btn" data-id="${u.id}" style="color:var(--accent-error)">Remove</button>` : ''}
      </div>
    </div>`;
}

function renderCyclePath(cycle, listings) {
  const nodes = cycle.map(id => listings.find(l => l.id === id)).filter(Boolean);
  if (nodes.length < 2) return '';
  return `<div class="cycle-path">
    ${nodes.map((n, i) => `
      <div class="cycle-node"><div class="cycle-node-circle">${n.avatar || n.name?.[0] || '?'}</div><div class="cycle-node-label">${n.offering?.split(' ')[0]}</div></div>
      ${i < nodes.length - 1 ? '<div class="cycle-arrow">→</div>' : ''}
    `).join('')}
    <div class="cycle-arrow">→</div>
    <div class="cycle-node"><div class="cycle-node-circle">${nodes[0].avatar || nodes[0].name?.[0]}</div><div class="cycle-node-label">${nodes[0].offering?.split(' ')[0]}</div></div>
  </div>`;
}

function setupBarterEvents(container, listings) {
  // Auto-Sync from AI
  container.querySelector('#auto-sync-ai')?.addEventListener('click', () => {
    const masteryData = store.getAllMastery();
    const engineeringKeys = Object.keys(masteryData).filter(k => 
      ['physics','engineering','calculus','machine_learning','algorithms','programming','basic_science','chemistry'].includes(k)
    );
    
    if (engineeringKeys.length === 0) {
      showToast('⚠️ No engineering AR interactions found. Please explore the 3D CAR model first!', 'warning');
      return;
    }

    const sortedEng = engineeringKeys.sort((a,b) => masteryData[b] - masteryData[a]);
    const strongest = sortedEng[0];
    const weakest = sortedEng[sortedEng.length - 1];

    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');

    document.getElementById('barter-offering').value = 'Advanced ' + capitalize(strongest);
    document.getElementById('barter-offer-level').value = 'Advanced';
    document.getElementById('barter-seeking').value = 'Foundational ' + capitalize(weakest);
    document.getElementById('barter-seek-level').value = 'Beginner';
    
    showToast('🧠 Form synced directly with your Engineering Neural Graph!', 'success');
  });

  // Submit listing
  container.querySelector('#submit-listing')?.addEventListener('click', () => {
    const name = document.getElementById('barter-name')?.value?.trim();
    const offering = document.getElementById('barter-offering')?.value?.trim();
    const seeking = document.getElementById('barter-seeking')?.value?.trim();
    const offeringLevel = document.getElementById('barter-offer-level')?.value;
    const seekingLevel = document.getElementById('barter-seek-level')?.value;
    const tagsRaw = document.getElementById('barter-tags')?.value?.trim();

    if (!name || !offering || !seeking) { showToast('Please fill in name, offering, and seeking fields', 'warning'); return; }

    store.addBarterListing({
      name, offering, offeringLevel, seeking, seekingLevel,
      avatar: name.split(' ').map(w=>w[0]).join('').slice(0,2),
      tags: tagsRaw ? tagsRaw.split(',').map(t=>t.trim()).filter(Boolean) : [],
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    });
    showToast(`✅ Listing published: ${offering} ⇌ ${seeking}`, 'success');
    renderSkillBarter(container);
  });

  // Exchange buttons
  container.querySelectorAll('.exchange-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const exchange = store.createExchange(id, 'Interested in skill exchange!');
      if (exchange) {
        showToast(`📩 Exchange request sent!`, 'success');
        btn.textContent = '✅ Requested';
        btn.disabled = true;
      }
    });
  });

  // Remove buttons
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.removeBarterListing(btn.dataset.id);
      showToast('Listing removed', 'info');
      renderSkillBarter(container);
    });
  });

  // Find matches
  container.querySelector('#find-matches')?.addEventListener('click', () => {
    const matches = computeMatches(listings);
    const resultDiv = document.getElementById('match-results');
    const matchList = document.getElementById('match-list');
    if (resultDiv && matchList) {
      resultDiv.style.display = 'block';
      matchList.innerHTML = matches.length > 0
        ? matches.map(m => `<div class="match-card"><div class="match-score ${m.score>80?'high':'medium'}">${m.score}%</div><div class="match-info"><div class="match-info-name">${m.a.name} ⇌ ${m.b.name}</div><div class="match-info-exchange">${m.a.offering} ↔ ${m.b.offering}</div></div></div>`).join('')
        : '<div style="text-align:center;color:var(--text-secondary);padding:var(--space-4)">No direct matches found. Add more listings to discover exchanges!</div>';
      showToast(`Found ${matches.length} matches!`, 'success');
    }
  });
}

function computeMatches(listings) {
  const matches = [];
  for (let i = 0; i < listings.length; i++) {
    for (let j = i + 1; j < listings.length; j++) {
      const a = listings[i], b = listings[j];
      let score = 0;
      // Check if A offers what B seeks
      if (a.offering.toLowerCase().includes(b.seeking.toLowerCase().split(' ')[0].toLowerCase())) score += 50;
      // Check if B offers what A seeks
      if (b.offering.toLowerCase().includes(a.seeking.toLowerCase().split(' ')[0].toLowerCase())) score += 50;
      // Bonus for matching levels
      if (a.offeringLevel === b.seekingLevel) score += 5;
      if (score > 0) matches.push({ a, b, score: Math.min(99, score) });
    }
  }
  return matches.sort((a,b) => b.score - a.score);
}

function buildBarterGraph(listings) {
  const graph = new Graph();
  listings.forEach(l => graph.addNode(l.id, l));
  listings.forEach(a => {
    listings.forEach(b => {
      if (a.id !== b.id && a.offering.toLowerCase().includes(b.seeking.toLowerCase().split(' ')[0].toLowerCase())) {
        graph.addEdge(a.id, b.id, 1, 'offer');
      }
    });
  });
  return graph;
}

function drawBarterNetwork(listings) {
  const canvas = document.getElementById('barter-canvas');
  if (!canvas || listings.length === 0) return;
  const cont = canvas.parentElement;
  canvas.width = cont.offsetWidth; canvas.height = 380;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width/2, cy = canvas.height/2, r = Math.min(canvas.width, canvas.height)*0.3;
  const nodes = listings.map((u, i) => {
    const a = (i / listings.length) * Math.PI * 2 - Math.PI / 2;
    return { ...u, x: cx+Math.cos(a)*r, y: cy+Math.sin(a)*r, nr: 28 };
  });

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now() * 0.001;
    // Connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i+1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const match = a.offering.toLowerCase().includes(b.seeking?.split(' ')[0]?.toLowerCase()||'') || b.offering.toLowerCase().includes(a.seeking?.split(' ')[0]?.toLowerCase()||'');
        if (match) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = 'rgba(124,58,237,0.2)'; ctx.lineWidth = 2; ctx.stroke();
        }
      }
    }
    // Nodes
    nodes.forEach((n, i) => {
      const bounce = Math.sin(time*2+i)*2;
      const col = n.color||'#7C3AED';
      ctx.beginPath(); ctx.arc(n.x, n.y+bounce, n.nr, 0, Math.PI*2);
      ctx.fillStyle = col+'20'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#F1F5F9'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n.avatar||n.name?.[0]||'?', n.x, n.y+bounce);
      ctx.fillStyle = '#94A3B8'; ctx.font = '9px Inter';
      ctx.fillText(n.name?.split(' ')[0]||'', n.x, n.y+bounce+n.nr+12);
    });
    requestAnimationFrame(render);
  }
  render();
}

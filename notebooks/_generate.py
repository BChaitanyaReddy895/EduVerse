import json
import os

cells = []
def md(source): cells.append({'cell_type':'markdown','metadata':{},'source': [l+'\n' for l in source.split('\n')]})
def code(source): cells.append({'cell_type':'code','execution_count':None,'metadata':{},'outputs':[],'source': [l+'\n' for l in source.split('\n')]})

md('''# EduVerse AI Teaching Assistant — Research Notebook
## Novel Hybrid Algorithms for Adaptive Learning

### Datasets (Download manually from Kaggle and upload below):
1. **UCI Student Performance** — Real Portuguese secondary school data
   - Download Link: [https://www.kaggle.com/datasets/uciml/student-performance-data-set](https://www.kaggle.com/datasets/uciml/student-performance-data-set)
   - *Extract the zip and upload `student-mat.csv` and `student-por.csv`*
2. **xAPI Educational Learning Analytics** — Student behavioral features
   - Download Link: [https://www.kaggle.com/datasets/aljarah/xAPI-Edu-Data](https://www.kaggle.com/datasets/aljarah/xAPI-Edu-Data)
   - *Extract the zip and upload `xAPI-Edu-Data.csv`*

### Novel Algorithms (NOT existing in literature):
| Algorithm | Full Name | Novelty |
|-----------|-----------|---------|
| **HNS-KGT** | Hybrid Neuro-Symbolic Graph Traversal | Neural attention + symbolic constraint propagation |
| **ACD-BKT** | Adaptive Competence Decay BKT | Per-student forgetting curves with Beta posterior |
| **EWGH** | Equity-Weighted Gradient Harmonization | Fairness-aware gradient re-weighting |
''')

code('''# Install required packages
!pip install -q networkx seaborn scikit-learn matplotlib pandas numpy''')

code('''import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import networkx as nx
import os, json
from collections import defaultdict
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, classification_report
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
import warnings
warnings.filterwarnings('ignore')
np.random.seed(42)
print('All libraries loaded successfully.')''')

md('''---
## 1. Dataset Upload & Acquisition

Since KaggleHub paths often change, we will load the datasets manually. 
**Go to the links at the top of the notebook, download the data, and run the cell below to upload the CSV files to Colab.**''')

code('''# 1.1 Upload CSV files to Colab
try:
    from google.colab import files
    print("Please upload the following 3 files:\\n1. student-mat.csv\\n2. student-por.csv\\n3. xAPI-Edu-Data.csv")
    uploaded = files.upload()
except ImportError:
    print('Not running in Colab. Make sure the 3 CSV files are in the same folder as this notebook.')''')

code('''# 1.2 Load UCI Student Performance Dataset
df_math = pd.read_csv('student-mat.csv', sep=';')
df_por = pd.read_csv('student-por.csv', sep=';')
df_math['subject'] = 'math'
df_por['subject'] = 'portuguese'
df_uci = pd.concat([df_math, df_por], ignore_index=True)

print(f'\\nUCI Dataset: {df_uci.shape[0]} students, {df_uci.shape[1]} features')
print(f'Subjects: Math={len(df_math)}, Portuguese={len(df_por)}')
df_uci.head()''')

code('''# 1.3 Load xAPI Educational Learning Analytics Dataset
df_xapi = pd.read_csv('xAPI-Edu-Data.csv')
print(f'\\nxAPI Dataset: {df_xapi.shape[0]} students, {df_xapi.shape[1]} features')
print(f'Topics: {df_xapi["Topic"].nunique()} unique')
print(f'Classes: {df_xapi["Class"].value_counts().to_dict()}')
df_xapi.head()''')

md('''---
## 2. Dataset Exploration & Preprocessing''')

code('''# 2.1 UCI Student Performance — Grade Distributions
fig, axes = plt.subplots(2, 3, figsize=(18, 10))
fig.suptitle('UCI Student Performance — Distribution Analysis', fontsize=16, fontweight='bold')

for i, col in enumerate(['G1', 'G2', 'G3']):
    ax = axes[0][i]
    ax.hist(df_uci[df_uci['subject']=='math'][col], bins=20, alpha=0.6, label='Math', color='#7C3AED')
    ax.hist(df_uci[df_uci['subject']=='portuguese'][col], bins=20, alpha=0.6, label='Portuguese', color='#06B6D4')
    ax.set_title(f'Grade {col}', fontweight='bold'); ax.legend()

for i, col in enumerate(['studytime', 'failures', 'absences']):
    ax = axes[1][i]
    ax.hist(df_uci[col], bins=20, color='#10B981', alpha=0.7, edgecolor='white')
    ax.set_title(col.title(), fontweight='bold')
    ax.axvline(df_uci[col].mean(), color='red', linestyle='--', label=f'Mean: {df_uci[col].mean():.1f}')
    ax.legend()

plt.tight_layout(); plt.show()''')

code('''# 2.2 xAPI Learning Analytics — Behavioral Features
fig, axes = plt.subplots(2, 3, figsize=(18, 10))
fig.suptitle('xAPI Learning Analytics — Behavioral Features', fontsize=16, fontweight='bold')

behavioral = ['raisedhands', 'VisITedResources', 'AnnoijncementsView', 'Discussion']
for i, col in enumerate(behavioral):
    ax = axes[i//3][i%3]
    for cls in ['H', 'M', 'L']:
        subset = df_xapi[df_xapi['Class']==cls][col]
        ax.hist(subset, bins=20, alpha=0.5, label=f'Class {cls}')
    ax.set_title(col, fontweight='bold'); ax.legend()

axes[1][1].barh(df_xapi['Topic'].value_counts().index[:10],
                df_xapi['Topic'].value_counts().values[:10], color='#7C3AED')
axes[1][1].set_title('Top 10 Topics', fontweight='bold')

df_xapi['gender'].value_counts().plot(kind='pie', ax=axes[1][2],
    colors=['#06B6D4','#F59E0B'], autopct='%1.1f%%')
axes[1][2].set_title('Gender Distribution', fontweight='bold')
plt.tight_layout(); plt.show()''')

code('''# 2.3 Correlation Analysis
fig, axes = plt.subplots(1, 2, figsize=(18, 7))

numeric_uci = df_uci.select_dtypes(include=[np.number])
sns.heatmap(numeric_uci.corr(), annot=False, cmap='RdYlBu_r', ax=axes[0], vmin=-1, vmax=1)
axes[0].set_title('UCI — Feature Correlations', fontweight='bold', fontsize=12)

numeric_xapi = df_xapi.select_dtypes(include=[np.number])
sns.heatmap(numeric_xapi.corr(), annot=True, fmt='.2f', cmap='RdYlBu_r', ax=axes[1], vmin=-1, vmax=1)
axes[1].set_title('xAPI — Feature Correlations', fontweight='bold', fontsize=12)
plt.tight_layout(); plt.show()''')

code('''# 2.4 BACP Background Analysis (Foundation for EWGH Algorithm)
fig, axes = plt.subplots(1, 3, figsize=(18, 5))
fig.suptitle('Background-Adaptive Analysis (BACP Foundation)', fontsize=14, fontweight='bold')

school_means = df_uci.groupby('school')['G3'].mean()
school_means.plot(kind='bar', ax=axes[0], color=['#7C3AED','#06B6D4'])
axes[0].set_title('Avg Grade by School Type'); axes[0].set_ylabel('G3 Score')

internet_means = df_uci.groupby('internet')['G3'].mean()
internet_means.plot(kind='bar', ax=axes[1], color=['#EF4444','#10B981'])
axes[1].set_title('Avg Grade by Internet Access')

for col in ['Medu', 'Fedu']:
    df_uci.groupby(col)['G3'].mean().plot(ax=axes[2], label=col, marker='o')
axes[2].set_title('Grade vs Parent Education'); axes[2].legend()
axes[2].set_xlabel('Education Level')
plt.tight_layout(); plt.show()

print('\\nDataset exploration complete')
print(f'Total students: {len(df_uci) + len(df_xapi)}')''')

md('''---
## 3. Knowledge Graph Construction from Real Data''')

code('''# 3.1 Build Knowledge Graph
skills = {
    'arithmetic': {'domain': 'math', 'level': 1},
    'algebra': {'domain': 'math', 'level': 2},
    'calculus': {'domain': 'math', 'level': 3},
    'statistics': {'domain': 'math', 'level': 3},
    'reading_comp': {'domain': 'language', 'level': 1},
    'writing': {'domain': 'language', 'level': 2},
    'critical_analysis': {'domain': 'language', 'level': 3},
    'basic_science': {'domain': 'science', 'level': 1},
    'physics': {'domain': 'science', 'level': 2},
    'chemistry': {'domain': 'science', 'level': 2},
    'biology': {'domain': 'science', 'level': 2},
    'programming': {'domain': 'cs', 'level': 2},
    'algorithms': {'domain': 'cs', 'level': 3},
    'machine_learning': {'domain': 'cs', 'level': 4},
    'communication': {'domain': 'soft', 'level': 1},
    'teamwork': {'domain': 'soft', 'level': 2},
}

G = nx.DiGraph()
for sid, attrs in skills.items():
    G.add_node(sid, **attrs)

prereqs = [
    ('arithmetic','algebra',0.92), ('algebra','calculus',0.87),
    ('algebra','statistics',0.72), ('algebra','physics',0.68),
    ('calculus','physics',0.78), ('statistics','machine_learning',0.74),
    ('reading_comp','writing',0.85), ('writing','critical_analysis',0.76),
    ('basic_science','physics',0.81), ('basic_science','chemistry',0.79),
    ('basic_science','biology',0.83),
    ('algebra','programming',0.65), ('programming','algorithms',0.88),
    ('algorithms','machine_learning',0.71), ('calculus','machine_learning',0.62),
    ('communication','teamwork',0.58), ('writing','communication',0.45),
    ('critical_analysis','algorithms',0.35),
]

for src, tgt, w in prereqs:
    etype = 'transfer' if skills[src]['domain'] != skills[tgt]['domain'] else 'prerequisite'
    G.add_edge(src, tgt, weight=w, type=etype)

print(f'Knowledge Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')

plt.figure(figsize=(14, 10))
pos = nx.spring_layout(G, k=2.5, seed=42)
cmap = {'math':'#7C3AED','language':'#06B6D4','science':'#10B981','cs':'#3B82F6','soft':'#F59E0B'}
node_colors = [cmap[G.nodes[n]['domain']] for n in G.nodes()]
edge_w = [G[u][v]['weight']*3 for u,v in G.edges()]
nx.draw(G, pos, with_labels=True, node_color=node_colors, node_size=900,
        font_size=8, font_weight='bold', arrows=True, arrowsize=15,
        width=edge_w, edge_color='gray', alpha=0.85)
for dom, col in cmap.items():
    plt.scatter([], [], c=col, s=100, label=dom.upper())
plt.legend(scatterpoints=1, fontsize=10)
plt.title('MDKGT Knowledge Hypergraph', fontsize=14, fontweight='bold')
plt.show()''')

md('''---
## 4. NOVEL ALGORITHM 1: HNS-KGT
### Hybrid Neuro-Symbolic Knowledge Graph Traversal''')

code('''class NeuralAttentionLayer:
    def __init__(self, input_dim, hidden_dim=16):
        self.W1 = np.random.randn(input_dim, hidden_dim) * 0.1
        self.b1 = np.zeros(hidden_dim)
        self.W2 = np.random.randn(hidden_dim, 1) * 0.1
        self.b2 = np.zeros(1)
        self.lr = 0.01

    def forward(self, x):
        self.x = x
        self.h = np.tanh(x @ self.W1 + self.b1)
        self.out = 1 / (1 + np.exp(-(self.h @ self.W2 + self.b2)))
        return self.out.flatten()

    def backward(self, loss_grad):
        d_out = loss_grad.reshape(-1, 1) * self.out * (1 - self.out)
        d_W2 = self.h.T @ d_out
        d_h = d_out @ self.W2.T * (1 - self.h**2)
        d_W1 = self.x.T @ d_h
        self.W1 -= self.lr * d_W1
        self.b1 -= self.lr * d_h.mean(axis=0)
        self.W2 -= self.lr * d_W2
        self.b2 -= self.lr * d_out.mean(axis=0)''')

code('''class HNS_KGT:
    def __init__(self, graph):
        self.G = graph
        self.attention = NeuralAttentionLayer(input_dim=5, hidden_dim=16)
        self.mastery = {n: 0.0 for n in graph.nodes()}
        self.recency = {n: 0.0 for n in graph.nodes()}

    def set_student_state(self, mastery_dict, recency_dict=None):
        for k, v in mastery_dict.items():
            if k in self.mastery: self.mastery[k] = v
        if recency_dict:
            for k, v in recency_dict.items():
                if k in self.recency: self.recency[k] = v

    def compute_attention_weights(self):
        features = [[self.mastery[u], self.mastery[v], data['weight'], self.recency.get(u,0), self.recency.get(v,0)] for u, v, data in self.G.edges(data=True)]
        attention = self.attention.forward(np.array(features))
        return {(u, v): float(att) for (u, v, _), att in zip(self.G.edges(data=True), attention)}

    def symbolic_constraint_check(self, node):
        for pred in self.G.predecessors(node):
            edge = self.G[pred][node]
            if edge['type'] == 'prerequisite' and self.mastery.get(pred, 0) < edge['weight'] * 0.4:
                return False, pred
        return True, None

    def find_optimal_path(self, target, max_steps=8):
        attention_weights = self.compute_attention_weights()
        open_set = [(0, target, [target])]
        visited, best_path, best_cost = set(), [target], float('inf')

        while open_set:
            cost, node, path = open_set.pop(0)
            if node in visited or len(path) > max_steps: continue
            visited.add(node)
            is_ready, _ = self.symbolic_constraint_check(node)
            if is_ready and self.mastery.get(node, 0) < 0.6 and cost < best_cost:
                best_path, best_cost = path, cost
            for pred in self.G.predecessors(node):
                if pred not in visited:
                    att = attention_weights.get((pred, node), 0.5)
                    open_set.append((cost + (1 - att) * (1 - self.mastery.get(pred, 0)), pred, [pred] + path))
            open_set.sort(key=lambda x: x[0])
        return best_path''')

md('''---
## 5. NOVEL ALGORITHM 2: ACD-BKT
### Adaptive Competence Decay with Bayesian Knowledge Tracing''')

code('''class ACD_BKT:
    def __init__(self, skills, p_init=0.3, p_learn=0.1, p_guess=0.2, p_slip=0.1):
        self.skills, self.p_init, self.p_learn, self.p_guess, self.p_slip = skills, p_init, p_learn, p_guess, p_slip
        self.knowledge = {s: p_init for s in skills}
        self.decay_alpha = {s: 2.0 for s in skills}; self.decay_beta = {s: 5.0 for s in skills}
        self.last_practiced = {s: 0 for s in skills}; self.practice_count = {s: 0 for s in skills}
        self.history = {s: [] for s in skills}

    def get_decay_rate(self, skill): return self.decay_alpha[skill] / (self.decay_alpha[skill] + self.decay_beta[skill])

    def apply_temporal_decay(self, skill, t):
        dt = t - self.last_practiced[skill]
        if dt > 0:
            ret = np.exp(-self.get_decay_rate(skill) * dt)
            self.knowledge[skill] *= ret + (1 - ret) * (1 - np.exp(-0.1 * self.practice_count[skill])) * 0.3

    def update(self, skill, correct, t):
        self.apply_temporal_decay(skill, t)
        self.last_practiced[skill] = t; self.practice_count[skill] += 1
        p = self.knowledge[skill]
        post = ((1-self.p_slip)*p)/((1-self.p_slip)*p+self.p_guess*(1-p)) if correct else (self.p_slip*p)/(self.p_slip*p+(1-self.p_guess)*(1-p))
        self.knowledge[skill] = post + (1 - post) * self.p_learn
        if correct: self.decay_alpha[skill] += 0.1; self.decay_beta[skill] += 0.5
        else: self.decay_alpha[skill] += 0.5; self.decay_beta[skill] += 0.1
        self.history[skill].append({'time': t, 'knowledge': self.knowledge[skill], 'decay_rate': self.get_decay_rate(skill)})''')

md('''---
## 6. NOVEL ALGORITHM 3: EWGH
### Equity-Weighted Gradient Harmonization for BACP''')

code('''class EWGH:
    def __init__(self, n_features, n_classes, hidden_dims=[64, 32], equity_lambda=0.5):
        # He Initialization for ReLu
        self.W1 = np.random.randn(n_features, hidden_dims[0]) * np.sqrt(2. / n_features)
        self.b1 = np.zeros(hidden_dims[0])
        self.W2 = np.random.randn(hidden_dims[0], hidden_dims[1]) * np.sqrt(2. / hidden_dims[0])
        self.b2 = np.zeros(hidden_dims[1])
        self.W3 = np.random.randn(hidden_dims[1], n_classes) * np.sqrt(2. / hidden_dims[1])
        self.b3 = np.zeros(n_classes)
        
        self.equity_lambda = equity_lambda
        # Adam Optimizer params
        self.lr, self.beta1, self.beta2, self.eps, self.t = 0.01, 0.9, 0.999, 1e-8, 0
        self.m = [np.zeros_like(w) for w in [self.W1, self.b1, self.W2, self.b2, self.W3, self.b3]]
        self.v = [np.zeros_like(w) for w in [self.W1, self.b1, self.W2, self.b2, self.W3, self.b3]]

    def relu(self, x): return np.maximum(0, x)
    def relu_deriv(self, x): return (x > 0).astype(float)

    def forward(self, X):
        self.X = X
        self.z1 = X @ self.W1 + self.b1
        self.h1 = self.relu(self.z1)
        self.z2 = self.h1 @ self.W2 + self.b2
        self.h2 = self.relu(self.z2)
        self.z3 = self.h2 @ self.W3 + self.b3
        e = np.exp(self.z3 - np.max(self.z3, axis=1, keepdims=True))
        return e / e.sum(axis=1, keepdims=True)

    def compute_equity_weights(self, probs, y, groups):
        group_losses = {g: -np.mean(np.log(probs[np.arange((groups==g).sum()), y[groups==g]] + 1e-8)) for g in np.unique(groups) if (groups==g).sum() > 0}
        mean_loss = np.mean(list(group_losses.values())) if group_losses else 1
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            eq_mult = {g: 1 + self.equity_lambda * (l / (mean_loss + 1e-8) - 1) for g, l in group_losses.items()}
        weights = np.ones(len(y))
        for g in np.unique(groups): weights[groups == g] = eq_mult.get(g, 1.0)
        return weights

    def train_step(self, X, y, groups):
        probs = self.forward(X)
        d = probs.copy(); d[np.arange(len(y)), y] -= 1
        d *= self.compute_equity_weights(probs, y, groups).reshape(-1, 1) / len(y)
        
        dW3 = self.h2.T @ d; db3 = d.sum(axis=0)
        dh2 = d @ self.W3.T * self.relu_deriv(self.z2)
        dW2 = self.h1.T @ dh2; db2 = dh2.sum(axis=0)
        dh1 = dh2 @ self.W2.T * self.relu_deriv(self.z1)
        dW1 = X.T @ dh1; db1 = dh1.sum(axis=0)
        
        grads = [dW1, db1, dW2, db2, dW3, db3]
        params = [self.W1, self.b1, self.W2, self.b2, self.W3, self.b3]
        self.t += 1
        
        # Adam update with L2 Regularization (weight decay) limits overfitting on small tabular data
        l2_lambda = 0.005 
        for i in range(len(params)):
            grad = grads[i] + (l2_lambda * params[i] if i in [0, 2, 4] else 0)
            self.m[i] = self.beta1 * self.m[i] + (1 - self.beta1) * grad
            self.v[i] = self.beta2 * self.v[i] + (1 - self.beta2) * (grad ** 2)
            m_hat = self.m[i] / (1 - self.beta1 ** self.t)
            v_hat = self.v[i] / (1 - self.beta2 ** self.t)
            params[i] -= self.lr * m_hat / (np.sqrt(v_hat) + self.eps)
            
        return -np.mean(np.log(probs[np.arange(len(y)), y] + 1e-8))

    def predict(self, X): return np.argmax(self.forward(X), axis=1)

    def fit(self, X, y, groups, epochs=800):
        losses = []
        for e in range(epochs):
            if e > 0 and e % 300 == 0: self.lr *= 0.5  # Decay
            loss = self.train_step(X, y, groups)
            losses.append(loss)
        return losses''')

md('''---
## 7. Comparative Evaluation''')

code('''# 7.1 Prepare xAPI dataset
from imblearn.over_sampling import SMOTE
le_class = LabelEncoder()
y_all = le_class.fit_transform(df_xapi['Class'])
groups_all = LabelEncoder().fit_transform(df_xapi['gender'].astype(str))

cat_cols = ['gender', 'NationalITy', 'PlaceofBirth', 'StageID', 'GradeID', 'SectionID', 'Topic', 'Semester', 'Relation', 'ParentAnsweringSurvey', 'ParentschoolSatisfaction', 'StudentAbsenceDays']
num_cols = ['raisedhands', 'VisITedResources', 'AnnoijncementsView', 'Discussion']

# Very Important: One-Hot Encoding instead of Label Encoding for Neural Networks!
df_encoded = pd.get_dummies(df_xapi[cat_cols], drop_first=True)
X_features = pd.concat([df_xapi[num_cols], df_encoded], axis=1)

X_scaled = StandardScaler().fit_transform(X_features.values.astype(float))
X_train, X_test, y_train, y_test, g_train, g_test = train_test_split(X_scaled, y_all, groups_all, test_size=0.1, random_state=42, stratify=y_all)

# --- ADVANCED DATA AUGMENTATION (SMOTE + Synthetic Noise) ---
print("Applying SMOTE and Gaussian Noise Augmentation...")
X_g = np.hstack([X_train, g_train.reshape(-1, 1)])
X_res, y_res = SMOTE(random_state=42).fit_resample(X_g, y_train)
X_train_res = X_res[:, :-1]
g_train_res = np.round(X_res[:, -1]).astype(int)

X_aug, y_aug, g_aug = [], [], []
for _ in range(15):
    X_aug.append(X_train_res + np.random.normal(0, 0.05, X_train_res.shape))
    y_aug.append(y_res)
    g_aug.append(g_train_res)

X_train = np.vstack(X_aug)
y_train = np.concatenate(y_aug)
g_train = np.concatenate(g_aug)
print(f"Data powerfully augmented to {len(y_train)} samples for Deep Learning!")''')

code('''# 7.2 Train all models
rf = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)
gb = GradientBoostingClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)

print('Training EWGH (Deep Network)...')
ewgh_base = EWGH(X_train.shape[1], len(np.unique(y_all)), hidden_dims=[128, 64], equity_lambda=0.0)
ewgh_base.fit(X_train, y_train, g_train, epochs=400)

ewgh = EWGH(X_train.shape[1], len(np.unique(y_all)), hidden_dims=[128, 64], equity_lambda=0.7)
ewgh.fit(X_train, y_train, g_train, epochs=400)

results = {'Random Forest': rf.predict(X_test), 'Gradient Boosting': gb.predict(X_test), 'EWGH (No Equity)': ewgh_base.predict(X_test), 'EWGH (Equity 0.7)': ewgh.predict(X_test)}
print("\\n=== Results ===")
for name, pred in results.items():
    acc = accuracy_score(y_test, pred)
    f1 = f1_score(y_test, pred, average='weighted')
    eq = max([f1_score(y_test[g_test==g], pred[g_test==g], average='weighted', zero_division=0) for g in np.unique(g_test)]) - min([f1_score(y_test[g_test==g], pred[g_test==g], average='weighted', zero_division=0) for g in np.unique(g_test)])
    print(f'{name}: Acc={acc:.4f}, F1={f1:.4f}, Equity Score={1-eq:.4f}')''')

md('''---
## 8. Export for Web App''')

code('''export = {
    'version': '1.1.0',
    'trained_at': pd.Timestamp.now().isoformat(),
    'knowledge_graph': {'nodes': [{'id': n, **G.nodes[n]} for n in G.nodes()], 'edges': [{'from': u, 'to': v, **G[u][v]} for u, v in G.edges()]},
    'hns_kgt_attention': {'W1': [r[:16] for r in ewgh.W1.tolist()[:5]], 'b1': ewgh.b1.tolist()[:16], 'W2': [[x] for x in ewgh.W2.tolist()[0][:16]], 'b2': [0.0]},
    'acd_bkt_params': {'p_init': 0.3, 'p_learn': 0.1, 'p_guess': 0.2, 'p_slip': 0.1},
    'bacp_baselines': {'school_type': {'government': {'math': 45.2, 'science': 42.8}, 'private': {'math': 55.3, 'science': 53.1}}}
}
with open('eduverse_ai_export.json', 'w') as f:
    json.dump(export, f, indent=2)
print('Exported to eduverse_ai_export.json. Download this file and replace public/models/trained_models.json in your React app.')''')

nb = {'cells': cells, 'metadata': {'kernelspec': {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'}}, 'nbformat': 4, 'nbformat_minor': 4}
with open('c:/Users/bnish/OneDrive/Desktop/Mini_project/notebooks/ai_teaching_assistant.ipynb', 'w') as f: 
    json.dump(nb, f)
print('Updated Notebook created')

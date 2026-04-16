# ============================================================
# EduVerse AI Teaching Assistant — Part 1: Dataset & Exploration
# ============================================================
# Datasets: UCI Student Performance (Kaggle), xAPI Educational (Kaggle)
# ============================================================

# %% [markdown]
# # EduVerse AI Teaching Assistant — Research Notebook
# ## Novel Hybrid Algorithms for Adaptive Learning
#
# ### Datasets (from Kaggle):
# 1. **UCI Student Performance** — Real Portuguese school data (demographics, grades, study habits)
#    - Source: https://www.kaggle.com/datasets/uciml/student-performance-data-set
# 2. **xAPI Educational Learning Analytics** — Student behavioral features (raised hands, visited resources)
#    - Source: https://www.kaggle.com/datasets/aljarah/xAPI-Edu-Data
#
# ### Novel Algorithms (not existing in literature):
# 1. **HNS-KGT** — Hybrid Neuro-Symbolic Knowledge Graph Traversal
# 2. **ACD-BKT** — Adaptive Competence Decay with Bayesian Knowledge Tracing
# 3. **EWGH** — Equity-Weighted Gradient Harmonization for BACP

# %% Install & Import
import subprocess, sys
for pkg in ['kagglehub', 'networkx', 'seaborn', 'scikit-learn']:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', pkg])

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import networkx as nx
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, classification_report
import warnings; warnings.filterwarnings('ignore')
np.random.seed(42)
print("✅ All libraries loaded")

# %% [markdown]
# ---
# ## 1. Dataset Acquisition from Kaggle

# %% Fetch Dataset 1: UCI Student Performance
import kagglehub
path1 = kagglehub.dataset_download("uciml/student-performance-data-set")
print(f"Dataset 1 downloaded to: {path1}")

import os
for f in os.listdir(path1):
    print(f"  {f} ({os.path.getsize(os.path.join(path1, f))/1024:.1f} KB)")

# Load Math & Portuguese datasets
df_math = pd.read_csv(os.path.join(path1, "student-mat.csv"), sep=";")
df_por = pd.read_csv(os.path.join(path1, "student-por.csv"), sep=";")
df_math['subject'] = 'math'
df_por['subject'] = 'portuguese'
df_uci = pd.concat([df_math, df_por], ignore_index=True)

print(f"\nUCI Dataset: {df_uci.shape[0]} students, {df_uci.shape[1]} features")
print(f"Subjects: Math={len(df_math)}, Portuguese={len(df_por)}")
df_uci.head()

# %% Fetch Dataset 2: xAPI Educational Data
path2 = kagglehub.dataset_download("aljarah/xAPI-Edu-Data")
print(f"Dataset 2 downloaded to: {path2}")

csv_file = [f for f in os.listdir(path2) if f.endswith('.csv')][0]
df_xapi = pd.read_csv(os.path.join(path2, csv_file))
print(f"\nxAPI Dataset: {df_xapi.shape[0]} students, {df_xapi.shape[1]} features")
print(f"Topics: {df_xapi['Topic'].nunique()} unique")
print(f"Classes: {df_xapi['Class'].value_counts().to_dict()}")
df_xapi.head()

# %% [markdown]
# ---
# ## 2. Dataset Exploration & Preprocessing

# %% 2.1 UCI Dataset Exploration
fig, axes = plt.subplots(2, 3, figsize=(18, 10))
fig.suptitle('UCI Student Performance — Distribution Analysis', fontsize=16, fontweight='bold')

# Grade distributions
for i, col in enumerate(['G1', 'G2', 'G3']):
    ax = axes[0][i]
    ax.hist(df_uci[df_uci['subject']=='math'][col], bins=20, alpha=0.6, label='Math', color='#7C3AED')
    ax.hist(df_uci[df_uci['subject']=='portuguese'][col], bins=20, alpha=0.6, label='Portuguese', color='#06B6D4')
    ax.set_title(f'Grade {col}', fontweight='bold')
    ax.legend()

# Study time, failures, absences
for i, col in enumerate(['studytime', 'failures', 'absences']):
    ax = axes[1][i]
    ax.hist(df_uci[col], bins=20, color='#10B981', alpha=0.7, edgecolor='white')
    ax.set_title(col.title(), fontweight='bold')
    ax.axvline(df_uci[col].mean(), color='red', linestyle='--', label=f'Mean: {df_uci[col].mean():.1f}')
    ax.legend()

plt.tight_layout()
plt.savefig('uci_exploration.png', dpi=150, bbox_inches='tight')
plt.show()

# %% 2.2 xAPI Dataset Exploration
fig, axes = plt.subplots(2, 3, figsize=(18, 10))
fig.suptitle('xAPI Learning Analytics — Behavioral Features', fontsize=16, fontweight='bold')

behavioral = ['raisedhands', 'VisITedResources', 'AnnoijncementsView', 'Discussion']
for i, col in enumerate(behavioral):
    ax = axes[i//3][i%3]
    for cls in ['H', 'M', 'L']:
        subset = df_xapi[df_xapi['Class']==cls][col]
        ax.hist(subset, bins=20, alpha=0.5, label=f'Class {cls}')
    ax.set_title(col, fontweight='bold'); ax.legend()

# Topic distribution
axes[1][1].barh(df_xapi['Topic'].value_counts().index[:10], 
                df_xapi['Topic'].value_counts().values[:10], color='#7C3AED')
axes[1][1].set_title('Top 10 Topics', fontweight='bold')

# Gender distribution
df_xapi['gender'].value_counts().plot(kind='pie', ax=axes[1][2], colors=['#06B6D4','#F59E0B'], autopct='%1.1f%%')
axes[1][2].set_title('Gender Distribution', fontweight='bold')

plt.tight_layout()
plt.savefig('xapi_exploration.png', dpi=150, bbox_inches='tight')
plt.show()

# %% 2.3 Correlation Analysis
fig, axes = plt.subplots(1, 2, figsize=(18, 7))

# UCI correlations
numeric_uci = df_uci.select_dtypes(include=[np.number])
sns.heatmap(numeric_uci.corr(), annot=False, cmap='RdYlBu_r', ax=axes[0], vmin=-1, vmax=1)
axes[0].set_title('UCI — Feature Correlations', fontweight='bold', fontsize=12)

# xAPI correlations
numeric_xapi = df_xapi.select_dtypes(include=[np.number])
sns.heatmap(numeric_xapi.corr(), annot=True, fmt='.2f', cmap='RdYlBu_r', ax=axes[1], vmin=-1, vmax=1)
axes[1].set_title('xAPI — Feature Correlations', fontweight='bold', fontsize=12)

plt.tight_layout()
plt.savefig('correlations.png', dpi=150, bbox_inches='tight')
plt.show()

# %% 2.4 BACP Background Analysis
fig, axes = plt.subplots(1, 3, figsize=(18, 5))
fig.suptitle('Background-Adaptive Analysis (BACP Foundation)', fontsize=14, fontweight='bold')

# School type effect (UCI)
school_means = df_uci.groupby('school')['G3'].mean()
school_means.plot(kind='bar', ax=axes[0], color=['#7C3AED','#06B6D4'])
axes[0].set_title('Avg Grade by School Type'); axes[0].set_ylabel('G3 Score')

# Internet access effect (UCI)
internet_means = df_uci.groupby('internet')['G3'].mean()
internet_means.plot(kind='bar', ax=axes[1], color=['#EF4444','#10B981'])
axes[1].set_title('Avg Grade by Internet Access')

# Parent education effect (UCI)
for col in ['Medu', 'Fedu']:
    df_uci.groupby(col)['G3'].mean().plot(ax=axes[2], label=col, marker='o')
axes[2].set_title('Grade vs Parent Education'); axes[2].legend(); axes[2].set_xlabel('Education Level')

plt.tight_layout()
plt.savefig('bacp_analysis.png', dpi=150, bbox_inches='tight')
plt.show()

print("\n✅ Dataset exploration complete")
print(f"Total students: {len(df_uci) + len(df_xapi)}")
print(f"UCI features: {list(df_uci.columns)}")
print(f"xAPI features: {list(df_xapi.columns)}")

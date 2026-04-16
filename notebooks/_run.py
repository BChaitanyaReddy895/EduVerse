import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, f1_score
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import SMOTE
import warnings
warnings.filterwarnings('ignore')

# 1. Load data
try:
    df_xapi = pd.read_csv('xAPI-Edu-Data.csv')
except FileNotFoundError:
    import urllib.request
    print('Downloading dataset for local testing...')
    urllib.request.urlretrieve('https://raw.githubusercontent.com/raghadaloraini/xAPI-Edu-Data/master/xAPI-Edu-Data.csv', 'xAPI-Edu-Data.csv')
    df_xapi = pd.read_csv('xAPI-Edu-Data.csv')

# 2. Prepare data
le_class = LabelEncoder()
y_all = le_class.fit_transform(df_xapi['Class'])
groups_all = LabelEncoder().fit_transform(df_xapi['gender'].astype(str))

cat_cols = ['gender', 'NationalITy', 'PlaceofBirth', 'StageID', 'GradeID', 'SectionID', 'Topic', 'Semester', 'Relation', 'ParentAnsweringSurvey', 'ParentschoolSatisfaction', 'StudentAbsenceDays']
num_cols = ['raisedhands', 'VisITedResources', 'AnnoijncementsView', 'Discussion']

# One-Hot Encoding
df_encoded = pd.get_dummies(df_xapi[cat_cols], drop_first=True)
X_features = pd.concat([df_xapi[num_cols], df_encoded], axis=1)

X_scaled = StandardScaler().fit_transform(X_features.values.astype(float))

# Test size 0.1 to give more training data
X_train, X_test, y_train, y_test, g_train, g_test = train_test_split(X_scaled, y_all, groups_all, test_size=0.1, random_state=42, stratify=y_all)

# Data Augmentation (SMOTE + Noise) strictly on train set to prevent data leakage
smote = SMOTE(random_state=42)
# append group to resample together
X_g = np.hstack([X_train, g_train.reshape(-1, 1)])
X_res, y_res = smote.fit_resample(X_g, y_train)
X_train_res = X_res[:, :-1]
g_train_res = np.round(X_res[:, -1]).astype(int)

# 10x Noise augmentation on training
X_aug = []
y_aug = []
g_aug = []
for _ in range(15):
    noise = np.random.normal(0, 0.05, X_train_res.shape)
    X_aug.append(X_train_res + noise)
    y_aug.append(y_res)
    g_aug.append(g_train_res)

X_train = np.vstack(X_aug)
y_train = np.concatenate(y_aug)
g_train = np.concatenate(g_aug)

class EWGH:
    def __init__(self, n_features, n_classes, hidden_dims=[128, 64], equity_lambda=0.5):
        self.W1 = np.random.randn(n_features, hidden_dims[0]) * np.sqrt(2. / n_features)
        self.b1 = np.zeros(hidden_dims[0])
        self.W2 = np.random.randn(hidden_dims[0], hidden_dims[1]) * np.sqrt(2. / hidden_dims[0])
        self.b2 = np.zeros(hidden_dims[1])
        self.W3 = np.random.randn(hidden_dims[1], n_classes) * np.sqrt(2. / hidden_dims[1])
        self.b3 = np.zeros(n_classes)
        self.lr, self.equity_lambda = 0.015, equity_lambda
        self.beta1, self.beta2, self.eps, self.t = 0.9, 0.999, 1e-8, 0
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
        l2_lambda = 0.002
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
            if e > 0 and e % 100 == 0: self.lr *= 0.8
            self.train_step(X, y, groups)

print('Training Random Forest...')
rf = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)
print('Training EWGH...')
ewgh = EWGH(X_train.shape[1], len(np.unique(y_all)), hidden_dims=[128, 64], equity_lambda=0.7)
ewgh.fit(X_train, y_train, g_train, epochs=400)

results = {'Random Forest': rf.predict(X_test), 'EWGH (Equity 0.7)': ewgh.predict(X_test)}
for name, pred in results.items():
    acc = accuracy_score(y_test, pred)
    print(f'{name}: Acc={acc:.4f}')

import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, f1_score
from imblearn.over_sampling import SMOTE
import warnings
warnings.filterwarnings('ignore')

SEEDS = [11, 21, 42, 84, 101]


def resolve_dataset_path():
    local_notebooks = Path('xAPI-Edu-Data.csv')
    if local_notebooks.exists():
        return local_notebooks

    workspace_copy = Path(__file__).resolve().parents[1] / 'student+performance' / 'student' / 'xAPI-Edu-Data.csv'
    if workspace_copy.exists():
        return workspace_copy

    raise FileNotFoundError(
        "xAPI-Edu-Data.csv not found in notebooks/ or student+performance/student/."
    )


class EWGH:
    def __init__(self, n_features, n_classes, hidden_dims=[128, 64], equity_lambda=0.7):
        self.W1 = np.random.randn(n_features, hidden_dims[0]) * np.sqrt(2.0 / n_features)
        self.b1 = np.zeros(hidden_dims[0])
        self.W2 = np.random.randn(hidden_dims[0], hidden_dims[1]) * np.sqrt(2.0 / hidden_dims[0])
        self.b2 = np.zeros(hidden_dims[1])
        self.W3 = np.random.randn(hidden_dims[1], n_classes) * np.sqrt(2.0 / hidden_dims[1])
        self.b3 = np.zeros(n_classes)
        self.lr = 0.015
        self.equity_lambda = equity_lambda
        self.beta1, self.beta2, self.eps, self.t = 0.9, 0.999, 1e-8, 0
        self.m = [np.zeros_like(w) for w in [self.W1, self.b1, self.W2, self.b2, self.W3, self.b3]]
        self.v = [np.zeros_like(w) for w in [self.W1, self.b1, self.W2, self.b2, self.W3, self.b3]]

    @staticmethod
    def relu(x):
        return np.maximum(0, x)

    @staticmethod
    def relu_deriv(x):
        return (x > 0).astype(float)

    def forward(self, x):
        self.x = x
        self.z1 = x @ self.W1 + self.b1
        self.h1 = self.relu(self.z1)
        self.z2 = self.h1 @ self.W2 + self.b2
        self.h2 = self.relu(self.z2)
        self.z3 = self.h2 @ self.W3 + self.b3
        e = np.exp(self.z3 - np.max(self.z3, axis=1, keepdims=True))
        return e / e.sum(axis=1, keepdims=True)

    def compute_equity_weights(self, probs, y, groups):
        group_losses = {}
        for g in np.unique(groups):
            mask = (groups == g)
            if mask.sum() == 0:
                continue
            group_losses[g] = -np.mean(np.log(probs[np.arange(mask.sum()), y[mask]] + 1e-8))
        mean_loss = np.mean(list(group_losses.values())) if group_losses else 1.0
        eq_mult = {g: 1.0 + self.equity_lambda * (l / (mean_loss + 1e-8) - 1.0) for g, l in group_losses.items()}
        w = np.ones(len(y))
        for g in np.unique(groups):
            w[groups == g] = eq_mult.get(g, 1.0)
        return w

    def train_step(self, x, y, groups):
        probs = self.forward(x)
        d = probs.copy()
        d[np.arange(len(y)), y] -= 1
        d *= self.compute_equity_weights(probs, y, groups).reshape(-1, 1) / len(y)

        dW3 = self.h2.T @ d
        db3 = d.sum(axis=0)
        dh2 = d @ self.W3.T * self.relu_deriv(self.z2)
        dW2 = self.h1.T @ dh2
        db2 = dh2.sum(axis=0)
        dh1 = dh2 @ self.W2.T * self.relu_deriv(self.z1)
        dW1 = x.T @ dh1
        db1 = dh1.sum(axis=0)

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

    def fit(self, x, y, groups, epochs=400):
        for e in range(epochs):
            if e > 0 and e % 100 == 0:
                self.lr *= 0.8
            self.train_step(x, y, groups)

    def predict(self, x):
        return np.argmax(self.forward(x), axis=1)


def run_one(seed):
    np.random.seed(seed)
    df = pd.read_csv(resolve_dataset_path())

    y_all = LabelEncoder().fit_transform(df['Class'])
    groups_all = LabelEncoder().fit_transform(df['gender'].astype(str))

    cat_cols = [
        'gender', 'NationalITy', 'PlaceofBirth', 'StageID', 'GradeID', 'SectionID',
        'Topic', 'Semester', 'Relation', 'ParentAnsweringSurvey',
        'ParentschoolSatisfaction', 'StudentAbsenceDays'
    ]
    announcement_col = 'AnnouncementsView' if 'AnnouncementsView' in df.columns else 'AnnoijncementsView'
    num_cols = ['raisedhands', 'VisITedResources', announcement_col, 'Discussion']

    x_encoded = pd.get_dummies(df[cat_cols], drop_first=True)
    x_features = pd.concat([df[num_cols], x_encoded], axis=1)
    x_scaled = StandardScaler().fit_transform(x_features.values.astype(float))

    x_train, x_test, y_train, y_test, g_train, g_test = train_test_split(
        x_scaled, y_all, groups_all, test_size=0.1, random_state=seed, stratify=y_all
    )

    x_g = np.hstack([x_train, g_train.reshape(-1, 1)])
    x_res, y_res = SMOTE(random_state=seed).fit_resample(x_g, y_train)
    x_train_res = x_res[:, :-1]
    g_train_res = np.round(x_res[:, -1]).astype(int)

    x_aug, y_aug, g_aug = [], [], []
    for _ in range(15):
        noise = np.random.normal(0, 0.05, x_train_res.shape)
        x_aug.append(x_train_res + noise)
        y_aug.append(y_res)
        g_aug.append(g_train_res)

    x_train = np.vstack(x_aug)
    y_train = np.concatenate(y_aug)
    g_train = np.concatenate(g_aug)

    model = EWGH(x_train.shape[1], len(np.unique(y_all)), hidden_dims=[128, 64], equity_lambda=0.7)
    model.fit(x_train, y_train, g_train, epochs=400)
    pred = model.predict(x_test)

    acc = float(accuracy_score(y_test, pred))
    weighted_f1 = float(f1_score(y_test, pred, average='weighted'))

    group_f1 = []
    for g in np.unique(g_test):
        mask = (g_test == g)
        if mask.sum() == 0:
            continue
        group_f1.append(float(f1_score(y_test[mask], pred[mask], average='weighted', zero_division=0)))

    equity_gap = float(max(group_f1) - min(group_f1)) if group_f1 else 0.0
    equity_score = float(1.0 - equity_gap)

    return {
        'seed': seed,
        'accuracy': acc,
        'weighted_f1': weighted_f1,
        'equity_gap': equity_gap,
        'equity_score': equity_score
    }


def summarize(rows):
    metrics = ['accuracy', 'weighted_f1', 'equity_gap', 'equity_score']
    out = {}
    for m in metrics:
        vals = np.array([r[m] for r in rows], dtype=float)
        out[m] = {
            'mean': float(np.mean(vals)),
            'std': float(np.std(vals, ddof=1))
        }
    return out


def main():
    rows = []
    for seed in SEEDS:
        print(f'Running EWGH seed={seed}...')
        rows.append(run_one(seed))

    df = pd.DataFrame(rows)
    summary = summarize(rows)

    out_csv = 'EWGH_multiseed_results.csv'
    out_json = 'EWGH_multiseed_summary.json'

    df.to_csv(out_csv, index=False)
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump({'seeds': SEEDS, 'summary': summary}, f, indent=2)

    print('\nEWGH 5-seed run complete')
    print(df.to_string(index=False))
    print('\nMean ± Std:')
    for k, v in summary.items():
        print(f"- {k}: {v['mean']:.4f} ± {v['std']:.4f}")
    print(f"\nSaved: {out_csv}, {out_json}")


if __name__ == '__main__':
    main()

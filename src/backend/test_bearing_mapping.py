import os
import joblib
import numpy as np

pkl_path = os.path.join(os.path.dirname(__file__), 'ml', 'bearing.pkl')
data = joblib.load(pkl_path)
model = data['model']
features = list(data['feature_names'])

test_vibs = [0.08, 0.15, 0.5, 1.2, 2.5, 5.0]
X = np.zeros((len(test_vibs), len(features)))

for idx, vib in enumerate(test_vibs):
    for b in ['b1', 'b2', 'b3', 'b4']:
        if f'{b}_rms' in features: X[idx, features.index(f'{b}_rms')] = vib
        if f'{b}_std' in features: X[idx, features.index(f'{b}_std')] = vib * 0.95
        if f'{b}_peak' in features: X[idx, features.index(f'{b}_peak')] = vib * 1.4
        if f'{b}_p2p' in features: X[idx, features.index(f'{b}_p2p')] = vib * 2.5
        if f'{b}_kurtosis' in features: X[idx, features.index(f'{b}_kurtosis')] = 3.0 + vib * 1.5
    if 'max_rms' in features: X[idx, features.index('max_rms')] = vib
    if 'max_peak' in features: X[idx, features.index('max_peak')] = vib * 1.4
    if 'max_kurtosis' in features: X[idx, features.index('max_kurtosis')] = 3.0 + vib * 1.5

probs = model.predict_proba(X)[:, 1]
preds = model.predict(X)
for v, p, c in zip(test_vibs, probs, preds):
    print(f"Vibration RMS: {v:4.2f} g -> Class {c} -> Failure Prob: {p:.3f}")

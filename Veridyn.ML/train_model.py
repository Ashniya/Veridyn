import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, roc_auc_score

def generate_synthetic_dataset(num_samples=3000, random_state=42):
    np.random.seed(random_state)
    
    # Feature 1: progress_percentage (0 to 100)
    progress_percentage = np.random.uniform(0, 100, num_samples)
    
    # Feature 2: remaining_days (-15 to 45)
    remaining_days = np.random.uniform(-15, 45, num_samples)
    
    # Feature 3: estimated_hours (4 to 80)
    estimated_hours = np.random.uniform(4, 80, num_samples)
    
    # Feature 4: actual_hours (0 to 120)
    actual_hours = np.maximum(0, estimated_hours * np.random.uniform(0.1, 2.2, num_samples))
    
    # Feature 5: evidence_score (0 to 100)
    evidence_score = np.clip(progress_percentage * np.random.uniform(0.4, 1.3, num_samples), 0, 100)
    
    # Feature 6: subtask_completion_ratio (0.0 to 1.0)
    subtask_completion_ratio = np.clip((progress_percentage / 100.0) + np.random.normal(0, 0.15, num_samples), 0.0, 1.0)
    
    # Feature 7: github_commits (0 to 25)
    github_commits = np.random.poisson(lam=np.clip(evidence_score / 15.0, 0, 15), size=num_samples)
    
    # Feature 8: github_prs (0 to 5)
    github_prs = np.random.poisson(lam=0.8, size=num_samples)
    
    # Feature 9: priority (1=Low, 2=Med, 3=High, 4=Critical)
    priority = np.random.choice([1, 2, 3, 4], size=num_samples, p=[0.2, 0.4, 0.3, 0.1])
    
    # Feature 10: complexity (1 to 10)
    complexity = np.random.randint(1, 11, size=num_samples)
    
    # Feature 11: blocked_dependencies (0 to 4)
    blocked_dependencies = np.random.choice([0, 1, 2, 3], size=num_samples, p=[0.7, 0.2, 0.07, 0.03])
    
    # Target Formula: Delay Probability Calculation Ground Truth
    hours_overrun = np.maximum(0, (actual_hours - estimated_hours) / np.maximum(1, estimated_hours))
    schedule_deficit = np.where(remaining_days < 0, np.abs(remaining_days) * 2.5 + 40, np.maximum(0, (100 - progress_percentage) - (remaining_days * 3)))
    evidence_gap = np.maximum(0, progress_percentage - evidence_score)
    
    delay_prob_raw = (
        schedule_deficit * 0.35 +
        hours_overrun * 25.0 +
        (100 - evidence_score) * 0.20 +
        evidence_gap * 0.15 +
        blocked_dependencies * 14.0 +
        (priority - 1) * 3.0 +
        (complexity / 10.0) * 8.0 +
        np.random.normal(0, 4.0, num_samples)
    )
    
    delay_probability = np.clip(delay_prob_raw, 0.0, 100.0)
    is_delayed = (delay_probability >= 50.0).astype(int)
    
    df = pd.DataFrame({
        "progress_percentage": progress_percentage,
        "remaining_days": remaining_days,
        "estimated_hours": estimated_hours,
        "actual_hours": actual_hours,
        "evidence_score": evidence_score,
        "subtask_completion_ratio": subtask_completion_ratio,
        "github_commits": github_commits,
        "github_prs": github_prs,
        "priority": priority,
        "complexity": complexity,
        "blocked_dependencies": blocked_dependencies,
        "delay_probability": delay_probability,
        "is_delayed": is_delayed
    })
    return df

def main():
    print("Generating synthetic development progress & risk dataset...")
    df = generate_synthetic_dataset(num_samples=5000)
    df.to_csv("Veridyn.ML/training_dataset.csv", index=False)
    print(f"Dataset generated: {len(df)} samples saved to training_dataset.csv.")
    
    feature_cols = [
        "progress_percentage", "remaining_days", "estimated_hours", "actual_hours",
        "evidence_score", "subtask_completion_ratio", "github_commits", "github_prs",
        "priority", "complexity", "blocked_dependencies"
    ]
    
    X = df[feature_cols]
    y_reg = df["delay_probability"]
    y_clf = df["is_delayed"]
    
    X_train, X_test, y_train_reg, y_test_reg, y_train_clf, y_test_clf = train_test_split(
        X, y_reg, y_clf, test_size=0.2, random_state=42
    )
    
    print("Training RandomForestRegressor for delay probability...")
    reg_model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
    reg_model.fit(X_train, y_train_reg)
    
    y_pred_reg = reg_model.predict(X_test)
    mse = mean_squared_error(y_test_reg, y_pred_reg)
    r2 = r2_score(y_test_reg, y_pred_reg)
    print(f"Regressor Results -> MSE: {mse:.2f}, R2 Score: {r2:.4f}")
    
    print("Training GradientBoostingClassifier for binary delay risk...")
    clf_model = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
    clf_model.fit(X_train, y_train_clf)
    
    y_pred_prob = clf_model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test_clf, y_pred_prob)
    print(f"Classifier Results -> ROC-AUC: {auc:.4f}")
    
    model_artifact = {
        "regressor": reg_model,
        "classifier": clf_model,
        "features": feature_cols,
        "feature_importances": dict(zip(feature_cols, reg_model.feature_importances_))
    }
    
    with open("Veridyn.ML/trained_model.pkl", "wb") as f:
        pickle.dump(model_artifact, f)
    
    print("Model serialized to Veridyn.ML/trained_model.pkl successfully.")

if __name__ == "__main__":
    main()

import os
import pickle
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Veridyn ML Risk Prediction Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = os.path.join(os.path.dirname(__file__), "trained_model.pkl")
model_artifact = None

if os.path.exists(model_path):
    with open(model_path, "rb") as f:
        model_artifact = pickle.load(f)
        print("Trained ML model artifact loaded successfully.")

class TaskPredictionInput(BaseModel):
    progress_percentage: float = 0.0
    remaining_days: float = 7.0
    estimated_hours: float = 16.0
    actual_hours: float = 0.0
    evidence_score: float = 50.0
    subtask_completion_ratio: float = 0.0
    github_commits: int = 0
    github_prs: int = 0
    priority: int = 2
    complexity: int = 3
    blocked_dependencies: int = 0

class PredictionOutput(BaseModel):
    delay_probability: float
    risk_level: str
    top_contributing_features: list[str]
    model_version: str = "1.0.0-RandomForest"

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model_artifact is not None}

@app.post("/predict", response_model=PredictionOutput)
def predict_task_delay(task: TaskPredictionInput):
    if model_artifact is None:
        # Fallback heuristic
        prob = min(max(0.0, (100.0 - task.evidence_score) * 0.5 + (task.blocked_dependencies * 15.0)), 100.0)
    else:
        features = [
            task.progress_percentage,
            task.remaining_days,
            task.estimated_hours,
            task.actual_hours,
            task.evidence_score,
            task.subtask_completion_ratio,
            task.github_commits,
            task.github_prs,
            task.priority,
            task.complexity,
            task.blocked_dependencies
        ]
        reg = model_artifact["regressor"]
        prob = float(reg.predict([features])[0])
        prob = round(max(0.0, min(100.0, prob)), 1)
    
    risk_level = "Critical" if prob >= 70 else "High" if prob >= 45 else "Medium" if prob >= 20 else "Low"
    
    top_features = []
    if task.remaining_days <= 0:
        top_features.append("Overdue delivery schedule")
    if task.blocked_dependencies > 0:
        top_features.append(f"{task.blocked_dependencies} blocked dependency predecessor(s)")
    if task.evidence_score < 30:
        top_features.append("Low verified development activity")
    if task.actual_hours > task.estimated_hours:
        top_features.append("Hours budget exceeded")
    if task.progress_percentage > task.evidence_score + 25:
        top_features.append("Reported progress exceeds objective evidence")
        
    return PredictionOutput(
        delay_probability=prob,
        risk_level=risk_level,
        top_contributing_features=top_features
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

@echo off
echo Starting Veridyn Python ML Prediction Service...
cd %~dp0
python train_model.py
python ml_api.py
pause

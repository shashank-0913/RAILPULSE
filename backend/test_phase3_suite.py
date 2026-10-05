import os
import sys

sys.path.insert(0, os.path.abspath('.'))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print('--- TESTING PHASE 3 BACKEND SUITE ---')

# 1. Test /api/health
h_res = client.get('/api/health')
print('1. /api/health status:', h_res.status_code, 'model_loaded:', h_res.json().get('model_loaded'))
assert h_res.status_code == 200

# 2. Test /api/model/metrics
m_res = client.get('/api/model/metrics')
print('2. /api/model/metrics status:', m_res.status_code)
m_json = m_res.json()
assert m_res.status_code == 200
b_metrics = m_json.get('benchmark_metrics', {})
print('   Dataset label:', b_metrics.get('dataset_label'))
print('   Records (Train/Test/Total):', b_metrics.get('records_train'), b_metrics.get('records_test'), b_metrics.get('total_records'))
print('   Accuracy ±3m, ±5m, ±10m:', b_metrics.get('within_3_min_percent'), b_metrics.get('within_5_min_percent'), b_metrics.get('within_10_min_percent'))
print('   Residual 80% CI (p10, p90):', b_metrics.get('residual_p10_min'), b_metrics.get('residual_p90_min'))
print('   Top Feature Importances count:', len(m_json.get('feature_importances', [])))

# 3. Test /api/trains/12864/eta with SHAP TreeExplainer & 80% interval
eta_res = client.get('/api/trains/12864/eta')
print('3. /api/trains/12864/eta status:', eta_res.status_code)
eta_json = eta_res.json()
assert eta_res.status_code == 200
print('   Predicted delay:', eta_json.get('predicted_delay_minutes'), 'min')
print('   80% Prediction interval:', f"[{eta_json.get('eta_low')} - {eta_json.get('eta_high')}]")
shap_list = eta_json.get('shap_contributions', [])
print('   SHAP top contributions count:', len(shap_list))
for s in shap_list[:3]:
    print('     -', s.get('label'), ':', s.get('value_formatted'), '->', s.get('contribution_minutes'), 'min')

# 4. Test /api/passenger/trains/12864/journey with explainability
j_res = client.get('/api/passenger/trains/12864/journey')
print('4. /api/passenger/trains/12864/journey status:', j_res.status_code)
j_json = j_res.json()
assert j_res.status_code == 200
print('   Explainability summary:', j_json.get('explainability', {}).get('summary'))
print('   Primary reason:', j_json.get('explainability', {}).get('primary_reason'))

# 5. Test POST /api/arrivals to log actual arrival
arr_res = client.post('/api/arrivals', json={
    'train_number': '12864',
    'station_code': 'CHE',
    'station_name': 'Srikakulam Road',
    'actual_arrival': '18:25',
    'actual_delay_minutes': 13.0
})
print('5. POST /api/arrivals status:', arr_res.status_code, arr_res.json().get('message'))
assert arr_res.status_code == 200

# 6. Test GET /api/model/live-performance
live_res = client.get('/api/model/live-performance')
print('6. GET /api/model/live-performance status:', live_res.status_code)
live_json = live_res.json()
assert live_res.status_code == 200
print('   Live arrivals count:', live_json.get('total_recorded_arrivals'))
print('   Live MAE:', live_json.get('live_mae_minutes'), 'min')

# 7. Test POST /api/model/retrain
retrain_res = client.post('/api/model/retrain', json={'notes': 'Continuous learning automated verification'})
print('7. POST /api/model/retrain status:', retrain_res.status_code)
retrain_json = retrain_res.json()
assert retrain_res.status_code == 200
print('   Retrain message:', retrain_json.get('message'))
print('   Total records trained on:', retrain_json.get('total_records_trained_on'))
print('   Before MAE:', retrain_json.get('before', {}).get('mae'), '-> After MAE:', retrain_json.get('after', {}).get('mae'))

print('\nALL PHASE 3 BACKEND TESTS PASSED SUCCESSFULLY!')

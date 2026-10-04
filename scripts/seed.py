"""Seed reference for local integrations; the browser MVP loads the same scenario in demoData.ts."""
from pathlib import Path

SEED = {
    'incident': 'Cyclone Relief — District A',
    'camps': ['Camp Alpha', 'Camp Beta', 'Camp Gamma'],
    'hospitals': ['District General Hospital', 'Community Care Hospital'],
    'resources': {'food_kits': 500, 'medicine_packages': 200, 'ambulances': 5, 'hospital_beds': 40, 'emergency_fund': 250000},
}

if __name__ == '__main__':
    print('Seed ready:', SEED['incident'])
    print('Demo state lives in frontend/src/services/demoData.ts')

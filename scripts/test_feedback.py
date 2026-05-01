#!/usr/bin/env python3
"""Send sample feedback to /feedback endpoint to exercise refinement."""
import requests
import json

API='http://127.0.0.1:5000'
print('POST /feedback -> quadcopter correct')
r = requests.post(API + '/feedback', json={'concept':'quadcopter','was_correct':True,'cosine':0.26,'visual_quality':0.6}, timeout=10)
print(r.status_code, r.text)
print('POST /feedback -> ship incorrect')
r = requests.post(API + '/feedback', json={'concept':'ship','was_correct':False,'cosine':0.24,'visual_quality':0.4}, timeout=10)
print(r.status_code, r.text)

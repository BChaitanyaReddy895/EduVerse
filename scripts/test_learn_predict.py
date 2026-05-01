#!/usr/bin/env python3
"""Test client: POST synthetic images to /learn-concept then /predict

Generates two simple PNG images in-memory, encodes them in base64,
and exercises the server endpoints to verify adaptive learning and prediction.
"""
import sys
import io
import base64
import json
import time
import traceback

def ensure_packages():
    try:
        import requests
        from PIL import Image, ImageDraw
    except Exception:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "pillow"])
        time.sleep(1)

ensure_packages()
import requests
from PIL import Image, ImageDraw

def make_synthetic_image():
    img = Image.new('RGB', (256,256), color=(255,255,255))
    d = ImageDraw.Draw(img)
    d.rectangle([60,100,200,136], fill=(60,120,220))
    d.line((130,118,30,70), fill=(20,60,140), width=8)
    d.line((130,118,30,166), fill=(20,60,140), width=8)
    d.line((150,118,230,92), fill=(20,60,140), width=8)
    d.line((150,118,230,144), fill=(20,60,140), width=8)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('ascii')

def post_learn(api_base='http://127.0.0.1:5000'):
    images = [make_synthetic_image(), make_synthetic_image()]
    payload = {'concept': 'quadcopter', 'images': images}
    print('POST /learn-concept -> sending 2 images')
    r = requests.post(api_base + '/learn-concept', json=payload, timeout=30)
    print('status:', r.status_code)
    try:
        print(json.dumps(r.json(), indent=2))
    except Exception:
        print(r.text[:1000])
    return images[0]

def post_predict(img_b64, api_base='http://127.0.0.1:5000'):
    payload = {'image': img_b64, 'top_k': 5}
    print('\nPOST /predict')
    r = requests.post(api_base + '/predict', json=payload, timeout=30)
    print('status:', r.status_code)
    try:
        resp = r.json()
        # print concise fields
        out = {
            'concept': resp.get('concept'),
            'cosine_similarity': resp.get('cosine_similarity'),
            'deterministic_pass': resp.get('deterministic_pass'),
            'requires_concept_confirmation': resp.get('requires_concept_confirmation'),
        }
        print(json.dumps(out, indent=2))
    except Exception:
        print(r.text[:1000])

if __name__ == '__main__':
    try:
        img = post_learn()
        time.sleep(1)
        post_predict(img)
    except Exception:
        traceback.print_exc()
        sys.exit(2)

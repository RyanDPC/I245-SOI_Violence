# Système de Streaming Caméra RTSP

Ce package pytest fournit un système complet pour se connecter à un flux de caméra IP, récupérer le flux vidéo et le rediriger via RTSP sur l'adresse 192.168.1.43.

## Fonctionnalités

- **Connexion à une caméra IP** : Support des caméras RTSP/IP
- **Streaming RTSP** : Rediffusion du flux sur 192.168.1.43:8554
- **Tests complets** : Suite de tests pytest pour valider le fonctionnement
- **Gestion d'erreurs** : Gestion robuste des erreurs de connexion
- **Logging** : Système de logs détaillé

## Installation

```bash
cd pytest
pip install -r requirements.txt
```

## Utilisation

### Utilisation basique

```python
from camera_streamer import CameraStreamer

# Créer un streamer de caméra
streamer = CameraStreamer(
    camera_ip="192.168.1.100",  # IP de votre caméra
    camera_port=554,
    rtsp_ip="192.168.1.43",
    rtsp_port=8554
)

# Se connecter à la caméra
if streamer.connect_to_camera():
    print("Connexion réussie!")
    
    # Démarrer le streaming RTSP
    streamer.start_rtsp_streaming()
    
    # Le flux est maintenant disponible sur rtsp://192.168.1.43:8554/stream
```

### Utilisation avec le pont complet

```python
from rtsp_server import CameraRTSPBridge

# Créer le pont caméra-RTSP
bridge = CameraRTSPBridge(
    camera_ip="192.168.1.100",
    camera_port=554,
    rtsp_ip="192.168.1.43",
    rtsp_port=8554
)

# Démarrer le système
if bridge.start():
    print("Système démarré!")
    print(f"Flux disponible sur: {bridge.get_status()['rtsp_url']}")
```

### Utilisation en ligne de commande

```bash
python rtsp_server.py --camera-ip 192.168.1.100 --rtsp-ip 192.168.1.43
```

## Tests

### Exécuter tous les tests

```bash
pytest
```

### Exécuter les tests avec détails

```bash
pytest -v
```

### Exécuter seulement les tests d'intégration

```bash
pytest -m integration
```

### Exécuter les tests sans les tests lents

```bash
pytest -m "not slow"
```

## Structure du projet

```
pytest/
├── __init__.py              # Package principal
├── camera_streamer.py       # Gestion des flux de caméra
├── rtsp_server.py          # Serveur RTSP
├── test_camera_streamer.py # Tests pour camera_streamer
├── test_rtsp_server.py     # Tests pour rtsp_server
├── conftest.py             # Configuration pytest
├── requirements.txt        # Dépendances
└── README.md              # Documentation
```

## Configuration

### Variables d'environnement

- `CAMERA_IP` : Adresse IP de la caméra source
- `CAMERA_PORT` : Port de la caméra source (défaut: 554)
- `RTSP_IP` : Adresse IP pour le streaming RTSP (défaut: 192.168.1.43)
- `RTSP_PORT` : Port pour le streaming RTSP (défaut: 8554)

### Format des URLs

- **Caméra source** : `rtsp://192.168.1.100:554/stream`
- **Flux RTSP** : `rtsp://192.168.1.43:8554/stream`

## Dépendances

- `opencv-python` : Traitement vidéo
- `numpy` : Calculs numériques
- `pytest` : Framework de tests
- `aiortc` : Support WebRTC/RTSP
- `aiohttp` : Serveur HTTP asynchrone
- `ffmpeg-python` : Intégration FFmpeg

## Exemples d'utilisation

### Exemple 1 : Connexion simple

```python
import cv2
from camera_streamer import CameraStreamer

streamer = CameraStreamer("192.168.1.100")
if streamer.connect_to_camera():
    frame = streamer.get_frame()
    if frame is not None:
        cv2.imshow("Camera", frame)
        cv2.waitKey(0)
    streamer.disconnect_from_camera()
```

### Exemple 2 : Streaming continu

```python
from rtsp_server import CameraRTSPBridge
import time

bridge = CameraRTSPBridge("192.168.1.100")
if bridge.start():
    try:
        while True:
            status = bridge.get_status()
            print(f"Statut: {status}")
            time.sleep(5)
    except KeyboardInterrupt:
        print("Arrêt...")
    finally:
        bridge.stop()
```

## Dépannage

### Problèmes de connexion

1. Vérifiez que l'IP de la caméra est correcte
2. Vérifiez que le port 554 est ouvert
3. Vérifiez les credentials de la caméra si nécessaire

### Problèmes de streaming RTSP

1. Vérifiez que le port 8554 est disponible
2. Vérifiez que l'adresse 192.168.1.43 est accessible
3. Vérifiez les logs pour plus de détails

### Tests qui échouent

1. Vérifiez que toutes les dépendances sont installées
2. Vérifiez que les ports de test sont disponibles
3. Exécutez les tests avec `-v` pour plus de détails

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.






#!/usr/bin/env python3
"""
Script d'analyse vidéo pour surveillance intelligente
Utilise Hugging Face en local pour détecter violence, feu, etc.
"""

import cv2
import numpy as np
import mysql.connector
from mysql.connector import Error
import time
import threading
import logging
import os
import json
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
import requests
from PIL import Image
import torch
from transformers import ViTForImageClassification, ViTFeatureExtractor
import base64
from io import BytesIO

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('analyzer.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class VideoAnalyzer:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 3306)),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', 'root'),
            'database': os.getenv('DB_NAME', 'smartcam')
        }
        
        # Clé de chiffrement pour les identifiants (à générer une fois)
        self.fernet_key = os.getenv('FERNET_KEY', '').encode()
        if not self.fernet_key:
            self.fernet_key = Fernet.generate_key()
            logger.warning(f"Nouvelle clé générée: {self.fernet_key.decode()}")
        self.cipher = Fernet(self.fernet_key)
        
        # Modèles Hugging Face en local
        self.models = {}
        self.load_models()
        
        # Configuration des analyses
        self.analysis_config = {
            'violence': {'fps': 1.0, 'model': 'jaranohaal/vit-base-violence-detection'},
            'fire': {'fps': 0.1, 'model': 'fire-detection-model'},  # À remplacer par un vrai modèle
            'movement': {'fps': 5.0, 'model': 'opencv'}
        }
        
        # Détection de mouvement
        self.background_subtractors = {}
        
        # Threads actifs
        self.active_threads = {}
        self.running = True
        
    def load_models(self):
        """Charge les modèles Hugging Face en local"""
        try:
            logger.info("Chargement des modèles Hugging Face...")
            
            # Modèle de détection de violence
            self.models['violence'] = {
                'model': ViTForImageClassification.from_pretrained('jaranohaal/vit-base-violence-detection'),
                'feature_extractor': ViTFeatureExtractor.from_pretrained('jaranohaal/vit-base-violence-detection')
            }
            
            logger.info("Modèles chargés avec succès")
            
        except Exception as e:
            logger.error(f"Erreur lors du chargement des modèles: {e}")
            
    def decrypt_credentials(self, encrypted_data):
        """Déchiffre les identifiants de caméra"""
        try:
            return self.cipher.decrypt(encrypted_data.encode()).decode()
        except Exception as e:
            logger.error(f"Erreur de déchiffrement: {e}")
            return None
            
    def get_cameras(self):
        """Récupère la liste des caméras depuis la base de données"""
        try:
            connection = mysql.connector.connect(**self.db_config)
            cursor = connection.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT id, Ip_address as ip_address, Username as username, Password as password, 
                       Last_connexion as last_connection, Status as status, Model as model
                FROM camera 
                WHERE Status = 'active'
            """)
            
            cameras = cursor.fetchall()
            
            # Déchiffrer les identifiants
            for camera in cameras:
                camera['username'] = self.decrypt_credentials(camera['username'])
                camera['password'] = self.decrypt_credentials(camera['password'])
                
            cursor.close()
            connection.close()
            
            return cameras
            
        except Error as e:
            logger.error(f"Erreur base de données: {e}")
            return []
            
    def update_camera_status(self, camera_id, status, last_frame_time=None):
        """Met à jour le statut de la caméra"""
        try:
            connection = mysql.connector.connect(**self.db_config)
            cursor = connection.cursor()
            
            cursor.execute("""
                UPDATE camera 
                SET Status = %s, Last_connexion = %s
                WHERE id = %s
            """, (status, datetime.now(), camera_id))
                
            connection.commit()
            cursor.close()
            connection.close()
            
        except Error as e:
            logger.error(f"Erreur mise à jour statut caméra {camera_id}: {e}")
            
    def detect_movement(self, frame, camera_id):
        """Détecte le mouvement dans une frame"""
        if camera_id not in self.background_subtractors:
            self.background_subtractors[camera_id] = cv2.createBackgroundSubtractorMOG2()
            
        fg_mask = self.background_subtractors[camera_id].apply(frame)
        
        # Calculer le pourcentage de pixels en mouvement
        movement_percentage = np.sum(fg_mask > 0) / (fg_mask.shape[0] * fg_mask.shape[1])
        
        return movement_percentage > 0.01  # Seuil de 1%
        
    def analyze_violence(self, image):
        """Analyse la violence dans une image"""
        try:
            model_data = self.models['violence']
            
            # Préprocesser l'image
            inputs = model_data['feature_extractor'](images=image, return_tensors="pt")
            
            # Effectuer l'inférence
            with torch.no_grad():
                outputs = model_data['model'](**inputs)
                logits = outputs.logits
                probabilities = torch.nn.functional.softmax(logits, dim=-1)
                
            # Récupérer les résultats
            predicted_class_idx = logits.argmax(-1).item()
            predicted_class = model_data['model'].config.id2label[predicted_class_idx]
            confidence = probabilities[0][predicted_class_idx].item()
            
            return {
                'analysis_type': 'violence',
                'result': predicted_class,
                'confidence': confidence,
                'is_violent': predicted_class.lower() == 'violent',
                'details': {
                    'class': predicted_class,
                    'confidence': confidence
                }
            }
            
        except Exception as e:
            logger.error(f"Erreur analyse violence: {e}")
            return None
            
    def analyze_fire(self, image):
        """Analyse la présence de feu dans une image"""
        try:
            # Conversion en HSV pour détecter les couleurs de feu
            hsv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2HSV)
            
            # Masques pour les couleurs de feu (rouge, orange, jaune)
            lower_fire1 = np.array([0, 50, 50])
            upper_fire1 = np.array([10, 255, 255])
            lower_fire2 = np.array([170, 50, 50])
            upper_fire2 = np.array([180, 255, 255])
            
            mask1 = cv2.inRange(hsv, lower_fire1, upper_fire1)
            mask2 = cv2.inRange(hsv, lower_fire2, upper_fire2)
            fire_mask = mask1 + mask2
            
            # Calculer le pourcentage de pixels de feu
            fire_percentage = np.sum(fire_mask > 0) / (fire_mask.shape[0] * fire_mask.shape[1])
            
            # Seuil pour considérer qu'il y a du feu
            fire_threshold = 0.05  # 5% de l'image
            
            return {
                'analysis_type': 'fire',
                'result': 'fire' if fire_percentage > fire_threshold else 'no_fire',
                'confidence': fire_percentage,
                'is_fire': fire_percentage > fire_threshold,
                'details': {
                    'fire_percentage': fire_percentage,
                    'threshold': fire_threshold
                }
            }
            
        except Exception as e:
            logger.error(f"Erreur analyse feu: {e}")
            return None
            
    def save_analysis_result(self, camera_id, image_path, analysis_results):
        """Sauvegarde les résultats d'analyse en base"""
        try:
            connection = mysql.connector.connect(**self.db_config)
            cursor = connection.cursor()
            
            # Insérer l'image
            cursor.execute("""
                INSERT INTO image (Date, URI)
                VALUES (%s, %s)
            """, (datetime.now(), image_path))
            
            image_id = cursor.lastrowid
            
            # Insérer les résultats d'analyse
            for analysis in analysis_results:
                # Déterminer le niveau de résultat selon le schéma existant
                if analysis.get('is_violent', False) or analysis.get('is_fire', False):
                    if analysis['confidence'] > 0.8:
                        result_level = 'high'
                    elif analysis['confidence'] > 0.6:
                        result_level = 'medium'
                    else:
                        result_level = 'low'
                else:
                    result_level = 'nothing'
                
                cursor.execute("""
                    INSERT INTO resultat_analyse (fk_image, fk_analyse, result, human_verification, 
                                               is_resolved, date)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    image_id,
                    1,  # ID de l'analyse (à adapter selon vos besoins)
                    result_level,
                    False,  # Pas encore vérifié par un humain
                    False,  # Pas encore résolu
                    datetime.now()
                ))
                
            connection.commit()
            cursor.close()
            connection.close()
            
            logger.info(f"Analyse sauvegardée pour caméra {camera_id}")
            
        except Error as e:
            logger.error(f"Erreur sauvegarde analyse: {e}")
            
    def process_camera_stream(self, camera):
        """Traite le flux vidéo d'une caméra"""
        camera_id = camera['id']
        rtsp_url = f"rtsp://{camera['username']}:{camera['password']}@{camera['ip_address']}/live0"
        
        logger.info(f"Démarrage analyse caméra {camera_id}: {camera['name']}")
        
        cap = None
        last_frame_times = {}
        
        try:
            cap = cv2.VideoCapture(rtsp_url)
            
    if not cap.isOpened():
                logger.error(f"Impossible d'ouvrir le flux caméra {camera_id}")
                self.update_camera_status(camera_id, 'error')
        return

            self.update_camera_status(camera_id, 'connected')
            
            frame_count = 0
            
            while self.running:
                ret, frame = cap.read()
                
            if not ret:
                    logger.warning(f"Impossible de lire la frame caméra {camera_id}")
                time.sleep(1)
                continue

                frame_count += 1
                current_time = time.time()
                
                # Détection de mouvement
                movement_detected = self.detect_movement(frame, camera_id)
                
                # Analyses conditionnelles basées sur le mouvement
                analyses_to_perform = []
                
                if movement_detected:
                    # Si mouvement détecté, effectuer toutes les analyses
                    for analysis_type, config in self.analysis_config.items():
                        if analysis_type == 'movement':
                            continue

                        last_time = last_frame_times.get(analysis_type, 0)
                        if current_time - last_time >= (1.0 / config['fps']):
                            analyses_to_perform.append(analysis_type)
                            last_frame_times[analysis_type] = current_time
                else:
                    # Sinon, seulement analyse de feu (moins fréquente)
                    last_time = last_frame_times.get('fire', 0)
                    if current_time - last_time >= (1.0 / self.analysis_config['fire']['fps']):
                        analyses_to_perform.append('fire')
                        last_frame_times['fire'] = current_time
                
                # Effectuer les analyses
                if analyses_to_perform:
                    # Convertir frame OpenCV en PIL Image
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_image = Image.fromarray(rgb_frame)
                    
                    analysis_results = []
                    
                    for analysis_type in analyses_to_perform:
                        if analysis_type == 'violence':
                            result = self.analyze_violence(pil_image)
                        elif analysis_type == 'fire':
                            result = self.analyze_fire(pil_image)
                        else:
                            continue

                        if result:
                            analysis_results.append(result)
                    
                    # Sauvegarder si des analyses ont été effectuées
                    if analysis_results:
                        # Sauvegarder l'image
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        image_filename = f"camera_{camera_id}_{timestamp}.jpg"
                        image_path = f"/app/storage/images/{image_filename}"
                        
                        # Créer le dossier si nécessaire
                        os.makedirs(os.path.dirname(image_path), exist_ok=True)
                        
                        # Sauvegarder l'image
                        cv2.imwrite(image_path, frame)
                        
                        # Sauvegarder les résultats
                        self.save_analysis_result(camera_id, image_path, analysis_results)
                        
                        # Mettre à jour le temps de dernière frame
                        self.update_camera_status(camera_id, 'connected', current_time)
                
                # Pause pour éviter la surcharge
                time.sleep(0.1)
                
        except Exception as e:
            logger.error(f"Erreur traitement caméra {camera_id}: {e}")
            self.update_camera_status(camera_id, 'error')
            
        finally:
            if cap:
                cap.release()
            logger.info(f"Arrêt analyse caméra {camera_id}")
            
    def start_analysis(self):
        """Démarre l'analyse pour toutes les caméras"""
        logger.info("Démarrage du système d'analyse vidéo")
        
        while self.running:
            try:
                cameras = self.get_cameras()
                
                # Démarrer les threads pour les nouvelles caméras
                for camera in cameras:
                    camera_id = camera['id']
                    
                    if camera_id not in self.active_threads or not self.active_threads[camera_id].is_alive():
                        thread = threading.Thread(
                            target=self.process_camera_stream,
                            args=(camera,),
                            daemon=True
                        )
                        thread.start()
                        self.active_threads[camera_id] = thread
                        logger.info(f"Thread démarré pour caméra {camera_id}")
                
                # Nettoyer les threads morts
                dead_threads = [cam_id for cam_id, thread in self.active_threads.items() 
                               if not thread.is_alive()]
                for cam_id in dead_threads:
                    del self.active_threads[cam_id]
                
                time.sleep(10)  # Vérifier toutes les 10 secondes
                
            except Exception as e:
                logger.error(f"Erreur boucle principale: {e}")
                time.sleep(5)
                
    def stop(self):
        """Arrête le système d'analyse"""
        logger.info("Arrêt du système d'analyse")
        self.running = False
        
        # Attendre que tous les threads se terminent
        for thread in self.active_threads.values():
            thread.join(timeout=5)

def main():
    """Fonction principale"""
    analyzer = VideoAnalyzer()
    
    try:
        analyzer.start_analysis()
    except KeyboardInterrupt:
        logger.info("Arrêt demandé par l'utilisateur")
    finally:
        analyzer.stop()

if __name__ == "__main__":
    main()

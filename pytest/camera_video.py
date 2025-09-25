"""
Mini script pour récupérer la vidéo de la caméra RTSP
"""
import cv2
import time

def get_camera_video():
    """Récupère la vidéo de la caméra RTSP"""
    
    # URL RTSP de votre caméra
    rtsp_url = "rtsp://Test123:Test123@192.168.1.43/live0"
    
    print("🎥 Connexion à la caméra...")
    print(f"📍 URL: {rtsp_url}")
    print("-" * 50)
    
    # Connexion à la caméra avec paramètres optimisés pour FPS élevé
    cap = cv2.VideoCapture(rtsp_url)
    
    # Configuration pour FPS élevé
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Buffer minimal pour réduire la latence
    cap.set(cv2.CAP_PROP_FPS, 30)        # Forcer 30 FPS
    
    if not cap.isOpened():
        print("❌ ERREUR: Impossible de se connecter à la caméra")
        return False
    
    print("✅ Caméra connectée!")
    
    # Récupération des informations
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    print(f"📐 Résolution: {width}x{height}")
    print(f"🎬 FPS actuel: {fps}")
    print(f"🎯 FPS cible: 30-60 FPS")
    print("\n💡 Appuyez sur 'q' pour quitter, 's' pour sauvegarder une image")
    print("⚡ Optimisations FPS activées (buffer minimal)")
    print("-" * 50)
    
    frame_count = 0
    
    try:
        while True:
            # Lire une frame
            ret, frame = cap.read()
            
            if not ret:
                print("❌ Erreur de lecture de la frame")
                break
            
            if frame is None:
                print("❌ Frame vide reçue")
                break
            
            # Afficher la frame
            cv2.imshow("Camera Video", frame)
            
            # Gestion des touches
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                print("👋 Arrêt demandé par l'utilisateur")
                break
            elif key == ord('s'):
                # Sauvegarder une image
                filename = f"camera_frame_{frame_count}.jpg"
                cv2.imwrite(filename, frame)
                print(f"💾 Image sauvegardée: {filename}")
            
            frame_count += 1
            
            # Afficher le compteur de frames toutes les 30 frames
            if frame_count % 30 == 0:
                print(f"📊 Frames lues: {frame_count}")
    
    except KeyboardInterrupt:
        print("\n👋 Arrêt par Ctrl+C")
    
    finally:
        # Nettoyage
        cap.release()
        cv2.destroyAllWindows()
        print("✅ Connexion fermée")
    
    return True

def main():
    """Fonction principale"""
    print("🎥 Récupérateur de vidéo caméra RTSP")
    print("=" * 50)
    
    success = get_camera_video()
    
    if success:
        print("🎉 Script terminé avec succès!")
    else:
        print("💥 Erreur lors de l'exécution")

if __name__ == "__main__":
    main()

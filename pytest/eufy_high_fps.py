"""
Script optimisé pour caméra Eufy T8410X - FPS élevé (30-60 FPS)
"""
import cv2
import time

def test_eufy_fps():
    """Test différents FPS avec la caméra Eufy"""
    
    # URLs RTSP pour différents FPS (Eufy T8410X)
    urls_to_test = [
        # URL principale
        "rtsp://Test123:Test123@192.168.1.43/live0",
        # URLs alternatives pour FPS élevé
        "rtsp://Test123:Test123@192.168.1.43/live1",  # Stream secondaire
        "rtsp://Test123:Test123@192.168.1.43/live2",  # Stream tertiaire
        # URLs avec paramètres FPS
        "rtsp://Test123:Test123@192.168.1.43/live0?fps=30",
        "rtsp://Test123:Test123@192.168.1.43/live0?fps=60",
    ]
    
    print("🎥 Test FPS élevé - Caméra Eufy T8410X")
    print("=" * 60)
    
    for i, url in enumerate(urls_to_test, 1):
        print(f"\n🔍 Test {i}/5: {url}")
        print("-" * 40)
        
        cap = cv2.VideoCapture(url)
        
        # Configuration optimisée pour FPS élevé
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)      # Buffer minimal
        cap.set(cv2.CAP_PROP_FPS, 60)            # Forcer 60 FPS
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)  # Résolution HD
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        
        if cap.isOpened():
            # Test de connexion
            ret, frame = cap.read()
            if ret and frame is not None:
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = cap.get(cv2.CAP_PROP_FPS)
                
                print(f"✅ CONNECTÉ!")
                print(f"📐 Résolution: {width}x{height}")
                print(f"🎬 FPS: {fps}")
                
                # Test de performance FPS
                start_time = time.time()
                frame_count = 0
                
                print("⏱️  Test de performance (5 secondes)...")
                
                while time.time() - start_time < 5:  # Test de 5 secondes
                    ret, frame = cap.read()
                    if ret:
                        frame_count += 1
                        cv2.imshow(f"Eufy Test {i}", frame)
                        if cv2.waitKey(1) & 0xFF == ord('q'):
                            break
                    else:
                        break
                
                actual_fps = frame_count / 5
                print(f"📊 FPS réel mesuré: {actual_fps:.1f}")
                
                if actual_fps >= 25:
                    print("🎉 EXCELLENT! FPS élevé détecté")
                elif actual_fps >= 15:
                    print("✅ BON! FPS acceptable")
                else:
                    print("⚠️  FPS faible, essayez une autre URL")
                
                cv2.destroyAllWindows()
                
            else:
                print("❌ Pas de flux vidéo")
        else:
            print("❌ Connexion échouée")
        
        cap.release()
        time.sleep(1)  # Pause entre les tests
    
    print("\n" + "=" * 60)
    print("💡 Conseils pour FPS élevé avec Eufy T8410X:")
    print("1. Utilisez l'application Eufy pour configurer 60 FPS")
    print("2. Vérifiez la qualité du réseau WiFi")
    print("3. Testez différentes URLs RTSP")
    print("4. Réduisez la résolution si nécessaire")
    print("5. Utilisez un câble Ethernet si possible")

def stream_eufy_high_fps():
    """Stream continu optimisé pour FPS élevé"""
    
    url = "rtsp://Test123:Test123@192.168.1.43/live0"
    
    print("🎥 Stream Eufy T8410X - FPS élevé")
    print("=" * 50)
    
    cap = cv2.VideoCapture(url)
    
    # Configuration maximale pour FPS élevé
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    cap.set(cv2.CAP_PROP_FPS, 60)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    
    if not cap.isOpened():
        print("❌ Connexion échouée")
        return
    
    print("✅ Connexion établie")
    print("💡 Appuyez sur 'q' pour quitter")
    print("⚡ Mode FPS élevé activé")
    print("-" * 50)
    
    frame_count = 0
    start_time = time.time()
    
    try:
        while True:
            ret, frame = cap.read()
            
            if ret:
                # Redimensionner si nécessaire pour l'affichage
                display_frame = cv2.resize(frame, (1280, 720))
                cv2.imshow("Eufy T8410X - High FPS", display_frame)
                
                frame_count += 1
                
                # Afficher FPS toutes les 60 frames
                if frame_count % 60 == 0:
                    elapsed = time.time() - start_time
                    current_fps = frame_count / elapsed
                    print(f"📊 FPS actuel: {current_fps:.1f}")
                
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            else:
                print("❌ Erreur de lecture")
                break
                
    except KeyboardInterrupt:
        print("\n👋 Arrêt par Ctrl+C")
    
    finally:
        cap.release()
        cv2.destroyAllWindows()
        
        # Statistiques finales
        total_time = time.time() - start_time
        avg_fps = frame_count / total_time
        print(f"📈 Statistiques finales:")
        print(f"   Frames totales: {frame_count}")
        print(f"   Temps total: {total_time:.1f}s")
        print(f"   FPS moyen: {avg_fps:.1f}")

def main():
    """Menu principal"""
    print("🎥 Eufy T8410X - Optimisation FPS")
    print("=" * 40)
    print("1. Tester différents FPS")
    print("2. Stream continu FPS élevé")
    print("3. Quitter")
    
    choice = input("\nVotre choix (1-3): ").strip()
    
    if choice == "1":
        test_eufy_fps()
    elif choice == "2":
        stream_eufy_high_fps()
    elif choice == "3":
        print("👋 Au revoir!")
    else:
        print("❌ Choix invalide")

if __name__ == "__main__":
    main()

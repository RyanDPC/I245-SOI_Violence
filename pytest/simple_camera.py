"""
Script ultra-simple pour récupérer la vidéo de la caméra
"""
import cv2

# URL de votre caméra
CAMERA_URL = "rtsp://Test123:Test123@192.168.1.45/live0"

print("Connexion à la caméra...")
cap = cv2.VideoCapture(CAMERA_URL)

if cap.isOpened():
    print("✅ CONNECTÉ!")
    
    while True:
        ret, frame = cap.read()
        
        if ret:
            cv2.imshow("Camera", frame)
            
            # Appuyez sur 'q' pour quitter
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        else:
            print("❌ Erreur de lecture")
            break
else:
    print("❌ CONNEXION ÉCHOUÉE")

cap.release()
cv2.destroyAllWindows()





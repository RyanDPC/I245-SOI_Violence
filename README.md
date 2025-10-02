# SmartCam Image/Video Analyzer (starter)

Ce dépôt contient un script Python de démarrage (`analyzer.py`) pour:

- Lire les caméras depuis une base MariaDB
- Déchiffrer les identifiants caméra (Fernet)
- Ouvrir les flux (OpenCV)
- Détecter du mouvement, échantillonner des images par analyse
- Appeler l'API Hugging Face pour inférence
- Stocker les images et les résultats dans la base

# Installation rapide

1. Créez et activez un environnement Python 3.10+
2. Installez les dépendances :

```powershell
pip install -r requirements.txt
```

3. Copiez `.env.example` vers `.env` et remplissez les variables (FERNET_KEY, HF_TOKEN, DB_*)

Génération d'une Fernet key (exemple Python) :

```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
```

# Ajouter ou modifier une analyse (fonction d'analyse d'image)

## 1. Ajouter une nouvelle analyse dans la base de données

Insérez une nouvelle ligne dans la table `analyse` :

```sql
INSERT INTO analyse (Name, Type_analyse, Nbr_positive_necessary)
VALUES ('Fire', 'Pompier', 1);
-- Autres exemples :
-- ('Violence', 'Police', 2)
-- ('Accident', 'Ambulance', 1)
```

> **Remarque :**
> - `Name` doit être unique et correspondre à la clé utilisée dans la configuration (voir ci-dessous).
> - `Type_analyse` doit être l'une des valeurs de l'énum MariaDB : 'Police', 'Ambulance', 'Pompier'.
> - `Nbr_positive_necessary` : nombre de détections positives nécessaires pour valider l'alerte.

## 2. Lier l'analyse à un modèle Hugging Face

Dans votre fichier `.env`, configurez la variable `HF_MODELS` pour faire le lien entre le nom de l'analyse et le modèle Hugging Face à utiliser :

```env
HF_MODELS={"fire":"username/fire-detector","violence":"username/violence-detector"}
```

> - La clé (ex : "fire") doit être en minuscules et correspondre au champ `Name` de la table `analyse` (également en minuscules).
> - La valeur est l'identifiant du modèle Hugging Face à utiliser pour cette analyse.
> - Vous pouvez aussi ajouter une clé "fire:fps" pour ajuster la fréquence d'analyse (images/seconde) pour ce type d'analyse :

```env
HF_MODELS={"fire":"username/fire-detector","fire:fps":0.2}
```

## 3. Modifier ou supprimer une analyse

- Pour modifier une analyse, mettez à jour la ligne correspondante dans la table `analyse` (ex : changer le nom, le type ou le nombre de validations nécessaires).
- Pour supprimer une analyse, supprimez la ligne dans la table `analyse` :

```sql
DELETE FROM analyse WHERE Name = 'Fire';
```
- N'oubliez pas de mettre à jour la variable d'environnement `HF_MODELS` pour refléter vos changements.

## 4. Ajouter une nouvelle fonction d'analyse côté Hugging Face

- Créez ou entraînez un modèle sur Hugging Face pour la tâche souhaitée (ex : détection de feu, violence, accident, etc.).
- Ajoutez son identifiant dans la variable `HF_MODELS` comme ci-dessus.
- Le script Python appellera automatiquement le bon modèle pour chaque analyse configurée.

# Notes

- Le script est dynamique : il détecte automatiquement les nouvelles caméras (Status='active') et les nouvelles analyses ajoutées dans la base.
- Le parsing de la réponse HF est générique ; adaptez la fonction `classify_result_to_level` dans `analyzer.py` selon la structure exacte de réponse de votre modèle.
- La détection de mouvement est une version minimale (frame differencing). Pour la production, remplacez par un algorithme plus robuste.
- L'interface web Node.js et le script Python sont dockerisables (voir `docker-compose.yml`).

# Lancer l'application avec Docker

Tout est prêt pour un déploiement rapide avec Docker et docker-compose (MariaDB, backend Node.js, script Python).

## 1. Prérequis

- [Docker](https://www.docker.com/) et [docker-compose](https://docs.docker.com/compose/) installés.

## 2. Configuration

- Copiez `.env.example` vers `.env` et complétez les variables nécessaires (notamment FERNET_KEY, HF_TOKEN, HF_MODELS, etc.).
- Vérifiez ou adaptez les variables d'environnement dans `docker-compose.yml` si besoin (par défaut, la base a pour user `root` et password `root`).
- Placez vos modèles Hugging Face dans la variable `HF_MODELS` du `.env` ou directement dans `docker-compose.yml` (attention à la sécurité pour les tokens !).

## 3. Lancement

Dans le dossier du projet, exécutez :

```powershell
docker-compose up --build
```

Cela va :
- Démarrer un conteneur MariaDB (port 3306)
- Démarrer le backend Node.js (port 3000)
- Démarrer le script Python d'analyse (analyzer)
- Monter le dossier `./storage` pour stocker les images extraites

## 4. Accès à l'interface web

Ouvrez votre navigateur sur :

```
http://localhost:3000
```

Vous pouvez voir la liste des caméras, les alertes récentes, et valider manuellement les analyses.

## 5. Arrêt

Pour arrêter tous les services :

```powershell
docker-compose down
```

## 6. Points d'attention

- Les images sont stockées dans le dossier `./storage` du projet (monté dans le conteneur analyzer).
- Les variables sensibles (HF_TOKEN, FERNET_KEY) doivent être gérées avec précaution (ne pas commiter en clair !).
- Pour initialiser la base avec vos propres caméras/analyses, modifiez la base MariaDB (voir section précédente).

Fichier principal : `analyzer.py`
# SmartCam-ImagesAnalysis
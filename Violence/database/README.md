# Schéma de Base de Données - Système de Surveillance Violence

## Tables MariaDB

### CAMERA Table:
- id [INT AUTO_INCREMENT PRIMARY KEY]
- name [TINYTEXT]
- lieu [TINYTEXT]
- status [ENUM('active', 'inactive', 'maintenance', 'error')]
- ip_adress [TINYTEXT]
- model [TINYTEXT]
- username [TINYTEXT]
- password [TINYTEXT]
- last_connexion [DATE TIME]

### POSITION Table:
- id [INT AUTO_INCREMENT PRIMARY KEY]
- label [TINYTEXT]
- latitude [DECIMAL(10, 8)]
- longitude [DECIMAL(11, 8)]

### IMAGE Table:
- id [INT AUTO_INCREMENT PRIMARY KEY]
- date [DATE TIME]
- uri [TINYTEXT]
- fk_camera [INTEGER] [1,N]

### ANALYSE Table:
- id [INT AUTO_INCREMENT PRIMARY KEY]
- name [TINYTEXT]
- type_analyse [ENUM('police', 'ambulance', 'pompier')]
- nbr_positive_necessary [TINYINT]

### RESULTAT_ANALYSE Table:
- id [INT AUTO_INCREMENT PRIMARY KEY]
- fk_image [INTEGER]   [1,N]
- fk_analyse [INTEGER] [1,N]
- result [ENUM('low', 'medium', 'high', 'nothing')]
- date [DATE TIME]
- human_verification [BOOLEAN]
- is_resolved [BOOLEAN]

## Relations:
- CAMERA (N) ←→ (1) IMAGE
- CAMERA (1) ←→ (1) POSITION 
- IMAGE (N) ←→ (1) RESULTAT_ANALYSE
- RESULTAT_ANALYSE (1) ←→ (N) ANALYSE

## INDEX:

### ANALYSE Table:
- INDEX idx_analyse_id ON id

### CAMERA Table:
- INDEX idx_camera_id ON id

### IMAGE Table:
- INDEX idx_image_date ON date
- INDEX idx_image_id ON id
- INDEX idx_image_date_id ON (date, id)

### RESULTAT_ANALYSE Table:
- INDEX idx_resultat_analyse_fk_image ON fk_image

### POSITION Table:
- INDEX idx_position_latitude_longitude ON (latitude, longitude)
- INDEX idx_position_id ON id

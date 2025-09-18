# Schéma de Base de Données - Système de Surveillance Violence

## Tables MariaDB

### CAMERA Table:
- id [INT AUTO_INCREMENT PRIMARY KEY]
- name [VARCHAR(255)]
- lieu [TINYTEXT]
- status [ENUM('active', 'inactive', 'maintenance', 'error')]
- ip_adress [VARCHAR(45)]
- district [VARCHAR(100)]
- city [VARCHAR(100)]
- latitude [DECIMAL(10, 8)]
- longitude [DECIMAL(11, 8)]
- model [VARCHAR(100)]
- resolution [VARCHAR(20)]
- fps [INT]
- night_vision [BOOLEAN]
- zoom_level [INT]
- angle_horizontal [INT]
- angle_vertical [INT]
- storage_days [INT]
- last_maintenance [DATE]
- next_maintenance [DATE]

### ACTION Table:
- id [INT AUTO_INCREMENT PRIMARY KEY]
- name [VARCHAR(255)]
- confiance [INT]
- image [VARCHAR(500)]
- description [VARCHAR(500)]
- timestamp [TIMESTAMP]
- violence [ENUM('critical', 'high', 'medium', 'low')]
- camera_id [INT]
- image_width [INT]
- image_height [INT]
- file_size [BIGINT]
- file_format [VARCHAR(10)]
- detection_zones [JSON]
- ai_model_version [VARCHAR(50)]
- processing_time [DECIMAL(8,3)]
- false_positive [BOOLEAN]
- confirmed [BOOLEAN]
- confirmed_at [TIMESTAMP]
- user_comments [TEXT]
- severity_score [DECIMAL(5,2)]

### ALERT Table:
- id [INT AUTO_INCREMENT PRIMARY KEY]
- alert_type [ENUM('camera_offline', 'high_violence_rate', 'storage_full', 'system_error', 'maintenance_due')]
- severity [ENUM('critical', 'high', 'medium', 'low')]
- title [VARCHAR(255)]
- message [TEXT]
- camera_id [INT]
- action_id [INT]
- is_resolved [BOOLEAN]
- resolved_at [TIMESTAMP]

### SYSTEM_CONFIG Table:
- id [INT AUTO_INCREMENT PRIMARY KEY]
- config_key [VARCHAR(100)]
- config_value [TEXT]
- description [TEXT]
- is_encrypted [BOOLEAN]

## Relations:
- CAMERA (1) ←→ (N) ACTION
- CAMERA (1) ←→ (N) ALERT
- ACTION (1) ←→ (N) ALERT

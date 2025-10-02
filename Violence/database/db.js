const mysql = require('mysql2/promise');

// Configuration de la base de données MariaDB
const DB_CONFIG = {
    host: 'localhost',
    port: 3306,
    database: 'violence_surveillance',
    user: 'violence_user',
    password: 'violence_password',
    charset: 'utf8mb4',
    timezone: '+00:00'
};

class Database {
    constructor() {
        this.connection = null;
        this.isConnected = false;
    }

    /**
     * Établit la connexion à la base de données
     */
    async connect() {
        try {
            this.connection = await mysql.createConnection(DB_CONFIG);
            this.isConnected = true;
            console.log('✅ Connexion à la base de données MariaDB établie');
            return { success: true, message: 'Connexion établie' };
        } catch (error) {
            console.error('❌ Erreur de connexion à la base de données:', error.message);
            this.isConnected = false;
            return { success: false, error: error.message };
        }
    }

    /**
     * Ferme la connexion à la base de données
     */
    async disconnect() {
        try {
            if (this.connection) {
                await this.connection.end();
                this.isConnected = false;
                console.log('✅ Connexion à la base de données fermée');
                return { success: true, message: 'Connexion fermée' };
            }
        } catch (error) {
            console.error('❌ Erreur lors de la fermeture:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Exécute une requête SQL
     */
    async query(sql, params = []) {
        if (!this.isConnected) {
            throw new Error('Base de données non connectée');
        }

        try {
            const [rows] = await this.connection.execute(sql, params);
            return {
                success: true,
                data: rows,
                rowCount: rows.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Erreur SQL:', error.message);
            return {
                success: false,
                error: error.message,
                sql: sql,
                params: params
            };
        }
    }

    /**
     * Initialise la base de données avec toutes les tables et index
     */
    async initializeDatabase() {
        try {
            console.log('🚀 Initialisation de la base de données...');

            // Création des tables
            await this.createTables();
            
            // Création des index
            await this.createIndexes();
            
            // Insertion des données de test (optionnel)
            await this.insertTestData();

            console.log('✅ Base de données initialisée avec succès');
            return { success: true, message: 'Base de données initialisée' };
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Crée toutes les tables selon le schéma
     */
    async createTables() {
        const tables = [
            // Table CAMERA
            `CREATE TABLE IF NOT EXISTS camera (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name TINYTEXT,
                lieu TINYTEXT,
                status ENUM('active', 'inactive', 'maintenance', 'error') DEFAULT 'inactive',
                ip_adress TINYTEXT,
                model TINYTEXT,
                username TINYTEXT,
                password TINYTEXT,
                last_connexion DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,

            // Table POSITION
            `CREATE TABLE IF NOT EXISTS position (
                id INT AUTO_INCREMENT PRIMARY KEY,
                label TINYTEXT,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,

            // Table IMAGE
            `CREATE TABLE IF NOT EXISTS image (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATETIME,
                uri TINYTEXT,
                fk_camera INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (fk_camera) REFERENCES camera(id) ON DELETE CASCADE
            )`,

            // Table ANALYSE
            `CREATE TABLE IF NOT EXISTS analyse (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name TINYTEXT,
                type_analyse ENUM('police', 'ambulance', 'pompier'),
                nbr_positive_necessary TINYINT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,

            // Table RESULTAT_ANALYSE
            `CREATE TABLE IF NOT EXISTS resultat_analyse (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fk_image INT,
                fk_analyse INT,
                result ENUM('low', 'medium', 'high', 'nothing') DEFAULT 'nothing',
                date DATETIME,
                human_verification BOOLEAN DEFAULT FALSE,
                is_resolved BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (fk_image) REFERENCES image(id) ON DELETE CASCADE,
                FOREIGN KEY (fk_analyse) REFERENCES analyse(id) ON DELETE CASCADE
            )`
        ];

        for (const table of tables) {
            await this.query(table);
        }
    }

    /**
     * Crée tous les index pour optimiser les performances
     */
    async createIndexes() {
        const indexes = [
            // Index ANALYSE
            'CREATE INDEX IF NOT EXISTS idx_analyse_id ON analyse(id)',
            
            // Index CAMERA
            'CREATE INDEX IF NOT EXISTS idx_camera_id ON camera(id)',
            
            // Index IMAGE
            'CREATE INDEX IF NOT EXISTS idx_image_date ON image(date)',
            'CREATE INDEX IF NOT EXISTS idx_image_id ON image(id)',
            'CREATE INDEX IF NOT EXISTS idx_image_date_id ON image(date, id)',
            
            // Index RESULTAT_ANALYSE
            'CREATE INDEX IF NOT EXISTS idx_resultat_analyse_fk_image ON resultat_analyse(fk_image)',
            
            // Index POSITION
            'CREATE INDEX IF NOT EXISTS idx_position_latitude_longitude ON position(latitude, longitude)',
            'CREATE INDEX IF NOT EXISTS idx_position_id ON position(id)'
        ];

        for (const index of indexes) {
            await this.query(index);
        }
    }

    /**
     * Insère des données de test
     */
    async insertTestData() {
        // Données de test pour les caméras
        const cameras = [
            ['Caméra Entrée', 'Entrée principale', 'active', '192.168.1.100', 'EufyCam E330', 'admin', 'password123', new Date()],
            ['Caméra Parking', 'Parking sous-sol', 'active', '192.168.1.101', 'EufyCam E330', 'admin', 'password123', new Date()],
            ['Caméra Réception', 'Zone réception', 'inactive', '192.168.1.102', 'EufyCam E330', 'admin', 'password123', null]
        ];

        for (const camera of cameras) {
            await this.query(
                'INSERT IGNORE INTO camera (name, lieu, status, ip_adress, model, username, password, last_connexion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                camera
            );
        }

        // Données de test pour les positions
        const positions = [
            ['Entrée Principale', 48.8566, 2.3522],
            ['Parking Sous-sol', 48.8567, 2.3523],
            ['Zone Réception', 48.8565, 2.3521]
        ];

        for (const position of positions) {
            await this.query(
                'INSERT IGNORE INTO position (label, latitude, longitude) VALUES (?, ?, ?)',
                position
            );
        }

        // Données de test pour les analyses
        const analyses = [
            ['Détection Violence', 'police', 3],
            ['Détection Urgence Médicale', 'ambulance', 2],
            ['Détection Incendie', 'pompier', 1]
        ];

        for (const analyse of analyses) {
            await this.query(
                'INSERT IGNORE INTO analyse (name, type_analyse, nbr_positive_necessary) VALUES (?, ?, ?)',
                analyse
            );
        }
    }

    /**
     * Méthodes CRUD pour chaque table
     */

    // CAMERA CRUD
    async getAllCameras() {
        return await this.query('SELECT * FROM camera ORDER BY created_at DESC');
    }

    async getCameraById(id) {
        return await this.query('SELECT * FROM camera WHERE id = ?', [id]);
    }

    async createCamera(cameraData) {
        const { name, lieu, status, ip_adress, model, username, password } = cameraData;
        return await this.query(
            'INSERT INTO camera (name, lieu, status, ip_adress, model, username, password, last_connexion) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [name, lieu, status, ip_adress, model, username, password]
        );
    }

    async updateCamera(id, cameraData) {
        const { name, lieu, status, ip_adress, model, username, password } = cameraData;
        return await this.query(
            'UPDATE camera SET name = ?, lieu = ?, status = ?, ip_adress = ?, model = ?, username = ?, password = ?, updated_at = NOW() WHERE id = ?',
            [name, lieu, status, ip_adress, model, username, password, id]
        );
    }

    async deleteCamera(id) {
        return await this.query('DELETE FROM camera WHERE id = ?', [id]);
    }

    // IMAGE CRUD
    async getAllImages(limit = 100, offset = 0) {
        return await this.query(
            'SELECT * FROM image ORDER BY date DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
    }

    async getImagesByCamera(cameraId, limit = 100) {
        return await this.query(
            'SELECT * FROM image WHERE fk_camera = ? ORDER BY date DESC LIMIT ?',
            [cameraId, limit]
        );
    }

    async createImage(imageData) {
        const { date, uri, fk_camera } = imageData;
        return await this.query(
            'INSERT INTO image (date, uri, fk_camera) VALUES (?, ?, ?)',
            [date, uri, fk_camera]
        );
    }

    // RESULTAT_ANALYSE CRUD
    async getAllResults(limit = 100, offset = 0) {
        return await this.query(`
            SELECT ra.*, i.uri as image_uri, i.date as image_date, a.name as analyse_name, a.type_analyse
            FROM resultat_analyse ra
            LEFT JOIN image i ON ra.fk_image = i.id
            LEFT JOIN analyse a ON ra.fk_analyse = a.id
            ORDER BY ra.date DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);
    }

    async createResult(resultData) {
        const { fk_image, fk_analyse, result, date, human_verification, is_resolved } = resultData;
        return await this.query(
            'INSERT INTO resultat_analyse (fk_image, fk_analyse, result, date, human_verification, is_resolved) VALUES (?, ?, ?, ?, ?, ?)',
            [fk_image, fk_analyse, result, date, human_verification, is_resolved]
        );
    }

    async updateResult(id, resultData) {
        const { result, human_verification, is_resolved } = resultData;
        return await this.query(
            'UPDATE resultat_analyse SET result = ?, human_verification = ?, is_resolved = ?, updated_at = NOW() WHERE id = ?',
            [result, human_verification, is_resolved, id]
        );
    }

    // STATISTIQUES
    async getViolenceStats() {
        return await this.query(`
            SELECT 
                a.type_analyse,
                ra.result,
                COUNT(*) as count,
                DATE(ra.date) as date
            FROM resultat_analyse ra
            JOIN analyse a ON ra.fk_analyse = a.id
            WHERE ra.date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY a.type_analyse, ra.result, DATE(ra.date)
            ORDER BY date DESC, count DESC
        `);
    }

    async getCameraStats() {
        return await this.query(`
            SELECT 
                c.id,
                c.name,
                c.status,
                COUNT(i.id) as image_count,
                COUNT(ra.id) as analysis_count,
                MAX(i.date) as last_image_date
            FROM camera c
            LEFT JOIN image i ON c.id = i.fk_camera
            LEFT JOIN resultat_analyse ra ON i.id = ra.fk_image
            GROUP BY c.id, c.name, c.status
            ORDER BY c.name
        `);
    }
}

// Instance singleton
const db = new Database();

module.exports = {
    Database,
    db,
    DB_CONFIG
};



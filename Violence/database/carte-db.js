// Gestionnaire des données de carte pour la page carte.html
class MapDataDB {
    static async getMapAlerts(filters = {}) {
        let query = `
            SELECT 
                vl.id, vl.camera_id, vl.violence_type, vl.location, vl.severity,
                vl.confidence, vl.confirmed, vl.false_positive, vl.timestamp,
                c.name as camera_name, c.district, c.city, c.latitude, c.longitude,
                c.status as camera_status
            FROM violence_logs vl
            JOIN cameras c ON vl.camera_id = c.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        // Filtres par gravité
        if (filters.severity && filters.severity.length > 0) {
            const severityPlaceholders = filters.severity.map(() => `$${paramIndex++}`).join(',');
            query += ` AND vl.severity IN (${severityPlaceholders})`;
            params.push(...filters.severity);
        }
        
        // Filtres par type de violence
        if (filters.violenceType && filters.violenceType.length > 0) {
            const typePlaceholders = filters.violenceType.map(() => `$${paramIndex++}`).join(',');
            query += ` AND vl.violence_type IN (${typePlaceholders})`;
            params.push(...filters.violenceType);
        }
        
        // Filtres par zone
        if (filters.zones && filters.zones.length > 0) {
            const zonePlaceholders = filters.zones.map(() => `$${paramIndex++}`).join(',');
            query += ` AND c.district IN (${zonePlaceholders})`;
            params.push(...filters.zones);
        }
        
        // Filtres par date
        if (filters.startDate) {
            query += ` AND vl.timestamp >= $${paramIndex++}`;
            params.push(filters.startDate);
        }
        
        if (filters.endDate) {
            query += ` AND vl.timestamp <= $${paramIndex++}`;
            params.push(filters.endDate);
        }
        
        // Filtres par statut de confirmation
        if (filters.confirmed !== undefined) {
            query += ` AND vl.confirmed = $${paramIndex++}`;
            params.push(filters.confirmed);
        }
        
        query += `
            ORDER BY vl.timestamp DESC
            LIMIT $${paramIndex}
        `;
        params.push(filters.limit || 100);
        
        try {
            const result = await DatabaseManager.executeQuery(query, params);
            
            return {
                success: true,
                data: result.rows,
                count: result.rowCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: [],
                count: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    static async getMapCameras(filters = {}) {
        let query = `
            SELECT 
                c.id, c.name, c.location, c.status, c.district, c.city,
                c.latitude, c.longitude, c.priority, c.ip_address,
                COUNT(vl.id) as incident_count,
                MAX(vl.timestamp) as last_incident,
                AVG(vl.confidence) as avg_confidence
            FROM cameras c
            LEFT JOIN violence_logs vl ON c.id = vl.camera_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        // Filtres par statut
        if (filters.status && filters.status.length > 0) {
            const statusPlaceholders = filters.status.map(() => `$${paramIndex++}`).join(',');
            query += ` AND c.status IN (${statusPlaceholders})`;
            params.push(...filters.status);
        }
        
        // Filtres par zone
        if (filters.zones && filters.zones.length > 0) {
            const zonePlaceholders = filters.zones.map(() => `$${paramIndex++}`).join(',');
            query += ` AND c.district IN (${zonePlaceholders})`;
            params.push(...filters.zones);
        }
        
        // Filtres par priorité
        if (filters.priority && filters.priority.length > 0) {
            const priorityPlaceholders = filters.priority.map(() => `$${paramIndex++}`).join(',');
            query += ` AND c.priority IN (${priorityPlaceholders})`;
            params.push(...filters.priority);
        }
        
        query += `
            GROUP BY c.id, c.name, c.location, c.status, c.district, c.city,
                     c.latitude, c.longitude, c.priority, c.ip_address
            ORDER BY c.priority DESC, incident_count DESC
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, params);
            
            return {
                success: true,
                data: result.rows,
                count: result.rowCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: [],
                count: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    static async getHeatmapData(filters = {}) {
        let query = `
            SELECT 
                c.latitude, c.longitude, c.district,
                COUNT(vl.id) as incident_count,
                AVG(vl.confidence) as avg_confidence,
                COUNT(CASE WHEN vl.severity = 'critical' THEN 1 END) as critical_count,
                COUNT(CASE WHEN vl.severity = 'high' THEN 1 END) as high_count,
                COUNT(CASE WHEN vl.severity = 'medium' THEN 1 END) as medium_count,
                COUNT(CASE WHEN vl.severity = 'low' THEN 1 END) as low_count
            FROM cameras c
            LEFT JOIN violence_logs vl ON c.id = vl.camera_id
            WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
        `;
        
        const params = [];
        let paramIndex = 1;
        
        // Filtres par zone
        if (filters.zones && filters.zones.length > 0) {
            const zonePlaceholders = filters.zones.map(() => `$${paramIndex++}`).join(',');
            query += ` AND c.district IN (${zonePlaceholders})`;
            params.push(...filters.zones);
        }
        
        // Filtres par date
        if (filters.startDate) {
            query += ` AND vl.timestamp >= $${paramIndex++}`;
            params.push(filters.startDate);
        }
        
        if (filters.endDate) {
            query += ` AND vl.timestamp <= $${paramIndex++}`;
            params.push(filters.endDate);
        }
        
        query += `
            GROUP BY c.latitude, c.longitude, c.district
            ORDER BY incident_count DESC
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, params);
            
            return {
                success: true,
                data: result.rows,
                count: result.rowCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: [],
                count: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    static async getMapStatistics(filters = {}) {
        let query = `
            SELECT 
                COUNT(DISTINCT c.id) as total_cameras,
                COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_cameras,
                COUNT(DISTINCT CASE WHEN c.status = 'error' THEN c.id END) as error_cameras,
                COUNT(vl.id) as total_incidents,
                COUNT(CASE WHEN vl.severity = 'critical' THEN 1 END) as critical_incidents,
                COUNT(CASE WHEN vl.severity = 'high' THEN 1 END) as high_incidents,
                COUNT(CASE WHEN vl.severity = 'medium' THEN 1 END) as medium_incidents,
                COUNT(CASE WHEN vl.severity = 'low' THEN 1 END) as low_incidents,
                COUNT(CASE WHEN vl.confirmed = true THEN 1 END) as confirmed_incidents,
                COUNT(CASE WHEN vl.false_positive = true THEN 1 END) as false_positives,
                AVG(vl.confidence) as avg_confidence,
                COUNT(CASE WHEN vl.timestamp > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_incidents
            FROM cameras c
            LEFT JOIN violence_logs vl ON c.id = vl.camera_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        // Filtres par zone
        if (filters.zones && filters.zones.length > 0) {
            const zonePlaceholders = filters.zones.map(() => `$${paramIndex++}`).join(',');
            query += ` AND c.district IN (${zonePlaceholders})`;
            params.push(...filters.zones);
        }
        
        // Filtres par date
        if (filters.startDate) {
            query += ` AND vl.timestamp >= $${paramIndex++}`;
            params.push(filters.startDate);
        }
        
        if (filters.endDate) {
            query += ` AND vl.timestamp <= $${paramIndex++}`;
            params.push(filters.endDate);
        }
        
        try {
            const result = await DatabaseManager.executeQuery(query, params);
            
            return {
                success: true,
                data: result.rows[0],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: null,
                timestamp: new Date().toISOString()
            };
        }
    }

    static async getZoneStatistics(zone = null) {
        let query = `
            SELECT 
                c.district,
                COUNT(DISTINCT c.id) as cameras_in_zone,
                COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_cameras,
                COUNT(vl.id) as total_incidents,
                COUNT(CASE WHEN vl.severity = 'critical' THEN 1 END) as critical_incidents,
                COUNT(CASE WHEN vl.severity = 'high' THEN 1 END) as high_incidents,
                COUNT(CASE WHEN vl.severity = 'medium' THEN 1 END) as medium_incidents,
                COUNT(CASE WHEN vl.severity = 'low' THEN 1 END) as low_incidents,
                AVG(vl.confidence) as avg_confidence,
                COUNT(CASE WHEN vl.timestamp > NOW() - INTERVAL '24 hours' THEN 1 END) as incidents_24h,
                COUNT(CASE WHEN vl.timestamp > NOW() - INTERVAL '7 days' THEN 1 END) as incidents_7d
            FROM cameras c
            LEFT JOIN violence_logs vl ON c.id = vl.camera_id
        `;
        
        const params = [];
        
        if (zone) {
            query += ` WHERE c.district = $1`;
            params.push(zone);
        }
        
        query += `
            GROUP BY c.district
            ORDER BY total_incidents DESC
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, params);
            
            return {
                success: true,
                data: result.rows,
                count: result.rowCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: [],
                count: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    static async getAlertById(alertId) {
        const query = `
            SELECT 
                vl.id, vl.camera_id, vl.violence_type, vl.location, vl.severity,
                vl.confidence, vl.confirmed, vl.false_positive, vl.user_comments,
                vl.timestamp, vl.created_at, vl.updated_at,
                c.name as camera_name, c.district, c.city, c.latitude, c.longitude,
                c.status as camera_status, c.ip_address, c.priority
            FROM violence_logs vl
            JOIN cameras c ON vl.camera_id = c.id
            WHERE vl.id = $1
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [alertId]);
            
            return {
                success: true,
                data: result.rows[0] || null,
                count: result.rowCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: null,
                count: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    static async updateAlertConfirmation(alertId, confirmed, userComments = '') {
        const query = `
            UPDATE violence_logs 
            SET confirmed = $1, user_comments = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING id, confirmed, user_comments, updated_at
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [confirmed, userComments, alertId]);
            
            return {
                success: true,
                data: result.rows[0],
                count: result.rowCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: null,
                count: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    static async markAlertAsFalsePositive(alertId, userComments = '') {
        const query = `
            UPDATE violence_logs 
            SET false_positive = true, user_comments = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, false_positive, user_comments, updated_at
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [userComments, alertId]);
            
            return {
                success: true,
                data: result.rows[0],
                count: result.rowCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: null,
                count: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    static async getMapExportData(filters = {}) {
        let query = `
            SELECT 
                vl.id, vl.violence_type, vl.location, vl.severity, vl.confidence,
                vl.confirmed, vl.false_positive, vl.timestamp,
                c.name as camera_name, c.district, c.city, c.latitude, c.longitude,
                c.status as camera_status, c.priority
            FROM violence_logs vl
            JOIN cameras c ON vl.camera_id = c.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        // Appliquer les mêmes filtres que getMapAlerts
        if (filters.severity && filters.severity.length > 0) {
            const severityPlaceholders = filters.severity.map(() => `$${paramIndex++}`).join(',');
            query += ` AND vl.severity IN (${severityPlaceholders})`;
            params.push(...filters.severity);
        }
        
        if (filters.zones && filters.zones.length > 0) {
            const zonePlaceholders = filters.zones.map(() => `$${paramIndex++}`).join(',');
            query += ` AND c.district IN (${zonePlaceholders})`;
            params.push(...filters.zones);
        }
        
        if (filters.startDate) {
            query += ` AND vl.timestamp >= $${paramIndex++}`;
            params.push(filters.startDate);
        }
        
        if (filters.endDate) {
            query += ` AND vl.timestamp <= $${paramIndex++}`;
            params.push(filters.endDate);
        }
        
        query += ` ORDER BY vl.timestamp DESC`;
        
        try {
            const result = await DatabaseManager.executeQuery(query, params);
            
            return {
                success: true,
                data: result.rows,
                count: result.rowCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: [],
                count: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    static async getCameraClusters(zoomLevel, bounds = null) {
        let query = `
            SELECT 
                c.id, c.name, c.location, c.district, c.latitude, c.longitude,
                c.status, c.priority,
                COUNT(vl.id) as incident_count,
                MAX(vl.timestamp) as last_incident
            FROM cameras c
            LEFT JOIN violence_logs vl ON c.id = vl.camera_id
            WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
        `;
        
        const params = [];
        
        // Filtres géographiques si bounds fournis
        if (bounds) {
            query += ` AND c.latitude BETWEEN $1 AND $2 AND c.longitude BETWEEN $3 AND $4`;
            params.push(bounds.south, bounds.north, bounds.west, bounds.east);
        }
        
        query += `
            GROUP BY c.id, c.name, c.location, c.district, c.latitude, c.longitude, c.status, c.priority
            ORDER BY incident_count DESC
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, params);
            
            return {
                success: true,
                data: result.rows,
                count: result.rowCount,
                zoomLevel: zoomLevel,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: [],
                count: 0,
                timestamp: new Date().toISOString()
            };
        }
    }
}



// Gestionnaire des caméras pour la page index.html
class CameraDB {
    static async getAllCameras() {
        const query = `
            SELECT 
                id, name, location, status, ip_address, 
                district, priority, city, canton, country,
                latitude, longitude, created_at, updated_at
            FROM cameras 
            ORDER BY priority DESC, name ASC
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query);
            
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

    static async getCameraById(id) {
        const query = `
            SELECT 
                id, name, location, status, ip_address,
                district, priority, city, canton, country,
                latitude, longitude, created_at, updated_at
            FROM cameras 
            WHERE id = $1
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [id]);
            
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

    static async getCamerasByZone(zone) {
        const query = `
            SELECT 
                id, name, location, status, ip_address,
                district, priority, city, canton, country,
                latitude, longitude, created_at, updated_at
            FROM cameras 
            WHERE district = $1 AND status = 'active'
            ORDER BY priority DESC, name ASC
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [zone]);
            
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

    static async updateCameraStatus(id, status) {
        const query = `
            UPDATE cameras 
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, name, status, updated_at
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [status, id]);
            
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

    static async getActiveCamerasCount() {
        const query = `
            SELECT COUNT(*) as active_count
            FROM cameras 
            WHERE status = 'active'
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query);
            
            return {
                success: true,
                data: result.rows[0]?.active_count || 0,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    static async getNetworkStatus() {
        const query = `
            SELECT 
                COUNT(*) as total_cameras,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_cameras,
                COUNT(CASE WHEN status = 'error' THEN 1 END) as error_cameras,
                COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_cameras,
                AVG(CASE WHEN status = 'active' THEN 100 ELSE 0 END) as uptime_percentage
            FROM cameras
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query);
            
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
}

// Gestionnaire des logs de violence pour la page index.html
class ViolenceLogDB {
    static async getAllLogs(limit = 100, offset = 0) {
        const query = `
            SELECT 
                vl.id, vl.camera_id, vl.violence_type, vl.location, vl.severity,
                vl.confidence, vl.confirmed, vl.false_positive, vl.user_comments,
                vl.timestamp, vl.created_at, vl.updated_at,
                c.name as camera_name, c.district, c.city
            FROM violence_logs vl
            JOIN cameras c ON vl.camera_id = c.id
            ORDER BY vl.timestamp DESC
            LIMIT $1 OFFSET $2
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [limit, offset]);
            
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

    static async getLogsByCamera(cameraId, limit = 50) {
        const query = `
            SELECT 
                vl.id, vl.camera_id, vl.violence_type, vl.location, vl.severity,
                vl.confidence, vl.confirmed, vl.false_positive, vl.user_comments,
                vl.timestamp, vl.created_at,
                c.name as camera_name, c.district, c.city
            FROM violence_logs vl
            JOIN cameras c ON vl.camera_id = c.id
            WHERE vl.camera_id = $1
            ORDER BY vl.timestamp DESC
            LIMIT $2
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [cameraId, limit]);
            
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

    static async getLogsByDateRange(startDate, endDate, limit = 100) {
        const query = `
            SELECT 
                vl.id, vl.camera_id, vl.violence_type, vl.location, vl.severity,
                vl.confidence, vl.confirmed, vl.false_positive, vl.user_comments,
                vl.timestamp, vl.created_at,
                c.name as camera_name, c.district, c.city
            FROM violence_logs vl
            JOIN cameras c ON vl.camera_id = c.id
            WHERE vl.timestamp BETWEEN $1 AND $2
            ORDER BY vl.timestamp DESC
            LIMIT $3
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [startDate, endDate, limit]);
            
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

    static async createLog(logData) {
        const query = `
            INSERT INTO violence_logs (
                camera_id, violence_type, location, severity,
                confidence, confirmed, false_positive, user_comments,
                timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, camera_id, violence_type, timestamp, created_at
        `;
        
        const params = [
            logData.camera_id,
            logData.violence_type,
            logData.location,
            logData.severity,
            logData.confidence,
            logData.confirmed || false,
            logData.false_positive || false,
            logData.user_comments || '',
            logData.timestamp || new Date().toISOString()
        ];
        
        try {
            const result = await DatabaseManager.executeQuery(query, params);
            
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

    static async getTodayViolenceCount() {
        const query = `
            SELECT COUNT(*) as today_count
            FROM violence_logs 
            WHERE DATE(timestamp) = CURRENT_DATE
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query);
            
            return {
                success: true,
                data: result.rows[0]?.today_count || 0,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    static async getCriticalAlertsCount() {
        const query = `
            SELECT COUNT(*) as critical_count
            FROM violence_logs 
            WHERE severity = 'critical' AND confirmed = false
            AND timestamp > NOW() - INTERVAL '1 hour'
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query);
            
            return {
                success: true,
                data: result.rows[0]?.critical_count || 0,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    static async getTotalViolenceCount() {
        const query = `
            SELECT COUNT(*) as total_count
            FROM violence_logs 
            WHERE confirmed = true AND false_positive = false
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query);
            
            return {
                success: true,
                data: result.rows[0]?.total_count || 0,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: 0,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Gestionnaire des statistiques pour la page index.html
class StatisticsDB {
    static async getViolenceStatsByZone(zone = null) {
        let query = `
            SELECT 
                vl.location,
                COUNT(*) as total_incidents,
                COUNT(CASE WHEN vl.severity = 'critical' THEN 1 END) as critical_incidents,
                COUNT(CASE WHEN vl.confirmed = true THEN 1 END) as confirmed_incidents,
                AVG(vl.confidence) as avg_confidence,
                c.district, c.city
            FROM violence_logs vl
            JOIN cameras c ON vl.camera_id = c.id
        `;
        
        const params = [];
        
        if (zone) {
            query += ` WHERE c.district = $1`;
            params.push(zone);
        }
        
        query += `
            GROUP BY vl.location, c.district, c.city
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

    static async getRiskZones() {
        const query = `
            SELECT 
                c.district,
                COUNT(vl.id) as incident_count,
                COUNT(CASE WHEN vl.severity = 'critical' THEN 1 END) as critical_count,
                COUNT(CASE WHEN vl.severity = 'high' THEN 1 END) as high_count,
                MAX(vl.timestamp) as last_incident
            FROM cameras c
            LEFT JOIN violence_logs vl ON c.id = vl.camera_id
            WHERE vl.timestamp > NOW() - INTERVAL '24 hours'
            GROUP BY c.district
            ORDER BY incident_count DESC
            LIMIT 5
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query);
            
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

    static async getPriorityCameras() {
        const query = `
            SELECT 
                c.id, c.name, c.location, c.district, c.priority,
                COUNT(vl.id) as recent_detections,
                MAX(vl.timestamp) as last_detection,
                c.status
            FROM cameras c
            LEFT JOIN violence_logs vl ON c.id = vl.camera_id
            WHERE vl.timestamp > NOW() - INTERVAL '24 hours'
            GROUP BY c.id, c.name, c.location, c.district, c.priority, c.status
            ORDER BY recent_detections DESC, c.priority DESC
            LIMIT 5
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query);
            
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

    static async getRecentActivity() {
        const query = `
            SELECT 
                vl.id, vl.violence_type, vl.location, vl.severity, vl.timestamp,
                c.name as camera_name, c.district
            FROM violence_logs vl
            JOIN cameras c ON vl.camera_id = c.id
            WHERE vl.timestamp > NOW() - INTERVAL '2 hours'
            ORDER BY vl.timestamp DESC
            LIMIT 10
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query);
            
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
}

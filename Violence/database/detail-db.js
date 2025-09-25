// Gestionnaire des analyses d'images pour la page detail.html
class ImageAnalysisDB {
    static async createAnalysis(analysisData) {
        const query = `
            INSERT INTO image_analyses (
                image_hash, image_name, image_size, image_format,
                has_violence, confidence, severity, violence_types,
                detection_zones, analysis_time, model_version,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            RETURNING id, image_hash, has_violence, confidence, created_at
        `;
        
        const params = [
            analysisData.image_hash,
            analysisData.image_name,
            analysisData.image_size,
            analysisData.image_format,
            analysisData.has_violence,
            analysisData.confidence,
            analysisData.severity,
            JSON.stringify(analysisData.violence_types),
            JSON.stringify(analysisData.detection_zones),
            analysisData.analysis_time,
            analysisData.model_version || 'ViolenceDetector v2.1'
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

    static async getAnalysisById(id) {
        const query = `
            SELECT 
                id, image_hash, image_name, image_size, image_format,
                has_violence, confidence, severity, violence_types,
                detection_zones, analysis_time, model_version,
                created_at, updated_at
            FROM image_analyses 
            WHERE id = $1
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [id]);
            
            if (result.rows[0]) {
                // Décoder les JSON
                result.rows[0].violence_types = JSON.parse(result.rows[0].violence_types);
                result.rows[0].detection_zones = JSON.parse(result.rows[0].detection_zones);
            }
            
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

    static async getAnalysesByHash(imageHash) {
        const query = `
            SELECT 
                id, image_hash, image_name, has_violence, confidence,
                severity, violence_types, analysis_time, model_version,
                created_at
            FROM image_analyses 
            WHERE image_hash = $1
            ORDER BY created_at DESC
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [imageHash]);
            
            // Décoder les JSON
            result.rows.forEach(row => {
                row.violence_types = JSON.parse(row.violence_types);
            });
            
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

    static async getAllAnalyses(limit = 50, offset = 0) {
        const query = `
            SELECT 
                id, image_hash, image_name, has_violence, confidence,
                severity, violence_types, analysis_time, model_version,
                created_at
            FROM image_analyses 
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [limit, offset]);
            
            // Décoder les JSON
            result.rows.forEach(row => {
                row.violence_types = JSON.parse(row.violence_types);
            });
            
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

    static async getViolenceAnalyses(limit = 50, offset = 0) {
        const query = `
            SELECT 
                id, image_hash, image_name, has_violence, confidence,
                severity, violence_types, analysis_time, model_version,
                created_at
            FROM image_analyses 
            WHERE has_violence = true
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [limit, offset]);
            
            // Décoder les JSON
            result.rows.forEach(row => {
                row.violence_types = JSON.parse(row.violence_types);
            });
            
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

    static async updateAnalysis(id, updateData) {
        const query = `
            UPDATE image_analyses 
            SET 
                has_violence = COALESCE($1, has_violence),
                confidence = COALESCE($2, confidence),
                severity = COALESCE($3, severity),
                violence_types = COALESCE($4, violence_types),
                detection_zones = COALESCE($5, detection_zones),
                updated_at = NOW()
            WHERE id = $6
            RETURNING id, has_violence, confidence, severity, updated_at
        `;
        
        const params = [
            updateData.has_violence,
            updateData.confidence,
            updateData.severity,
            updateData.violence_types ? JSON.stringify(updateData.violence_types) : null,
            updateData.detection_zones ? JSON.stringify(updateData.detection_zones) : null,
            id
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

    static async deleteAnalysis(id) {
        const query = `
            DELETE FROM image_analyses 
            WHERE id = $1
            RETURNING id, image_hash, image_name
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [id]);
            
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

    static async getAnalysisStats() {
        const query = `
            SELECT 
                COUNT(*) as total_analyses,
                COUNT(CASE WHEN has_violence = true THEN 1 END) as violence_detected,
                COUNT(CASE WHEN has_violence = false THEN 1 END) as no_violence,
                AVG(confidence) as avg_confidence,
                COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
                COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
                COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_count,
                COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_count
            FROM image_analyses
            WHERE created_at > NOW() - INTERVAL '30 days'
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

// Gestionnaire des métadonnées d'images
class ImageMetadataDB {
    static async saveImageMetadata(imageData) {
        const query = `
            INSERT INTO image_metadata (
                image_hash, original_filename, file_size, file_type,
                image_width, image_height, color_depth, compression,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id, image_hash, original_filename, created_at
        `;
        
        const params = [
            imageData.hash,
            imageData.filename,
            imageData.size,
            imageData.type,
            imageData.width,
            imageData.height,
            imageData.colorDepth,
            imageData.compression
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

    static async getImageMetadata(hash) {
        const query = `
            SELECT 
                id, image_hash, original_filename, file_size, file_type,
                image_width, image_height, color_depth, compression,
                created_at
            FROM image_metadata 
            WHERE image_hash = $1
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [hash]);
            
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

    static async updateImageMetadata(hash, updateData) {
        const query = `
            UPDATE image_metadata 
            SET 
                original_filename = COALESCE($1, original_filename),
                file_size = COALESCE($2, file_size),
                image_width = COALESCE($3, image_width),
                image_height = COALESCE($4, image_height),
                updated_at = NOW()
            WHERE image_hash = $5
            RETURNING id, image_hash, original_filename, updated_at
        `;
        
        const params = [
            updateData.filename,
            updateData.size,
            updateData.width,
            updateData.height,
            hash
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
}



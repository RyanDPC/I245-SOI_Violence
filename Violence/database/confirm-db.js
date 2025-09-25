// Gestionnaire des confirmations pour la page confirm.html
class ConfirmationDB {
    static async createConfirmation(confirmationData) {
        const query = `
            INSERT INTO confirmations (
                analysis_id, user_id, is_confirmed, user_confidence,
                user_severity, user_comments, false_positive,
                confirmation_time, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id, analysis_id, is_confirmed, user_confidence, created_at
        `;
        
        const params = [
            confirmationData.analysis_id,
            confirmationData.user_id,
            confirmationData.is_confirmed,
            confirmationData.user_confidence,
            confirmationData.user_severity,
            confirmationData.user_comments || '',
            confirmationData.false_positive || false,
            confirmationData.confirmation_time || new Date().toISOString()
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

    static async getConfirmationById(id) {
        const query = `
            SELECT 
                c.id, c.analysis_id, c.user_id, c.is_confirmed, c.user_confidence,
                c.user_severity, c.user_comments, c.false_positive,
                c.confirmation_time, c.created_at,
                ia.image_hash, ia.image_name, ia.confidence as ai_confidence,
                ia.severity as ai_severity, ia.violence_types
            FROM confirmations c
            JOIN image_analyses ia ON c.analysis_id = ia.id
            WHERE c.id = $1
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [id]);
            
            if (result.rows[0]) {
                result.rows[0].violence_types = JSON.parse(result.rows[0].violence_types);
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

    static async getConfirmationsByAnalysis(analysisId) {
        const query = `
            SELECT 
                c.id, c.analysis_id, c.user_id, c.is_confirmed, c.user_confidence,
                c.user_severity, c.user_comments, c.false_positive,
                c.confirmation_time, c.created_at,
                u.username, u.role
            FROM confirmations c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.analysis_id = $1
            ORDER BY c.created_at DESC
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [analysisId]);
            
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

    static async getAllConfirmations(limit = 100, offset = 0) {
        const query = `
            SELECT 
                c.id, c.analysis_id, c.user_id, c.is_confirmed, c.user_confidence,
                c.user_severity, c.user_comments, c.false_positive,
                c.confirmation_time, c.created_at,
                ia.image_hash, ia.image_name, ia.confidence as ai_confidence,
                ia.severity as ai_severity, ia.violence_types,
                u.username, u.role
            FROM confirmations c
            JOIN image_analyses ia ON c.analysis_id = ia.id
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
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

    static async updateConfirmation(id, updateData) {
        const query = `
            UPDATE confirmations 
            SET 
                is_confirmed = COALESCE($1, is_confirmed),
                user_confidence = COALESCE($2, user_confidence),
                user_severity = COALESCE($3, user_severity),
                user_comments = COALESCE($4, user_comments),
                false_positive = COALESCE($5, false_positive),
                updated_at = NOW()
            WHERE id = $6
            RETURNING id, is_confirmed, user_confidence, user_severity, updated_at
        `;
        
        const params = [
            updateData.is_confirmed,
            updateData.user_confidence,
            updateData.user_severity,
            updateData.user_comments,
            updateData.false_positive,
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

    static async getConfirmationStats() {
        const query = `
            SELECT 
                COUNT(*) as total_confirmations,
                COUNT(CASE WHEN is_confirmed = true THEN 1 END) as confirmed_count,
                COUNT(CASE WHEN is_confirmed = false THEN 1 END) as rejected_count,
                COUNT(CASE WHEN false_positive = true THEN 1 END) as false_positives,
                AVG(user_confidence) as avg_user_confidence,
                AVG(CASE WHEN is_confirmed = true THEN user_confidence END) as avg_confirmed_confidence,
                AVG(CASE WHEN is_confirmed = false THEN user_confidence END) as avg_rejected_confidence
            FROM confirmations
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

    static async getAccuracyStats() {
        const query = `
            SELECT 
                COUNT(*) as total_comparisons,
                COUNT(CASE 
                    WHEN (ia.has_violence = true AND c.is_confirmed = true) OR 
                         (ia.has_violence = false AND c.is_confirmed = false) 
                    THEN 1 
                END) as correct_predictions,
                COUNT(CASE 
                    WHEN (ia.has_violence = true AND c.is_confirmed = false) OR 
                         (ia.has_violence = false AND c.is_confirmed = true) 
                    THEN 1 
                END) as incorrect_predictions,
                COUNT(CASE WHEN c.false_positive = true THEN 1 END) as false_positives,
                ROUND(
                    COUNT(CASE 
                        WHEN (ia.has_violence = true AND c.is_confirmed = true) OR 
                             (ia.has_violence = false AND c.is_confirmed = false) 
                        THEN 1 
                    END) * 100.0 / COUNT(*), 2
                ) as accuracy_percentage
            FROM confirmations c
            JOIN image_analyses ia ON c.analysis_id = ia.id
            WHERE c.created_at > NOW() - INTERVAL '30 days'
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

    static async getConfirmationHistory(userId = null, limit = 50) {
        let query = `
            SELECT 
                c.id, c.analysis_id, c.is_confirmed, c.user_confidence,
                c.user_severity, c.confirmation_time, c.created_at,
                ia.image_hash, ia.image_name, ia.confidence as ai_confidence,
                ia.severity as ai_severity
            FROM confirmations c
            JOIN image_analyses ia ON c.analysis_id = ia.id
        `;
        
        const params = [];
        
        if (userId) {
            query += ` WHERE c.user_id = $1`;
            params.push(userId);
        }
        
        query += `
            ORDER BY c.created_at DESC
            LIMIT $${params.length + 1}
        `;
        params.push(limit);
        
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

    static async getPendingConfirmations(limit = 20) {
        const query = `
            SELECT 
                ia.id as analysis_id, ia.image_hash, ia.image_name,
                ia.has_violence, ia.confidence, ia.severity,
                ia.violence_types, ia.created_at
            FROM image_analyses ia
            LEFT JOIN confirmations c ON ia.id = c.analysis_id
            WHERE c.id IS NULL AND ia.has_violence = true
            ORDER BY ia.created_at ASC
            LIMIT $1
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [limit]);
            
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
}

// Gestionnaire des utilisateurs pour les confirmations
class UserDB {
    static async getUserById(id) {
        const query = `
            SELECT 
                id, username, email, role, department,
                created_at, last_login, is_active
            FROM users 
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

    static async getUsersByRole(role) {
        const query = `
            SELECT 
                id, username, email, role, department,
                created_at, last_login, is_active
            FROM users 
            WHERE role = $1 AND is_active = true
            ORDER BY username ASC
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [role]);
            
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

    static async updateUserLastLogin(id) {
        const query = `
            UPDATE users 
            SET last_login = NOW()
            WHERE id = $1
            RETURNING id, username, last_login
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

    static async getUserStats(userId) {
        const query = `
            SELECT 
                COUNT(c.id) as total_confirmations,
                COUNT(CASE WHEN c.is_confirmed = true THEN 1 END) as confirmed_count,
                COUNT(CASE WHEN c.is_confirmed = false THEN 1 END) as rejected_count,
                COUNT(CASE WHEN c.false_positive = true THEN 1 END) as false_positives,
                AVG(c.user_confidence) as avg_confidence,
                MAX(c.created_at) as last_confirmation
            FROM confirmations c
            WHERE c.user_id = $1
            AND c.created_at > NOW() - INTERVAL '30 days'
        `;
        
        try {
            const result = await DatabaseManager.executeQuery(query, [userId]);
            
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



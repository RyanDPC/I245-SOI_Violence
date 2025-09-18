// Variables globales
let currentAnalysis = null;
let mapInstance = null;
let analysisHistory = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
let confirmationHistory = JSON.parse(localStorage.getItem('confirmationHistory') || '[]');
let logsHistory = JSON.parse(localStorage.getItem('logsHistory') || '[]');
let camerasData = JSON.parse(localStorage.getItem('camerasData') || '[]');
let autoRefreshInterval = null;
let isAutoRefresh = false;

// Simulation d'analyse d'image (à remplacer par une vraie API)
class ImageAnalyzer {
    static async analyzeImage(imageFile) {
        // Simulation d'un délai d'analyse
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Génération de données simulées
        const randomViolence = Math.random() > 0.5;
        const confidence = randomViolence ? 
            Math.random() * 0.4 + 0.6 : // 60-100% si violence détectée
            Math.random() * 0.3 + 0.1;  // 10-40% si pas de violence
        
        const severityLevels = ['low', 'medium', 'high', 'critical'];
        const randomSeverity = severityLevels[Math.floor(Math.random() * severityLevels.length)];
        
        const violenceTypes = ['physical', 'weapon', 'blood', 'threat'];
        const detectedTypes = violenceTypes.filter(() => Math.random() > 0.5);
        
        return {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            hasViolence: randomViolence,
            confidence: Math.round(confidence * 100),
            severity: randomSeverity,
            violenceTypes: detectedTypes,
            analysisTime: Math.random() * 2000 + 500, // 500-2500ms
            imageInfo: {
                name: imageFile.name,
                size: imageFile.size,
                type: imageFile.type,
                dimensions: {
                    width: Math.floor(Math.random() * 1000) + 500,
                    height: Math.floor(Math.random() * 800) + 400
                }
            },
            detectionZones: this.generateDetectionZones(),
            technicalDetails: {
                model: 'ViolenceDetector v2.1',
                version: '2.1.3',
                threshold: 0.75,
                algorithm: 'CNN + R-CNN'
            }
        };
    }
    
    static generateDetectionZones() {
        const zones = [];
        const numZones = Math.floor(Math.random() * 3) + 1; // 1-3 zones
        
        for (let i = 0; i < numZones; i++) {
            zones.push({
                id: i,
                x: Math.random() * 60 + 10, // 10-70%
                y: Math.random() * 60 + 10, // 10-70%
                width: Math.random() * 20 + 10, // 10-30%
                height: Math.random() * 20 + 10, // 10-30%
                confidence: Math.random() * 0.4 + 0.6,
                type: ['physical', 'weapon', 'blood', 'threat'][Math.floor(Math.random() * 4)],
                label: this.getViolenceTypeLabel(['physical', 'weapon', 'blood', 'threat'][Math.floor(Math.random() * 4)])
            });
        }
        
        return zones;
    }
    
    static getViolenceTypeLabel(type) {
        const labels = {
            physical: 'Violence physique',
            weapon: 'Arme détectée',
            blood: 'Sang/Blessure',
            threat: 'Menace/Geste agressif'
        };
        return labels[type] || 'Violence détectée';
    }
}

// Gestion de l'upload d'images
class ImageUploader {
    static init() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        
        if (!uploadArea || !imageInput) return;
        
        // Drag & drop
        uploadArea.addEventListener('dragover', this.handleDragOver);
        uploadArea.addEventListener('dragleave', this.handleDragLeave);
        uploadArea.addEventListener('drop', this.handleDrop);
        
        // Click to upload
        uploadArea.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', this.handleFileSelect);
    }
    
    static handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }
    
    static handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }
    
    static handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processImage(files[0]);
        }
    }
    
    static handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processImage(file);
        }
    }
    
    static async processImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner un fichier image valide.');
            return;
        }
        
        // Afficher un indicateur de chargement
        this.showLoading();
        
        try {
            // Analyser l'image
            const analysis = await ImageAnalyzer.analyzeImage(file);
            currentAnalysis = analysis;
            
            // Afficher les résultats
            this.displayResults(file, analysis);
            
            // Ajouter à l'historique
            this.addToHistory(analysis);
            
        } catch (error) {
            console.error('Erreur lors de l\'analyse:', error);
            alert('Erreur lors de l\'analyse de l\'image.');
        } finally {
            this.hideLoading();
        }
    }
    
    static showLoading() {
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.innerHTML = `
                <div class="upload-content">
                    <i class="fas fa-spinner fa-spin upload-icon"></i>
                    <h3>Analyse en cours...</h3>
                    <p>Veuillez patienter pendant l'analyse de votre image.</p>
                </div>
            `;
        }
    }
    
    static hideLoading() {
        // Restaurer l'interface d'upload
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.innerHTML = `
                <div class="upload-content">
                    <i class="fas fa-cloud-upload-alt upload-icon"></i>
                    <h3>Glissez-déposez votre image ici</h3>
                    <p>ou cliquez pour sélectionner un fichier</p>
                    <button class="upload-btn" onclick="document.getElementById('imageInput').click()">
                        <i class="fas fa-plus"></i> Sélectionner une image
                    </button>
                </div>
            `;
        }
    }
    
    static displayResults(imageFile, analysis) {
        const resultsSection = document.getElementById('resultsSection');
        const analyzedImage = document.getElementById('analyzedImage');
        const violenceIndicator = document.getElementById('violenceIndicator');
        const confidenceLevel = document.getElementById('confidenceLevel');
        const severityLevel = document.getElementById('severityLevel');
        
        if (!resultsSection) return;
        
        // Afficher la section des résultats
        resultsSection.style.display = 'block';
        
        // Afficher l'image
        if (analyzedImage) {
            const reader = new FileReader();
            reader.onload = (e) => {
                analyzedImage.src = e.target.result;
            };
            reader.readAsDataURL(imageFile);
        }
        
        // Mettre à jour l'indicateur de violence
        if (violenceIndicator) {
            const icon = violenceIndicator.querySelector('.indicator-icon');
            const text = violenceIndicator.querySelector('.indicator-text');
            const confidence = violenceIndicator.querySelector('.confidence-score');
            
            if (analysis.hasViolence) {
                icon.className = 'indicator-icon violent';
                icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                text.textContent = 'Violence détectée';
                confidence.textContent = `${analysis.confidence}%`;
                confidence.className = 'confidence-score text-danger';
            } else {
                icon.className = 'indicator-icon safe';
                icon.innerHTML = '<i class="fas fa-check-circle"></i>';
                text.textContent = 'Aucune violence détectée';
                confidence.textContent = `${analysis.confidence}%`;
                confidence.className = 'confidence-score text-success';
            }
        }
        
        // Mettre à jour les statistiques rapides
        if (confidenceLevel) {
            confidenceLevel.textContent = analysis.confidence;
        }
        
        if (severityLevel) {
            const severityLabels = {
                low: 'Faible',
                medium: 'Moyen',
                high: 'Élevé',
                critical: 'Critique'
            };
            severityLevel.textContent = severityLabels[analysis.severity] || 'Inconnu';
            severityLevel.className = `severity-badge ${analysis.severity}`;
        }
        
        // Faire défiler vers les résultats
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    static addToHistory(analysis) {
        analysisHistory.unshift(analysis);
        // Limiter à 50 analyses
        if (analysisHistory.length > 50) {
            analysisHistory = analysisHistory.slice(0, 50);
        }
        localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));
        this.updateHistoryDisplay();
    }
    
    static updateHistoryDisplay() {
        const historyGrid = document.getElementById('historyGrid');
        if (!historyGrid) return;
        
        if (analysisHistory.length === 0) {
            historyGrid.innerHTML = `
                <div class="no-history">
                    <i class="fas fa-history"></i>
                    <p>Aucune analyse récente</p>
                </div>
            `;
            return;
        }
        
        historyGrid.innerHTML = analysisHistory.slice(0, 10).map(analysis => `
            <div class="history-item" onclick="viewHistoryItem('${analysis.id}')">
                <div class="history-image">
                    <div class="history-placeholder">
                        <i class="fas fa-image"></i>
                    </div>
                    <div class="history-status ${analysis.hasViolence ? 'violent' : 'safe'}">
                        <i class="fas fa-${analysis.hasViolence ? 'exclamation-triangle' : 'check-circle'}"></i>
                    </div>
                </div>
                <div class="history-info">
                    <h4>${analysis.imageInfo.name}</h4>
                    <p>Confiance: ${analysis.confidence}%</p>
                    <p>${new Date(analysis.timestamp).toLocaleDateString('fr-FR')}</p>
                </div>
            </div>
        `).join('');
    }
}

// Navigation entre les pages
function goBack() {
    window.history.back();
}

function goToIndex() {
    window.location.href = 'index.html';
}

function viewDetails() {
    if (currentAnalysis) {
        // Stocker l'analyse courante pour la page de détail
        sessionStorage.setItem('currentAnalysis', JSON.stringify(currentAnalysis));
        window.location.href = 'detail.html';
    }
}

function viewHistoryItem(analysisId) {
    const analysis = analysisHistory.find(a => a.id === analysisId);
    if (analysis) {
        sessionStorage.setItem('currentAnalysis', JSON.stringify(analysis));
        window.location.href = 'detail.html';
    }
}

function confirmResult() {
    if (currentAnalysis) {
        sessionStorage.setItem('currentAnalysis', JSON.stringify(currentAnalysis));
        window.location.href = 'confirm.html';
    }
}

// Page de détail
function loadAnalysisDetails() {
    const analysisData = sessionStorage.getItem('currentAnalysis');
    if (!analysisData) {
        alert('Aucune analyse trouvée.');
        goBack();
        return;
    }
    
    const analysis = JSON.parse(analysisData);
    currentAnalysis = analysis;
    
    // Remplir les détails de l'analyse
    fillAnalysisDetails(analysis);
}

function fillAnalysisDetails(analysis) {
    // Image
    const detailImage = document.getElementById('detailImage');
    if (detailImage && analysis.imageData) {
        detailImage.src = analysis.imageData;
    }
    
    // Statut de violence
    const violenceStatus = document.getElementById('violenceStatus');
    if (violenceStatus) {
        const badge = violenceStatus.querySelector('.status-badge');
        if (analysis.hasViolence) {
            badge.textContent = 'Violence détectée';
            badge.className = 'status-badge violent';
        } else {
            badge.textContent = 'Aucune violence';
            badge.className = 'status-badge safe';
        }
    }
    
    // Niveau de gravité
    const severityLevel = document.getElementById('severityLevel');
    if (severityLevel) {
        const badge = severityLevel.querySelector('.severity-badge');
        const severityLabels = {
            low: 'Faible',
            medium: 'Moyen',
            high: 'Élevé',
            critical: 'Critique'
        };
        badge.textContent = severityLabels[analysis.severity] || 'Inconnu';
        badge.className = `severity-badge ${analysis.severity}`;
    }
    
    // Score de confiance
    const confidenceScore = document.getElementById('confidenceScore');
    if (confidenceScore) {
        const fill = confidenceScore.querySelector('.confidence-fill');
        fill.style.width = `${analysis.confidence}%`;
        fill.style.background = getConfidenceColor(analysis.confidence);
    }
    
    // Date d'analyse
    const analysisDate = document.getElementById('analysisDate');
    if (analysisDate) {
        analysisDate.textContent = new Date(analysis.timestamp).toLocaleString('fr-FR');
    }
    
    // Informations sur l'image
    fillImageInfo(analysis.imageInfo);
    
    // Métriques de détection
    fillDetectionMetrics(analysis);
    
    // Types de violence
    fillViolenceTypes(analysis.violenceTypes);
    
    // Zones de détection
    fillDetectionZones(analysis.detectionZones);
}

function fillImageInfo(imageInfo) {
    const elements = {
        imageDimensions: `${imageInfo.dimensions.width} × ${imageInfo.dimensions.height}`,
        imageFormat: imageInfo.type,
        imageSize: formatFileSize(imageInfo.size),
        imageChecksum: generateChecksum(imageInfo.name + imageInfo.size)
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function fillDetectionMetrics(analysis) {
    const elements = {
        analysisTime: `${Math.round(analysis.analysisTime)}ms`,
        analyzedZones: analysis.detectionZones.length
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function fillViolenceTypes(violenceTypes) {
    const grid = document.getElementById('violenceTypesGrid');
    if (!grid) return;
    
    if (violenceTypes.length === 0) {
        grid.innerHTML = '<p class="no-violence">Aucun type de violence détecté.</p>';
        return;
    }
    
    const typeLabels = {
        physical: { icon: 'fas fa-fist-raised', label: 'Violence physique' },
        weapon: { icon: 'fas fa-gun', label: 'Arme détectée' },
        blood: { icon: 'fas fa-tint', label: 'Sang/Blessure' },
        threat: { icon: 'fas fa-exclamation', label: 'Menace/Geste agressif' }
    };
    
    grid.innerHTML = violenceTypes.map(type => {
        const typeInfo = typeLabels[type];
        return `
            <div class="violence-type-card">
                <div class="violence-type-icon">
                    <i class="${typeInfo.icon}"></i>
                </div>
                <div class="violence-type-info">
                    <h4>${typeInfo.label}</h4>
                    <p>Type de violence détecté avec un niveau de confiance élevé</p>
                </div>
            </div>
        `;
    }).join('');
}

function fillDetectionZones(zones) {
    const zonesList = document.getElementById('zonesList');
    const imageOverlay = document.getElementById('imageOverlay');
    
    if (zonesList) {
        zonesList.innerHTML = zones.map(zone => `
            <div class="zone-item">
                <div class="zone-info">
                    <i class="fas fa-crosshairs"></i>
                    <span>${zone.label}</span>
                    <span class="zone-coordinates">(${Math.round(zone.x)}%, ${Math.round(zone.y)}%)</span>
                </div>
                <div class="zone-confidence">
                    ${Math.round(zone.confidence * 100)}%
                </div>
            </div>
        `).join('');
    }
    
    if (imageOverlay) {
        imageOverlay.innerHTML = zones.map(zone => `
            <div class="detection-zone" 
                 style="left: ${zone.x}%; top: ${zone.y}%; width: ${zone.width}%; height: ${zone.height}%;"
                 data-label="${zone.label}">
            </div>
        `).join('');
    }
}

function toggleZones() {
    const overlay = document.getElementById('imageOverlay');
    if (overlay) {
        overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    }
}

function highlightAllZones() {
    const zones = document.querySelectorAll('.detection-zone');
    zones.forEach(zone => {
        zone.style.animation = 'pulse 1s infinite';
    });
    
    setTimeout(() => {
        zones.forEach(zone => {
            zone.style.animation = '';
        });
    }, 3000);
}

// Carte interactive
function initializeMap() {
    if (typeof L === 'undefined') {
        console.error('Leaflet n\'est pas chargé');
        return;
    }
    
    // Initialiser la carte centrée sur Lausanne, Vaud, Suisse
    mapInstance = L.map('map').setView([46.5197, 6.6323], 13);
    
    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);
    
    // Ajouter les marqueurs d'alertes
    addAlertMarkers();
}

function addAlertMarkers() {
    if (!mapInstance) return;
    
    // Données simulées d'alertes
    const alerts = generateSampleAlerts();
    
    alerts.forEach(alert => {
        const marker = L.circleMarker([alert.lat, alert.lng], {
            radius: getMarkerRadius(alert.severity),
            fillColor: getSeverityColor(alert.severity),
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });
        
        marker.bindPopup(`
            <div class="alert-popup">
                <h4>${alert.title}</h4>
                <p><strong>Gravité:</strong> ${alert.severity}</p>
                <p><strong>Confiance:</strong> ${alert.confidence}%</p>
                <p><strong>Date:</strong> ${new Date(alert.timestamp).toLocaleDateString('fr-FR')}</p>
                <button onclick="viewAlertDetails('${alert.id}')">Voir détails</button>
            </div>
        `);
        
        marker.addTo(mapInstance);
    });
}

function generateSampleAlerts() {
    const alerts = [];
    const lausanneZones = [
        { name: 'Centre-ville', lat: 46.5197, lng: 6.6323, zone: 'centre' },
        { name: 'Gare CFF', lat: 46.5186, lng: 6.6287, zone: 'gare' },
        { name: 'UNIL/EPFL', lat: 46.5202, lng: 6.5684, zone: 'unil' },
        { name: 'Quai du Lac', lat: 46.5069, lng: 6.6329, zone: 'lac' },
        { name: 'Le Flon', lat: 46.5244, lng: 6.6334, zone: 'flon' },
        { name: 'Ouchy', lat: 46.5079, lng: 6.6261, zone: 'ouchy' },
        { name: 'Stade de la Tuilière', lat: 46.5433, lng: 6.6108, zone: 'stade' },
        { name: 'Place Saint-François', lat: 46.5231, lng: 6.6342, zone: 'centre' },
        { name: 'Riponne', lat: 46.5256, lng: 6.6362, zone: 'centre' },
        { name: 'Place du Château', lat: 46.5214, lng: 6.6378, zone: 'centre' },
        { name: 'Prilly', lat: 46.5378, lng: 6.5961, zone: 'centre' },
        { name: 'Chailly', lat: 46.5367, lng: 6.6417, zone: 'centre' }
    ];
    
    const severities = ['low', 'medium', 'high', 'critical'];
    const violenceTypes = ['physical', 'weapon', 'blood', 'threat'];
    
    lausanneZones.forEach(zone => {
        const numAlerts = Math.floor(Math.random() * 8) + 1;
        for (let i = 0; i < numAlerts; i++) {
            alerts.push({
                id: `lausanne-${zone.zone}-${i}`,
                title: `Alerte violence - ${zone.name}`,
                lat: zone.lat + (Math.random() - 0.5) * 0.005, // Plus précis pour Lausanne
                lng: zone.lng + (Math.random() - 0.5) * 0.005,
                severity: severities[Math.floor(Math.random() * severities.length)],
                violenceType: violenceTypes[Math.floor(Math.random() * violenceTypes.length)],
                confidence: Math.floor(Math.random() * 40) + 60,
                zone: zone.zone,
                location: zone.name,
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
    });
    
    return alerts;
}

function getMarkerRadius(severity) {
    const radii = { low: 8, medium: 12, high: 16, critical: 20 };
    return radii[severity] || 10;
}

function getSeverityColor(severity) {
    const colors = {
        low: '#10b981',
        medium: '#3b82f6',
        high: '#f59e0b',
        critical: '#ef4444'
    };
    return colors[severity] || '#64748b';
}

function getConfidenceColor(confidence) {
    // Calculer la couleur basée sur le pourcentage de confiance
    // 0% = rouge, 50% = orange, 100% = vert
    const hue = (confidence / 100) * 120; // 0° (rouge) à 120° (vert)
    return `hsl(${hue}, 70%, 50%)`;
}

function applyFilters() {
    // Récupérer les filtres
    const severityFilters = {
        critical: document.getElementById('filter-critical')?.checked,
        high: document.getElementById('filter-high')?.checked,
        medium: document.getElementById('filter-medium')?.checked,
        low: document.getElementById('filter-low')?.checked
    };
    
    const violenceFilters = {
        physical: document.getElementById('filter-physical')?.checked,
        weapon: document.getElementById('filter-weapon')?.checked,
        blood: document.getElementById('filter-blood')?.checked,
        threat: document.getElementById('filter-threat')?.checked
    };
    
    const zoneFilters = {
        centre: document.getElementById('filter-centre')?.checked,
        gare: document.getElementById('filter-gare')?.checked,
        unil: document.getElementById('filter-unil')?.checked,
        lac: document.getElementById('filter-lac')?.checked,
        flon: document.getElementById('filter-flon')?.checked,
        ouchy: document.getElementById('filter-ouchy')?.checked,
        stade: document.getElementById('filter-stade')?.checked
    };
    
    const statusFilters = {
        confirmed: document.getElementById('filter-confirmed')?.checked,
        pending: document.getElementById('filter-pending')?.checked,
        error: document.getElementById('filter-error')?.checked
    };
    
    // Filtrer les marqueurs sur la carte
    filterMapMarkers(severityFilters, violenceFilters, zoneFilters, statusFilters);
    updateStatistics();
}

function filterMapMarkers(severityFilters, violenceFilters, zoneFilters, statusFilters) {
    if (!mapInstance) return;
    
    // Supprimer tous les marqueurs existants
    mapInstance.eachLayer(layer => {
        if (layer instanceof L.CircleMarker) {
            mapInstance.removeLayer(layer);
        }
    });
    
    // Regénérer les marqueurs avec les filtres
    const alerts = generateSampleAlerts();
    const filteredAlerts = alerts.filter(alert => {
        // Filtre par gravité
        if (!severityFilters[alert.severity]) return false;
        
        // Filtre par type de violence
        if (!violenceFilters[alert.violenceType]) return false;
        
        // Filtre par zone de Lausanne
        if (!zoneFilters[alert.zone]) return false;
        
        return true;
    });
    
    // Ajouter les marqueurs filtrés
    filteredAlerts.forEach(alert => {
        const marker = L.circleMarker([alert.lat, alert.lng], {
            radius: getMarkerRadius(alert.severity),
            fillColor: getSeverityColor(alert.severity),
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });
        
        marker.bindPopup(`
            <div class="alert-popup">
                <h4>${alert.title}</h4>
                <p><strong>Zone:</strong> ${alert.location}</p>
                <p><strong>Type:</strong> ${alert.violenceType}</p>
                <p><strong>Gravité:</strong> ${alert.severity}</p>
                <p><strong>Confiance:</strong> ${alert.confidence}%</p>
                <p><strong>Date:</strong> ${new Date(alert.timestamp).toLocaleDateString('fr-FR')}</p>
                <button onclick="viewAlertDetails('${alert.id}')">Voir détails</button>
            </div>
        `);
        
        marker.addTo(mapInstance);
    });
}

function loadMapData() {
    if (!mapInstance) return;
    
    // Charger les données de caméras de Lausanne
    CameraLogsManager.initializeCameras();
    
    // Ajouter les marqueurs d'alertes
    addAlertMarkers();
    
    // Mettre à jour les statistiques
    updateStatistics();
}

function updateStatistics() {
    const alerts = generateSampleAlerts();
    const stats = {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        confirmedAlerts: alerts.filter(a => Math.random() > 0.7).length, // Simulation
        pendingAlerts: alerts.filter(a => Math.random() <= 0.7).length // Simulation
    };
    
    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function centerMap() {
    if (mapInstance) {
        mapInstance.setView([46.5197, 6.6323], 13); // Centrer sur Lausanne
    }
}

function toggleHeatmap() {
    console.log('Basculement de la carte de chaleur...');
}

function toggleClusters() {
    console.log('Basculement du regroupement des marqueurs...');
}

function exportMap() {
    console.log('Export de la carte...');
}

function viewAlertDetails(alertId) {
    console.log('Affichage des détails de l\'alerte:', alertId);
}

function closeModal() {
    const modal = document.getElementById('alertModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Page de confirmation
function loadConfirmationData() {
    const analysisData = sessionStorage.getItem('currentAnalysis');
    if (!analysisData) {
        alert('Aucune analyse trouvée.');
        goBack();
        return;
    }
    
    const analysis = JSON.parse(analysisData);
    currentAnalysis = analysis;
    
    // Remplir les données de confirmation
    fillConfirmationData(analysis);
}

function fillConfirmationData(analysis) {
    // Image
    const confirmImage = document.getElementById('confirmImage');
    if (confirmImage && analysis.imageData) {
        confirmImage.src = analysis.imageData;
    }
    
    // Prédiction IA
    const aiPrediction = document.getElementById('aiPrediction');
    if (aiPrediction) {
        const badge = aiPrediction.querySelector('.prediction-badge');
        if (analysis.hasViolence) {
            badge.textContent = 'Violence détectée';
            badge.className = 'prediction-badge violent';
        } else {
            badge.textContent = 'Aucune violence';
            badge.className = 'prediction-badge safe';
        }
    }
    
    // Confiance IA
    const aiConfidence = document.getElementById('aiConfidence');
    const aiConfidenceText = document.getElementById('aiConfidenceText');
    if (aiConfidence && aiConfidenceText) {
        aiConfidence.style.width = `${analysis.confidence}%`;
        aiConfidenceText.textContent = `${analysis.confidence}%`;
    }
    
    // Détails IA
    const aiDetailsList = document.getElementById('aiDetailsList');
    if (aiDetailsList) {
        aiDetailsList.innerHTML = `
            <li>Analyse effectuée le ${new Date(analysis.timestamp).toLocaleString('fr-FR')}</li>
            <li>Temps d'analyse: ${Math.round(analysis.analysisTime)}ms</li>
            <li>Zones analysées: ${analysis.detectionZones.length}</li>
            <li>Types détectés: ${analysis.violenceTypes.length}</li>
        `;
    }
    
    // Pré-remplir les options si violence détectée
    if (analysis.hasViolence) {
        document.getElementById('violenceYes').checked = true;
        document.getElementById('severityGroup').style.display = 'block';
        document.getElementById('violenceTypesGroup').style.display = 'block';
        
        // Pré-sélectionner la gravité
        const severityRadio = document.querySelector(`input[name="severity"][value="${analysis.severity}"]`);
        if (severityRadio) {
            severityRadio.checked = true;
        }
        
        // Pré-sélectionner les types de violence
        analysis.violenceTypes.forEach(type => {
            const checkbox = document.querySelector(`input[name="violenceTypes"][value="${type}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    } else {
        document.getElementById('violenceNo').checked = true;
    }
    
    // Mettre à jour les statistiques de confirmation
    updateConfirmationStats();
}

function updateConfirmationStats() {
    const stats = {
        totalConfirmations: confirmationHistory.length,
        correctPredictions: confirmationHistory.filter(c => c.aiCorrect).length,
        accuracyRate: confirmationHistory.length > 0 ? 
            Math.round((confirmationHistory.filter(c => c.aiCorrect).length / confirmationHistory.length) * 100) : 0
    };
    
    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Afficher les confirmations récentes
    displayRecentConfirmations();
}

function displayRecentConfirmations() {
    const container = document.getElementById('recentConfirmations');
    if (!container) return;
    
    const recent = confirmationHistory.slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = '<p>Aucune confirmation récente.</p>';
        return;
    }
    
    container.innerHTML = recent.map(confirmation => `
        <div class="confirmation-item">
            <div class="confirmation-image">
                <i class="fas fa-image"></i>
            </div>
            <div class="confirmation-info">
                <h4>${confirmation.imageName}</h4>
                <p>IA: ${confirmation.aiPrediction ? 'Violence' : 'Sûr'} | 
                   Utilisateur: ${confirmation.userPrediction ? 'Violence' : 'Sûr'}</p>
                <p class="confirmation-date">${new Date(confirmation.timestamp).toLocaleDateString('fr-FR')}</p>
            </div>
            <div class="confirmation-status ${confirmation.aiCorrect ? 'correct' : 'incorrect'}">
                <i class="fas fa-${confirmation.aiCorrect ? 'check' : 'times'}"></i>
            </div>
        </div>
    `).join('');
}

function confirmResult() {
    const hasViolence = document.querySelector('input[name="hasViolence"]:checked')?.value;
    
    if (!hasViolence) {
        alert('Veuillez confirmer si l\'image contient de la violence ou non.');
        return;
    }
    
    const userPrediction = hasViolence === 'yes';
    const aiCorrect = userPrediction === currentAnalysis.hasViolence;
    
    const confirmation = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        analysisId: currentAnalysis.id,
        imageName: currentAnalysis.imageInfo.name,
        aiPrediction: currentAnalysis.hasViolence,
        userPrediction: userPrediction,
        aiCorrect: aiCorrect,
        userComments: document.getElementById('userComments')?.value || '',
        severity: document.querySelector('input[name="severity"]:checked')?.value || null,
        violenceTypes: Array.from(document.querySelectorAll('input[name="violenceTypes"]:checked')).map(cb => cb.value)
    };
    
    // Ajouter à l'historique
    confirmationHistory.unshift(confirmation);
    if (confirmationHistory.length > 100) {
        confirmationHistory = confirmationHistory.slice(0, 100);
    }
    localStorage.setItem('confirmationHistory', JSON.stringify(confirmationHistory));
    
    // Afficher un message de confirmation
    alert(`Résultat ${aiCorrect ? 'correct' : 'incorrect'} enregistré. Merci pour votre contribution !`);
    
    // Rediriger vers la page principale
    window.location.href = 'index.html';
}

function saveDraft() {
    // Sauvegarder comme brouillon
    console.log('Sauvegarde du brouillon...');
    alert('Brouillon sauvegardé.');
}

function reportError() {
    // Signaler une erreur
    const comments = prompt('Décrivez l\'erreur détectée:');
    if (comments) {
        console.log('Erreur signalée:', comments);
        alert('Erreur signalée. Merci pour votre contribution !');
    }
}

function skipConfirmation() {
    if (confirm('Êtes-vous sûr de vouloir passer cette confirmation ?')) {
        window.location.href = 'index.html';
    }
}

// Utilitaires
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateChecksum(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
}

function clearHistory() {
    if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
        analysisHistory = [];
        confirmationHistory = [];
        localStorage.removeItem('analysisHistory');
        localStorage.removeItem('confirmationHistory');
        ImageUploader.updateHistoryDisplay();
        alert('Historique effacé.');
    }
}

function exportReport() {
    console.log('Export du rapport...');
    alert('Fonctionnalité d\'export à implémenter.');
}

function shareAnalysis() {
    if (navigator.share) {
        navigator.share({
            title: 'Analyse de violence',
            text: `Résultat de l'analyse: ${currentAnalysis.hasViolence ? 'Violence détectée' : 'Aucune violence'} (${currentAnalysis.confidence}%)`,
            url: window.location.href
        });
    } else {
        // Fallback pour les navigateurs qui ne supportent pas l'API Share
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('Lien copié dans le presse-papiers !');
        });
    }
}

// Gestionnaire de logs de caméras
class CameraLogsManager {
    static init() {
        this.initializeCameras();
        this.loadInitialLogs();
        this.updateStatistics();
        this.updateDashboard();
        this.populateFilters();
    }
    
    static initializeCameras() {
        if (camerasData.length === 0) {
            // Simulation d'un réseau de surveillance pour Lausanne, Vaud, Suisse
            camerasData = [];
            
            // Lausanne - 80 caméras réparties dans les zones principales
            const lausanneZones = [
                // Centre-ville (20 caméras)
                { zone: 'Centre-ville', locations: ['Place Saint-François', 'Rue de Bourg', 'Place de la Palud', 'Rue du Grand-Pont', 'Place du Château', 'Rue de la Mercerie', 'Place de la Riponne', 'Rue Caroline', 'Place de la Louve', 'Rue de l\'Ale'] },
                // Gare CFF (15 caméras)
                { zone: 'Gare CFF', locations: ['Hall principal', 'Quai 1-2', 'Quai 3-4', 'Quai 5-6', 'Sortie Nord', 'Sortie Sud', 'Parking', 'Bus', 'Métro', 'Tunnel piéton'] },
                // UNIL/EPFL (20 caméras)
                { zone: 'UNIL/EPFL', locations: ['Campus UNIL', 'Bibliothèque', 'Amphithéâtres', 'Restaurants', 'Parc scientifique', 'Station métro', 'Parking étudiants', 'Laboratoires', 'Résidences', 'Sport'] },
                // Quai du Lac (10 caméras)
                { zone: 'Quai du Lac', locations: ['Quai Ouchy', 'Quai de Belgique', 'Quai de Mont-Blanc', 'Parc Denantou', 'Musée Olympique', 'Port', 'Promenade', 'Restaurants', 'Hôtels', 'Plage'] },
                // Le Flon (8 caméras)
                { zone: 'Le Flon', locations: ['Centre commercial', 'Cinéma', 'Bars', 'Restaurants', 'Parking souterrain', 'Métro', 'Escalators', 'Terrasses'] },
                // Ouchy (5 caméras)
                { zone: 'Ouchy', locations: ['Château d\'Ouchy', 'Port', 'Promenade', 'Parc', 'Restaurants'] },
                // Stade de la Tuilière (2 caméras)
                { zone: 'Stade de la Tuilière', locations: ['Entrée principale', 'Parking'] }
            ];
            
            let cameraIndex = 1;
            lausanneZones.forEach(zoneData => {
                zoneData.locations.forEach(location => {
                    camerasData.push({
                        id: `lausanne-cam-${cameraIndex.toString().padStart(3, '0')}`,
                        name: `Lausanne-${location}`,
                        location: `Lausanne - ${location}`,
                        status: Math.random() > 0.1 ? 'active' : (Math.random() > 0.5 ? 'inactive' : 'error'),
                        ip: `10.0.${Math.floor(cameraIndex/255)}.${cameraIndex%255}`,
                        district: location,
                        priority: Math.random() > 0.7 ? 'high' : 'normal',
                        city: 'Lausanne',
                        canton: 'Vaud',
                        country: 'Suisse'
                    });
                    cameraIndex++;
                });
            });
            
            localStorage.setItem('camerasData', JSON.stringify(camerasData));
        }
    }
    
    static loadInitialLogs() {
        if (logsHistory.length === 0) {
            // Générer quelques logs initiaux
            for (let i = 0; i < 10; i++) {
                this.generateRandomLog();
            }
        }
        this.updateLogsTable();
    }
    
    static generateRandomLog() {
        const activeCameras = camerasData.filter(cam => cam.status === 'active');
        if (activeCameras.length === 0) return;
        
        const camera = activeCameras[Math.floor(Math.random() * activeCameras.length)];
        const violenceTypes = ['physical', 'weapon', 'blood', 'threat'];
        const severities = ['low', 'medium', 'high', 'critical'];
        
        const log = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            cameraId: camera.id,
            cameraName: camera.name,
            violenceType: violenceTypes[Math.floor(Math.random() * violenceTypes.length)],
            location: camera.location,
            city: camera.city,
            zone: camera.district,
            severity: severities[Math.floor(Math.random() * severities.length)],
            confidence: Math.floor(Math.random() * 40) + 60, // 60-100%
            confirmed: Math.random() > 0.7 // 30% de chance d'être confirmé
        };
        
        logsHistory.unshift(log);
        if (logsHistory.length > 100) {
            logsHistory = logsHistory.slice(0, 100);
        }
        
        localStorage.setItem('logsHistory', JSON.stringify(logsHistory));
        return log;
    }
    
    static updateLogsTable() {
        const tbody = document.getElementById('logsTableBody');
        if (!tbody) return;
        
        if (logsHistory.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <br>Aucun log de violence détecté
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = logsHistory.map(log => {
            const severityLabels = {
                low: 'Faible',
                medium: 'Moyen', 
                high: 'Élevé',
                critical: 'Critique'
            };
            
            const violenceTypeLabels = {
                physical: 'Violence physique',
                weapon: 'Arme détectée',
                blood: 'Sang/Blessure',
                threat: 'Menace/Geste'
            };
            
            const violenceTypeIcons = {
                physical: 'fas fa-fist-raised',
                weapon: 'fas fa-gun',
                blood: 'fas fa-tint',
                threat: 'fas fa-exclamation'
            };
            
            return `
                <tr class="log-row" data-severity="${log.severity}" data-camera="${log.cameraId}">
                    <td>
                        <div class="log-time">
                            ${new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                            <div class="log-date">${new Date(log.timestamp).toLocaleDateString('fr-FR')}</div>
                        </div>
                    </td>
                    <td>
                        <div class="camera-info">
                            <strong>${log.cameraName}</strong>
                            <div class="camera-id">${log.cameraId}</div>
                        </div>
                    </td>
                    <td>
                        <div class="violence-type">
                            <div class="violence-type-icon ${log.violenceType}">
                                <i class="${violenceTypeIcons[log.violenceType]}"></i>
                            </div>
                            <span>${violenceTypeLabels[log.violenceType]}</span>
                        </div>
                    </td>
                    <td>${log.location}</td>
                    <td>
                        <span class="severity-badge ${log.severity}">
                            ${severityLabels[log.severity]}
                        </span>
                    </td>
                    <td>
                        <div class="confidence-display">
                            <span class="confidence-value" style="color: ${getConfidenceColor(log.confidence)}">${log.confidence}%</span>
                            <div class="confidence-bar-small">
                                <div class="confidence-fill-small" style="width: ${log.confidence}%; background: ${getConfidenceColor(log.confidence)}"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="log-actions">
                            <button class="log-action-btn primary" onclick="viewLogDetails('${log.id}')" title="Voir détails">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="log-action-btn secondary" onclick="confirmLog('${log.id}')" title="Confirmer">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="log-action-btn secondary" onclick="reportFalsePositive('${log.id}')" title="Faux positif">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        this.updateLogsCount();
    }
    
    static updateLogsCount() {
        const countElement = document.getElementById('logsCount');
        if (countElement) {
            countElement.textContent = logsHistory.length;
        }
    }
    
    static updateStatistics() {
        const activeCameras = camerasData.filter(cam => cam.status === 'active').length;
        const totalViolence = logsHistory.length;
        const todayViolence = logsHistory.filter(log => {
            const logDate = new Date(log.timestamp);
            const today = new Date();
            return logDate.toDateString() === today.toDateString();
        }).length;
        const criticalAlerts = logsHistory.filter(log => log.severity === 'critical').length;
        
        const stats = {
            activeCameras,
            totalViolence,
            todayViolence,
            criticalAlerts
        };
        
        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    static updateCamerasDisplay() {
        const grid = document.getElementById('camerasGrid');
        if (!grid) return;
        
        grid.innerHTML = camerasData.map(camera => {
            const statusIcons = {
                active: 'fas fa-video',
                inactive: 'fas fa-video-slash',
                error: 'fas fa-exclamation-triangle'
            };
            
            const statusLabels = {
                active: 'Active',
                inactive: 'Inactive',
                error: 'Erreur'
            };
            
            const cameraLogs = logsHistory.filter(log => log.cameraId === camera.id);
            const todayLogs = cameraLogs.filter(log => {
                const logDate = new Date(log.timestamp);
                const today = new Date();
                return logDate.toDateString() === today.toDateString();
            }).length;
            
            return `
                <div class="camera-card ${camera.status}">
                    <div class="camera-header">
                        <div class="camera-name">${camera.name}</div>
                        <div class="camera-status ${camera.status}">
                            <i class="${statusIcons[camera.status]}"></i>
                            ${statusLabels[camera.status]}
                        </div>
                    </div>
                    <div class="camera-info">
                        <div class="camera-info-item">
                            <span class="camera-info-label">Localisation:</span>
                            <span class="camera-info-value">${camera.location}</span>
                        </div>
                        <div class="camera-info-item">
                            <span class="camera-info-label">IP:</span>
                            <span class="camera-info-value">${camera.ip}</span>
                        </div>
                        <div class="camera-info-item">
                            <span class="camera-info-label">Violences aujourd'hui:</span>
                            <span class="camera-info-value">${todayLogs}</span>
                        </div>
                        <div class="camera-info-item">
                            <span class="camera-info-label">Total détections:</span>
                            <span class="camera-info-value">${cameraLogs.length}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    static populateFilters() {
        this.populateCityFilter();
        this.populateDistrictFilter();
    }
    
    static populateCityFilter() {
        const select = document.getElementById('cityFilter');
        if (!select) return;
        
        // Garder l'option "Toutes les villes"
        const allOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        select.appendChild(allOption);
        
        const cities = [...new Set(camerasData.map(camera => camera.location.split(' - ')[0]))];
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            select.appendChild(option);
        });
    }
    
    static populateDistrictFilter() {
        const select = document.getElementById('districtFilter');
        if (!select) return;
        
        // Garder l'option "Tous les quartiers"
        const allOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        select.appendChild(allOption);
        
        const districts = [...new Set(camerasData.map(camera => camera.district))];
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            select.appendChild(option);
        });
    }
    
    static addNewLog() {
        const log = this.generateRandomLog();
        if (log) {
            this.updateLogsTable();
            this.updateStatistics();
            this.updateDashboard();
            
            // Mettre en surbrillance la nouvelle entrée
            setTimeout(() => {
                const newRow = document.querySelector(`tr[data-log-id="${log.id}"]`);
                if (newRow) {
                    newRow.classList.add('new-log');
                    setTimeout(() => {
                        newRow.classList.remove('new-log');
                    }, 2000);
                }
            }, 100);
        }
    }
    
    static updateDashboard() {
        this.updateRiskZones();
        this.updatePriorityCameras();
        this.updateRecentActivity();
        this.updateNetworkStats();
    }
    
    static updateNetworkStats() {
        const container = document.getElementById('networkStats');
        if (!container) return;
        
        const totalCameras = camerasData.length;
        const activeCameras = camerasData.filter(cam => cam.status === 'active').length;
        const errorCameras = camerasData.filter(cam => cam.status === 'error').length;
        const networkUptime = Math.floor(Math.random() * 10) + 95; // 95-99%
        
        container.innerHTML = `
            <div class="network-stat-item">
                <div class="stat-label">Caméras actives</div>
                <div class="stat-value">${activeCameras}/${totalCameras}</div>
                <div class="stat-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(activeCameras/totalCameras)*100}%"></div>
                    </div>
                </div>
            </div>
            <div class="network-stat-item">
                <div class="stat-label">Uptime réseau</div>
                <div class="stat-value">${networkUptime}%</div>
                <div class="stat-progress">
                    <div class="progress-bar">
                        <div class="progress-fill success" style="width: ${networkUptime}%"></div>
                    </div>
                </div>
            </div>
            <div class="network-stat-item">
                <div class="stat-label">Caméras en erreur</div>
                <div class="stat-value error">${errorCameras}</div>
                <div class="stat-icon">
                    <i class="fas fa-${errorCameras > 0 ? 'exclamation-triangle' : 'check-circle'}"></i>
                </div>
            </div>
        `;
    }
    
    static updateRiskZones() {
        const container = document.getElementById('riskZones');
        if (!container) return;
        
        const riskMap = {};
        logsHistory.forEach(log => {
            const key = log.location;
            if (!riskMap[key]) {
                riskMap[key] = { count: 0, severity: 0 };
            }
            riskMap[key].count++;
            riskMap[key].severity += ['low', 'medium', 'high', 'critical'].indexOf(log.severity) + 1;
        });
        
        const riskZones = Object.entries(riskMap)
            .sort((a, b) => (b[1].severity / b[1].count) - (a[1].severity / a[1].count))
            .slice(0, 5);
        
        container.innerHTML = riskZones.map(([location, data]) => {
            const avgSeverity = data.severity / data.count;
            const severityClass = avgSeverity >= 3 ? 'critical' : avgSeverity >= 2 ? 'high' : 'medium';
            return `
                <div class="risk-zone-item ${severityClass}">
                    <div class="zone-location">${location}</div>
                    <div class="zone-stats">
                        <span class="violation-count">${data.count} incidents</span>
                        <span class="severity-indicator ${severityClass}"></span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    static updatePriorityCameras() {
        const container = document.getElementById('priorityCameras');
        if (!container) return;
        
        const priorityCameras = camerasData
            .filter(cam => cam.priority === 'high' || cam.status === 'error')
            .slice(0, 5);
        
        container.innerHTML = priorityCameras.map(camera => `
            <div class="priority-camera-item ${camera.status}">
                <div class="camera-info">
                    <div class="camera-name">${camera.name}</div>
                    <div class="camera-location">${camera.location}</div>
                </div>
                <div class="camera-status-indicator">
                    <i class="fas fa-${camera.status === 'active' ? 'video' : camera.status === 'error' ? 'exclamation-triangle' : 'video-slash'}"></i>
                    <span class="status-text">${camera.status}</span>
                </div>
            </div>
        `).join('');
    }
    
    static updateRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        const recentLogs = logsHistory.slice(0, 5);
        
        container.innerHTML = recentLogs.map(log => {
            const timeAgo = this.getTimeAgo(new Date(log.timestamp));
            return `
                <div class="activity-item">
                    <div class="activity-icon ${log.severity}">
                        <i class="fas fa-${log.violenceType === 'physical' ? 'fist-raised' : log.violenceType === 'weapon' ? 'gun' : log.violenceType === 'blood' ? 'tint' : 'exclamation'}"></i>
                    </div>
                    <div class="activity-details">
                        <div class="activity-description">
                            ${log.violenceType} détecté à ${log.location}
                        </div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                    <div class="activity-severity ${log.severity}">
                        ${log.severity}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    static getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'À l\'instant';
        if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)}min`;
        if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
        return `Il y a ${Math.floor(diffInSeconds / 86400)}j`;
    }
}

// Fonctions de contrôle des logs
function toggleAutoRefresh() {
    const btn = document.getElementById('autoRefreshBtn');
    if (!btn) return;
    
    isAutoRefresh = !isAutoRefresh;
    
    if (isAutoRefresh) {
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        btn.classList.add('active');
        autoRefreshInterval = setInterval(() => {
            CameraLogsManager.addNewLog();
        }, Math.random() * 10000 + 5000); // 5-15 secondes
    } else {
        btn.innerHTML = '<i class="fas fa-play"></i> Auto-refresh';
        btn.classList.remove('active');
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }
}

function clearLogs() {
    if (confirm('Êtes-vous sûr de vouloir effacer tous les logs ?')) {
        logsHistory = [];
        localStorage.setItem('logsHistory', JSON.stringify(logsHistory));
        CameraLogsManager.updateLogsTable();
        CameraLogsManager.updateStatistics();
        alert('Logs effacés.');
    }
}

function exportLogs() {
    const csvContent = [
        ['Heure', 'Caméra', 'Type de violence', 'Ville', 'Zone', 'Localisation complète', 'Gravité', 'Confiance', 'Confirmé'].join(','),
        ...logsHistory.map(log => [
            new Date(log.timestamp).toLocaleString('fr-FR'),
            log.cameraName,
            log.violenceType,
            log.city || log.location.split(' - ')[0],
            log.zone || log.location.split(' - ')[1] || log.location,
            log.location,
            log.severity,
            log.confidence + '%',
            log.confirmed ? 'Oui' : 'Non'
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs-violence-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function filterLogs() {
    const severityFilter = document.getElementById('severityFilter')?.value;
    const cityFilter = document.getElementById('cityFilter')?.value;
    const districtFilter = document.getElementById('districtFilter')?.value;
    const priorityFilter = document.getElementById('priorityFilter')?.value;
    const timeFilter = document.getElementById('timeFilter')?.value;
    
    const rows = document.querySelectorAll('.log-row');
    rows.forEach(row => {
        const severity = row.getAttribute('data-severity');
        const locationCell = row.querySelector('td:nth-child(4)'); // Colonne localisation
        const location = locationCell ? locationCell.textContent : '';
        const city = location.split(' - ')[0];
        const district = location.split(' - ')[1] || '';
        const timeCell = row.querySelector('td:nth-child(1)');
        const logTime = timeCell ? new Date(timeCell.querySelector('.log-time')?.textContent || Date.now()) : new Date();
        
        let show = true;
        
        // Filtre par gravité
        if (severityFilter && severity !== severityFilter) {
            show = false;
        }
        
        // Filtre par ville
        if (cityFilter && city !== cityFilter) {
            show = false;
        }
        
        // Filtre par quartier
        if (districtFilter && district !== districtFilter) {
            show = false;
        }
        
        // Filtre par priorité (basé sur la gravité)
        if (priorityFilter) {
            const isHighPriority = severity === 'critical' || severity === 'high';
            if (priorityFilter === 'high' && !isHighPriority) {
                show = false;
            }
            if (priorityFilter === 'normal' && isHighPriority) {
                show = false;
            }
        }
        
        // Filtre par temps
        if (timeFilter) {
            const now = new Date();
            const timeDiff = now - logTime;
            
            switch (timeFilter) {
                case 'last-hour':
                    if (timeDiff > 3600000) show = false;
                    break;
                case 'last-4-hours':
                    if (timeDiff > 14400000) show = false;
                    break;
                case 'today':
                    if (logTime.toDateString() !== now.toDateString()) show = false;
                    break;
                case 'last-week':
                    if (timeDiff > 604800000) show = false;
                    break;
            }
        }
        
        row.style.display = show ? '' : 'none';
    });
    
    // Mettre à jour le compteur
    const visibleRows = document.querySelectorAll('.log-row:not([style*="display: none"])');
    const countElement = document.getElementById('logsCount');
    if (countElement) {
        countElement.textContent = visibleRows.length;
    }
}

function showCriticalAlerts() {
    document.getElementById('severityFilter').value = 'critical';
    document.getElementById('priorityFilter').value = 'high';
    filterLogs();
}

function showCameraStatus() {
    // Filtrer pour montrer les caméras avec des problèmes
    alert('Fonctionnalité d\'état du réseau à implémenter');
}

function viewLogDetails(logId) {
    const log = logsHistory.find(l => l.id === logId);
    if (log) {
        // Créer une analyse temporaire pour la page de détail
        const tempAnalysis = {
            id: log.id,
            timestamp: log.timestamp,
            hasViolence: true,
            confidence: log.confidence,
            severity: log.severity,
            violenceTypes: [log.violenceType],
            imageInfo: {
                name: `Détection_${log.cameraName}_${new Date(log.timestamp).toISOString().split('T')[0]}.jpg`,
                size: 1024000,
                type: 'image/jpeg',
                dimensions: { width: 1920, height: 1080 }
            },
            detectionZones: [{
                id: 1,
                x: Math.random() * 60 + 10,
                y: Math.random() * 60 + 10,
                width: Math.random() * 20 + 10,
                height: Math.random() * 20 + 10,
                confidence: log.confidence / 100,
                type: log.violenceType,
                label: log.violenceType
            }],
            technicalDetails: {
                model: 'ViolenceDetector v2.1',
                version: '2.1.3',
                threshold: 0.75,
                algorithm: 'CNN + R-CNN'
            }
        };
        
        sessionStorage.setItem('currentAnalysis', JSON.stringify(tempAnalysis));
        window.location.href = 'detail.html';
    }
}

function confirmLog(logId) {
    const log = logsHistory.find(l => l.id === logId);
    if (log) {
        log.confirmed = true;
        localStorage.setItem('logsHistory', JSON.stringify(logsHistory));
        CameraLogsManager.updateLogsTable();
        alert('Log confirmé.');
    }
}

function reportFalsePositive(logId) {
    const log = logsHistory.find(l => l.id === logId);
    if (log) {
        log.confirmed = false;
        log.falsePositive = true;
        localStorage.setItem('logsHistory', JSON.stringify(logsHistory));
        CameraLogsManager.updateLogsTable();
        alert('Faux positif signalé.');
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les logs de caméras sur la page principale
    if (document.getElementById('logsTable')) {
        CameraLogsManager.init();
    }
    
    // Initialiser l'uploader d'images sur la page principale (gardé pour compatibilité)
    if (document.getElementById('uploadArea')) {
        ImageUploader.init();
        ImageUploader.updateHistoryDisplay();
    }
    
        // Initialiser la carte si on est sur la page carte
        if (document.getElementById('map')) {
            // La carte sera initialisée par le script inline dans carte.html
            loadMapData();
        }
    
    // Initialiser les détails si on est sur la page détail
    if (document.getElementById('detailImage')) {
        loadAnalysisDetails();
    }
    
    // Initialiser la confirmation si on est sur la page confirmation
    if (document.getElementById('confirmImage')) {
        loadConfirmationData();
    }
});

// Ajouter des animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
    }
    
    .no-history {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
    }
    
    .no-history i {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
    
    .history-item {
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;
    }
    
    .history-item:hover {
        border-color: var(--primary-color);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }
    
    .history-image {
        position: relative;
        margin-bottom: 1rem;
    }
    
    .history-placeholder {
        width: 100%;
        height: 120px;
        background: var(--bg-tertiary);
        border-radius: var(--border-radius);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: var(--text-muted);
    }
    
    .history-status {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 0.875rem;
    }
    
    .history-status.violent {
        background: var(--danger-color);
    }
    
    .history-status.safe {
        background: var(--success-color);
    }
    
    .history-info h4 {
        margin-bottom: 0.5rem;
        font-size: 1rem;
        color: var(--text-primary);
    }
    
    .history-info p {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0.25rem 0;
    }
    
    .confirmation-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        margin-bottom: 1rem;
    }
    
    .confirmation-image {
        width: 3rem;
        height: 3rem;
        background: var(--bg-tertiary);
        border-radius: var(--border-radius);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
    }
    
    .confirmation-info {
        flex: 1;
    }
    
    .confirmation-info h4 {
        margin-bottom: 0.25rem;
        font-size: 1rem;
    }
    
    .confirmation-info p {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0.125rem 0;
    }
    
    .confirmation-status {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    }
    
    .confirmation-status.correct {
        background: var(--success-color);
    }
    
    .confirmation-status.incorrect {
        background: var(--danger-color);
    }
`;
document.head.appendChild(style);

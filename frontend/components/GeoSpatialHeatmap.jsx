import React, { useState, useMemo } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// You would typically fetch this GeoJSON from your backend or a static file
const MOCK_DELHI_GEOJSON = {
    type: "FeatureCollection",
    features: [
        // Simplified feature for demo (Replacewith real ward boundaries)
        {
            type: "Feature",
            properties: { wardId: "W-101", name: "South Delhi", riskScore: 72 },
            geometry: { type: "Polygon", coordinates: [[[77.2, 28.5], [77.25, 28.5], [77.25, 28.55], [77.2, 28.55], [77.2, 28.5]]] }
        },
        {
            type: "Feature",
            properties: { wardId: "W-102", name: "Karol Bagh", riskScore: 45 },
            geometry: { type: "Polygon", coordinates: [[[77.15, 28.6], [77.2, 28.6], [77.2, 28.65], [77.15, 28.65], [77.15, 28.6]]] }
        }
    ]
};

const GeoSpatialHeatmap = ({ riskData = [] }) => {
    const [hoverInfo, setHoverInfo] = useState(null);

    // Merge live risk data into GeoJSON properties
    const data = useMemo(() => {
        if (!riskData.length) return MOCK_DELHI_GEOJSON;

        const features = MOCK_DELHI_GEOJSON.features.map(f => {
            const match = riskData.find(r => r.wardId === f.properties.wardId);
            return {
                ...f,
                properties: {
                    ...f.properties,
                    riskScore: match ? match.riskScore : f.properties.riskScore,
                    outbreakCategory: match ? match.outbreakCategory : "UNKNOWN"
                }
            };
        });
        return { type: "FeatureCollection", features };
    }, [riskData]);

    const layerStyle = {
        id: 'ward-risk-fill',
        type: 'fill',
        paint: {
            'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'riskScore'],
                0, '#22c55e',    // Low risk - Green
                40, '#eab308',   // Medium - Yellow
                70, '#f97316',   // High - Orange
                90, '#ef4444'    // Critical - Red
            ],
            'fill-opacity': 0.6
        }
    };

    const lineStyle = {
        id: 'ward-borders',
        type: 'line',
        paint: {
            'line-color': '#ffffff',
            'line-width': 1,
            'line-opacity': 0.5
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }}>
            <Map
                initialViewState={{
                    longitude: 77.2090,
                    latitude: 28.6139,
                    zoom: 10
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                interactiveLayerIds={['ward-risk-fill']}
                onMouseMove={evt => {
                    const { features, point } = evt;
                    if (features && features.length > 0) {
                        setHoverInfo({
                            feature: features[0],
                            x: point.x,
                            y: point.y
                        });
                    } else {
                        setHoverInfo(null);
                    }
                }}
                onMouseLeave={() => setHoverInfo(null)}
            >
                <Source id="delhi-wards" type="geojson" data={data}>
                    <Layer {...layerStyle} />
                    <Layer {...lineStyle} />
                </Source>

                {hoverInfo && (
                    <div style={{
                        position: 'absolute',
                        left: hoverInfo.x,
                        top: hoverInfo.y,
                        pointerEvents: 'none',
                        zIndex: 100,
                        transform: 'translate(-50%, -100%)',
                        marginTop: '-10px'
                    }}>
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.9)',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(4px)'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                {hoverInfo.feature.properties.name} ({hoverInfo.feature.properties.wardId})
                            </div>
                            <div>Risk Score: <b>{hoverInfo.feature.properties.riskScore}</b></div>
                            <div style={{ textTransform: 'uppercase', fontSize: '10px', color: '#cbd5e1' }}>
                                {hoverInfo.feature.properties.outbreakCategory}
                            </div>
                        </div>
                    </div>
                )}
            </Map>
        </div>
    );
};

export default GeoSpatialHeatmap;

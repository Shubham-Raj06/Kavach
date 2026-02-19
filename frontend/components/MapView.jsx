'use client';
import { useEffect, useRef, useCallback } from 'react';

const RISK_TO_COLOR = (score) => {
    if (score >= 0.8) return [239, 68, 68];   // red
    if (score >= 0.6) return [249, 115, 22];  // orange
    if (score >= 0.4) return [234, 179, 8];   // yellow
    return [34, 197, 94];                      // green
};

export default function MapView({ data = [], selectedWard, onSelectWard }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
            // Render a fallback canvas-based map if no Mapbox token
            renderFallbackMap(mapContainer.current, data, onSelectWard);
            return;
        }

        import('mapbox-gl').then((mapboxgl) => {
            mapboxgl.default.accessToken = token;

            const map = new mapboxgl.default.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [72.87, 19.07],
                zoom: 11,
            });

            mapRef.current = map;

            map.on('load', () => {
                // Add heatmap source
                map.addSource('risk-data', {
                    type: 'geojson',
                    data: buildGeoJSON(data),
                });

                // Heatmap layer
                map.addLayer({
                    id: 'risk-heatmap',
                    type: 'heatmap',
                    source: 'risk-data',
                    paint: {
                        'heatmap-weight': ['get', 'riskScore'],
                        'heatmap-intensity': 1.5,
                        'heatmap-radius': 40,
                        'heatmap-color': [
                            'interpolate', ['linear'], ['heatmap-density'],
                            0, 'rgba(0,0,0,0)',
                            0.3, 'rgba(34,197,94,0.6)',
                            0.6, 'rgba(234,179,8,0.8)',
                            0.8, 'rgba(249,115,22,0.9)',
                            1, 'rgba(239,68,68,1)',
                        ],
                        'heatmap-opacity': 0.8,
                    },
                });

                // Circle layer for ward markers
                map.addLayer({
                    id: 'risk-circles',
                    type: 'circle',
                    source: 'risk-data',
                    paint: {
                        'circle-radius': 10,
                        'circle-color': [
                            'interpolate', ['linear'], ['get', 'riskScore'],
                            0, '#22c55e',
                            0.4, '#eab308',
                            0.7, '#f97316',
                            1, '#ef4444',
                        ],
                        'circle-opacity': 0.9,
                        'circle-stroke-color': '#fff',
                        'circle-stroke-width': 1.5,
                    },
                });

                // Click handler
                map.on('click', 'risk-circles', (e) => {
                    const props = e.features[0].properties;
                    onSelectWard(props);
                });

                map.on('mouseenter', 'risk-circles', () => {
                    map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', 'risk-circles', () => {
                    map.getCanvas().style.cursor = '';
                });
            });
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update data when heatmap changes
    useEffect(() => {
        if (!mapRef.current || !data.length) return;
        const source = mapRef.current.getSource('risk-data');
        if (source) source.setData(buildGeoJSON(data));
    }, [data]);

    return (
        <div ref={mapContainer} className="w-full h-full" id="map-container" />
    );
}

function buildGeoJSON(data) {
    return {
        type: 'FeatureCollection',
        features: data
            .filter((d) => d.latitude && d.longitude)
            .map((d) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [d.longitude, d.latitude] },
                properties: { ...d, riskScore: d.riskScore ?? 0 },
            })),
    };
}

// ── Fallback canvas map (no Mapbox token) ────────────────────────────────────
function renderFallbackMap(container, data, onSelectWard) {
    container.style.background = '#0d1117';
    container.style.position = 'relative';
    container.innerHTML = `
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;">
      <div style="color:#6b7280;font-size:13px;text-align:center;">
        <div style="font-size:24px;margin-bottom:8px;">🗺️</div>
        <div style="color:#9ca3af;font-weight:600;margin-bottom:4px;">Interactive Heatmap</div>
        <div style="color:#6b7280;font-size:12px;">Add NEXT_PUBLIC_MAPBOX_TOKEN to enable</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:500px;padding:0 16px;">
        ${data.map(w => {
        const score = w.riskScore ?? 0;
        const color = score >= 0.8 ? '#ef4444' : score >= 0.6 ? '#f97316' : score >= 0.4 ? '#eab308' : '#22c55e';
        return `<div
            onclick="window.__kavachSelectWard('${w.wardId}')"
            style="background:${color}22;border:1px solid ${color}66;color:${color};padding:6px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-weight:600;">
            ${w.name?.split(' - ')[1] || w.name} ${(score * 100).toFixed(0)}%
          </div>`;
    }).join('')}
      </div>
    </div>
  `;
    // Bridge click events
    window.__kavachSelectWard = (wardId) => {
        const ward = data.find(w => w.wardId === wardId);
        if (ward) onSelectWard(ward);
    };
}

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ArrowLeft, Eye, EyeOff, Layers, Navigation } from 'lucide-react';
import {
  formatBRL,
  formatNumber,
  getComplexTotals,
  HousingComplex,
  ReferenceHub,
  RouteResult,
} from '../data/habitacionais';

type BaseLayerId = 'osm' | 'satellite';
export type RouteCompareMode = 'both' | 'praca-padre-cicero' | 'cariri-shopping';

interface InteractiveMapProps {
  complexes: HousingComplex[];
  hubs: ReferenceHub[];
  selectedComplexId: string | null;
  routeCompareMode: RouteCompareMode;
  onSelectComplex: (id: string | null) => void;
  onSelectHubMode: (mode: RouteCompareMode) => void;
  onReturnBroadView: () => void;
  routeToPraca: RouteResult | null;
  routeToShopping: RouteResult | null;
  routesPracaById: Record<string, RouteResult>;
  routesShoppingById: Record<string, RouteResult>;
  travelMode: 'car' | 'walk';
  isRouteLoading: boolean;
  isBroadView?: boolean;
  broadViewResetKey?: number;
}

const TILE_LAYERS: Record<
  BaseLayerId,
  { label: string; url: string; attribution: string; maxNativeZoom: number; maxZoom: number }
> = {
  osm: {
    label: 'Ruas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    maxNativeZoom: 16,
    maxZoom: 18,
  },
  satellite: {
    label: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics',
    maxNativeZoom: 17,
    maxZoom: 18,
  },
};

const LABEL_DIRECTION: Record<
  string,
  { direction: 'top' | 'bottom' | 'left' | 'right'; offset: [number, number] }
> = {
  'beata-maria-araujo': { direction: 'right', offset: [16, 0] },
  'leandro-bezerra': { direction: 'right', offset: [16, 0] },
  'mirante-da-serra': { direction: 'top', offset: [0, -18] },
  'tenente-coelho': { direction: 'top', offset: [0, -18] },
  'nossa-senhora-das-dores': { direction: 'left', offset: [-16, 4] },
  'sao-sebastiao': { direction: 'bottom', offset: [0, 18] },
  'padre-cicero': { direction: 'left', offset: [-16, 0] },
};

function createHouseMarkerIcon(
  isSelected: boolean,
  isPlanned: boolean
): L.DivIcon {
  const fill = isPlanned ? '#B45309' : '#C71E1D';
  const ring = isSelected ? '#1C1917' : '#FFFFFF';
  const size = isSelected ? 34 : 26;
  const strokeWidth = isSelected ? 2.5 : 1.75;

  return L.divIcon({
    className: 'custom-house-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:9999px;
        background:${fill};
        border:${strokeWidth}px solid ${ring};
        box-shadow:${
          isSelected
            ? '0 4px 12px rgba(28,25,23,0.38)'
            : '0 2px 5px rgba(28,25,23,0.22)'
        };
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
      ">
        <svg width="${Math.round(size * 0.54)}" height="${Math.round(size * 0.54)}" viewBox="0 0 24 24" fill="white" aria-hidden="true">
          <path d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3z"/>
        </svg>
      </div>
    `,
  });
}

function createHubMarkerIcon(hub: ReferenceHub, isActive: boolean): L.DivIcon {
  const size = isActive ? 32 : 28;
  const iconSize = Math.round(size * 0.56);
  const svgIcon =
    hub.id === 'praca-padre-cicero'
      ? `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 22v-7"/>
          <path d="M17 15H7l2-5H7.5L12 3l4.5 7H15l2 5Z"/>
        </svg>`
      : `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <path d="M3 6h18"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>`;

  return L.divIcon({
    className: 'custom-hub-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:6px;
        background:#0369A1;
        border:${isActive ? 2.5 : 1.75}px solid ${isActive ? '#1C1917' : '#FFFFFF'};
        box-shadow:0 3px 10px rgba(28,25,23,0.28);
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
      ">
        ${svgIcon}
      </div>
    `,
  });
}

export function InteractiveMap({
  complexes,
  hubs,
  selectedComplexId,
  routeCompareMode,
  onSelectComplex,
  onSelectHubMode,
  onReturnBroadView,
  routeToPraca,
  routeToShopping,
  routesPracaById,
  routesShoppingById,
  travelMode,
  isRouteLoading,
  isBroadView = false,
  broadViewResetKey = 0,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const ringsLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const hoverTooltipRef = useRef<L.Tooltip | null>(null);

  const [baseLayer, setBaseLayer] = useState<BaseLayerId>('osm');
  const [showRings, setShowRings] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [-7.216, -39.302],
      zoom: 12.5,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    ringsLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Clicking empty map area clears selection back to broad view
    map.on('click', () => {
      onSelectComplex(null);
    });

    mapRef.current = map;

    const invalidateTimer = window.setTimeout(() => {
      map.invalidateSize(false);
    }, 150);

    const observer = new ResizeObserver(() => {
      map.invalidateSize(false);
    });
    observer.observe(el);

    return () => {
      window.clearTimeout(invalidateTimer);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [onSelectComplex]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const cfg = TILE_LAYERS[baseLayer];
    const tl = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxNativeZoom: cfg.maxNativeZoom,
      maxZoom: cfg.maxZoom,
    }).addTo(map);
    tl.bringToBack();
    tileLayerRef.current = tl;
  }, [baseLayer]);

  useEffect(() => {
    const ringsLayer = ringsLayerRef.current;
    if (!ringsLayer) return;
    ringsLayer.clearLayers();

    if (!showRings || isBroadView) return;
    const centerHub =
      routeCompareMode === 'cariri-shopping'
        ? hubs.find((h) => h.id === 'cariri-shopping') ?? hubs[1]
        : hubs.find((h) => h.id === 'praca-padre-cicero') ?? hubs[0];

    if (!centerHub) return;

    [2000, 5000, 8000].forEach((radiusMeters) => {
      L.circle([centerHub.coords.lat, centerHub.coords.lng], {
        radius: radiusMeters,
        color: '#0369A1',
        weight: 1,
        opacity: 0.3,
        dashArray: '4, 6',
        fillColor: '#0369A1',
        fillOpacity: radiusMeters === 2000 ? 0.035 : 0.012,
        interactive: false,
      }).addTo(ringsLayer);
    });
  }, [hubs, routeCompareMode, showRings, isBroadView]);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;
    markersLayer.clearLayers();

    if (hoverTooltipRef.current) {
      map.closeTooltip(hoverTooltipRef.current);
    }

    let closeTimer: number | null = null;

    const clearCloseTimer = () => {
      if (closeTimer !== null) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    };

    const openHoverCard = (
      latLng: [number, number],
      direction: 'top' | 'bottom',
      html: string
    ) => {
      clearCloseTimer();
      if (hoverTooltipRef.current) {
        map.closeTooltip(hoverTooltipRef.current);
      }
      const tooltip = L.tooltip({
        direction,
        offset: direction === 'bottom' ? [0, 22] : [0, -22],
        className: 'editorial-marker-hover-card',
        interactive: false,
      })
        .setLatLng(latLng)
        .setContent(html);
      hoverTooltipRef.current = tooltip;
      tooltip.openOn(map);
    };

    const closeHoverCardImmediate = () => {
      clearCloseTimer();
      if (hoverTooltipRef.current) {
        map.closeTooltip(hoverTooltipRef.current);
      }
    };

    const scheduleCloseHoverCard = () => {
      clearCloseTimer();
      closeTimer = window.setTimeout(() => {
        if (hoverTooltipRef.current) {
          map.closeTooltip(hoverTooltipRef.current);
        }
      }, 65);
    };

    const bindLabelInteractions = (
      marker: L.Marker,
      onHover: () => void,
      onClick: () => void
    ) => {
      const el = marker.getTooltip()?.getElement();
      if (!el) return;
      L.DomEvent.on(el, 'mouseenter', onHover);
      L.DomEvent.on(el, 'mouseleave', scheduleCloseHoverCard);
      L.DomEvent.on(el, 'click', (e) => {
        L.DomEvent.stopPropagation(e);
        closeHoverCardImmediate();
        onClick();
      });
    };

    const labeledEntries: { marker: L.Marker; priority: number }[] = [];

    hubs.forEach((hub) => {
      const isActive =
        !isBroadView &&
        (routeCompareMode === 'both' || routeCompareMode === hub.id);
      const marker = L.marker([hub.coords.lat, hub.coords.lng], {
        icon: createHubMarkerIcon(hub, isActive),
        zIndexOffset: 900,
      });

      const showHubHover = () => {
        openHoverCard(
          [hub.coords.lat, hub.coords.lng],
          hub.id === 'praca-padre-cicero' ? 'bottom' : 'top',
          `<div style="font-weight:700;color:#0369A1;margin-bottom:2px;">${hub.name}</div>` +
            `<div style="color:#57534e;font-size:11px;">Ponto de referência · clique para filtrar trajetos até este destino</div>`
        );
      };

      const selectHub = () => onSelectHubMode(hub.id);

      marker.on('mouseover', showHubHover);
      marker.on('mouseout', scheduleCloseHoverCard);
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        closeHoverCardImmediate();
        selectHub();
      });
      if (showLabels || isActive) {
        marker.bindTooltip(hub.shortName, {
          permanent: true,
          direction: 'left',
          offset: [-16, 0],
          className: 'editorial-hub-label',
          interactive: true,
        });
      }
      marker.addTo(markersLayer);
      if (showLabels || isActive) {
        bindLabelInteractions(marker, showHubHover, selectHub);
        labeledEntries.push({ marker, priority: isActive ? 1 : 2 });
      } else {
        labeledEntries.push({ marker, priority: 99 });
      }
    });

    complexes.forEach((complex) => {
      const isSelected = complex.id === selectedComplexId;
      const isPlanned = complex.status === 'previsto';
      const totals = getComplexTotals(complex);
      const rPraca = routesPracaById[complex.id];
      const rShopping = routesShoppingById[complex.id];
      const pracaDist = rPraca
        ? `${rPraca.distanceKm.toFixed(1).replace('.', ',')} km`
        : '—';
      const shoppingDist = rShopping
        ? `${rShopping.distanceKm.toFixed(1).replace('.', ',')} km`
        : '—';

      const marker = L.marker([complex.coords.lat, complex.coords.lng], {
        icon: createHouseMarkerIcon(isSelected, isPlanned),
        zIndexOffset: isSelected ? 1000 : 300,
      });

      const showComplexHover = () => {
        openHoverCard(
          [complex.coords.lat, complex.coords.lng],
          complex.id === 'leandro-bezerra' ? 'bottom' : 'top',
          `<div style="font-weight:700;color:#1c1917;margin-bottom:1px;">${complex.name}</div>` +
            `<div style="color:#78716c;font-size:10.5px;margin-bottom:6px;">${complex.neighborhood} · ${complex.statusLabel}</div>` +
            `<div style="display:grid;gap:2px;font-size:11px;border-top:1px solid #e7e5e4;padding-top:5px;">` +
            `<div style="display:flex;justify-content:space-between;gap:10px;"><span style="color:#57534e;">Casas:</span><strong style="font-family:var(--font-mono);font-variant-numeric:tabular-nums;">${formatNumber(totals.units)}</strong></div>` +
            `<div style="display:flex;justify-content:space-between;gap:10px;"><span style="color:#57534e;">Valor:</span><strong style="font-family:var(--font-mono);font-variant-numeric:tabular-nums;">${formatBRL(totals.value)}</strong></div>` +
            `<div style="display:flex;justify-content:space-between;gap:10px;"><span style="color:#57534e;">Praça / Shopping:</span><strong style="font-family:var(--font-mono);font-variant-numeric:tabular-nums;">${pracaDist} · ${shoppingDist}</strong></div>` +
            `</div>` +
            `<div style="margin-top:6px;padding-top:4px;border-top:1px solid #f5f5f4;color:#C71E1D;font-weight:600;font-size:10.5px;">${
              isSelected
                ? 'Selecionado · clique no ícone para voltar à visão ampla'
                : 'Clique no ícone para mais detalhes'
            }</div>`
        );
      };

      const toggleComplex = () => onSelectComplex(isSelected ? null : complex.id);

      marker.on('mouseover', showComplexHover);
      marker.on('mouseout', scheduleCloseHoverCard);
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        closeHoverCardImmediate();
        toggleComplex();
      });

      if (showLabels || isSelected) {
        const placement = LABEL_DIRECTION[complex.id] ?? {
          direction: 'right' as const,
          offset: [16, 0] as [number, number],
        };
        marker.bindTooltip(complex.shortName, {
          permanent: true,
          direction: placement.direction,
          offset: placement.offset,
          className: isPlanned
            ? 'editorial-map-label editorial-map-label-previsto'
            : 'editorial-map-label editorial-map-label-entregue',
          interactive: true,
        });
      }

      marker.addTo(markersLayer);
      if (showLabels || isSelected) {
        bindLabelInteractions(marker, showComplexHover, toggleComplex);
        labeledEntries.push({ marker, priority: isSelected ? 0 : 3 });
      } else {
        labeledEntries.push({ marker, priority: 99 });
      }
    });

    const resolveLabelCollisions = () => {
      const iconRects = labeledEntries
        .map((entry) => entry.marker.getElement()?.getBoundingClientRect() ?? null)
        .filter((r): r is DOMRect => r !== null);

      const acceptedLabelRects: DOMRect[] = [];
      const pad = 3;

      const overlaps = (a: DOMRect, b: DOMRect, margin: number) =>
        !(
          a.right + margin < b.left ||
          a.left - margin > b.right ||
          a.bottom + margin < b.top ||
          a.top - margin > b.bottom
        );

      const sorted = [...labeledEntries].sort((a, b) => a.priority - b.priority);
      sorted.forEach((entry) => {
        const tooltipEl = entry.marker.getTooltip()?.getElement();
        if (!tooltipEl) return;

        tooltipEl.style.opacity = '1';
        tooltipEl.style.pointerEvents = 'auto';

        // Always keep selected item's label visible
        if (entry.priority === 0) {
          acceptedLabelRects.push(tooltipEl.getBoundingClientRect());
          return;
        }

        const labelRect = tooltipEl.getBoundingClientRect();
        const hitsIcon = iconRects.some((ir) => overlaps(labelRect, ir, pad));
        const hitsLabel = acceptedLabelRects.some((lr) => overlaps(labelRect, lr, pad));

        if (hitsIcon || hitsLabel) {
          tooltipEl.style.opacity = '0';
          tooltipEl.style.pointerEvents = 'none';
        } else {
          acceptedLabelRects.push(labelRect);
        }
      });
    };

    const rafId = window.requestAnimationFrame(resolveLabelCollisions);
    map.on('zoomend', resolveLabelCollisions);
    map.on('moveend', resolveLabelCollisions);

    return () => {
      clearCloseTimer();
      window.cancelAnimationFrame(rafId);
      map.off('zoomend', resolveLabelCollisions);
      map.off('moveend', resolveLabelCollisions);
    };
  }, [
    hubs,
    complexes,
    selectedComplexId,
    routeCompareMode,
    isBroadView,
    routesPracaById,
    routesShoppingById,
    showLabels,
    onSelectComplex,
    onSelectHubMode,
  ]);

  // Draw route(s) when a complex is selected; otherwise frame all 9 points broadly
  useEffect(() => {
    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    routeLayer.clearLayers();

    const activeComplex = selectedComplexId
      ? complexes.find((c) => c.id === selectedComplexId)
      : null;
    const pracaHub = hubs.find((h) => h.id === 'praca-padre-cicero');
    const shoppingHub = hubs.find((h) => h.id === 'cariri-shopping');
    if (!pracaHub || !shoppingHub) return;

    if (!activeComplex) {
      const allBounds = L.latLngBounds([]);
      hubs.forEach((h) => allBounds.extend([h.coords.lat, h.coords.lng]));
      complexes.forEach((c) => allBounds.extend([c.coords.lat, c.coords.lng]));
      if (allBounds.isValid()) {
        map.invalidateSize(false);
        map.fitBounds(allBounds, {
          paddingTopLeft: [95, 42],
          paddingBottomRight: [48, 42],
          maxZoom: 13.5,
          animate: false,
        });
      }
      return;
    }

    // In Visão ampla, clicking a complex only highlights/zooms to that complex and shows its info on the map (no routes drawn)
    if (isBroadView) {
      L.circleMarker([activeComplex.coords.lat, activeComplex.coords.lng], {
        radius: 24,
        color: activeComplex.status === 'previsto' ? '#B45309' : '#C71E1D',
        weight: 2,
        opacity: 0.75,
        dashArray: '4, 4',
        fillColor: activeComplex.status === 'previsto' ? '#B45309' : '#C71E1D',
        fillOpacity: 0.14,
        interactive: false,
      }).addTo(routeLayer);

      map.invalidateSize(false);
      const targetZoom = 14;
      const point = map.project(
        [activeComplex.coords.lat, activeComplex.coords.lng],
        targetZoom
      );
      const isWide = containerRef.current
        ? containerRef.current.clientWidth >= 600
        : true;
      const offsetPoint = isWide
        ? L.point(point.x + 170, point.y)
        : L.point(point.x, point.y + 100);
      const targetLatLng = map.unproject(offsetPoint, targetZoom);
      map.setView(targetLatLng, targetZoom, { animate: true });
      return;
    }

    const bounds = L.latLngBounds([
      [activeComplex.coords.lat, activeComplex.coords.lng],
    ]);

    const showPraca =
      routeCompareMode === 'both' || routeCompareMode === 'praca-padre-cicero';
    const showShopping =
      routeCompareMode === 'both' || routeCompareMode === 'cariri-shopping';

    const formatRouteDuration = (minutes: number) => {
      if (minutes < 60) return `~${minutes} min`;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m === 0 ? `~${h}h` : `~${h}h${String(m).padStart(2, '0')}`;
    };

    const addInteractiveRoute = (
      route: RouteResult,
      color: string,
      destLabel: string
    ) => {
      L.polyline(route.geometry, {
        color: '#FFFFFF',
        weight: 6,
        opacity: 0.85,
        interactive: false,
      }).addTo(routeLayer);

      const mainLine = L.polyline(route.geometry, {
        color,
        weight: 3.5,
        opacity: 0.95,
        interactive: false,
      }).addTo(routeLayer);

      const mins =
        travelMode === 'walk' ? route.durationWalkMin : route.durationCarMin;
      const modeText = travelMode === 'walk' ? 'a pé' : 'de carro';
      const distText = `${route.distanceKm.toFixed(1).replace('.', ',')} km`;
      const durText = formatRouteDuration(mins);

      const hitLine = L.polyline(route.geometry, {
        color: '#000000',
        weight: 16,
        opacity: 0,
        interactive: true,
      }).addTo(routeLayer);

      hitLine.bindTooltip(
        `<div style="font-weight:600;color:#e7e5e4;font-size:10.5px;margin-bottom:1px;">${destLabel}</div>` +
          `<div style="font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-weight:600;">${distText} · ${durText} <span style="font-weight:400;color:#d6d3d1;">(${modeText})</span></div>`,
        {
          sticky: true,
          permanent: false,
          direction: 'top',
          offset: [0, -10],
          className: 'editorial-route-tooltip',
        }
      );

      hitLine.on('mouseover', () => {
        mainLine.setStyle({ weight: 5.5, opacity: 1 });
      });
      hitLine.on('mouseout', () => {
        mainLine.setStyle({ weight: 3.5, opacity: 0.95 });
      });
      hitLine.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
      });

      route.geometry.forEach((pt) => bounds.extend(pt));
    };

    if (showShopping) {
      bounds.extend([shoppingHub.coords.lat, shoppingHub.coords.lng]);
      if (routeCompareMode === 'cariri-shopping') {
        L.polyline(
          [
            [activeComplex.coords.lat, activeComplex.coords.lng],
            [shoppingHub.coords.lat, shoppingHub.coords.lng],
          ],
          {
            color: '#57534E',
            weight: 1.5,
            opacity: 0.55,
            dashArray: '5, 5',
            interactive: false,
          }
        ).addTo(routeLayer);
      }
      if (routeToShopping && routeToShopping.geometry.length > 1) {
        addInteractiveRoute(routeToShopping, '#0369A1', 'Até o Cariri Shopping');
      }
    }

    if (showPraca) {
      bounds.extend([pracaHub.coords.lat, pracaHub.coords.lng]);
      if (routeCompareMode === 'praca-padre-cicero') {
        L.polyline(
          [
            [activeComplex.coords.lat, activeComplex.coords.lng],
            [pracaHub.coords.lat, pracaHub.coords.lng],
          ],
          {
            color: '#57534E',
            weight: 1.5,
            opacity: 0.55,
            dashArray: '5, 5',
            interactive: false,
          }
        ).addTo(routeLayer);
      }
      if (routeToPraca && routeToPraca.geometry.length > 1) {
        addInteractiveRoute(routeToPraca, '#C71E1D', 'Até a Praça Padre Cícero');
      }
    }

    map.invalidateSize(false);
    map.fitBounds(bounds, { padding: [52, 52], maxZoom: 14, animate: false });
  }, [
    complexes,
    hubs,
    selectedComplexId,
    routeCompareMode,
    isBroadView,
    routeToPraca,
    routeToShopping,
    travelMode,
    broadViewResetKey,
  ]);

  const activeBroadComplex =
    isBroadView && selectedComplexId
      ? complexes.find((c) => c.id === selectedComplexId) ?? null
      : null;
  const activeBroadTotals = activeBroadComplex
    ? getComplexTotals(activeBroadComplex)
    : null;
  const activeBroadPraca = activeBroadComplex
    ? routesPracaById[activeBroadComplex.id]
    : undefined;
  const activeBroadShopping = activeBroadComplex
    ? routesShoppingById[activeBroadComplex.id]
    : undefined;

  return (
    <div className="flex flex-col border border-stone-200 bg-white rounded-xl overflow-hidden">
      {/* Map Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-stone-200 bg-stone-50/80">
        <div className="flex items-center gap-0.5 p-0.5 bg-stone-200/75 rounded-lg">
          {(Object.keys(TILE_LAYERS) as BaseLayerId[]).map((layerId) => (
            <button
              key={layerId}
              type="button"
              onClick={() => setBaseLayer(layerId)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                baseLayer === layerId
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {layerId === 'satellite' && <Layers className="w-3 h-3" />}
              {TILE_LAYERS[layerId].label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {!isBroadView && (
            <button
              type="button"
              onClick={() => setShowRings((v) => !v)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showRings
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900'
              }`}
            >
              Anéis 2·5·8 km
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowLabels((v) => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Rótulos
          </button>
        </div>
      </div>

      {/* Explicit Sized Map Container */}
      <div className="relative w-full h-[430px] sm:h-[470px]" style={{ minHeight: 430 }}>
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ width: '100%', height: '100%', minHeight: 430 }}
        />

        {isRouteLoading && (
          <div className="absolute top-3 left-3 z-[450] bg-white/95 border border-stone-200 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 shadow-xs flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-red-700" />
            Calculando trajetos…
          </div>
        )}

        {/* On-map Detailed Info Card when a complex is clicked in Visão ampla */}
        {activeBroadComplex && activeBroadTotals && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-auto sm:left-auto sm:top-3 sm:right-3 sm:w-[390px] md:w-[415px] max-h-[265px] sm:max-h-[calc(100%-24px)] overflow-y-auto z-[460] bg-white/98 backdrop-blur-xs border border-stone-300 rounded-xl shadow-lg p-3.5 sm:p-4 space-y-3 text-xs"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                  {activeBroadComplex.name}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {activeBroadComplex.neighborhood} · {activeBroadComplex.statusLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={onReturnBroadView}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                title="Voltar para visão ampla"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Visão ampla
              </button>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-[11.5px] sm:text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-100/80 text-[10px] uppercase tracking-wider text-stone-500">
                    <th className="py-1.5 px-2.5 font-semibold">Etapa</th>
                    <th className="py-1.5 px-2 font-semibold text-right whitespace-nowrap">
                      Qtd. casas
                    </th>
                    <th className="py-1.5 px-2.5 font-semibold text-right whitespace-nowrap">
                      Valor contratado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70 bg-white">
                  {activeBroadComplex.stages.map((st) => (
                    <tr key={st.id}>
                      <td className="py-1.5 px-2.5 text-stone-700 font-medium">
                        {st.name}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono-tabular font-semibold text-stone-900 whitespace-nowrap">
                        {formatNumber(st.units)}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono-tabular text-stone-900 whitespace-nowrap">
                        {formatBRL(st.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-stone-300 bg-stone-100 font-bold text-stone-900">
                    <td className="py-1.5 px-2.5">Total</td>
                    <td className="py-1.5 px-2 text-right font-mono-tabular whitespace-nowrap">
                      {formatNumber(activeBroadTotals.units)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono-tabular whitespace-nowrap">
                      {formatBRL(activeBroadTotals.value)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5 text-xs">
              <div className="bg-sky-50/60 border border-sky-200/70 rounded-lg px-2.5 py-1.5">
                <span className="text-[10.5px] text-stone-500 block">
                  Até a Praça Pe. Cícero
                </span>
                <strong className="font-mono-tabular text-sm text-[#0369A1]">
                  {activeBroadPraca
                    ? `${activeBroadPraca.distanceKm.toFixed(1).replace('.', ',')} km`
                    : '—'}
                </strong>
              </div>
              <div className="bg-sky-50/60 border border-sky-200/70 rounded-lg px-2.5 py-1.5">
                <span className="text-[10.5px] text-stone-500 block">
                  Até o Cariri Shopping
                </span>
                <strong className="font-mono-tabular text-sm text-[#0369A1]">
                  {activeBroadShopping
                    ? `${activeBroadShopping.distanceKm.toFixed(1).replace('.', ',')} km`
                    : '—'}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Map Legend */}
        <div
          className={`absolute bottom-3 left-3 z-[450] bg-white/95 backdrop-blur-xs border border-stone-200 rounded-lg px-3 py-2 text-[11px] text-stone-700 shadow-xs ${
            activeBroadComplex ? 'hidden sm:block' : ''
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C71E1D] inline-block" />
              Entregue
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B45309] inline-block" />
              Previsto 2027
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#0369A1] inline-block" />
              Praça / Shopping
            </span>
          </div>
          {!isBroadView && selectedComplexId && (
            <div className="mt-1 pt-1 border-t border-stone-200/80 flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-[#C71E1D] inline-block" />
                Rota Praça Pe. Cícero
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-[#0369A1] inline-block" />
                Rota Cariri Shopping
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

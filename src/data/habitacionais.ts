export interface LatLng {
  lat: number;
  lng: number;
}

export interface ReferenceHub {
  id: 'praca-padre-cicero' | 'cariri-shopping';
  name: string;
  shortName: string;
  coords: LatLng;
  color: string;
}

export interface ComplexStage {
  id: string;
  name: string;
  units: number;
  value: number;
}

export interface HousingComplex {
  id: string;
  name: string;
  shortName: string;
  neighborhood: string;
  status: 'entregue' | 'previsto';
  statusLabel: string;
  coords: LatLng;
  stages: ComplexStage[];
}

export interface ExtraProgramEntry {
  id: string;
  name: string;
  category: string;
  units: number;
  value: number;
}

export interface RouteResult {
  distanceKm: number;
  durationCarMin: number;
  durationWalkMin: number;
  geometry: [number, number][]; // [lat, lng] pairs for Leaflet
  source: 'osrm' | 'estimado';
}

// Polos de referência exatos do Datawrapper (iZ4lY v=7)
export const REFERENCE_HUBS: ReferenceHub[] = [
  {
    id: 'praca-padre-cicero',
    name: 'Praça Padre Cícero (Centro)',
    shortName: 'Praça Pe. Cícero',
    coords: { lat: -7.2016014, lng: -39.317691 },
    color: '#0369A1',
  },
  {
    id: 'cariri-shopping',
    name: 'Cariri Shopping',
    shortName: 'Cariri Shopping',
    coords: { lat: -7.2237419, lng: -39.3248034 },
    color: '#0369A1',
  },
];

// Os 7 conjuntos habitacionais mapeados no Datawrapper (iZ4lY v=7) + dados oficiais da tabela MCMV
export const HOUSING_COMPLEXES: HousingComplex[] = [
  {
    id: 'padre-cicero',
    name: 'Residencial Padre Cícero II e III',
    shortName: 'Padre Cícero II e III',
    neighborhood: 'Sítio Pedra de Fogo',
    status: 'entregue',
    statusLabel: 'Entregue (2021)',
    coords: { lat: -7.252782331242599, lng: -39.25933493620681 },
    stages: [
      {
        id: 'padre-cicero-2',
        name: 'Res. Padre Cícero II',
        units: 479,
        value: 36883000.0,
      },
      {
        id: 'padre-cicero-3',
        name: 'Res. Padre Cícero III',
        units: 433,
        value: 33341000.0,
      },
    ],
  },
  {
    id: 'beata-maria-araujo',
    name: 'Residencial Beata Maria de Araújo I e II',
    shortName: 'Beata Maria de Araújo I e II',
    neighborhood: 'São José / Frei Damião',
    status: 'previsto',
    statusLabel: 'Previsto (2027)',
    coords: { lat: -7.252638659780217, lng: -39.34279895635427 },
    stages: [
      {
        id: 'beata-1',
        name: 'Res. Beata Maria de Araújo I',
        units: 248,
        value: 37180031.96,
      },
      {
        id: 'beata-2',
        name: 'Res. Beata Maria de Araújo II',
        units: 176,
        value: 26347427.89,
      },
    ],
  },
  {
    id: 'sao-sebastiao',
    name: 'Residencial São Sebastião I e II',
    shortName: 'São Sebastião I e II',
    neighborhood: 'Brejo Seco',
    status: 'entregue',
    statusLabel: 'Entregue (2017)',
    coords: { lat: -7.22999370714912, lng: -39.27144483929408 },
    stages: [
      {
        id: 'sao-sebastiao-1',
        name: 'Res. São Sebastião I',
        units: 333,
        value: 20979000.0,
      },
      {
        id: 'sao-sebastiao-2',
        name: 'Res. São Sebastião II',
        units: 448,
        value: 28224000.0,
      },
    ],
  },
  {
    id: 'mirante-da-serra',
    name: 'Residencial Mirante da Serra I e II',
    shortName: 'Mirante da Serra I e II',
    neighborhood: 'Pedrinhas',
    status: 'previsto',
    statusLabel: 'Previsto (2027)',
    coords: { lat: -7.199265298939267, lng: -39.26874292818968 },
    stages: [
      {
        id: 'mirante-1',
        name: 'Mirante da Serra I',
        units: 192,
        value: 28798431.64,
      },
      {
        id: 'mirante-2',
        name: 'Mirante da Serra II',
        units: 192,
        value: 28799427.78,
      },
    ],
  },
  {
    id: 'nossa-senhora-das-dores',
    name: 'Residencial Nossa Senhora das Dores (Manoel Raimundo)',
    shortName: 'Nossa Sra. das Dores',
    neighborhood: 'Betolândia',
    status: 'entregue',
    statusLabel: 'Entregue (2014)',
    coords: { lat: -7.222960769603731, lng: -39.27981871120494 },
    stages: [
      {
        id: 'manoel-raimundo-unica',
        name: 'Res. Manoel Raimundo de Santana Filho (N. Sra. das Dores)',
        units: 713,
        value: 42066421.52,
      },
    ],
  },
  {
    id: 'tenente-coelho',
    name: 'Residencial Tenente Coelho I, II, III e IV',
    shortName: 'Tenente Coelho I–IV',
    neighborhood: 'Aeroporto',
    status: 'entregue',
    statusLabel: 'Entregue (2012)',
    coords: { lat: -7.211077340258058, lng: -39.286225807254596 },
    stages: [
      {
        id: 'tenente-1',
        name: 'Cond. Res. Tenente Coelho I',
        units: 320,
        value: 13282030.0,
      },
      {
        id: 'tenente-2',
        name: 'Cond. Res. Tenente Coelho II',
        units: 352,
        value: 14629381.0,
      },
      {
        id: 'tenente-3',
        name: 'Cond. Res. Tenente Coelho III',
        units: 352,
        value: 14537591.0,
      },
      {
        id: 'tenente-4',
        name: 'Cond. Res. Tenente Coelho IV',
        units: 256,
        value: 10604341.45,
      },
    ],
  },
  {
    id: 'leandro-bezerra',
    name: 'Residencial Leandro Bezerra I, II e III',
    shortName: 'Leandro Bezerra I–III',
    neighborhood: 'Vila Três Marias',
    status: 'entregue',
    statusLabel: 'Entregue (2021)',
    coords: { lat: -7.176193607977552, lng: -39.299332048683596 },
    stages: [
      {
        id: 'leandro-1',
        name: 'Res. Leandro Bezerra de Menezes I',
        units: 300,
        value: 24000000.0,
      },
      {
        id: 'leandro-2',
        name: 'Res. Leandro Bezerra de Menezes II',
        units: 300,
        value: 24000000.0,
      },
      {
        id: 'leandro-3',
        name: 'Res. Leandro Bezerra de Menezes III',
        units: 300,
        value: 24000000.0,
      },
    ],
  },
];

// Demais registros da planilha oficial MCMV (Zona Rural / outros) para compor o Total Geral de 5.541 UHs e R$ 413.395.934,24
export const EXTRA_PROGRAM_ENTRIES: ExtraProgramEntry[] = [
  {
    id: 'juazeiro-do-norte-avulso',
    name: 'Juazeiro do Norte (outros contratos)',
    category: 'Programa geral',
    units: 18,
    value: 1350000.0,
  },
  {
    id: 'pnhr-padre-cicero-iv',
    name: 'PNHR Padre Cícero IV',
    category: 'Habitação Rural',
    units: 42,
    value: 1646400.0,
  },
  {
    id: 'pnhr-umari-i',
    name: 'PNHR Umari I',
    category: 'Habitação Rural',
    units: 40,
    value: 1254000.0,
  },
  {
    id: 'pnhr-juazeiro-iii',
    name: 'PNHR Juazeiro III',
    category: 'Habitação Rural',
    units: 36,
    value: 1128600.0,
  },
  {
    id: 'pnhr-sitio-espinho',
    name: 'PNHR Sítio Espinho - Juazeiro II',
    category: 'Habitação Rural',
    units: 11,
    value: 344850.0,
  },
];

export function getComplexTotals(complex: HousingComplex): {
  units: number;
  value: number;
} {
  return complex.stages.reduce(
    (acc, st) => ({
      units: acc.units + st.units,
      value: acc.value + st.value,
    }),
    { units: 0, value: 0 }
  );
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function estimateFallbackRoute(origin: LatLng, dest: LatLng): RouteResult {
  const straight = haversineKm(origin, dest);
  const streetKm = Number((straight * 1.28).toFixed(2));
  const carMin = Math.max(5, Math.round((streetKm / 24) * 60));
  const walkMin = Math.max(10, Math.round((streetKm / 4.5) * 60));
  return {
    distanceKm: streetKm,
    durationCarMin: carMin,
    durationWalkMin: walkMin,
    geometry: [
      [origin.lat, origin.lng],
      [dest.lat, dest.lng],
    ],
    source: 'estimado',
  };
}

const routeCache = new Map<string, RouteResult>();

export async function fetchStreetRoute(
  origin: LatLng,
  dest: LatLng,
  signal?: AbortSignal
): Promise<RouteResult> {
  const key = `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}->${dest.lat.toFixed(5)},${dest.lng.toFixed(5)}`;
  const cached = routeCache.get(key);
  if (cached) return cached;

  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route || !route.geometry?.coordinates?.length) {
      throw new Error('Sem geometria de rota');
    }
    const distanceKm = Number((route.distance / 1000).toFixed(2));
    const durationCarMin = Math.max(5, Math.round((route.duration / 60) * 1.5 + 1));
    const durationWalkMin = Math.max(8, Math.round((distanceKm / 4.5) * 60));
    const geometry: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );
    const result: RouteResult = {
      distanceKm,
      durationCarMin,
      durationWalkMin,
      geometry,
      source: 'osrm',
    };
    routeCache.set(key, result);
    return result;
  } catch {
    return estimateFallbackRoute(origin, dest);
  }
}

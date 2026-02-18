import { useMemo } from 'react';

// Approximate lat/lng to SVG coordinate mapping for Brazilian cities
// Brazil bounding box: lat -33.75 to 5.27, lng -73.99 to -34.79
const BRAZIL_BOUNDS = {
  minLat: -33.75,
  maxLat: 5.27,
  minLng: -73.99,
  maxLng: -34.79,
};

// Common Brazilian city coordinates
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'São Paulo': { lat: -23.55, lng: -46.63 },
  'Rio de Janeiro': { lat: -22.91, lng: -43.17 },
  'Brasília': { lat: -15.79, lng: -47.88 },
  'Salvador': { lat: -12.97, lng: -38.51 },
  'Fortaleza': { lat: -3.72, lng: -38.53 },
  'Belo Horizonte': { lat: -19.92, lng: -43.94 },
  'Manaus': { lat: -3.12, lng: -60.02 },
  'Curitiba': { lat: -25.43, lng: -49.27 },
  'Recife': { lat: -8.05, lng: -34.87 },
  'Porto Alegre': { lat: -30.03, lng: -51.23 },
  'Belém': { lat: -1.46, lng: -48.50 },
  'Goiânia': { lat: -16.68, lng: -49.25 },
  'Guarulhos': { lat: -23.46, lng: -46.53 },
  'Campinas': { lat: -22.91, lng: -47.06 },
  'São Luís': { lat: -2.53, lng: -44.28 },
  'Maceió': { lat: -9.67, lng: -35.74 },
  'Natal': { lat: -5.79, lng: -35.21 },
  'Campo Grande': { lat: -20.44, lng: -54.65 },
  'Teresina': { lat: -5.09, lng: -42.80 },
  'João Pessoa': { lat: -7.12, lng: -34.86 },
  'Aracaju': { lat: -10.91, lng: -37.07 },
  'Cuiabá': { lat: -15.60, lng: -56.10 },
  'Florianópolis': { lat: -27.59, lng: -48.55 },
  'Vitória': { lat: -20.32, lng: -40.34 },
  'Ibiúna': { lat: -23.66, lng: -47.22 },
  'Jundiaí': { lat: -23.19, lng: -46.88 },
  'Santos': { lat: -23.96, lng: -46.33 },
  'Sorocaba': { lat: -23.50, lng: -47.46 },
  'Ribeirão Preto': { lat: -21.18, lng: -47.81 },
  'Uberlândia': { lat: -18.92, lng: -48.28 },
  'Londrina': { lat: -23.31, lng: -51.16 },
  'Niterói': { lat: -22.88, lng: -43.10 },
  'Osasco': { lat: -23.53, lng: -46.79 },
  'São Bernardo do Campo': { lat: -23.69, lng: -46.56 },
  'Santo André': { lat: -23.67, lng: -46.54 },
  'Joinville': { lat: -26.30, lng: -48.85 },
  'Maringá': { lat: -23.42, lng: -51.94 },
};

// Approximate state center coordinates for region-level fallback
const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  'São Paulo': { lat: -22.0, lng: -49.0 },
  'Rio de Janeiro': { lat: -22.25, lng: -42.66 },
  'Minas Gerais': { lat: -18.51, lng: -44.56 },
  'Bahia': { lat: -12.58, lng: -41.70 },
  'Paraná': { lat: -24.89, lng: -51.55 },
  'Rio Grande do Sul': { lat: -29.75, lng: -53.25 },
  'Pernambuco': { lat: -8.28, lng: -37.86 },
  'Ceará': { lat: -5.20, lng: -39.53 },
  'Pará': { lat: -3.79, lng: -52.48 },
  'Santa Catarina': { lat: -27.24, lng: -50.22 },
  'Goiás': { lat: -15.93, lng: -49.86 },
  'Maranhão': { lat: -5.42, lng: -45.44 },
  'Amazonas': { lat: -3.47, lng: -65.10 },
  'Paraíba': { lat: -7.24, lng: -36.78 },
  'Espírito Santo': { lat: -19.18, lng: -40.31 },
  'Mato Grosso do Sul': { lat: -20.78, lng: -54.79 },
  'Mato Grosso': { lat: -12.64, lng: -55.42 },
  'Rio Grande do Norte': { lat: -5.79, lng: -36.51 },
  'Alagoas': { lat: -9.57, lng: -36.78 },
  'Piauí': { lat: -7.72, lng: -42.73 },
  'Distrito Federal': { lat: -15.79, lng: -47.88 },
  'Sergipe': { lat: -10.57, lng: -37.38 },
  'Rondônia': { lat: -10.83, lng: -63.34 },
  'Tocantins': { lat: -10.18, lng: -48.33 },
  'Acre': { lat: -9.02, lng: -70.81 },
  'Amapá': { lat: 1.41, lng: -51.77 },
  'Roraima': { lat: 2.74, lng: -61.41 },
};

function latLngToSvg(lat: number, lng: number, width: number, height: number) {
  const x = ((lng - BRAZIL_BOUNDS.minLng) / (BRAZIL_BOUNDS.maxLng - BRAZIL_BOUNDS.minLng)) * width;
  const y = ((BRAZIL_BOUNDS.maxLat - lat) / (BRAZIL_BOUNDS.maxLat - BRAZIL_BOUNDS.minLat)) * height;
  return { x, y };
}

interface VisitorLocation {
  city: string;
  region: string;
  country: string;
  count: number;
}

interface BrazilMapProps {
  locations: VisitorLocation[];
}

export function BrazilMap({ locations }: BrazilMapProps) {
  const WIDTH = 240;
  const HEIGHT = 220;

  const markers = useMemo(() => {
    return locations
      .filter(loc => loc.country === 'Brazil' || loc.country === 'Brasil')
      .map(loc => {
        // Try city first, then region/state
        const coords = CITY_COORDS[loc.city] || STATE_COORDS[loc.region] || null;
        if (!coords) return null;
        const pos = latLngToSvg(coords.lat, coords.lng, WIDTH, HEIGHT);
        return { ...loc, x: pos.x, y: pos.y };
      })
      .filter(Boolean) as (VisitorLocation & { x: number; y: number })[];
  }, [locations]);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Brazil outline - simplified */}
      <path
        d="M95,8 L110,5 L125,8 L140,6 L150,10 L158,8 L168,12 L178,10 L188,18 L195,15
           L200,22 L208,28 L215,35 L218,45 L220,55 L222,65 L225,75 L222,85
           L218,95 L220,105 L215,115 L210,125 L205,132 L198,138 L190,145
           L182,155 L175,162 L168,170 L160,178 L150,185 L140,190 L130,195
           L120,198 L108,195 L100,190 L92,182 L85,175 L80,168 L72,160
           L65,155 L58,148 L52,140 L48,130 L45,120 L42,110 L38,100
           L35,90 L32,80 L30,70 L28,60 L30,50 L32,42 L38,35
           L45,28 L55,22 L65,18 L75,14 L85,10 Z"
        fill="hsl(var(--muted))"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        opacity="0.5"
      />
      
      {/* Visitor markers */}
      {markers.map((m, i) => (
        <g key={i}>
          {/* Pulse ring */}
          <circle
            cx={m.x}
            cy={m.y}
            r={Math.min(6 + m.count * 2, 14)}
            fill="hsl(var(--primary))"
            opacity="0.2"
          >
            <animate
              attributeName="r"
              values={`${Math.min(4 + m.count * 2, 12)};${Math.min(8 + m.count * 2, 18)};${Math.min(4 + m.count * 2, 12)}`}
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.3;0.1;0.3"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Dot */}
          <circle
            cx={m.x}
            cy={m.y}
            r={Math.min(3 + m.count, 7)}
            fill="hsl(var(--primary))"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="1.5"
          />
          {/* Count label */}
          {m.count > 1 && (
            <text
              x={m.x}
              y={m.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-primary-foreground"
              fontSize="7"
              fontWeight="bold"
            >
              {m.count}
            </text>
          )}
        </g>
      ))}

      {/* Show message if no Brazilian visitors */}
      {markers.length === 0 && locations.length > 0 && (
        <text
          x={WIDTH / 2}
          y={HEIGHT / 2}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="10"
        >
          Visitantes fora do Brasil
        </text>
      )}
    </svg>
  );
}

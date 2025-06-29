import mapboxgl from 'mapbox-gl';
import { MarkerData } from '../../types';
import { MARKER_STYLES } from '../../constants';
import { isMobile } from '../../utils/viewport';

// Next Race 마커 텍스트 스타일 상수
const NEXT_RACE_TEXT_STYLE = {
  desktop: {
    fontSize: '12px',
    lineHeight: '1.3'
  },
  mobile: {
    fontSize: '10px', 
    lineHeight: '1.3'
  }
} as const;

// 일반 서킷 마커 SVG 크기 상수
const CIRCUIT_SVG_SIZE = {
  desktop: { width: '30', height: '30' },
  mobile: { width: '22', height: '22' }
} as const;

// 실제 F1 서킷 코너 정보
const CIRCUIT_CORNERS: Record<string, number> = {
  'bahrain': 15,
  'saudi-arabia': 27,
  'australia': 14,  // 2022년 레이아웃 변경으로 16→14 코너
  'japan': 18,
  'china': 16,
  'miami': 19,
  'imola': 19,
  'monaco': 19,
  'canada': 14,
  'spain': 16,
  'austria': 10,
  'silverstone': 18,
  'britain': 18,
  'hungary': 14,
  'spa': 19,
  'netherlands': 14,
  'monza': 11,
  'italy': 11,
  'azerbaijan': 20,
  'singapore': 19,  // 2023년 레이아웃 변경으로 23→19 코너
  'usa': 20,
  'mexico': 17,
  'brazil': 15,
  'vegas': 17,
  'qatar': 16,
  'abu-dhabi': 16,
  'nurburgring': 15  // 정확한 GP 서킷 코너 수
};

interface Circuit {
  id: string;
  name: string;
  grandPrix: string;
  officialName: string;
  country: string;
  location: {
    lng: number;
    lat: number;
    city: string;
    country: string;
  };
  length: number;
  laps?: number;
  corners?: number;
  lapRecord?: {
    time: string;
    driver: string;
    year: number;
  };
}

interface CircuitMarkerProps {
  map: mapboxgl.Map;
  circuit: Circuit;
  isNextRace?: boolean;
  onMarkerClick?: (item: MarkerData) => void;
  onMarkerCreated?: (marker: mapboxgl.Marker) => void;
}

export const createCircuitMarker = ({ 
  map, 
  circuit, 
  isNextRace = false, 
  onMarkerClick,
  onMarkerCreated 
}: CircuitMarkerProps): mapboxgl.Marker => {
  const mobile = isMobile();
  const markerStyle = isNextRace ? MARKER_STYLES.nextRaceMarker : MARKER_STYLES.circuitMarker;
  
  // 커스텀 마커 엘리먼트 생성
  const el = document.createElement('div');
  el.className = 'marker circuit-marker';
  el.style.position = 'absolute';
  el.style.width = mobile ? markerStyle.mobileWidth : markerStyle.width;
  el.style.height = mobile ? markerStyle.mobileHeight : markerStyle.height;
  el.style.cursor = 'pointer';
  el.style.willChange = 'transform';
  el.style.transform = 'translate3d(0, 0, 0)'; // GPU 레이어 강제
  el.style.backfaceVisibility = 'hidden'; // 렌더링 최적화
  el.style.perspective = '1000px'; // 3D 가속

  // 메인 박스
  const box = document.createElement('div');
  box.style.width = '100%';
  box.style.height = '100%';
  box.style.backgroundColor = markerStyle.backgroundColor;
  box.style.borderRadius = markerStyle.borderRadius;
  box.style.border = markerStyle.border;
  box.style.boxShadow = isNextRace ? '0 4px 15px rgba(255, 24, 1, 0.6)' : '0 4px 15px rgba(220, 38, 38, 0.4)';
  box.style.transition = 'all 0.3s ease';
  box.style.display = 'flex';
  box.style.alignItems = 'center';
  box.style.justifyContent = 'center';
  
  // 초기 opacity 설정 (줌 레벨에 따라)
  el.style.opacity = '1';
  el.style.transition = 'opacity 0.3s ease';

  // 컨텐트 추가
  if (isNextRace) {
    const textStyle = mobile ? NEXT_RACE_TEXT_STYLE.mobile : NEXT_RACE_TEXT_STYLE.desktop;
    box.innerHTML = `
      <div style="font-size: ${textStyle.fontSize}; font-weight: bold; color: white; text-align: center; line-height: ${textStyle.lineHeight};">
        NEXT<br>RACE
      </div>
    `;
  } else {
    const svgSize = mobile ? CIRCUIT_SVG_SIZE.mobile : CIRCUIT_SVG_SIZE.desktop;
    box.innerHTML = `
      <svg width="${svgSize.width}" height="${svgSize.height}" viewBox="0 0 24 24" fill="none">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" stroke-width="2"/>
        <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  el.appendChild(box);

  // GPU 가속 호버 효과
  el.style.willChange = 'transform';
  box.style.willChange = 'transform, box-shadow';

  el.addEventListener('mouseenter', () => {
    box.style.transform = 'scale(1.1) translateZ(0)';
    box.style.boxShadow = isNextRace ? '0 6px 20px rgba(255, 24, 1, 0.8)' : '0 6px 20px rgba(220, 38, 38, 0.6)';
  });

  el.addEventListener('mouseleave', () => {
    box.style.transform = 'scale(1) translateZ(0)';
    box.style.boxShadow = isNextRace ? '0 4px 15px rgba(255, 24, 1, 0.6)' : '0 4px 15px rgba(220, 38, 38, 0.4)';
  });

  // 클릭 이벤트
  if (onMarkerClick) {
    el.addEventListener('click', () => {
      const markerData: MarkerData = {
        type: 'circuit',
        id: circuit.id,
        name: circuit.name,
        grandPrix: circuit.grandPrix,
        length: circuit.length,
        laps: circuit.laps,
        corners: CIRCUIT_CORNERS[circuit.id] || 10,
        totalDistance: circuit.laps && circuit.length ? Math.round((circuit.laps * circuit.length) * 10) / 10 : 0,
        location: `${circuit.location.city}, ${circuit.location.country}`
      };
      onMarkerClick(markerData);
    });
  }

  // 마커 추가
  const marker = new mapboxgl.Marker(el, { 
    anchor: 'center'
  })
    .setLngLat([circuit.location.lng, circuit.location.lat])
    .addTo(map);

  if (onMarkerCreated) {
    onMarkerCreated(marker);
  }

  return marker;
};

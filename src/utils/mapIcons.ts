import L from 'leaflet';
import { Landmark } from '@/types/landmarks';

// Function to create image-based icon
export const getImageIcon = (landmark: Landmark) => {
  const imageUrl = landmark.image_url || '/placeholder.svg';
  
  return L.divIcon({
    className: 'custom-image-marker',
    html: `
      <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
        <img src="${imageUrl}" alt="${landmark.title}" class="w-full h-full object-cover min-w-full min-h-full" onerror="this.src='/placeholder.svg'" />
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Function to get icon based on category
export const getIconForCategory = (category: string) => {
  const getIconHtml = (iconPath: string, bgColor: string) => `
    <div class="rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white" style="background-color: ${bgColor}">
      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
        ${iconPath}
      </svg>
    </div>
  `;

  console.log('Processing category:', category);
  
  // Golden Gate - Use Golden Gate SVG (exact match with space)
  if (category === 'Golden Gate') {
    console.log('Matched Golden Gate category, using golden-gate.svg');
    return L.icon({
      iconUrl: '/golden-gate.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  }
  
  // Prison - Lock/Shield icon
  if (category.toLowerCase().includes('prison')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M6 10a2 2 0 114 0v1h4V10a6 6 0 10-12 0v1h4v-1zm0 4v7h4v-7H6zm8 0v7h4v-7h-4z"/>',
        '#DC2626'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Architecture - Building icon
  if (category.toLowerCase().includes('architecture')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M3 21h18V9l-9-6-9 6v12zm7-11h4v2h-4v-2zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2z"/>',
        '#4F46E5'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Museum - Use museum.svg file
  if (category.toLowerCase().includes('museum')) {
    console.log('Matched Museum category, using museum.svg');
    return L.icon({
      iconUrl: '/museum.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  }
  
  // Monument - Tower/Obelisk icon
  if (category.toLowerCase().includes('monument')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M10 2l2 3v2l2-1 2 1V5l-2-3zm-6 8l6-3 6 3v2l-6-2-6 2v-2zm0 6l6-2 6 2v2l-6-2-6 2v-2z"/>',
        '#6B7280'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Cultural Site - Pagoda/Temple icon
  if (category.toLowerCase().includes('cultural')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M12 2l-2 3v2l2-1 2 1V5l-2-3zm-6 8l6-3 6 3v2l-6-2-6 2v-2zm0 6l6-2 6 2v2l-6-2-6 2v-2z"/>',
        '#EC4899'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Tech Landmark - Computer/Chip icon
  if (category.toLowerCase().includes('tech')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h6v2H8v-2zm0 4h4v2H8v-2z"/>',
        '#059669'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Nature Preserve - Realistic trees PNG
  if (category.toLowerCase().includes('nature') || category.toLowerCase().includes('preserve')) {
    return L.icon({
      iconUrl: '/trees-realistic.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  }
  
  // Street - Road icon
  if (category.toLowerCase().includes('street') || category.toLowerCase().includes('road')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M4 12h16M4 8h16M4 16h16M8 4v16M16 4v16"/>',
        '#F59E0B'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Misc. - General location pin
  if (category.toLowerCase().includes('misc')) {
    return L.divIcon({
      className: 'custom-marker',
      html: getIconHtml(
        '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>',
        '#6366F1'
      ),
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }
  
  // Default icon for unmatched categories
  return L.divIcon({
    className: 'custom-marker',
    html: getIconHtml(
      '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>',
      '#6366F1'
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

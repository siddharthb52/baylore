// Tool functions for Wikipedia and Wikimedia API calls

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";

interface WikipediaData {
  title: string;
  extract: string;
  coordinates?: { lat: number; lon: number };
  infobox?: Record<string, string>;
  pageUrl: string;
}

interface WikimediaImage {
  url: string;
  description?: string;
}

/**
 * Search Wikipedia for a landmark and extract detailed information
 */
export async function searchWikipedia(landmarkName: string): Promise<WikipediaData | null> {
  try {
    // First, search for the page
    const searchParams = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: landmarkName,
      format: 'json',
      origin: '*',
    });

    const searchResponse = await fetch(`${WIKIPEDIA_API}?${searchParams}`);
    const searchData = await searchResponse.json();

    if (!searchData.query?.search?.length) {
      return null;
    }

    const pageTitle = searchData.query.search[0].title;

    // Get page content, coordinates, and extract
    const pageParams = new URLSearchParams({
      action: 'query',
      titles: pageTitle,
      prop: 'extracts|coordinates|pageprops|info',
      exintro: 'true',
      explaintext: 'true',
      inprop: 'url',
      format: 'json',
      origin: '*',
    });

    const pageResponse = await fetch(`${WIKIPEDIA_API}?${pageParams}`);
    const pageData = await pageResponse.json();

    const page = Object.values(pageData.query.pages)[0] as any;

    return {
      title: page.title,
      extract: page.extract || '',
      coordinates: page.coordinates?.[0] ? {
        lat: page.coordinates[0].lat,
        lon: page.coordinates[0].lon,
      } : undefined,
      pageUrl: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
    };
  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    return null;
  }
}

/**
 * Get a Wikimedia Commons image for a landmark
 */
export async function getWikimediaImage(landmarkName: string): Promise<WikimediaImage | null> {
  try {
    // Search for images on Wikimedia Commons
    const searchParams = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: landmarkName,
      gsrnamespace: '6', // File namespace
      gsrlimit: '5',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      format: 'json',
      origin: '*',
    });

    const response = await fetch(`${WIKIMEDIA_API}?${searchParams}`);
    const data = await response.json();

    if (!data.query?.pages) {
      return null;
    }

    // Get first image result
    const pages = Object.values(data.query.pages) as any[];
    const firstImage = pages[0];

    if (firstImage?.imageinfo?.[0]) {
      return {
        url: firstImage.imageinfo[0].url,
        description: firstImage.imageinfo[0].extmetadata?.ImageDescription?.value,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Wikimedia image:', error);
    return null;
  }
}

/**
 * Validate that coordinates are within Bay Area bounds
 */
export function isInBayArea(lat: number, lon: number): boolean {
  const BAY_AREA_BOUNDS = {
    minLat: 36.8,
    maxLat: 38.0,
    minLon: -123.0,
    maxLon: -121.0,
  };

  return (
    lat >= BAY_AREA_BOUNDS.minLat &&
    lat <= BAY_AREA_BOUNDS.maxLat &&
    lon >= BAY_AREA_BOUNDS.minLon &&
    lon <= BAY_AREA_BOUNDS.maxLon
  );
}

/**
 * Verify that a URL is accessible
 */
export async function verifyUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}


export interface Landmark {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  summary: string;
  category: string;
  year_built?: number;
  architect?: string;
  historical_significance?: string;
  fun_facts?: string[];
  image_url?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

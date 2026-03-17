import { Landmark } from './landmarks';

export type ProposedLandmarkStatus = 'pending' | 'verified' | 'rejected';

export interface ProposedLandmark extends Omit<Landmark, 'created_at' | 'updated_at'> {
  // Agent workflow fields
  status: ProposedLandmarkStatus;
  source_urls: string[]; // URLs of Wikipedia pages, sources used
  verification_notes?: string; // Why rejected or what needs fixing
  fetch_metadata?: {
    agent_reasoning?: string;
    confidence_score?: number;
    tools_used?: string[];
    search_queries?: string[];
    [key: string]: any;
  };
  
  // Timestamps
  proposed_at: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

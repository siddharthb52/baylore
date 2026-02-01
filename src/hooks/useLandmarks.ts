
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Landmark } from '@/types/landmarks';

export const useLandmarks = () => {
  return useQuery({
    queryKey: ['landmarks'],
    queryFn: async (): Promise<Landmark[]> => {
      const { data, error } = await supabase
        .from('landmarks')
        .select('*')
        .order('title');

      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching landmarks:', error);
        throw error;
      }

      return data || [];
    },
  });
};

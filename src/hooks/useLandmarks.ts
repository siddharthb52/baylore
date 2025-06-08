
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Landmark } from '@/types/landmarks';

export const useLandmarks = () => {
  return useQuery({
    queryKey: ['landmarks'],
    queryFn: async (): Promise<Landmark[]> => {
      console.log('Fetching landmarks from Supabase...');
      
      const { data, error } = await supabase
        .from('landmarks')
        .select('*')
        .order('title');

      if (error) {
        console.error('Error fetching landmarks:', error);
        throw error;
      }

      console.log('Successfully fetched landmarks:', data);
      return data || [];
    },
  });
};

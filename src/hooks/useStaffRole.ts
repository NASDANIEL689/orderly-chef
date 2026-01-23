import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useStaffRole = (userId?: string) => {
  return useQuery({
    queryKey: ['staff-role', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('staff_users')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no row exists, the user is not staff.
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data?.role ?? null;
    },
  });
};

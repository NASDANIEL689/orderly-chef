import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Special {
  id: string;
  menu_item_id: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpecialWithItem extends Special {
  menu_items?: {
    name: string;
    price: number;
  };
}

export const useSpecials = (isActive?: boolean) => {
  return useQuery({
    queryKey: ['specials', isActive],
    queryFn: async () => {
      let query = supabase
        .from('specials')
        .select('*');
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []) as Special[];
    },
  });
};

export const useSpecialsWithItems = (isActive?: boolean) => {
  return useQuery({
    queryKey: ['specials-with-items', isActive],
    queryFn: async () => {
      let query = supabase
        .from('specials')
        .select('*, menu_items(name, price)');
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []) as SpecialWithItem[];
    },
  });
};

export const useCreateSpecial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (special: Omit<Special, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('specials')
        .insert([{ ...special, created_by: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specials'] });
      queryClient.invalidateQueries({ queryKey: ['specials-with-items'] });
      toast.success('Special created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create special: ${error.message}`);
    },
  });
};

export const useUpdateSpecial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Special> & { id: string }) => {
      const { data, error } = await supabase
        .from('specials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specials'] });
      queryClient.invalidateQueries({ queryKey: ['specials-with-items'] });
      toast.success('Special updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update special: ${error.message}`);
    },
  });
};

export const useDeleteSpecial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('specials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specials'] });
      queryClient.invalidateQueries({ queryKey: ['specials-with-items'] });
      toast.success('Special deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete special: ${error.message}`);
    },
  });
};

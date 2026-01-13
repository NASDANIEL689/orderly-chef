import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category, MenuItem } from '@/types/pos';

const allowedCategories = ['Pizza', 'Drinks'];

// Fallback menu when Supabase is empty or to override old data
const fallbackPizzaItems: MenuItem[] = [
  {
    id: 'fallback-1l-2m',
    category_id: '',
    name: 'Kasi Special: One Large + Double Mini Decker',
    price: 220,
    description: 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza',
    image_url: null,
    available: true,
    created_at: '',
  },
  {
    id: 'fallback-1l-3m',
    category_id: '',
    name: 'Kasi Special: One Large + Triple Mini Decker',
    price: 250,
    description: 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza',
    image_url: null,
    available: true,
    created_at: '',
  },
  {
    id: 'fallback-1l-4m',
    category_id: '',
    name: 'Kasi Special: One Large + Quad Mini Decker',
    price: 280,
    description: 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza',
    image_url: null,
    available: true,
    created_at: '',
  },
  {
    id: 'fallback-2l-1m',
    category_id: '',
    name: 'Kasi Special: Two Large + Single Mini Decker',
    price: 280,
    description: 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza',
    image_url: null,
    available: true,
    created_at: '',
  },
  {
    id: 'fallback-2l-2m',
    category_id: '',
    name: 'Kasi Special: Two Large + Double Mini Decker',
    price: 300,
    description: 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza',
    image_url: null,
    available: true,
    created_at: '',
  },
  {
    id: 'fallback-2l-3m',
    category_id: '',
    name: 'Kasi Special: Two Large + Triple Mini Decker',
    price: 350,
    description: 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza',
    image_url: null,
    available: true,
    created_at: '',
  },
  {
    id: 'fallback-2l-4m',
    category_id: '',
    name: 'Kasi Special: Two Large + Quad Mini Decker',
    price: 380,
    description: 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza',
    image_url: null,
    available: true,
    created_at: '',
  },
];

const fallbackDrinkItems: MenuItem[] = [
  { id: 'fallback-drink-1', category_id: '', name: 'Cola', price: 2.49, description: 'Classic cola', image_url: null, available: true, created_at: '' },
  { id: 'fallback-drink-2', category_id: '', name: 'Lemonade', price: 2.99, description: 'Fresh squeezed lemonade', image_url: null, available: true, created_at: '' },
  { id: 'fallback-drink-3', category_id: '', name: 'Iced Tea', price: 2.99, description: 'Brewed tea over ice', image_url: null, available: true, created_at: '' },
  { id: 'fallback-drink-4', category_id: '', name: 'Sparkling Water', price: 2.79, description: 'Lightly carbonated mineral water', image_url: null, available: true, created_at: '' },
];

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .in('name', allowedCategories)
        .order('name');
      
      if (error) throw error;
      const categories = (data as Category[] | null) ?? [];
      if (categories.length === 0) {
        return [
          { id: 'pizza', name: 'Pizza', icon: 'pizza', created_at: '' },
          { id: 'drinks', name: 'Drinks', icon: 'coffee', created_at: '' },
        ];
      }
      return categories;
    },
  });
};

export const useMenuItems = (categoryId?: string) => {
  return useQuery({
    queryKey: ['menu-items', categoryId],
    queryFn: async () => {
      // Fetch category IDs for mapping
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .in('name', allowedCategories);

      const categories = (categoriesData as Category[] | null) ?? [];
      const pizzaCategoryId = categories.find((c) => c.name === 'Pizza')?.id || 'pizza';
      const drinksCategoryId = categories.find((c) => c.name === 'Drinks')?.id || 'drinks';

      let query = supabase
        .from('menu_items')
        .select('*, categories!inner(name)')
        .eq('available', true)
        .in('categories.name', allowedCategories)
        .order('name');
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;

      const items = (data || []).map(({ categories, ...item }) => item as MenuItem);

      // Always use the fixed pizza combos; use Supabase drinks if present, else fallback drinks
      const pizzaItems = fallbackPizzaItems.map((item) => ({ ...item, category_id: pizzaCategoryId }));
      const supabaseDrinks = items.filter((i) => i.category_id === drinksCategoryId);
      const drinkItems =
        supabaseDrinks.length > 0
          ? supabaseDrinks
          : fallbackDrinkItems.map((item) => ({ ...item, category_id: drinksCategoryId }));

      const combined = [...pizzaItems, ...drinkItems];

      if (categoryId) {
        return combined.filter((i) => i.category_id === categoryId);
      }
      return combined;
    },
  });
};

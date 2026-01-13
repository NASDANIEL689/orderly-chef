export interface Category {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  available: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  menu_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  order_type: 'dine-in' | 'takeaway' | 'online';
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number | null;
  change_amount: number | null;
  payment_method: 'cash' | 'card' | 'online' | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  flavour?: string;
}

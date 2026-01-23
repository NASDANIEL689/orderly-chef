import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, CartItem } from '@/types/pos';
import { toast } from 'sonner';

const ORDER_COUNTER_KEY = 'order_counter';
const ORDER_COUNTER_START_KEY = 'order_counter_start';
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

const getNextOrderNumber = () => {
  try {
    const now = Date.now();
    const start = parseInt(localStorage.getItem(ORDER_COUNTER_START_KEY) || '0', 10);
    const counter = parseInt(localStorage.getItem(ORDER_COUNTER_KEY) || '0', 10);

    // Reset counter if no start or more than 2 days passed
    if (!start || now - start > TWO_DAYS_MS) {
      localStorage.setItem(ORDER_COUNTER_START_KEY, now.toString());
      localStorage.setItem(ORDER_COUNTER_KEY, '1');
      return '00001';
    }

    const next = counter + 1;
    localStorage.setItem(ORDER_COUNTER_KEY, next.toString());
    return next.toString().padStart(5, '0');
  } catch (err) {
    console.error('Failed to generate order number, using fallback:', err);
    // Fallback: random 5-digit
    return (Math.floor(10000 + Math.random() * 90000)).toString();
  }
};

const isValidUUID = (value: string | null | undefined) => {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

interface CreateOrderData {
  items: CartItem[];
  orderType: 'dine-in' | 'takeaway' | 'online';
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  paymentMethod?: 'cash' | 'card' | 'online';
  amountPaid?: number;
}

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      // Map Supabase relation order_items -> items for UI convenience
      return (data || []).map((row: any) => ({
        ...row,
        items: row.order_items || [],
      })) as Order[];
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      const subtotal = orderData.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;
      const changeAmount = orderData.amountPaid ? orderData.amountPaid - total : null;
      const orderNumber = getNextOrderNumber();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          order_type: orderData.orderType,
          customer_name: orderData.customerName || null,
          customer_email: orderData.customerEmail || null,
          customer_phone: orderData.customerPhone || null,
          subtotal,
          tax,
          total,
          amount_paid: orderData.amountPaid || null,
          change_amount: changeAmount,
          payment_method: orderData.paymentMethod || null,
          notes: orderData.notes || null,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map((item) => {
        const combinedNotes = [item.flavour ? `Flavour: ${item.flavour}` : '', item.notes || '']
          .filter(Boolean)
          .join(' | ');
        return {
          order_id: order.id,
          // fallback menu items use local UUID-less ids; store null to satisfy UUID constraint
          menu_item_id: isValidUUID(item.id) ? item.id : null,
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          notes: combinedNotes || null,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order as Order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Order ${order.order_number} created successfully!`);
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: (error) => {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    },
  });
};

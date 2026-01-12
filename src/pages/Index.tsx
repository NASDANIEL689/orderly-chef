import { useState } from 'react';
import { useCategories, useMenuItems } from '@/hooks/useMenu';
import { useOrders, useCreateOrder, useUpdateOrderStatus } from '@/hooks/useOrders';
import { CategoryTabs } from '@/components/pos/CategoryTabs';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { OrdersPanel } from '@/components/pos/OrdersPanel';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { CartItem, MenuItem, Order } from '@/types/pos';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, ClipboardList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: menuItems = [], isLoading: itemsLoading } = useMenuItems(selectedCategory || undefined);
  const { data: orders = [] } = useOrders();
  const createOrder = useCreateOrder();
  const updateOrderStatus = useUpdateOrderStatus();

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
    }
  };

  const removeItem = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCompleteOrder = async (data: {
    paymentMethod: 'cash' | 'card' | 'online';
    amountPaid?: number;
    customerName?: string;
    customerEmail?: string;
    orderType: 'dine-in' | 'takeaway' | 'online';
  }) => {
    try {
      const order = await createOrder.mutateAsync({
        items: cart,
        orderType: data.orderType,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        paymentMethod: data.paymentMethod,
        amountPaid: data.amountPaid,
      });
      setCompletedOrder(order);
      setIsPaymentOpen(false);
      setIsReceiptOpen(true);
      setCart([]);
    } catch (error) {
      console.error('Order failed:', error);
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Receipt sent to printer');
  };

  const handleEmail = () => {
    toast.info('Email functionality requires Resend API setup');
  };

  const isLoading = categoriesLoading || itemsLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">
            Chef Paul's <span className="text-primary">POS</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Menu */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Tabs defaultValue="menu" className="h-full">
            <TabsList className="mb-4 bg-secondary">
              <TabsTrigger value="menu" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                New Order
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Orders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="menu" className="space-y-6">
              <CategoryTabs
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <MenuGrid items={menuItems} onAddItem={addToCart} />
              )}
            </TabsContent>

            <TabsContent value="orders">
              <OrdersPanel
                orders={orders}
                onUpdateStatus={(orderId, status) => updateOrderStatus.mutate({ orderId, status })}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-96 p-6 pl-0">
          <CartPanel
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            onCheckout={() => setIsPaymentOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        items={cart}
        onCompleteOrder={handleCompleteOrder}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={completedOrder}
        items={cart.map((item) => ({
          id: item.id,
          menu_item_id: item.id,
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          notes: null,
        }))}
        onPrint={handlePrint}
        onEmail={handleEmail}
      />
    </div>
  );
};

export default Index;

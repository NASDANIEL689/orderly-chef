import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useCategories, useMenuItems } from '@/hooks/useMenu';
import { useOrders, useCreateOrder, useUpdateOrderStatus } from '@/hooks/useOrders';
import { useStaffRole } from '@/hooks/useStaffRole';
import { CategoryTabs } from '@/components/pos/CategoryTabs';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { OrdersPanel } from '@/components/pos/OrdersPanel';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { CartItem, MenuItem, Order, OrderItem } from '@/types/pos';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, ClipboardList, Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PosScreen = ({ canUpdateStatus, userEmail }: { canUpdateStatus: boolean; userEmail?: string | null }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [receiptItems, setReceiptItems] = useState<OrderItem[]>([]);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'staff' | 'admin'>('staff');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: menuItems = [], isLoading: itemsLoading } = useMenuItems(selectedCategory || undefined);
  const { data: orders = [] } = useOrders();
  const createOrder = useCreateOrder();
  const updateOrderStatus = useUpdateOrderStatus();

  const flavourOptions = ['Meat Lovers', 'Mexican Chilli', 'Creamy Chicken', 'Phane Pizza'] as const;

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      // Default flavour so checkout always has a selection
      return [...prev, { ...item, quantity: 1, flavour: flavourOptions[0] }];
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

  const updateFlavour = (itemId: string, flavour: string) => {
    setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, flavour } : i)));
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
      setReceiptItems(
        cart.map((item) => ({
          id: item.id,
          menu_item_id: item.id,
          item_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          notes: item.notes || null,
        }))
      );
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error('Email and password are required.');
      return;
    }

    setIsCreatingUser(true);
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      },
    });

    if (error) {
      console.error('Create user error:', error);
      toast.error(error.message || 'Failed to create user.');
    } else {
      toast.success(`Created ${data?.email || 'user'} (${data?.role || newUserRole}).`);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('staff');
      setIsCreateUserOpen(false);
    }
    setIsCreatingUser(false);
  };

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
            <span className="text-xs text-muted-foreground">{userEmail}</span>
            {canUpdateStatus && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/admin')}
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Admin
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsCreateUserOpen(true)}>
                  Create user
                </Button>
              </>
            )}
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
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
                canUpdateStatus={canUpdateStatus}
                onReprintReceipt={(order) => {
                  setCompletedOrder(order);
                  setReceiptItems(order.items || []);
                  setIsReceiptOpen(true);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-96 p-6 pl-0">
          <CartPanel
            items={cart}
            onUpdateQuantity={updateQuantity}
            onUpdateFlavour={updateFlavour}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            onCheckout={() => setIsPaymentOpen(true)}
            flavourOptions={flavourOptions as unknown as string[]}
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
        items={receiptItems}
        onPrint={handlePrint}
        onEmail={handleEmail}
      />

      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create POS User</DialogTitle>
            <DialogDescription>
              Admins can add staff accounts for POS access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                value={newUserEmail}
                onChange={(event) => setNewUserEmail(event.target.value)}
                placeholder="staff@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-password">Password</Label>
              <Input
                id="new-user-password"
                type="password"
                value={newUserPassword}
                onChange={(event) => setNewUserPassword(event.target.value)}
                placeholder="Set a strong password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-role">Role</Label>
              <select
                id="new-user-role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newUserRole}
                onChange={(event) => setNewUserRole(event.target.value === 'admin' ? 'admin' : 'staff')}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreatingUser}>
              {isCreatingUser ? 'Creating...' : 'Create user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Index = ({ session }: { session: Session }) => {
  const { data: staffRole, isLoading } = useStaffRole(session.user.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!staffRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Staff Access Required</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Your account is not listed as staff. Ask an admin to add you.
        </p>
        <Button variant="secondary" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <PosScreen
      canUpdateStatus={staffRole === 'admin'}
      userEmail={session.user.email}
    />
  );
};

export default Index;

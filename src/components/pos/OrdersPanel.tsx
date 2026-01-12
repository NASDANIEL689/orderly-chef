import { Order } from '@/types/pos';
import { Clock, CheckCircle, ChefHat, Package, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrdersPanelProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
}

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', className: 'status-pending', next: 'preparing' as const },
  preparing: { icon: ChefHat, label: 'Preparing', className: 'status-preparing', next: 'ready' as const },
  ready: { icon: Package, label: 'Ready', className: 'status-ready', next: 'completed' as const },
  completed: { icon: CheckCircle, label: 'Completed', className: 'status-completed', next: null },
  cancelled: { icon: XCircle, label: 'Cancelled', className: 'status-completed', next: null },
};

export const OrdersPanel = ({ orders, onUpdateStatus }: OrdersPanelProps) => {
  const activeOrders = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Active Orders ({activeOrders.length})</h2>
      
      {activeOrders.length === 0 ? (
        <div className="pos-card text-center py-8 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeOrders.map((order) => {
            const config = statusConfig[order.status];
            const Icon = config.icon;

            return (
              <div key={order.id} className="pos-card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{order.order_number}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{order.order_type}</p>
                  </div>
                  <span className={`status-badge ${config.className}`}>
                    <Icon className="w-3 h-3 inline mr-1" />
                    {config.label}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground mb-3">
                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                </div>

                {order.customer_name && (
                  <p className="text-sm text-foreground mb-2">Customer: {order.customer_name}</p>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="font-bold text-primary">${order.total.toFixed(2)}</span>
                  {config.next && (
                    <button
                      onClick={() => onUpdateStatus(order.id, config.next!)}
                      className="pos-button-primary text-sm py-2 px-4"
                    >
                      Mark as {statusConfig[config.next].label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

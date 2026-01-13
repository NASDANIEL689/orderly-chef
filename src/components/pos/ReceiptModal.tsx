import { Order, OrderItem } from '@/types/pos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, Mail, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  items: OrderItem[];
  onPrint: () => void;
  onEmail: () => void;
}

export const ReceiptModal = ({ isOpen, onClose, order, items, onPrint, onEmail }: ReceiptModalProps) => {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Order Complete</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* Receipt Preview */}
          <div className="receipt-container">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">CHEF PAUL'S</h2>
              <p className="text-xs">123 Restaurant Street</p>
              <p className="text-xs">Tel: (555) 123-4567</p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-3" />

            <div className="text-center mb-3">
              <p className="text-lg font-bold">ORDER #{order.order_number}</p>
              <p className="text-xs uppercase">{order.order_type}</p>
              <p className="text-xs">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-3" />

            <div className="space-y-1 mb-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span>
                    {item.quantity}x {item.item_name}
                  </span>
                  <span>{formatCurrency(item.total_price)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-400 my-3" />

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1">
                <span>TOTAL:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {order.payment_method === 'cash' && order.amount_paid && (
              <>
                <div className="border-t border-dashed border-gray-400 my-3" />
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Cash Received:</span>
                    <span>{formatCurrency(order.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Change:</span>
                    <span>{formatCurrency(order.change_amount || 0)}</span>
                  </div>
                </div>
              </>
            )}

            <div className="border-t border-dashed border-gray-400 my-3" />

            <div className="text-center text-xs">
              <p>Thank you for your order!</p>
              <p>Please come again</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button onClick={onPrint} className="pos-button-primary flex-1 flex items-center justify-center gap-2">
              <Printer className="w-5 h-5" />
              Print Receipt
            </button>
            {order.customer_email && (
              <button onClick={onEmail} className="pos-button-secondary flex-1 flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" />
                Email Receipt
              </button>
            )}
          </div>
          <button onClick={onClose} className="pos-button-secondary w-full mt-3 flex items-center justify-center gap-2">
            <X className="w-5 h-5" />
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

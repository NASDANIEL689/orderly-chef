import { useState } from 'react';
import { CartItem } from '@/types/pos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Banknote, Globe, Mail, Printer, X, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onCompleteOrder: (data: {
    paymentMethod: 'cash' | 'card' | 'online';
    amountPaid?: number;
    customerName?: string;
    customerEmail?: string;
    orderType: 'dine-in' | 'takeaway' | 'online';
    sendReceipt?: boolean;
  }) => void;
}

export const PaymentModal = ({ isOpen, onClose, items, onCompleteOrder }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'online'>('dine-in');
  const [sendReceipt, setSendReceipt] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;
  const change = parseFloat(amountPaid) - total;

  const quickAmounts = [20, 50, 100];

  const handleNumpadClick = (value: string) => {
    if (value === 'C') {
      setAmountPaid('');
    } else if (value === '⌫') {
      setAmountPaid((prev) => prev.slice(0, -1));
    } else if (value === '.') {
      if (!amountPaid.includes('.')) {
        setAmountPaid((prev) => prev + value);
      }
    } else {
      setAmountPaid((prev) => prev + value);
    }
  };

  const handleAmountInput = (value: string) => {
    const normalized = value.replace(/[^0-9.]/g, '');
    const parts = normalized.split('.');
    if (parts.length > 2) return;
    const cleaned = parts.length === 2 ? `${parts[0]}.${parts[1].slice(0, 2)}` : normalized;
    setAmountPaid(cleaned);
  };

  const handleComplete = () => {
    onCompleteOrder({
      paymentMethod,
      amountPaid: paymentMethod === 'cash' ? parseFloat(amountPaid) : total,
      customerName: customerName || undefined,
      customerEmail: customerEmail || undefined,
      orderType,
      sendReceipt,
    });
  };

  const isValid = paymentMethod !== 'cash' || (parseFloat(amountPaid) >= total);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Left Column - Payment Details */}
          <div className="space-y-6">
            {/* Order Type */}
            <div>
              <Label className="text-foreground mb-3 block">Order Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['dine-in', 'takeaway', 'online'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`py-3 px-4 rounded-lg font-medium capitalize transition-all ${
                      orderType === type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-muted'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-foreground mb-3 block">Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'online')}
                className="grid grid-cols-3 gap-2"
              >
                <div>
                  <RadioGroupItem value="cash" id="cash" className="sr-only" />
                  <Label
                    htmlFor="cash"
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-muted'
                    }`}
                  >
                    <Banknote className="w-6 h-6" />
                    <span className="font-medium">Cash</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="card" id="card" className="sr-only" />
                  <Label
                    htmlFor="card"
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-muted'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="font-medium">Card</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="online" id="online" className="sr-only" />
                  <Label
                    htmlFor="online"
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'online'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-muted'
                    }`}
                  >
                    <Globe className="w-6 h-6" />
                    <span className="font-medium">Online</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Cash Amount Input */}
            {paymentMethod === 'cash' && (
              <div>
                <Label className="text-foreground mb-3 block">Amount Received</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setAmountPaid(amount.toString())}
                        className="flex-1 py-2 px-4 rounded-lg bg-secondary text-foreground font-medium hover:bg-muted transition-all"
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                    <button
                      onClick={() => setAmountPaid(total.toFixed(2))}
                      className="flex-1 py-2 px-4 rounded-lg bg-primary/20 text-primary font-medium hover:bg-primary/30 transition-all"
                    >
                      Exact
                    </button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Enter Amount</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amountPaid}
                      onChange={(event) => handleAmountInput(event.target.value)}
                      className="pos-input text-2xl font-mono text-center"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleNumpadClick(key)}
                        className="numpad-button"
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Customer Info */}
            <div className="space-y-3">
              <Input
                placeholder="Customer Name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="pos-input"
              />
              <Input
                type="email"
                placeholder="Customer Email (optional)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="pos-input"
              />
              {customerEmail && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendReceipt}
                    onChange={(e) => setSendReceipt(e.target.checked)}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-foreground">Send receipt to email</span>
                </label>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="pos-card">
            <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="text-muted-foreground">
                    <div>
                      {item.quantity}x {item.name}
                    </div>
                    {item.flavour && (
                      <div className="text-xs text-foreground">Flavour: {item.flavour}</div>
                    )}
                  </div>
                  <span className="text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (10%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
              {paymentMethod === 'cash' && parseFloat(amountPaid) > 0 && (
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                  <span className="text-foreground">Change</span>
                  <span className={change >= 0 ? 'text-success' : 'text-destructive'}>
                    {change >= 0 ? formatCurrency(change) : '—'}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleComplete}
                disabled={!isValid}
                className="pos-button-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" />
                Complete Order
              </button>
              <button onClick={onClose} className="pos-button-secondary w-full flex items-center justify-center gap-2">
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { MenuItem } from '@/types/pos';
import { formatCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface MenuGridProps {
  items: MenuItem[];
  onAddItem: (item: MenuItem) => void;
}

export const MenuGrid = ({ items, onAddItem }: MenuGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onAddItem(item)}
          className="menu-item-card text-left group"
        >
          <div className="menu-item-header">
            <div>
              <h3 className="menu-item-title">
                {item.name}
              </h3>
              {item.description && (
                <p className="menu-item-description">
                  {item.description}
                </p>
              )}
            </div>
            <div className="menu-item-action">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <div className="menu-item-footer">
            <span className="menu-item-price">
              {formatCurrency(item.price)}
            </span>
            <span className="menu-item-cta">Tap to add</span>
          </div>
        </button>
      ))}
    </div>
  );
};

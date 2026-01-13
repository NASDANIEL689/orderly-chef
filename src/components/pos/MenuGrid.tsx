import { MenuItem } from '@/types/pos';
import { formatCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface MenuGridProps {
  items: MenuItem[];
  onAddItem: (item: MenuItem) => void;
}

export const MenuGrid = ({ items, onAddItem }: MenuGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onAddItem(item)}
          className="menu-item-card text-left group"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {item.name}
            </h3>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
              <Plus className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {item.description}
            </p>
          )}
          <p className="text-lg font-bold text-primary mt-2">
            {formatCurrency(item.price)}
          </p>
        </button>
      ))}
    </div>
  );
};

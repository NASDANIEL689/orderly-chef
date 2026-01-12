import { Category } from '@/types/pos';
import { UtensilsCrossed, Pizza, Coffee, Cookie, Cake } from 'lucide-react';

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  burger: UtensilsCrossed,
  pizza: Pizza,
  coffee: Coffee,
  fries: Cookie,
  cake: Cake,
};

export const CategoryTabs = ({ categories, selectedCategory, onSelectCategory }: CategoryTabsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelectCategory(null)}
        className={`category-chip flex items-center gap-2 whitespace-nowrap ${
          selectedCategory === null ? 'category-chip-active' : 'category-chip-inactive'
        }`}
      >
        <UtensilsCrossed className="w-4 h-4" />
        All Items
      </button>
      {categories.map((category) => {
        const Icon = iconMap[category.icon || ''] || UtensilsCrossed;
        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`category-chip flex items-center gap-2 whitespace-nowrap ${
              selectedCategory === category.id ? 'category-chip-active' : 'category-chip-inactive'
            }`}
          >
            <Icon className="w-4 h-4" />
            {category.name}
          </button>
        );
      })}
    </div>
  );
};

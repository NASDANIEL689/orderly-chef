import { useState } from 'react';
import { useMenuItems } from '@/hooks/useMenu';
import { useSpecials, useCreateSpecial, useUpdateSpecial, useDeleteSpecial, type Special } from '@/hooks/useSpecials';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Edit2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const SpecialsManagement = () => {
  const { data: specials = [], isLoading: specialsLoading } = useSpecials();
  const { data: menuItems = [] } = useMenuItems();
  const createSpecial = useCreateSpecial();
  const updateSpecial = useUpdateSpecial();
  const deleteSpecial = useDeleteSpecial();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    menu_item_id: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    start_date: '',
    end_date: '',
    description: '',
    is_active: true,
  });

  const handleOpenDialog = (special?: Special) => {
    if (special) {
      setEditingId(special.id);
      setFormData({
        menu_item_id: special.menu_item_id,
        discount_type: special.discount_type,
        discount_value: special.discount_value.toString(),
        start_date: special.start_date.split('T')[0],
        end_date: special.end_date.split('T')[0],
        description: special.description || '',
        is_active: special.is_active,
      });
    } else {
      setEditingId(null);
      setFormData({
        menu_item_id: '',
        discount_type: 'percentage',
        discount_value: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '',
        is_active: true,
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.menu_item_id || !formData.discount_value || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    const specialData = {
      menu_item_id: formData.menu_item_id,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      description: formData.description,
      is_active: formData.is_active,
    };

    if (editingId) {
      await updateSpecial.mutateAsync({ id: editingId, ...specialData });
    } else {
      await createSpecial.mutateAsync(specialData);
    }

    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this special?')) {
      await deleteSpecial.mutateAsync(id);
    }
  };

  const getMenuItemName = (itemId: string) => {
    return menuItems.find(item => item.id === itemId)?.name || 'Unknown Item';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Manage Specials</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Special
        </Button>
      </div>

      {specialsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : specials.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No specials yet. Create one to get started!
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Menu Item</TableHead>
                <TableHead>Discount Type</TableHead>
                <TableHead>Discount Value</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specials.map((special) => (
                <TableRow key={special.id}>
                  <TableCell>{getMenuItemName(special.menu_item_id)}</TableCell>
                  <TableCell className="capitalize">{special.discount_type}</TableCell>
                  <TableCell>
                    {special.discount_type === 'percentage'
                      ? `${special.discount_value}%`
                      : `$${special.discount_value.toFixed(2)}`}
                  </TableCell>
                  <TableCell>{new Date(special.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(special.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        special.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {special.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(special)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(special.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Special' : 'Create Special'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the special offer details.' : 'Create a new special offer for menu items.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="menu-item">Menu Item *</Label>
              <Select value={formData.menu_item_id} onValueChange={(value) => setFormData({ ...formData, menu_item_id: value })}>
                <SelectTrigger id="menu-item">
                  <SelectValue placeholder="Select menu item" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - ${item.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount-type">Discount Type *</Label>
                <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value as 'percentage' | 'fixed' })}>
                  <SelectTrigger id="discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount-value">
                  Discount Value {formData.discount_type === 'percentage' ? '(%)' : '($)'} *
                </Label>
                <Input
                  id="discount-value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter special description (optional)"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <Label htmlFor="is-active" className="cursor-pointer">
                Active
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSpecial.isPending || updateSpecial.isPending}>
                {createSpecial.isPending || updateSpecial.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Plus, Loader2, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';

interface StaffUser {
  user_id: string;
  role: 'staff' | 'admin';
  email?: string;
  created_at: string;
}

export const StaffManagement = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'staff' | 'admin'>('staff');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Fetch staff users
  const { data: staffUsers = [], isLoading } = useQuery({
    queryKey: ['staff-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_users')
        .select('user_id, role, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch email for each user
      const usersWithEmail = await Promise.all(
        data.map(async (staff) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(staff.user_id);
          return {
            ...staff,
            email: user?.email || 'Unknown',
          };
        })
      );
      
      return usersWithEmail as StaffUser[];
    },
  });

  // Create staff user
  const createStaffMutation = useMutation({
    mutationFn: async () => {
      if (!newUserEmail || !newUserPassword) {
        throw new Error('Email and password are required');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
      });

      if (authError) throw authError;

      // Add to staff_users table
      const { error: staffError } = await supabase
        .from('staff_users')
        .insert({
          user_id: authData.user.id,
          role: selectedRole,
        });

      if (staffError) throw staffError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-users'] });
      toast.success('Staff user created successfully');
      setIsOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setSelectedRole('staff');
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  // Update staff role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'staff' | 'admin' }) => {
      const { error } = await supabase
        .from('staff_users')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-users'] });
      toast.success('Role updated successfully');
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  // Delete staff user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Remove from staff_users table first
      const { error: staffError } = await supabase
        .from('staff_users')
        .delete()
        .eq('user_id', userId);

      if (staffError) throw staffError;

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-users'] });
      toast.success('Staff user deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  const handleOpenCreateDialog = () => {
    setEditingId(null);
    setNewUserEmail('');
    setNewUserPassword('');
    setSelectedRole('staff');
    setIsOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    await createStaffMutation.mutateAsync();
  };

  const handleDelete = (userId: string, email: string) => {
    if (confirm(`Are you sure you want to delete ${email}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Staff Management</h2>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : staffUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No staff users yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffUsers.map((staff) => (
                <TableRow key={staff.user_id}>
                  <TableCell className="font-medium">{staff.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {staff.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Users className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="capitalize font-semibold text-sm">
                        {staff.role}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(staff.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select
                        defaultValue={staff.role}
                        onValueChange={(newRole) =>
                          updateRoleMutation.mutate({
                            userId: staff.user_id,
                            role: newRole as 'staff' | 'admin',
                          })
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(staff.user_id, staff.email || 'User')}
                        disabled={deleteUserMutation.isPending}
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create Staff User</DialogTitle>
            <DialogDescription>
              Add a new staff member to the system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email *</Label>
              <Input
                id="staff-email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="staff@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-password">Password *</Label>
              <Input
                id="staff-password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Set password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-role">Role</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as 'staff' | 'admin')}>
                <SelectTrigger id="staff-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createStaffMutation.isPending}
            >
              {createStaffMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

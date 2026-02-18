import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SpecialsManagement } from '@/components/pos/admin/SpecialsManagement';
import { ProfitAnalytics } from '@/components/pos/admin/ProfitAnalytics';
import { StaffManagement } from '@/components/pos/admin/StaffManagement';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Tag, Users, LogOut } from 'lucide-react';

const AdminDashboard = ({ session }: { session: Session }) => {
  const [activeTab, setActiveTab] = useState('analytics');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Chef Paul's <span className="text-primary">Admin</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <span className="text-xs text-muted-foreground">{session.user.email}</span>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="specials" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Specials</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Staff</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <ProfitAnalytics />
          </TabsContent>

          {/* Specials Tab */}
          <TabsContent value="specials" className="space-y-4">
            <SpecialsManagement />
          </TabsContent>

          {/* Staff Management Tab */}
          <TabsContent value="staff" className="space-y-4">
            <StaffManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

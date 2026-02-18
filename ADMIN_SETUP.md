# Admin Features Setup Guide

## Quick Start

The admin features are now integrated into your Orderly Chef POS system. Follow these steps to activate them:

### 1. Run Database Migrations

The new admin features require database updates. Push the migrations to your Supabase instance:

```bash
# From the project root
supabase db push
```

This will:
- Create the `specials` table
- Create indexes for efficient queries
- Set up analytics views (`order_analytics`, `daily_analytics`)
- Configure Row Level Security policies

### 2. Create an Admin User

1. Start your POS system: `npm run dev`
2. Log in with any staff account
3. If you're the first admin, use the POS "Create user" button to add yourself as admin
4. Make one of the created users an admin via the Staff Management dashboard

### 3. Access the Admin Dashboard

Once logged in as an admin:
1. You'll see an **Admin** button in the POS header
2. Click it to access the admin dashboard
3. Switch between **Analytics**, **Specials**, and **Staff** tabs

---

## Features Overview

### Admin Dashboard (Available at `/admin`)

#### Analytics Tab
- View profit metrics across different timelines
- See revenue, profit, and order trends
- Analyze daily performance in detail
- Track cancellation rates

#### Specials Tab
- Create percentage or fixed-amount discounts
- Set start and end dates for special offers
- Enable/disable specials without deleting
- View all active and inactive specials

#### Staff Tab
- Create new staff and admin users
- Change user roles dynamically
- Delete user accounts and authentication records
- See user creation dates

---

## Key Components Created

### Files Added

```
src/
  ├── hooks/
  │   ├── useSpecials.ts          # Specials management hooks
  │   └── useAnalytics.ts         # Analytics data hooks
  ├── components/pos/admin/
  │   ├── SpecialsManagement.tsx  # Specials UI component
  │   ├── ProfitAnalytics.tsx     # Analytics dashboard
  │   └── StaffManagement.tsx     # Staff management UI
  └── pages/
      └── Admin.tsx               # Admin dashboard page

supabase/migrations/
  └── 20260218120000_add_specials_table.sql  # DB schema

ADMIN_FEATURES.md                 # Detailed documentation
```

### Database Objects Created

- `specials` table
- `idx_specials_menu_item_id` index
- `idx_specials_is_active` index
- `idx_specials_dates` index
- `order_analytics` view
- `daily_analytics` view
- RLS policies for all new objects

---

## Configuration

### Environment Variables

No additional environment variables are required. The system uses existing Supabase configuration.

### Admin Roles

The system uses Postgres-level role checking:

```typescript
// Role check query
SELECT 1 FROM public.staff_users su
WHERE su.user_id = auth.uid()
  AND su.role = 'admin'
```

---

## Testing Checklist

After setup, verify these features work:

- [ ] Can access admin dashboard with admin account
- [ ] Analytics tab shows data for different timelines
- [ ] Can create a new special offer
- [ ] Can edit and delete specials
- [ ] Special discounts appear in profit calculations
- [ ] Can create new staff users
- [ ] Can change user roles
- [ ] Can delete users
- [ ] Profit analytics include discount amounts
- [ ] Non-admin users cannot access `/admin` route

---

## Performance Notes

### Analytics Performance
- Daily analytics are pre-calculated via views
- Queries should return in < 1 second for 90-day periods
- Use timeline filters to optimize response times on larger datasets

### Specials Performance
- Specials are indexed by `menu_item_id` and `is_active`
- Queries for active specials are optimized
- Date-based filtering is indexed

### Recommendations
- Review analytics monthly to archive old data if needed
- Keep number of active specials reasonable (< 100)
- Monitor database size periodically

---

## Troubleshooting

### Migrations Don't Apply
```bash
# Check migration status
supabase migration list

# Re-run migrations
supabase db push --dry-run  # Preview changes
supabase db push            # Apply changes
```

### Admin Button Missing
- Verify user role is `admin` in `staff_users` table
- Check RLS policies aren't blocking access
- Refresh browser and clear cache

### Analytics No Data
- Ensure you have completed orders in the database
- Check that order dates are recent
- Verify `order_analytics` view exists: 
  ```sql
  SELECT * FROM public.order_analytics LIMIT 1;
  ```

### Specials Not Applying
- Verify special is marked `is_active = true`
- Check start_date is not in the future
- Ensure end_date hasn't passed
- Confirm `menu_item_id` is correct

---

## Next Steps

1. Review [ADMIN_FEATURES.md](./ADMIN_FEATURES.md) for detailed feature documentation
2. Test all admin features with your team
3. Set up admin users for different departments
4. Configure special offers for upcoming promotions
5. Monitor analytics to track business performance

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review detailed documentation in ADMIN_FEATURES.md
3. Check database logs for RLS or permission errors
4. Verify Supabase instance is running and accessible

---

## Database Migration Details

The migration file creates:

1. **Specials Table**
   - Tracks discount/special offers
   - Links to menu items
   - Date-based activation
   - Soft-delete via `is_active` flag

2. **Analytics Views**
   - `order_analytics`: Profit per order
   - `daily_analytics`: Aggregated daily metrics

3. **Security Policies**
   - Staff can read active specials
   - Admins can manage all specials
   - Automatic tracking of who created specials

4. **Indexes**
   - Fast lookup by menu item
   - Fast filtering by active status
   - Optimized date range queries

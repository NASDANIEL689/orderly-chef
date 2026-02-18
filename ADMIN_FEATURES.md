# Admin Features Documentation

## Overview

The Orderly Chef POS system now includes comprehensive admin functionality that allows authorized administrators to:

1. **Manage Specials** - Create, edit, and manage special offers and discounts
2. **View Profit Analytics** - Track profitability with detailed analytics across different timelines
3. **Manage Staff** - Create and manage staff user accounts with role assignments

## Admin Dashboard Access

### How to Access
- Only users with the **Admin** role can access the admin dashboard
- Click the **Admin** button in the POS header (available only for admin users)
- Or navigate directly to `/admin`

### Admin Features

---

## 1. Profit Analytics

### Overview
The Profit Analytics dashboard provides detailed insights into business performance with real-time data visualization.

### Key Metrics
- **Total Revenue**: Sum of all completed order totals
- **Total Profit**: Calculated revenue minus discounts
- **Total Orders**: Count of all orders in the period
- **Completed Orders**: Successfully completed transactions
- **Average Profit/Order**: Mean profit per completed order
- **Highest/Lowest Order Profit**: Peak and minimum order profits

### Timeline Selection
View analytics for:
- Last 7 Days
- Last 30 Days
- Last 90 Days

### Visualizations
1. **Revenue vs Profit Trend Chart**
   - Line chart showing daily revenue and profit trends
   - Helps identify profitable periods

2. **Orders and Profit Chart**
   - Bar chart for order count
   - Line overlay showing profit amounts
   - Correlates order volume with profitability

3. **Daily Breakdown Table**
   - Detailed day-by-day performance
   - Sortable metrics
   - Export-ready format

### Data Calculation
- Profit = Total Revenue - Discounts Applied
- Specials and discounts are automatically factored into profit calculations
- Only completed orders are included in analytics

---

## 2. Specials Management

### Creating a Special

1. Navigate to **Admin Dashboard** → **Specials** tab
2. Click **Add Special** button
3. Fill in the details:
   - **Menu Item**: Select the item to discount
   - **Discount Type**: Choose between:
     - **Percentage (%)**: Discount as percentage of item price
     - **Fixed Amount ($)**: Flat discount amount
   - **Discount Value**: The amount or percentage
   - **Start Date**: When the special begins
   - **End Date**: When the special expires
   - **Description**: Optional details about the special
   - **Active**: Toggle to enable/disable the special

4. Click **Save**

### Editing a Special

1. Click the **Edit** (pencil) icon in the specials table
2. Modify any fields
3. Click **Save**

### Deleting a Special

1. Click the **Delete** (trash) icon
2. Confirm the deletion

### Special Rules
- End date must be after start date
- Discount value must be greater than zero
- Specials only apply during their active date range
- Multiple specials cannot overlap on the same item (last created takes precedence)

### Special Application
- Specials are automatically applied when orders are created
- Staff can see active specials in the POS system
- Discounts are deducted from the order total
- Profit calculations account for all applied discounts

---

## 3. Staff Management

### Creating a Staff User

1. Navigate to **Admin Dashboard** → **Staff** tab
2. Click **Add Staff** button
3. Enter details:
   - **Email**: Employee email address
   - **Password**: Set initial password (employees should change on first login)
   - **Role**: 
     - **Staff**: Can access POS, view specials, create orders
     - **Admin**: Can access admin dashboard, manage specials, manage staff, view analytics

4. Click **Create**

### Changing Staff Role

1. In the **Staff** tab, locate the employee
2. Use the role dropdown to change between **Staff** and **Admin**
3. Changes take effect immediately

### Deleting a Staff User

1. Click the **Delete** button next to an employee
2. Confirm the deletion
3. The employee's auth account and staff record are removed

### Staff Permissions

**Staff Role:**
- Access POS system
- Create and process orders
- View active specials
- Cannot access admin dashboard

**Admin Role:**
- All Staff capabilities plus:
- Access admin dashboard
- Create and manage specials
- Create and manage staff users
- View profit analytics
- Create user accounts for new staff

---

## Database Schema

### Specials Table
```sql
CREATE TABLE specials (
  id UUID PRIMARY KEY,
  menu_item_id UUID (references menu_items),
  discount_type TEXT ('percentage' | 'fixed'),
  discount_value DECIMAL,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  description TEXT,
  is_active BOOLEAN,
  created_by UUID (references users),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Analytics Views
- `order_analytics`: Detailed view of each order with calculated profit
- `daily_analytics`: Aggregated daily performance metrics

---

## API Hooks

### Specials Hooks

#### `useSpecials(isActive?: boolean)`
Fetch specials with optional filtering by active status.

```typescript
const { data: specials, isLoading } = useSpecials(true);
```

#### `useCreateSpecial()`
Create a new special.

```typescript
const createSpecial = useCreateSpecial();
await createSpecial.mutateAsync({
  menu_item_id: 'item-id',
  discount_type: 'percentage',
  discount_value: 10,
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  description: 'Weekend Special',
  is_active: true
});
```

#### `useUpdateSpecial()`
Update an existing special.

```typescript
const updateSpecial = useUpdateSpecial();
await updateSpecial.mutateAsync({
  id: 'special-id',
  discount_value: 15
});
```

#### `useDeleteSpecial()`
Delete a special.

```typescript
const deleteSpecial = useDeleteSpecial();
await deleteSpecial.mutateAsync('special-id');
```

### Analytics Hooks

#### `useDailyAnalytics()`
Fetch daily analytics data.

```typescript
const { data: dailyData } = useDailyAnalytics();
```

#### `useAnalyticsSummary(days: number)`
Get aggregated summary for specified days (default: 30).

```typescript
const { data: summary } = useAnalyticsSummary(30);
// Returns: { totalRevenue, totalProfit, totalOrders, ... }
```

#### `useTrendData(days: number)`
Fetch trend data for charting.

```typescript
const { data: trendData } = useTrendData(30);
```

---

## Security & Permissions

All admin features are protected by Row Level Security (RLS) policies:

- **Specials**: Only staff users can read specials; only admins can modify
- **Staff Users**: Only admins can manage staff records
- **Analytics**: Only staff users can view analytics
- User authentication is required for all operations

---

## Best Practices

### For Specials Management
1. Plan specials in advance
2. Set realistic end dates to avoid expired specials showing
3. Use descriptive names/descriptions
4. Monitor profit impact of discounts
5. Archive inactive specials periodically

### For Staff Management
1. Assign admin role carefully - limit number of admins
2. Ensure strong passwords are used initially
3. Review staff regularly and remove inactive users
4. Keep staff roles updated when responsibilities change

### For Analytics
1. Check analytics regularly to identify trends
2. Use different timelines for short and long-term analysis
3. Monitor profit margins during special campaigns
4. Compare week-over-week and month-over-month trends

---

## Troubleshooting

### Admin Button Not Appearing
- Ensure you're logged in with an admin role
- Check the staff table to verify your role
- Refresh the page

### Specials Not Applying
- Verify the special's end date hasn't passed
- Check that the special is marked as active
- Ensure the menu item ID is correct
- Review profit analytics to see discount amounts

### Analytics Not Showing Data
- Ensure you have completed orders in the selected timeframe
- Check database connectivity
- Try refreshing the page
- Select a larger timeline if no recent data exists

---

## Coming Soon

Future enhancements planned:
- Bulk special creation
- Advanced filtering and search
- Export analytics to PDF/CSV
- Staff performance metrics
- Inventory management
- Customer loyalty programs

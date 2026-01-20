# Vendor & Logistics System Updates - 2026-01-20

## Summary
This update focuses on fixing the vendor signup flow, enabling public order tracking with driver details, and enhancing the vendor dashboard with real-time notifications and UI improvements.

## 1. Vendor Signup Improvements
- **Package Selection**: Replaced the static card list with a **searchable dropdown** for subscription packages on the vendor signup page. This improves usability, especially when there are many packages.
- **Default Selection**: The "Starter" package (or the one marked as default in DB) is now automatically selected.
- **Header Visibility**: Fixed `App.tsx` handling of routes to ensure the main site header is **visible** on the Signup page (`/vendor-signup`), while remaining hidden on the Dashboard (`/vendor/*`).
- **Subscription Fixes**: 
  - Corrected Foreign Key constraint issues by ensuring `auth.users.id` is used for vendor subscriptions.
  - Updated RLS policies to allow proper subscription creation during signup.

## 2. Public Order Tracking
- **Unauthenticated Access**: Implemented a secure RPC function (`get_delivery_details`) to allow Public users (guests) to track orders using *only* a tracking number.
- **Enhanced Details**: The tracking page now displays:
  - **Assigned Driver**: Name, phone number, vehicle type, and vehicle number.
  - **Live Status**: Current delivery status (Pending -> Picked Up -> In Transit -> Delivered).
  - **History**: Full timeline of tracking events.
- **Database**: 
  - Created `ENABLE_PUBLIC_TRACKING.sql` script to set up the necessary secure functions.

## 3. Vendor Dashboard Enhancements
- **Notifications System**:
  - Added a **Real-time Notification Center** (`VendorNotifications.tsx`) to the dashboard header.
  - Features: Unread count badge, dropdown list, "Mark as Read" functionality, and auto-updates via Supabase Realtime subs.
- **Branding**:
  - Replaced the text-based header in the sidebar with the **ZimAIO Logo**.
  - Implemented responsive logo resizing (large on expand, icon on collapse).

## 4. Technical Fixes
- **RLS Policies**: Fixed Row Level Security policies for `vendor_subscriptions` to prevent permission errors.
- **Code Refactoring**: Cleaned up imports and state management in `VendorSetup.tsx` and `TrackOrderPage.tsx`.

## Instructions for Deploying Database Changes
To ensure all new features work correctly, please run the following SQL scripts in your Supabase SQL Editor:
1. `FIX_SUBSCRIPTION_RLS.sql` - Fixes permission issues for vendor signups.
2. `ENABLE_PUBLIC_TRACKING.sql` - Enables the public tracking function.

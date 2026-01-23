# Task: Optimize Homepage Layout

## Status: Completed

### Objectives
- [x] Remove "Brands" from the top header.
- [x] Remove the Features section (Wide Selection, Secure Checkout, etc.) from the homepage.
- [x] Implement horizontal sliding (carousel) for Vendors and Featured Products on mobile view.

### Details
- **Header Updates:**
    - Modified `src/components/Header.tsx` to filter out 'BRANDS' from the navigation items, ensuring it doesn't appear in the top bar.
    
- **Homepage Layout Changes (`src/pages/HomePage.tsx`):**
    - **Removed Features Section:** Deleted the section containing "Wide Selection", "Secure Checkout", "Best Value", and "Expert Support".
    - **Mobile Optimization:**
        - Updated `VendorShops` list to use `flex overflow-x-auto snap-x` on mobile boundaries, switching to `grid` on medium (`md`) screens and up.
        - Updated `FeaturedProducts` list to use the same horizontal scroll pattern on mobile.
        - Added `min-w-[...]` and `snap-center` classes to items to ensure proper scrolling behavior.
        - Verified changes across desktop (1280px) and mobile (375px) viewports.

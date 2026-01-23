# Task: Add Contact Us to Header

## Status: Completed

### Objectives
- [x] Add "Contact Us" to the main emerald green navigation bar.
- [x] Position it strictly *before* "Sell on Zimaio".
- [x] Ensure appropriate icon handling (`MessageCircle`).

### Details
- **Updated `src/components/Header.tsx`**:
    - Enhanced `getIcon` helper to support the `'MessageCircle'` icon.
    - Modified the `fetchNavigationItems` logic in the `useEffect` hook.
    - Implemented logic to find the index of `/vendor-signup` (the "Sell on Zimaio" link) and insert the "Contact Us" item immediately before it.
    - Verified the order using a browser screenshot: **VENDORS** -> **CONTACT US** -> **SELL ON ZIMAIO**.

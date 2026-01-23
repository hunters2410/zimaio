# Task: Reorder Navigation Items

## Status: Completed

### Objectives
- [x] Change the order of navigation items in the top header.
- [x] New Order: **VENDORS** -> **SELL ON ZIMAIO** -> **CONTACT US**.

### Details
- **Updated `src/components/Header.tsx`**:
    - Adjusted the splice logic to insert the "Contact Us" item at `sellIndex + 1`.
    - This effectively places "Contact Us" immediately *after* "Sell on Zimaio".
    - Verified the new order with a browser screenshot.

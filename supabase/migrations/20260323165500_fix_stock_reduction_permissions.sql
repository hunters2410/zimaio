-- Migration: fix_stock_reduction_permissions
-- Description: Refactors stock management to ONLY deduct stock when an order is marked as 'paid'.

-- 1. Redefine handle_stock_on_order_item to only handle RESTORING stock on deletion (cancellation)
CREATE OR REPLACE FUNCTION handle_stock_on_order_item_deletion()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_status text;
BEGIN
    SELECT payment_status INTO v_payment_status FROM orders WHERE id = OLD.order_id;
    
    -- If the order was already paid, we refund the stock when an item is deleted
    -- (Usually items aren't deleted from paid orders, but this is for safety)
    IF v_payment_status = 'paid' THEN
        UPDATE products
        SET stock_quantity = stock_quantity + OLD.quantity
        WHERE id = OLD.product_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_manage_stock_deletion ON order_items;
CREATE TRIGGER trg_manage_stock_deletion
AFTER DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION handle_stock_on_order_item_deletion();

-- 2. New Function to handle stock deduction when ORDER is PAID
CREATE OR REPLACE FUNCTION handle_stock_on_order_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
BEGIN
    -- Trigger only when payment_status changes to 'paid'
    IF (NEW.payment_status = 'paid' AND (OLD IS NULL OR OLD.payment_status != 'paid')) THEN
        -- Loop through order items and deduct stock
        FOR v_item IN SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
            UPDATE products
            SET stock_quantity = stock_quantity - v_item.quantity
            WHERE id = v_item.product_id;
        END LOOP;
    END IF;

    -- Handle stock REFUND if order is cancelled/refunded after being paid
    IF (NEW.payment_status = 'refunded' AND OLD.payment_status = 'paid') OR
       (NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND NEW.payment_status = 'paid') THEN
        FOR v_item IN SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
            UPDATE products
            SET stock_quantity = stock_quantity + v_item.quantity
            WHERE id = v_item.product_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Attach trigger to orders table
DROP TRIGGER IF EXISTS trg_manage_stock_on_payment ON orders;
CREATE TRIGGER trg_manage_stock_on_payment
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_stock_on_order_payment();

-- 4. CLEANUP: Remove the old unconditional trigger from order_items
DROP TRIGGER IF EXISTS trg_manage_stock ON order_items;

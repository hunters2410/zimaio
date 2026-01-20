-- Function to get delivery details by tracking number publicly
-- This helps unauthenticated users track their orders safely
CREATE OR REPLACE FUNCTION get_delivery_details(p_tracking_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with permissions of the creator (admin), bypassing RLS
AS $$
DECLARE
  v_delivery_id uuid;
  v_delivery_data json;
  v_history_data json;
BEGIN
  -- Get Delivery ID first
  SELECT id INTO v_delivery_id FROM deliveries WHERE tracking_number = p_tracking_number;
  
  IF v_delivery_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fetch Delivery Data including relations
  SELECT json_build_object(
    'id', d.id,
    'tracking_number', d.tracking_number,
    'delivery_status', d.delivery_status,
    'delivery_address', d.delivery_address,
    'customer_phone', d.customer_phone,
    'created_at', d.created_at,
    'pickup_time', d.pickup_time,
    'delivery_time', d.delivery_time,
    'delivery_notes', d.delivery_notes,
    'order', (SELECT json_build_object('total_amount', o.total_amount, 'order_status', o.order_status) FROM orders o WHERE o.id = d.order_id),
    'vendor', (SELECT json_build_object('full_name', p.full_name, 'phone', p.phone) FROM profiles p WHERE p.id = d.vendor_id),
    'driver', (SELECT json_build_object('driver_name', dd.driver_name, 'phone_number', dd.phone_number, 'vehicle_type', dd.vehicle_type, 'vehicle_number', dd.vehicle_number) FROM delivery_drivers dd WHERE dd.id = d.driver_id)
  ) INTO v_delivery_data
  FROM deliveries d
  WHERE d.id = v_delivery_id;

  -- Fetch History Data
  SELECT json_agg(
    json_build_object(
      'id', h.id,
      'status', h.status,
      'location', h.location,
      'notes', h.notes,
      'created_at', h.created_at
    ) ORDER BY h.created_at DESC
  ) INTO v_history_data
  FROM delivery_tracking_history h
  WHERE h.delivery_id = v_delivery_id;

  -- Return Combined Result
  RETURN json_build_object(
    'delivery', v_delivery_data,
    'history', COALESCE(v_history_data, '[]'::json)
  );
END;
$$;

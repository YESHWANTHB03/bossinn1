/*
  # Update RLS policies for internal system access
  
  1. Changes
    - Update RLS policies to allow public access for internal system use
    - Remove authentication requirement since this is an internal system
  
  2. Security
    - Enable RLS on all tables
    - Allow all operations for all users since this is an internal system
    - Note: In production, this should be replaced with proper authentication
*/

-- Update rooms table policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON rooms;
CREATE POLICY "Allow all operations" ON rooms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update bookings table policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON bookings;
CREATE POLICY "Allow all operations" ON bookings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update payments table policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON payments;
CREATE POLICY "Allow all operations" ON payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update inventory table policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON inventory;
CREATE POLICY "Allow all operations" ON inventory
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update purchases table policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON purchases;
CREATE POLICY "Allow all operations" ON purchases
  FOR ALL
  USING (true)
  WITH CHECK (true);
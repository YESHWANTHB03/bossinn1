/*
  # Hotel Management System Schema

  1. New Tables
    - `rooms`
      - `id` (uuid, primary key)
      - `room_number` (integer, unique)
      - `type` (enum: 'ac', 'non-ac')
      - `status` (enum: 'available', 'occupied', 'cleaning')
    
    - `bookings`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `customer_name` (text)
      - `phone_number` (text)
      - `persons` (integer)
      - `extra_beds` (integer)
      - `id_proof_url` (text)
      - `initial_payment` (numeric)
      - `check_in_date` (timestamptz)
      - `expected_check_out` (timestamptz)
      - `actual_check_out` (timestamptz)
      - `status` (enum: 'active', 'completed')
      - `rent_per_day` (numeric)

    - `payments`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, references bookings)
      - `amount` (numeric)
      - `payment_date` (timestamptz)
      - `payment_type` (enum: 'check_in', 'extension', 'purchase')

    - `inventory`
      - `id` (uuid, primary key)
      - `item_name` (text)
      - `quantity` (integer)
      - `price` (numeric)

    - `purchases`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, references bookings)
      - `item_id` (uuid, references inventory)
      - `quantity` (integer)
      - `amount` (numeric)
      - `purchase_date` (timestamptz)
      - `payment_status` (enum: 'paid', 'pending')

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to perform CRUD operations
*/

-- Create custom types
CREATE TYPE room_type AS ENUM ('ac', 'non-ac');
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'cleaning');
CREATE TYPE booking_status AS ENUM ('active', 'completed');
CREATE TYPE payment_type AS ENUM ('check_in', 'extension', 'purchase');
CREATE TYPE payment_status AS ENUM ('paid', 'pending');

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number integer UNIQUE NOT NULL,
  type room_type NOT NULL DEFAULT 'non-ac',
  status room_status NOT NULL DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) NOT NULL,
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  persons integer NOT NULL DEFAULT 1,
  extra_beds integer NOT NULL DEFAULT 0,
  id_proof_url text,
  initial_payment numeric NOT NULL DEFAULT 0,
  check_in_date timestamptz NOT NULL DEFAULT now(),
  expected_check_out timestamptz NOT NULL,
  actual_check_out timestamptz,
  status booking_status NOT NULL DEFAULT 'active',
  rent_per_day numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) NOT NULL,
  amount numeric NOT NULL,
  payment_date timestamptz NOT NULL DEFAULT now(),
  payment_type payment_type NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) NOT NULL,
  item_id uuid REFERENCES inventory(id) NOT NULL,
  quantity integer NOT NULL,
  amount numeric NOT NULL,
  purchase_date timestamptz NOT NULL DEFAULT now(),
  payment_status payment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations for authenticated users" ON rooms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON bookings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON inventory
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON purchases
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_purchases_booking_id ON purchases(booking_id);
CREATE INDEX IF NOT EXISTS idx_purchases_item_id ON purchases(item_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
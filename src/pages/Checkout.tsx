import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';

type ActiveBooking = {
  id: string;
  room_id: string;
  customer_name: string;
  initial_payment: number;
  check_in_date: string;
  room_number: number;
  rent_per_day: number;
};

type PendingPurchase = {
  id: string;
  amount: number;
  item_name: string;
  quantity: number;
};

function Checkout() {
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [bookingDetails, setBookingDetails] = useState<{
    daysStayed: number;
    rentAmount: number;
    purchaseAmount: number;
    advancePayment: number;
  }>({
    daysStayed: 0,
    rentAmount: 0,
    purchaseAmount: 0,
    advancePayment: 0
  });

  useEffect(() => {
    fetchActiveBookings();
  }, []);

  useEffect(() => {
    if (selectedBooking) {
      fetchPendingPurchases();
      calculateTotalAmount();
    }
  }, [selectedBooking]);

  async function fetchActiveBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        room_id,
        customer_name,
        initial_payment,
        check_in_date,
        rent_per_day,
        rooms (
          room_number
        )
      `)
      .eq('status', 'active');

    if (error) {
      toast.error('Failed to fetch active bookings');
      return;
    }

    // Filter out bookings with missing room data
    const validBookings = (data || []).filter(booking => booking.rooms != null);
    
    setActiveBookings(validBookings.map(booking => ({
      ...booking,
      room_number: booking.rooms.room_number
    })));
  }

  async function fetchPendingPurchases() {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        id,
        amount,
        quantity,
        inventory (
          item_name
        )
      `)
      .eq('booking_id', selectedBooking)
      .eq('payment_status', 'pending');

    if (error) {
      toast.error('Failed to fetch pending purchases');
      return;
    }

    setPendingPurchases((data || []).map(purchase => ({
      ...purchase,
      item_name: purchase.inventory?.item_name || 'Unknown Item'
    })));
  }

  async function calculateTotalAmount() {
    const booking = activeBookings.find(b => b.id === selectedBooking);
    if (!booking) return;

    const checkInDate = new Date(booking.check_in_date);
    const now = new Date();
    const days = Math.max(1, differenceInDays(now, checkInDate) + 1);
    const rentAmount = days * booking.rent_per_day;

    // Get all payments for this booking
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, payment_type')
      .eq('booking_id', selectedBooking);

    if (paymentsError) {
      toast.error('Failed to fetch payments');
      return;
    }

    // Calculate advance payment (sum of all extension payments)
    const advancePayment = (payments || [])
      .filter(p => p.payment_type === 'extension')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('amount')
      .eq('booking_id', selectedBooking)
      .eq('payment_status', 'pending');

    if (purchasesError) {
      toast.error('Failed to calculate total amount');
      return;
    }

    const purchaseAmount = (purchases || []).reduce((sum, p) => sum + p.amount, 0);
    const total = rentAmount - booking.initial_payment - advancePayment + purchaseAmount;

    setBookingDetails({
      daysStayed: days,
      rentAmount,
      purchaseAmount,
      advancePayment
    });
    
    setTotalAmount(Math.max(0, total));
  }

  async function handleCheckout() {
    if (!selectedBooking) return;

    try {
      if (totalAmount > 0) {
        // Record final payment as 'extension' type
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            booking_id: selectedBooking,
            amount: totalAmount,
            payment_type: 'extension' // Changed from 'checkout' to 'extension'
          });

        if (paymentError) throw paymentError;
      }

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', selectedBooking);

      if (bookingError) throw bookingError;

      // Update room status
      const booking = activeBookings.find(b => b.id === selectedBooking);
      if (!booking) throw new Error('Booking not found');

      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'cleaning' })
        .eq('id', booking.room_id);

      if (roomError) throw roomError;

      // Update purchase status
      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({ payment_status: 'paid' })
        .eq('booking_id', selectedBooking);

      if (purchaseError) throw purchaseError;

      toast.success('Checkout completed successfully');
      setSelectedBooking('');
      fetchActiveBookings();
    } catch (error) {
      toast.error('Failed to process checkout');
      console.error(error);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

      <div className="mb-6">
        <label className="block text-lg font-large text-gray-1000 mb-2 font-bold">SELECT ROOM</label>
        <select
          value={selectedBooking}
          onChange={(e) => setSelectedBooking(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 
             p-3 text-lg h-14">
        
          <option value="">Select a room</option>
          {activeBookings.map((booking) => (
            <option key={booking.id} value={booking.id}>
              Room {booking.room_number} - {booking.customer_name}
            </option>
          ))}
        </select>
      </div>

      {selectedBooking && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Stay Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Days Stayed</p>
                <p className="text-lg font-medium">{bookingDetails.daysStayed} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Room Rent</p>
                <p className="text-lg font-medium">₹{bookingDetails.rentAmount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Initial Payment</p>
                <p className="text-lg font-medium">₹{activeBookings.find(b => b.id === selectedBooking)?.initial_payment || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Advance Payment</p>
                <p className="text-lg font-medium">₹{bookingDetails.advancePayment}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Pending Purchases</h2>
            {pendingPurchases.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td className="px-6 py-4">{purchase.item_name}</td>
                      <td className="px-6 py-4">{purchase.quantity}</td>
                      <td className="px-6 py-4">₹{purchase.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No pending purchases</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Total Amount Due</h2>
            <p className="text-3xl font-bold text-blue-600">₹{totalAmount}</p>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            Complete Checkout
          </button>
        </>
      )}
    </div>
  );
}

export default Checkout;
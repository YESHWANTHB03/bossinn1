import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type Payment = {
  id: string;
  amount: number;
  payment_date: string;
  payment_type: string;
};

type BookedRoom = {
  id: string;
  room_number: number;
  customer_name: string;
  phone_number: string;
  check_in_date: string;
  persons: number;
  extra_beds: number;
  initial_payment: number;
  type: 'ac' | 'non-ac';
  rent_per_day: number;
  payments: Payment[];
  totalDue: number;
};

type ModalType = 'payment' | 'rentChange' | null;

type ModalState = {
  type: ModalType;
  roomId: string | null;
};

function BookedRooms() {
  const [bookedRooms, setBookedRooms] = useState<BookedRoom[]>([]);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [newRentAmounts, setNewRentAmounts] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<ModalState>({ type: null, roomId: null });

  useEffect(() => {
    fetchBookedRooms();
  }, []);

  async function fetchBookedRooms() {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_name,
        phone_number,
        check_in_date,
        persons,
        extra_beds,
        initial_payment,
        rent_per_day,
        rooms (
          room_number,
          type
        )
      `)
      .eq('status', 'active');

    if (error) {
      toast.error('Failed to fetch booked rooms');
      return;
    }

    // Filter out any bookings with missing room data
    const validBookings = data.filter(booking => booking.rooms != null);
    
    // Fetch payments for each booking
    const bookingsWithPayments = await Promise.all(
      validBookings.map(async (booking) => {
        // Get all payments
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('booking_id', booking.id)
          .order('payment_date', { ascending: false });

        // Get pending purchases
        const { data: purchases } = await supabase
          .from('purchases')
          .select('amount')
          .eq('booking_id', booking.id)
          .eq('payment_status', 'pending');

        const totalPurchases = (purchases || []).reduce((sum, p) => sum + p.amount, 0);
        const totalPayments = (payments || []).reduce((sum, p) => sum + p.amount, 0);
        const daysStayed = Math.max(1, Math.ceil((new Date().getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)));
        const totalRent = daysStayed * booking.rent_per_day;
        const totalDue = totalRent + totalPurchases - booking.initial_payment - totalPayments;

        return {
          ...booking,
          room_number: booking.rooms.room_number,
          type: booking.rooms.type,
          payments: payments || [],
          totalDue: Math.max(0, totalDue)
        };
      })
    );

    setBookedRooms(bookingsWithPayments);
  }

  async function handlePayment(roomId: string) {
    const amount = parseFloat(paymentAmounts[roomId]);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const room = bookedRooms.find(r => r.id === roomId);
    if (!room) return;

    try {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: roomId,
          amount,
          // Using 'extension' for all payments since it's a valid enum value
          payment_type: 'extension'
        });

      if (paymentError) throw paymentError;

      toast.success('Payment recorded successfully');
      setModal({ type: null, roomId: null });
      setPaymentAmounts({ ...paymentAmounts, [roomId]: '' });
      fetchBookedRooms();
    } catch (error) {
      toast.error('Failed to process payment');
      console.error(error);
    }
  }

  async function handleRentChange(roomId: string) {
    const newRent = parseFloat(newRentAmounts[roomId]);
    if (!newRent || newRent <= 0) {
      toast.error('Please enter a valid rent amount');
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ rent_per_day: newRent })
        .eq('id', roomId);

      if (error) throw error;

      toast.success('Rent updated successfully');
      setModal({ type: null, roomId: null });
      setNewRentAmounts({ ...newRentAmounts, [roomId]: '' });
      fetchBookedRooms();
    } catch (error) {
      toast.error('Failed to update rent');
      console.error(error);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Booked Rooms</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookedRooms.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Room {room.room_number}
                </h2>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">
                    {room.type.toUpperCase()} - ₹{room.rent_per_day}/day
                  </p>
                  <button
                    onClick={() => setModal({ type: 'rentChange', roomId: room.id })}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Change
                  </button>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Occupied
              </span>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Guest Name:</label>
                  <p className="text-gray-800">{room.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone:</label>
                  <p className="text-gray-800">{room.phone_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Check-in:</label>
                  <p className="text-gray-800">
                    {format(new Date(room.check_in_date), 'PPpp')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Guests:</label>
                  <p className="text-gray-800">
                    {room.persons} person(s), {room.extra_beds} extra bed(s)
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">Payment History</h3>
                  <p className="text-sm font-medium text-red-600">Due: ₹{room.totalDue}</p>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {room.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {format(new Date(payment.payment_date), 'PPpp')}
                        <span className="ml-2 text-xs text-blue-600">
                          ({payment.payment_type})
                        </span>
                      </span>
                      <span className="font-medium">₹{payment.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setModal({ type: 'payment', roomId: room.id })}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Make Payment
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal.type === 'payment' && modal.roomId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Make Payment</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={paymentAmounts[modal.roomId] || ''}
                onChange={(e) => setPaymentAmounts({
                  ...paymentAmounts,
                  [modal.roomId]: e.target.value
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter amount"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setModal({ type: null, roomId: null })}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePayment(modal.roomId)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'rentChange' && modal.roomId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Change Room Rent</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Rent per Day (₹)
              </label>
              <input
                type="number"
                value={newRentAmounts[modal.roomId] || ''}
                onChange={(e) => setNewRentAmounts({
                  ...newRentAmounts,
                  [modal.roomId]: e.target.value
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter new rent amount"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setModal({ type: null, roomId: null })}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRentChange(modal.roomId)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Update Rent
              </button>
            </div>
          </div>
        </div>
      )}

      {bookedRooms.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No rooms are currently occupied
        </div>
      )}
    </div>
  );
}

export default BookedRooms;
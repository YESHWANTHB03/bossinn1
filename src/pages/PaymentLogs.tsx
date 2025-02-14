import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

type Payment = {
  id: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  room_number: number;
};

function PaymentLogs() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_date,
        payment_type,
        bookings (
          rooms (
            room_number
          )
        )
      `)
      .order('payment_date', { ascending: false });

    if (!error && data) {
      setPayments(data.map(payment => ({
        ...payment,
        room_number: payment.bookings.rooms.room_number
      })));
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">Payment Logs</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {format(new Date(payment.payment_date), 'PPpp')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    Room {payment.room_number}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm capitalize">
                    {payment.payment_type.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    ₹{payment.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PaymentLogs;
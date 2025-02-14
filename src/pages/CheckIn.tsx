import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { addDays } from 'date-fns';

type CheckInForm = {
  customerName: string;
  phoneNumber: string;
  persons: number;
  extraBeds: number;
  initialPayment: number;
  idProofUrl: string;
  rentPerDay: number;
};

function CheckIn() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<CheckInForm>();

  const onSubmit = async (data: CheckInForm) => {
    try {
      const checkInDate = new Date();
      // Set expected checkout to next day by default
      const expectedCheckOut = addDays(checkInDate, 1);

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          room_id: roomId,
          customer_name: data.customerName,
          phone_number: data.phoneNumber,
          persons: data.persons,
          extra_beds: data.extraBeds,
          id_proof_url: data.idProofUrl,
          initial_payment: data.initialPayment,
          check_in_date: checkInDate.toISOString(),
          expected_check_out: expectedCheckOut.toISOString(),
          status: 'active',
          rent_per_day: data.rentPerDay
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update room status
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', roomId);

      if (roomError) throw roomError;

      // Create payment record for check-in
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: booking.id,
          amount: data.initialPayment,
          payment_type: 'check_in'
        });

      if (paymentError) throw paymentError;

      toast.success('Check-in successful!');
      navigate('/rooms');
    } catch (error) {
      toast.error('Failed to process check-in');
      console.error(error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Guest Check-In</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
          <input
            type="text"
            {...register('customerName', { required: 'Customer name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.customerName && (
            <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            {...register('phoneNumber', { 
              required: 'Phone number is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Please enter a valid 10-digit phone number'
              }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Persons</label>
          <input
            type="number"
            {...register('persons', { 
              required: 'Number of persons is required',
              min: {
                value: 1,
                message: 'At least 1 person is required'
              }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.persons && (
            <p className="mt-1 text-sm text-red-600">{errors.persons.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Extra Beds</label>
          <input
            type="number"
            {...register('extraBeds', { 
              min: {
                value: 0,
                message: 'Extra beds cannot be negative'
              }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.extraBeds && (
            <p className="mt-1 text-sm text-red-600">{errors.extraBeds.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof URL</label>
          <input
            type="text"
            {...register('idProofUrl')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rent per Day (₹)</label>
          <input
            type="number"
            {...register('rentPerDay', { 
              required: 'Rent per day is required',
              min: {
                value: 0,
                message: 'Rent cannot be negative'
              }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.rentPerDay && (
            <p className="mt-1 text-sm text-red-600">{errors.rentPerDay.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Initial Payment</label>
          <input
            type="number"
            {...register('initialPayment', { 
              required: 'Initial payment is required',
              min: {
                value: 0,
                message: 'Payment cannot be negative'
              }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.initialPayment && (
            <p className="mt-1 text-sm text-red-600">{errors.initialPayment.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/rooms')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            Check In
          </button>
        </div>
      </form>
    </div>
  );
}

export default CheckIn;
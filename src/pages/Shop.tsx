import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

type InventoryItem = {
  id: string;
  item_name: string;
  quantity: number;
  price: number;
};

type ActiveBooking = {
  id: string;
  room_id: string;
  customer_name: string;
  room_number: number;
};

function Shop() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('pending');
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: '',
    quantity: '',
    price: ''
  });

  useEffect(() => {
    fetchInventory();
    fetchActiveBookings();
  }, []);

  async function fetchInventory() {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('item_name');

    if (error) {
      toast.error('Failed to fetch inventory');
      return;
    }

    setInventory(data || []);
  }

  async function fetchActiveBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        room_id,
        customer_name,
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

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    
    const { error } = await supabase
      .from('inventory')
      .insert({
        item_name: newItem.item_name,
        quantity: parseInt(newItem.quantity),
        price: parseFloat(newItem.price)
      });

    if (error) {
      toast.error('Failed to add item');
      return;
    }

    toast.success('Item added successfully');
    setShowAddItemDialog(false);
    setNewItem({ item_name: '', quantity: '', price: '' });
    fetchInventory();
  }

  async function handlePurchase() {
    if (!selectedBooking) {
      toast.error('Please select a room');
      return;
    }

    const purchases = Object.entries(quantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => {
        const item = inventory.find(i => i.id === itemId);
        return {
          booking_id: selectedBooking,
          item_id: itemId,
          quantity,
          amount: (item?.price || 0) * quantity,
          payment_status: paymentStatus
        };
      });

    if (purchases.length === 0) {
      toast.error('Please select items to purchase');
      return;
    }

    try {
      // Update inventory quantities
      for (const purchase of purchases) {
        const item = inventory.find(i => i.id === purchase.item_id);
        if (!item) {
          toast.error('Item not found');
          return;
        }
        
        if (item.quantity < purchase.quantity) {
          toast.error('Insufficient quantity for ${item.item_name}');
          return;
        }

        const { error: updateError } = await supabase
          .from('inventory')
          .update({ quantity: item.quantity - purchase.quantity })
          .eq('id', purchase.item_id);

        if (updateError) throw updateError;
      }

      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert(purchases);

      if (purchaseError) throw purchaseError;

      if (paymentStatus === 'paid') {
        const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0);
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            booking_id: selectedBooking,
            amount: totalAmount,
            payment_type: 'purchase'
          });

        if (paymentError) throw paymentError;
      }

      toast.success('Purchase recorded successfully');
      setQuantities({});
      setSelectedBooking('');
      setPaymentStatus('pending');
      fetchInventory();
    } catch (error) {
      toast.error('Failed to process purchase');
      console.error(error);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">Shop & Inventory</h1>
        <button
          onClick={() => setShowAddItemDialog(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Add Item</span>
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Room</label>
        <select
          value={selectedBooking}
          onChange={(e) => setSelectedBooking(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">SELECT A ROOM</option>
          {activeBookings.map((booking) => (
            <option key={booking.id} value={booking.id}>
              Room {booking.room_number} - {booking.customer_name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ITEM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PRICE
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AVAILABLE
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QUANTITY
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 whitespace-nowrap">{item.item_name}</td>
                  <td className="px-4 py-4 whitespace-nowrap">₹{item.price}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{item.quantity}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={quantities[item.id] || 0}
                      onChange={(e) => setQuantities({
                        ...quantities,
                        [item.id]: parseInt(e.target.value) || 0
                      })}
                      className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            checked={paymentStatus === 'paid'}
            onChange={() => setPaymentStatus('paid')}
            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
          />
          <span>PAY NOW</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            checked={paymentStatus === 'pending'}
            onChange={() => setPaymentStatus('pending')}
            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
          />
          <span>ADD TO ROOM BILL</span>
        </label>
      </div>

      <button
        onClick={handlePurchase}
        disabled={!selectedBooking}
        className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
      >
        Complete Purchase
      </button>

      {showAddItemDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New Item</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddItemDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shop;
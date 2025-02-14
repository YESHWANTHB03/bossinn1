import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

type Room = {
  id: string;
  room_number: number;
  status: 'available' | 'occupied' | 'cleaning';
  type: 'ac' | 'non-ac';
};

function RoomMatrix() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const navigate = useNavigate();
  const [showCleaningDialog, setShowCleaningDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showAddRoomDialog, setShowAddRoomDialog] = useState(false);
  const [newRoom, setNewRoom] = useState({
    room_number: '',
    type: 'ac'
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number');

    if (error) {
      toast.error('Failed to fetch rooms');
      return;
    }

    setRooms(data);
  }

  async function handleRoomClick(room: Room) {
    if (room.status === 'available') {
      navigate(`/check-in/${room.id}`);
    } else if (room.status === 'cleaning') {
      setSelectedRoom(room);
      setShowCleaningDialog(true);
    }
  }

  async function handleCleaningComplete(isClean: boolean) {
    if (!selectedRoom) return;

    if (isClean) {
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'available' })
        .eq('id', selectedRoom.id);

      if (error) {
        toast.error('Failed to update room status');
        return;
      }

      toast.success('Room marked as available');
      fetchRooms();
    }

    setShowCleaningDialog(false);
    setSelectedRoom(null);
  }

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault();
    
    const { error } = await supabase
      .from('rooms')
      .insert({
        room_number: parseInt(newRoom.room_number),
        type: newRoom.type,
        status: 'available'
      });

    if (error) {
      toast.error('Failed to add room');
      return;
    }

    toast.success('Room added successfully');
    setShowAddRoomDialog(false);
    setNewRoom({ room_number: '', type: 'ac' });
    fetchRooms();
  }

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-red-500';
      case 'cleaning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Room Matrix</h1>
        <button
          onClick={() => setShowAddRoomDialog(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Add Room</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => handleRoomClick(room)}
            className={`p-4 rounded-lg shadow-md ${getStatusColor(room.status)} text-white hover:opacity-90 transition-opacity`}
          >
            <div className="text-lg font-bold">Room {room.room_number}</div>
            <div className="text-sm">{room.type.toUpperCase()}</div>
          </button>
        ))}
      </div>

      {showCleaningDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Room Cleaning Status</h2>
            <p className="mb-4">Has Room {selectedRoom?.room_number} been cleaned?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleCleaningComplete(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
              >
                No
              </button>
              <button
                onClick={() => handleCleaningComplete(true)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddRoomDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New Room</h2>
            <form onSubmit={handleAddRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number
                </label>
                <input
                  type="number"
                  required
                  value={newRoom.room_number}
                  onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  value={newRoom.type}
                  onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value as 'ac' | 'non-ac' })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="ac">AC</option>
                  <option value="non-ac">Non-AC</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddRoomDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomMatrix;
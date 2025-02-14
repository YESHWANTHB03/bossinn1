export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          room_number: number
          type: 'ac' | 'non-ac'
          status: 'available' | 'occupied' | 'cleaning'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_number: number
          type?: 'ac' | 'non-ac'
          status?: 'available' | 'occupied' | 'cleaning'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_number?: number
          type?: 'ac' | 'non-ac'
          status?: 'available' | 'occupied' | 'cleaning'
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          room_id: string
          customer_name: string
          phone_number: string
          persons: number
          extra_beds: number
          id_proof_url: string | null
          initial_payment: number
          check_in_date: string
          expected_check_out: string
          actual_check_out: string | null
          status: 'active' | 'completed'
          rent_per_day: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          customer_name: string
          phone_number: string
          persons?: number
          extra_beds?: number
          id_proof_url?: string | null
          initial_payment?: number
          check_in_date?: string
          expected_check_out: string
          actual_check_out?: string | null
          status?: 'active' | 'completed'
          rent_per_day: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          customer_name?: string
          phone_number?: string
          persons?: number
          extra_beds?: number
          id_proof_url?: string | null
          initial_payment?: number
          check_in_date?: string
          expected_check_out?: string
          actual_check_out?: string | null
          status?: 'active' | 'completed'
          rent_per_day?: number
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          amount: number
          payment_date: string
          payment_type: 'check_in' | 'extension' | 'purchase'
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          amount: number
          payment_date?: string
          payment_type: 'check_in' | 'extension' | 'purchase'
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          amount?: number
          payment_date?: string
          payment_type?: 'check_in' | 'extension' | 'purchase'
          created_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          item_name: string
          quantity: number
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_name: string
          quantity?: number
          price?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_name?: string
          quantity?: number
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          booking_id: string
          item_id: string
          quantity: number
          amount: number
          purchase_date: string
          payment_status: 'paid' | 'pending'
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          item_id: string
          quantity: number
          amount: number
          purchase_date?: string
          payment_status?: 'paid' | 'pending'
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          item_id?: string
          quantity?: number
          amount?: number
          purchase_date?: string
          payment_status?: 'paid' | 'pending'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
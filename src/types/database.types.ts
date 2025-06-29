export interface Staff {
  staff_id: number;
  user_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  hire_date: string;
  hourly_rate: number;
  weekly_hours?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  job_description?: string;
  current_staff?: boolean;
}

export interface FacialProfile {
  id: string;
  staff_id: number;
  face_descriptor: any; // JSON data from face-api.js
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TimeClockEvent {
  id: string;
  staff_id: number;
  event_time: string;
  event_type: 'clock_in' | 'clock_out';
  break_type?: 'work' | 'tea' | 'lunch' | 'other';
  verification_method: 'facial' | 'manual' | 'override';
  confidence_score?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimeSegment {
  id: string;
  staff_id: number;
  date_worked: string;
  clock_in_event_id: string;
  clock_out_event_id?: string;
  start_time: string;
  end_time?: string;
  segment_type: 'work' | 'break';
  break_type?: 'tea' | 'lunch' | 'other';
  duration_minutes?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TimeDailySummary {
  id: string;
  staff_id: number;
  date_worked: string;
  first_clock_in?: string;
  last_clock_out?: string;
  total_work_minutes?: number;
  total_break_minutes?: number;
  lunch_break_minutes?: number;
  other_breaks_minutes?: number;
  is_complete: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
} 
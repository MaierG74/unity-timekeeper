import { createClient } from '@supabase/supabase-js';
import { FacialProfile } from '../types/database.types';

// Hardcoded values from .env.local for Electron renderer compatibility
// In production, these should be properly secured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string; // from .env
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string; // from .env

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Typed helper functions for database operations
export const getActiveStaff = async () => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('is_active', true);
  
  if (error) throw error;
  return data;
};

export const getStaffById = async (staffId: number) => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('staff_id', staffId)
    .single();
  
  if (error) throw error;
  return data;
};

export const clockIn = async (
  staffId: number, 
  // Using the eventType parameter to determine the event type
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  eventType: string, 
  breakType?: string | null
) => {
  try {
    console.log(`Clocking in staff ID ${staffId} with verification method: facial`);
    
    const { data, error } = await supabase
      .from('time_clock_events')
      .insert({
        staff_id: staffId,
        event_time: new Date().toISOString(),
        event_type: eventType,
        break_type: breakType || null,
        verification_method: 'facial'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Clock in error:', error);
      throw error;
    }
    
    console.log('Clock in successful:', data);
    return data;
  } catch (error) {
    console.error('Clock in exception:', error);
    throw error;
  }
};

export const clockOut = async (
  staffId: number,
  eventType: string,
  breakType?: string | null,
  eventTime?: string
) => {
  try {
    console.log(`Clocking out staff ID ${staffId} with verification method: facial`);

    const { data, error } = await supabase
      .from('time_clock_events')
      .insert({
        staff_id: staffId,
        event_time: eventTime || new Date().toISOString(),
        event_type: eventType,
        break_type: breakType || null,
        verification_method: 'facial'
      })
      .select()
      .single();

    if (error) {
      console.error('Clock out error:', error);
      throw error;
    }

    console.log('Clock out successful:', data);
    return data;
  } catch (error) {
    console.error('Clock out exception:', error);
    throw error;
  }
};

export const getTimeEntries = async (staffId: number, date: string) => {
  const { data, error } = await supabase
    .from('time_clock_events')
    .select('*')
    .eq('staff_id', staffId)
    .gte('event_time', `${date}T00:00:00Z`)
    .lte('event_time', `${date}T23:59:59Z`)
    .order('event_time', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const getFacialProfile = async (staffId: number): Promise<FacialProfile | null> => {
  const { data, error } = await supabase
    .from('facial_profiles')
    .select('*')
    .eq('staff_id', staffId)
    .single();

  if (error) {
    console.error('Error fetching facial profile:', error);
    // Depending on the desired behavior, you might want to throw the error
    // or return null. Returning null for now.
    return null;
  }
  return data;
};

export const getFacialProfilesForActiveStaff = async (): Promise<FacialProfile[]> => {
  const { data, error } = await supabase.rpc('get_facial_profiles_for_active_staff');

  if (error) {
    console.error('Error fetching facial profiles for active staff:', error);
    throw error;
  }

  return data || [];
};

export const saveFacialProfile = async (staffId: number, faceDescriptor: any) => {
  const { data, error } = await supabase
    .from('facial_profiles')
    .upsert({
      staff_id: staffId,
      face_descriptor: faceDescriptor,
      is_active: true
    }, { onConflict: 'staff_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Get the latest clock event for a staff member
export const getLatestClockEvent = async (staffId: number) => { // Removed TimeClockEvent type for now to avoid import issues if types.d.ts is not updated yet
  const { data, error } = await supabase
    .from('time_clock_events')
    .select('*')
    .eq('staff_id', staffId)
    .order('event_time', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching latest clock event:', error);
    throw error;
  }
  // Explicitly cast to 'any' then to 'TimeClockEvent | null' if needed, or ensure TimeClockEvent is defined and imported
  return data && data.length > 0 ? data[0] as any : null; 
};

// Get all staff with their latest clock event
export const getStaffWithLatestEvent = async () => {
  const { data, error } = await supabase.rpc('get_staff_with_latest_event');

  if (error) {
    console.error('Error fetching staff with latest event:', error);
    throw error;
  }
  return data;
}; 
import React, { useState, useEffect } from 'react';
import { supabase, getStaffWithLatestEvent } from '../config/supabase';

// Define the type for the data returned by our RPC
interface StaffStatus {
  staff_id: number;
  first_name: string;
  last_name: string;
  latest_event_type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | null;
  latest_event_time: string | null;
  is_clocked_in_today: boolean;
}

const StaffStatusDisplay: React.FC = () => {
  const [clockedInStaff, setClockedInStaff] = useState<StaffStatus[]>([]);
  const [clockedOutStaff, setClockedOutStaff] = useState<StaffStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClockedInVisible, setIsClockedInVisible] = useState(true);
  const [isClockedOutVisible, setIsClockedOutVisible] = useState(false);

  const fetchStaffStatus = async () => {
    try {
      setIsLoading(true);
      const data = await getStaffWithLatestEvent();
      if (data) {
        const inStaff = data.filter((s: StaffStatus) => s.is_clocked_in_today);
        const outStaff = data.filter((s: StaffStatus) => !s.is_clocked_in_today);
        setClockedInStaff(inStaff);
        setClockedOutStaff(outStaff);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch staff status:', err);
      setError('Could not load staff status.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStaffStatus();

    // Set up real-time subscription
    const subscription = supabase
      .channel('time_clock_events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'time_clock_events' }, payload => {
        console.log('Real-time update received:', payload);
        fetchStaffStatus(); // Re-fetch all statuses on any new event
      })
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (isLoading) {
    return <div className="loading-spinner"></div>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="staff-status-display">
        <div className="headcount-summary">
          <span className="on-site">{clockedInStaff.length} on-site</span>
          <span className="separator"> · </span>
          <span className="off-site">{clockedOutStaff.length} off-site</span>
        </div>
      <div className="status-list-container">
        <h4 onClick={() => setIsClockedInVisible(!isClockedInVisible)} className="collapsible-header">
          Clocked In ({clockedInStaff.length})
          <span className={`arrow ${isClockedInVisible ? 'down' : 'right'}`}></span>
        </h4>
        {isClockedInVisible && (
          <ul className="status-list">
            {clockedInStaff.map(staff => (
              <li key={staff.staff_id}>{staff.first_name} {staff.last_name}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="status-list-container">
        <h4 onClick={() => setIsClockedOutVisible(!isClockedOutVisible)} className="collapsible-header">
          Not Clocked In ({clockedOutStaff.length})
          <span className={`arrow ${isClockedOutVisible ? 'down' : 'right'}`}></span>
        </h4>
        {isClockedOutVisible && (
          <ul className="status-list">
            {clockedOutStaff.map(staff => (
              <li key={staff.staff_id}>{staff.first_name} {staff.last_name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StaffStatusDisplay;

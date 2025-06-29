import React, { useState, useEffect } from 'react';
import CameraCapture from '../components/CameraCapture';
import { getActiveStaff, clockIn, clockOut, getFacialProfilesForActiveStaff, getLatestClockEvent } from '../config/supabase'; // Removed supabase, checkLiveness
import { createFaceMatcher, recognizeFace } from '../facial-recognition/face-recognition.service'; // Removed checkLiveness
import { Staff, FacialProfile } from '../types/database.types'; // Removed TimeClockEvent as it's not directly used.

const ClockInPage: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [facialProfiles, setFacialProfiles] = useState<FacialProfile[]>([]);
  const [recognizedStaff, setRecognizedStaff] = useState<Staff | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'determining_action'>('idle');
  const [message, setMessage] = useState<string>('');
  const [determinedAction, setDeterminedAction] = useState<'clock_in' | 'clock_out' | 'stale' | null>(null);
  const [staleEventTime, setStaleEventTime] = useState<Date | null>(null);
  const [staleCheckoutTime, setStaleCheckoutTime] = useState<string>('');
  const [isDataLoading, setIsDataLoading] = useState(true);
  // Helper to format Date to input datetime-local value
  const formatToLocalInput = (date: Date) => date.toISOString().slice(0,16);

  // Load active staff and facial profiles on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load active staff
        const activeStaff = await getActiveStaff();
        setStaff(activeStaff);

        // Load facial profiles for all active staff using the new efficient function
        const profiles = await getFacialProfilesForActiveStaff();
        setFacialProfiles(profiles);
      } catch (error) {
        console.error('Failed to load data:', error);
        setMessage('Failed to load staff data. Please refresh the page.');
        setStatus('error');
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle face capture
  const handleCapture = async (faceDescriptor: Float32Array) => {
    setStatus('processing');
    setMessage('Processing...');

    try {
      // Check if we have facial profiles
      if (facialProfiles.length === 0) {
        setMessage('No facial profiles registered. Please enroll staff first.');
        setStatus('error');
        return;
      }

      // Create face matcher with loaded profiles
      const faceMatcher = createFaceMatcher(facialProfiles);

      // Recognize the face
      const match = recognizeFace(faceDescriptor, faceMatcher);

      if (!match) {
        setMessage('Face not recognized. Please try again or contact an administrator.');
        setStatus('error');
        return;
      }

      // Find the staff member in our staff list
      const matchedStaff = staff.find(s => s.staff_id === match.staffId);

      if (!matchedStaff) {
        setMessage('Staff member not found in active staff list.');
        setStatus('error');
        return;
      }

      // Set the recognized staff
      setRecognizedStaff(matchedStaff);
      setStatus('determining_action'); // New status while we fetch latest event
      setMessage(`Hello, ${matchedStaff.first_name} ${matchedStaff.last_name}! Checking current status...`);

      try {
        const latestEvent = await getLatestClockEvent(matchedStaff.staff_id);
        if (latestEvent && (latestEvent.event_type === 'clock_in' || latestEvent.event_type === 'break_start')) {
          // check staleness
          const eventTime = new Date(latestEvent.event_time);
          const now = new Date();
          const ageMs = now.getTime() - eventTime.getTime();
          const THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours threshold for stale clock-in detection
          const isNewDay = now.toDateString() !== eventTime.toDateString();
          if (isNewDay || ageMs > THRESHOLD_MS) {
            const formatted = formatToLocalInput(eventTime);
            setStaleEventTime(eventTime);
            setStaleCheckoutTime(formatted);
            setDeterminedAction('stale');
            setMessage(`It looks like you never clocked out after ${eventTime.toLocaleString()}. What would you like to do?`);
          } else {
            setDeterminedAction('clock_out');
            setMessage(`Welcome back, ${matchedStaff.first_name}! Ready to clock out? Last in: ${new Date(latestEvent.event_time).toLocaleString()}`);
          }
        } else {
          setDeterminedAction('clock_in');
          setMessage(`Hello, ${matchedStaff.first_name}! Ready to clock in?`);
        }
        setStatus('success'); // Ready to show confirm button
      } catch (fetchError) {
        console.error('Failed to fetch latest clock event:', fetchError);
        setMessage('Could not determine current clock status. Please try again.');
        setStatus('error');
        setRecognizedStaff(null); // Reset recognized staff on error
      }

    } catch (error) {
      console.error('Face recognition failed:', error);
      setMessage('Face recognition failed. Please try again.');
      setStatus('error');
    }
  };

  // Handle clock in/out action
  const handleClockAction = async () => {
    if (!recognizedStaff || !determinedAction) return;

    setStatus('processing');
    setMessage(`Processing ${determinedAction === 'clock_in' ? 'clock in' : 'clock out'}...`);

    try {
      if (determinedAction === 'clock_in') {
        await clockIn(recognizedStaff.staff_id, 'clock_in', null); // Explicitly set breakType to null for standard clock_in
        setMessage(`Successfully clocked in ${recognizedStaff.first_name} ${recognizedStaff.last_name}`);
      } else {
        await clockOut(recognizedStaff.staff_id, 'clock_out', null); // Explicitly set breakType to null for standard clock_out
        setMessage(`Successfully clocked out ${recognizedStaff.first_name} ${recognizedStaff.last_name}`);
      }
      
      // Display success message for a bit, then reset
      setStatus('success'); 
      setDeterminedAction(null); // Hide buttons immediately after success
      setTimeout(() => {
        handleReset(); // Use handleReset to clear state
      }, 3000);
    } catch (error) {
      console.error('Clock action failed:', error);
      setMessage(`Failed to ${determinedAction === 'clock_in' ? 'clock in' : 'clock out'}. Please try again.`);
      setStatus('error');
       setTimeout(() => { // Also reset on error after a delay
        handleReset();
      }, 3000);
    }
  };

  // Format time difference in a human-readable way
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 1) return `${diffDays} days ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffHours > 1) return `${diffHours} hours ago`;
    return 'less than an hour ago';
  };

  // Handlers for stale event options (forgot to clock out yesterday)

  const handleCloseYesterday = async () => {
    if (!recognizedStaff || !staleCheckoutTime) return;
    setStatus('processing');
    setMessage('Processing clock out...');
    try {
      const isoUtc = new Date(staleCheckoutTime).toISOString();
      await clockOut(recognizedStaff.staff_id, 'clock_out', null, isoUtc);
      setMessage(`Clock out recorded for ${new Date(staleCheckoutTime).toLocaleString()}.`);
      setStatus('success');
      setDeterminedAction(null);
      setTimeout(handleReset, 3000);
    } catch (err) {
      console.error(err);
      setMessage('Failed to save clock out. Please try again.');
      setStatus('error');
      setTimeout(handleReset, 3000);
    }
  };

  const handleCloseAndStartNew = async () => {
    if (!recognizedStaff || !staleCheckoutTime) return;
    setStatus('processing');
    setMessage('Processing...');
    try {
      // Close previous session with selected time
      const isoUtc = new Date(staleCheckoutTime).toISOString();
      await clockOut(recognizedStaff.staff_id, 'clock_out', null, isoUtc);
      // Start new shift with current time
      await clockIn(recognizedStaff.staff_id, 'clock_in', null);
      setMessage(`Previous session closed and new shift started.`);
      setStatus('success');
      setDeterminedAction(null);
      setTimeout(handleReset, 3000);
    } catch (err) {
      console.error(err);
      setMessage('Failed to process. Please try again.');
      setStatus('error');
      setTimeout(handleReset, 3000);
    }
  };

  // Reset state
  const handleReset = () => {
    setRecognizedStaff(null);
    setDeterminedAction(null);
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="clock-in-page">
      <h1>Facial Recognition Time Clock</h1>

      {isDataLoading ? (
        <div className="loading-indicator" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem' }}>Loading staff data...</p>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <>
          {status === 'idle' && (
            <>
              <p>Please look at the camera to clock in or out</p>
              <CameraCapture onCapture={handleCapture} />
              {/* Action controls (radio buttons, break type) removed */}
            </>
          )}
        </>
      )}
      
      {(status === 'processing' || status === 'determining_action') && (
        <div className="processing">
          <p>{message}</p>
          <div className="loading-spinner"></div>
        </div>
      )}
      
      {/* Show confirmation for stale or normal actions */}
       {status === 'success' && recognizedStaff && determinedAction === 'stale' && (
         <div className="confirmation stale-session">
           <h2>⏰ Unfinished Session Detected</h2>
           <div className="stale-session-details">
              <div style={{ margin: '1rem 0' }}>
                <label htmlFor="staleCheckout" style={{ color: '#f3f4f6', marginRight: '0.5rem' }}>Checkout time:</label>
                <input id="staleCheckout" type="datetime-local" value={staleCheckoutTime} onChange={e => setStaleCheckoutTime(e.target.value)} />
              </div>
             <p>You have an open session from <strong>{staleEventTime ? formatTimeAgo(staleEventTime) : 'a previous time'}</strong>.</p>
             <p className="warning">
               <strong>Note:</strong> This appears to be from a different day. Please select the appropriate action.
             </p>
           </div>
           <div className="confirmation-buttons">
             <button onClick={handleCloseYesterday} className="confirm-button" title="Record clock out for the previous session">
               Close Yesterday’s Session Only
             </button>
             <button onClick={handleCloseAndStartNew} className="confirm-button primary" title="Start a new session (previous session will remain open)">
               Close & Start New Shift
             </button>
             <button onClick={handleReset} className="cancel-button">Cancel</button>
           </div>
         </div>
       )}
       {status === 'success' && recognizedStaff && (determinedAction === 'clock_in' || determinedAction === 'clock_out') && (
         <div className="confirmation">
          <h2>{message}</h2>
          <p>Recognized: {recognizedStaff.first_name} {recognizedStaff.last_name}</p>
          <div className="confirmation-buttons">
            <button onClick={handleClockAction} className="confirm-button">
              Confirm {determinedAction === 'clock_in' ? 'Clock In' : 'Clock Out'}
            </button>
            <button onClick={handleReset} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Show final success message after action is confirmed */}
      {status === 'success' && !determinedAction && (
        <div className="success-message-container">
          <p>{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="error-message-container">
          <p>{message}</p>
          <button onClick={handleReset}>Try Again</button>
        </div>
      )}
    </div>
  );
};

export default ClockInPage;
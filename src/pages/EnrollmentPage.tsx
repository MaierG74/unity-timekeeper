import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import { getActiveStaff, saveFacialProfile } from '../config/supabase';
import { Staff } from '../types/database.types';

const EnrollmentPage: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [status, setStatus] = useState<'idle' | 'capturing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();

  // Load active staff on component mount
  useEffect(() => {
    const loadStaff = async () => {
      try {
        console.log('Fetching active staff...');
        
        // Try to use Electron IPC if available, otherwise use Supabase directly
        let activeStaff;
        if (window.electron) {
          console.log('Using Electron IPC to fetch staff');
          activeStaff = await window.electron.staff.getActiveStaff();
        } else {
          console.log('Using Supabase directly to fetch staff');
          activeStaff = await getActiveStaff();
        }
        
        console.log('Staff data received:', activeStaff);
        setStaff(activeStaff);
      } catch (error) {
        console.error('Failed to load staff:', error);
        setMessage('Failed to load staff data. Please refresh the page.');
        setStatus('error');
      }
    };

    loadStaff();
  }, []);

  // Update selected staff when ID changes
  useEffect(() => {
    if (selectedStaffId === '') {
      setSelectedStaff(null);
      return;
    }

    const staffMember = staff.find(s => s.staff_id === selectedStaffId);
    if (staffMember) {
      setSelectedStaff(staffMember);
    }
  }, [selectedStaffId, staff]);

  // Handle staff selection
  const handleStaffSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedStaffId(value === '' ? '' : parseInt(value, 10));
    setStatus('idle');
    setMessage('');
  };

  // Start enrollment process
  const handleStartEnrollment = () => {
    if (!selectedStaff) return;
    setStatus('capturing');
    setMessage(`Please look at the camera, ${selectedStaff.first_name}`);
  };

  // Handle face capture for enrollment
  const handleCapture = async (faceDescriptor: Float32Array) => {
    if (!selectedStaff) return;

    try {
      // Convert Float32Array to a plain object for storage
      const descriptorObject = Array.from(faceDescriptor).reduce((obj, val, index) => {
        obj[index] = val;
        return obj;
      }, {} as Record<number, number>);

      let enrollmentResult;
      
      // Try using Electron IPC if available
      if (window.electron) {
        console.log('Using Electron IPC for enrollment');
        enrollmentResult = await window.electron.facialRecognition.enrollStaff(
          selectedStaff.staff_id, 
          descriptorObject
        );
        
        // Check if enrollment failed due to RLS policy
        if (!enrollmentResult.success && enrollmentResult.details?.includes('row-level security policy')) {
          setMessage(`Database permission error: ${enrollmentResult.error}`);
          setStatus('error');
          return;
        }
      } else {
        console.log('Using direct Supabase enrollment');
        // Save facial profile directly
        enrollmentResult = await saveFacialProfile(selectedStaff.staff_id, descriptorObject);
      }
      
      setMessage(`Successfully enrolled ${selectedStaff.first_name} ${selectedStaff.last_name}`);
      setStatus('success');
      
      // Reset after delay
      setTimeout(() => {
        setSelectedStaffId('');
        setSelectedStaff(null);
        setStatus('idle');
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Enrollment failed:', error);
      
      // Check if error is a string or an object
      let errorMessage = 'Failed to save facial profile. Please try again.';
      if (typeof error === 'object' && error !== null) {
        // @ts-ignore
        if (error.message?.includes('row-level security policy')) {
          errorMessage = 'Permission denied. The application does not have permission to save facial profiles. Please contact the administrator.';
        } else {
          // @ts-ignore
          errorMessage = error.message || errorMessage;
        }
      }
      
      setMessage(errorMessage);
      setStatus('error');
    }
  };

  // Reset state
  const handleReset = () => {
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="enrollment-page">
      <h1>Staff Facial Recognition Enrollment</h1>
      
      <div className="enrollment-form">
        <div className="form-group">
          <label htmlFor="staff-select">Select Staff Member:</label>
          <select
            id="staff-select"
            value={selectedStaffId}
            onChange={handleStaffSelect}
            disabled={status === 'capturing'}
          >
            <option value="">-- Select Staff --</option>
            {staff.map(s => (
              <option key={s.staff_id} value={s.staff_id}>
                {s.first_name} {s.last_name}
              </option>
            ))}
          </select>
        </div>
        
        {selectedStaff && status === 'idle' && (
          <div className="staff-details">
            <h2>{selectedStaff.first_name} {selectedStaff.last_name}</h2>
            <p>Employee ID: {selectedStaff.staff_id}</p>
            <button onClick={handleStartEnrollment}>Start Enrollment</button>
          </div>
        )}
        
        {status === 'capturing' && (
          <div className="capture-container">
            <p>{message}</p>
            <CameraCapture onCapture={handleCapture} />
            <button onClick={handleReset}>Cancel</button>
          </div>
        )}
        
        {status === 'success' && (
          <div className="success">
            <p>{message}</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="error">
            <p>{message}</p>
            <button onClick={handleReset}>Try Again</button>
          </div>
        )}
      </div>
      <button onClick={() => navigate('/')} className="nav-button return-button">Return to Clock In</button>
    </div>
  );
};

export default EnrollmentPage; 
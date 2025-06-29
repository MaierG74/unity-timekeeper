/// <reference types="vite/client" />

interface Window {
  electron?: {
    getCameraAccess: () => Promise<boolean>;
    timeEntries: {
      clockIn: (staffId: number, eventType: string, breakType?: string) => Promise<any>;
      clockOut: (staffId: number, eventType: string, breakType?: string) => Promise<any>;
      getEntries: (staffId: number, date: string) => Promise<any[]>;
    };
    facialRecognition: {
      enrollStaff: (staffId: number, faceDescriptor: any) => Promise<any>;
      identifyFace: (faceDescriptor: any) => Promise<any>;
    };
    staff: {
      getActiveStaff: () => Promise<any[]>;
      getStaffById: (staffId: number) => Promise<any>;
    };
  }
}

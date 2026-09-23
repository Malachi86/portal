
// Storage types restricted to Lab/Room Request System
export type UserRole = 'admin' | 'teacher' | 'student';
export type Department = 'college' | 'shs';

export interface User {
  id: string; // USN or EMP number
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: Department;
  profilePic?: string;
}

export interface Lab {
  id: string;
  name: string;
  capacity: number;
}

export interface Pc {
  id: string;
  pcNumber: string;
  labId: string;
  status: 'available' | 'occupied';
}

export interface LabRequest {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string; // Optional or general purpose
  labId: string;
  pcId?: string; // Optional if requesting to 'handle' the whole lab
  startTime: string;
  endTime: string;
  reason?: string;
  status: 'pending' | 'approved' | 'declined';
  requestType: 'use' | 'handle'; // 'use' for PC access, 'handle' for teacher supervision
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  timeIn?: string;
  timeOut?: string;
  locationId: string;
  pcId?: string;
}

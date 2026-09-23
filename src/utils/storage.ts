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
  isApproved?: boolean;
  isBanned?: boolean;
  lastSeen?: string;
}

export interface Lab {
  id: string;
  name: string;
  capacity: number;
}

export interface Room {
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

export interface Subject {
  id: string;
  name: string;
  code?: string;
  teacherId: string;
  teacherName: string;
}

export interface LabRequest {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string; 
  labId: string;
  pcId?: string;
  startTime: string;
  endTime: string;
  reason?: string;
  status: 'pending' | 'approved' | 'declined';
  requestType: 'use' | 'handle';
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
  locationType: 'lab' | 'room';
  pcId?: string;
  sessionId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Settings {
  teacherSecret?: string;
}
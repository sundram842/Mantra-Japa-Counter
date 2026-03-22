export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface JapaSession {
  id: string;
  userId: string;
  date: string;        // YYYY-MM-DD
  count: number;
  target: number;
  mantraName: string;
  completedAt: string;  // ISO timestamp
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

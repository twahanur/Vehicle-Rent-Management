export interface StaffUser {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

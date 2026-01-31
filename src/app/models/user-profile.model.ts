export interface UserProfile {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  gross_salary: number;
  net_salary: number;
  created_at: string;
  updated_at: string;
}

import { API_URL } from '@/constants/api'

export interface SelectOption {
  id: string;
  name: string;
  code?: string;
}

export async function fetchUniversities(): Promise<SelectOption[]> {
  const res = await fetch(`${API_URL}/universities`);
  if (!res.ok) throw new Error('Failed to load universities');
  return res.json();
}

export async function fetchFacultiesByUniversity(
  universityId: string
): Promise<SelectOption[]> {
  const res = await fetch(
    `${API_URL}/universities/${encodeURIComponent(universityId)}/faculties`
  );
  if (!res.ok) throw new Error('Failed to load faculties');
  return res.json();
}

export async function fetchDepartmentsByUniversity(
  universityId: string,
  facultyId?: string
): Promise<SelectOption[]> {
  const query = facultyId ? `?faculty_id=${encodeURIComponent(facultyId)}` : '';
  const res = await fetch(
    `${API_URL}/universities/${encodeURIComponent(universityId)}/departments${query}`
  );
  if (!res.ok) throw new Error('Failed to load departments');
  return res.json();
}

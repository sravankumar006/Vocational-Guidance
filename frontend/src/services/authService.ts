import { apiClient } from '@/lib/apiClient';
import { AuthResponse, User, UserRole } from '@/types';

const TOKEN_KEY = 'sih_auth_token';
const USER_KEY = 'sih_auth_user';
const DEV_QUICK_FILL_PASSWORD = 'YourActualPassword';

// Built-in verified identity personas for rapid developer testing & offline fallback
const FALLBACK_CREDENTIALS: Record<UserRole, { identifier: string; defaultPass: string }> = {
  student: { identifier: 'student@sih.gov.in', defaultPass: DEV_QUICK_FILL_PASSWORD },
  parent: { identifier: 'parent@sih.gov.in', defaultPass: DEV_QUICK_FILL_PASSWORD },
  admin: { identifier: 'admin@sih.gov.in', defaultPass: DEV_QUICK_FILL_PASSWORD },
};

const FALLBACK_PERSONAS: Record<UserRole, User> = {
  student: {
    id: 1,
    name: 'Aarav Sharma',
    email: 'student@sih.gov.in',
    phone: '+919876543210',
    role: 'student',
    family_id: 'FAM-9042',
    student_id: 1,
    education_level: 'Class 10 Passed',
    district: 'Medak',
    state: 'Telangana',
  },
  parent: {
    id: 2,
    name: 'Sunita Sharma',
    email: 'parent@sih.gov.in',
    phone: '+919876543211',
    role: 'parent',
    family_id: 'FAM-9042',
    student_id: 1,
    linked_student_name: 'Aarav Sharma',
    relationship_to_student: 'Mother',
    district: 'Medak',
    state: 'Telangana',
  },
  admin: {
    id: 3,
    name: 'Dr. Rajesh Verma',
    email: 'admin@sih.gov.in',
    phone: '+919876543212',
    role: 'admin',
    title: 'Director of Vocational Guidance',
    department: 'National Directorate of Skill Development',
  },
};

export const authService = {
  async login(identifier?: string, password?: string, role?: UserRole): Promise<AuthResponse> {
    // If role is passed directly (quick dev switch button), use the default seeded credentials
    const targetId = identifier || (role ? FALLBACK_CREDENTIALS[role].identifier : '');
    const targetPass = password || (role ? FALLBACK_CREDENTIALS[role].defaultPass : '');

    try {
      const response = await apiClient<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: targetId, password: targetPass }),
        timeout: 10000,
      });

      if (response && response.access_token) {
        localStorage.setItem(TOKEN_KEY, response.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        return response;
      }
      throw new Error('Invalid response structure from auth endpoint');
    } catch (err: any) {
      // If the error was a real backend authentication rejection (401/403/invalid password),
      // bubble it up to the user so they see the real credential error!
      const errorMsg = err.message || '';
      if (
        errorMsg.includes('Invalid credentials') ||
        errorMsg.includes('inactive') ||
        errorMsg.includes('401') ||
        errorMsg.includes('403')
      ) {
        throw err;
      }

      // Offline dev fallback if network/connection failed or server timed out
      const cleanId = (targetId || '').toLowerCase().trim();
      const detectedRole: UserRole | undefined =
        role ||
        (cleanId.includes('student')
          ? 'student'
          : cleanId.includes('parent')
          ? 'parent'
          : cleanId.includes('admin')
          ? 'admin'
          : undefined);

      if (detectedRole && FALLBACK_PERSONAS[detectedRole]) {
        console.warn(`[AuthService] Backend request failed (${errorMsg}). Falling back to local persona for '${detectedRole}'.`);
        const mockUser = FALLBACK_PERSONAS[detectedRole];
        const mockToken = `mock-jwt-token-for-${detectedRole}-${Date.now()}`;
        localStorage.setItem(TOKEN_KEY, mockToken);
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        return {
          access_token: mockToken,
          token_type: 'bearer',
          user: mockUser,
        };
      }

      throw err;
    }
  },

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  async refreshToken(): Promise<string | null> {
    try {
      const response = await apiClient<AuthResponse>('/api/auth/refresh', {
        method: 'POST',
        timeout: 2500,
      });
      if (response && response.access_token) {
        localStorage.setItem(TOKEN_KEY, response.access_token);
        if (response.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        }
        return response.access_token;
      }
    } catch {
      this.clearSession();
    }
    return null;
  },

  async fetchMe(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    if (token.startsWith('mock-')) {
      return this.getCurrentUser();
    }

    try {
      const user = await apiClient<User>('/api/auth/me', { timeout: 2000 });
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      }
    } catch (err: any) {
      // If unauthorized, attempt to use refresh token session to seamlessly recover
      if (err.message && (err.message.includes('401') || err.message.includes('expired'))) {
        const newToken = await this.refreshToken();
        if (newToken) {
          try {
            return await apiClient<User>('/api/auth/me', { timeout: 2000 });
          } catch {
            return null;
          }
        }
      }
      return this.getCurrentUser();
    }
    return this.getCurrentUser();
  },

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async logout(): Promise<void> {
    try {
      await apiClient('/api/auth/logout', { method: 'POST', timeout: 1500 }).catch(() => {});
    } finally {
      this.clearSession();
    }
  },
};

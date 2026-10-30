import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface AddressItem {
  city: string;
  street: string;
  postalCode?: string;
  _id?: string;
}

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | string;
  address?: AddressItem[] | any;
  phone?: string;
  gender?: string;
  created_at?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Using deployed production backend on Vercel
  private readonly baseUrl = 'https://nti-be.vercel.app/auth';

  // Reactive Angular Signals (Standard Zoneless Reactivity)
  public readonly currentUser = signal<User | null>(this.getStoredUser());
  public readonly token = signal<string | null>(this.getStoredToken());
  public readonly isLoggedIn = computed(() => !!this.currentUser());
  public readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  // Observable support for backward compatibility with async pipe
  private currentUserSubject = new BehaviorSubject<User | null>(this.currentUser());
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  signIn(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap((res) => {
        if (res && res.token) {
          const user = this.decodeToken(res.token, email);
          this.setSession(res.token, user);
        }
      })
    );
  }

  signUp(userData: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    phone?: string;
    city?: string;
    street?: string;
    postalCode?: string;
    address?: any;
    gender?: string;
  }): Observable<RegisterResponse> {
    // Safely format address into Mongoose embedded array schema: [{ city, street, postalCode }]
    let formattedAddress: AddressItem[] = [];

    if (Array.isArray(userData.address) && userData.address.length > 0 && typeof userData.address[0] === 'object') {
      formattedAddress = userData.address.map(a => ({
        city: a.city?.trim() || 'Cairo',
        street: a.street?.trim() || 'Main Street',
        postalCode: a.postalCode?.trim() || '11511'
      }));
    } else if (userData.city || userData.street) {
      formattedAddress = [{
        city: userData.city?.trim() || 'Cairo',
        street: userData.street?.trim() || 'Main Street',
        postalCode: userData.postalCode?.trim() || '11511'
      }];
    } else if (typeof userData.address === 'string' && userData.address.trim()) {
      const parts = userData.address.split(',').map(s => s.trim());
      formattedAddress = [{
        city: parts[0] || 'Cairo',
        street: parts[1] || 'Main Street',
        postalCode: '11511'
      }];
    } else {
      formattedAddress = [{
        city: 'Cairo',
        street: 'El-Tahrir Square',
        postalCode: '11511'
      }];
    }

    const payload = {
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      confirmPassword: userData.confirmPassword || userData.password,
      phone: userData.phone?.trim() || '01000000000',
      address: formattedAddress,
      gender: userData.gender || 'not specified'
    };

    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, payload);
  }

  logout(): void {
    try {
      localStorage.removeItem('lux_token');
      localStorage.removeItem('lux_user');
    } catch {}
    this.token.set(null);
    this.currentUser.set(null);
    this.currentUserSubject.next(null);
  }

  public getToken(): string | null {
    return this.token() || this.getStoredToken();
  }

  public setSession(token: string, user: User): void {
    try {
      localStorage.setItem('lux_token', token);
      localStorage.setItem('lux_user', JSON.stringify(user));
    } catch {}
    this.token.set(token);
    this.currentUser.set(user);
    this.currentUserSubject.next(user);
  }

  public getCleanErrorMessage(err: any): string {
    const raw = err?.error?.message || err?.message || '';

    if (raw.includes('Cast to embedded failed') || raw.includes('path "address"')) {
      return 'Please provide a valid City and Street address.';
    }
    if (raw.includes('email is already exist') || raw.includes('duplicate key') || raw.includes('E11000')) {
      return 'This email is already registered. Please sign in or use a different email address.';
    }
    if (raw.includes('Passwords do not match')) {
      return 'Passwords do not match. Please re-enter matching passwords.';
    }
    if (raw.includes('Password must be at least 6 characters')) {
      return 'Password is too short. It must be at least 6 characters.';
    }
    if (raw.includes('Name must be at least 2 characters')) {
      return 'Name must be at least 2 characters long.';
    }
    if (raw.includes('email is invalid format')) {
      return 'Please enter a valid email address (e.g. user@example.com).';
    }
    if (raw.includes('Invalid login credentials')) {
      return 'Incorrect email or password. Please verify your credentials.';
    }
    if (raw.includes('user not found')) {
      return 'No account found with this email.';
    }

    return raw || 'An unexpected error occurred. Please verify your inputs and try again.';
  }

  private decodeToken(token: string, fallbackEmail: string): User {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]));
        return {
          id: payload.id || payload._id || 'usr_' + Date.now(),
          _id: payload.id || payload._id,
          name: payload.name || fallbackEmail.split('@')[0],
          email: payload.email || fallbackEmail,
          role: payload.role || 'user'
        };
      }
    } catch (e) {
      console.warn('Could not decode token payload', e);
    }
    return {
      id: 'usr_' + Date.now(),
      name: fallbackEmail.split('@')[0],
      email: fallbackEmail,
      role: 'user'
    };
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem('lux_token');
    } catch {
      return null;
    }
  }

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('lux_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}

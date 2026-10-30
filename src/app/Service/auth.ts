import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from './api';

export interface AuthSession {
  access_token: string;
  token_type: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor() {}

  public get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  signUp(name: string, email: string, password: string): Observable<AuthSession> {
    const newUser: User = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'user',
      created_at: new Date().toISOString()
    };

    const users = this.getStoredUsers();
    users.push({ ...newUser, password });
    this.saveStoredUsers(users);

    const session: AuthSession = {
      access_token: 'jwt_' + Date.now(),
      token_type: 'Bearer',
      user: newUser
    };

    this.setUserSession(newUser, session.access_token);
    return of(session);
  }

  signIn(email: string, password: string): Observable<AuthSession> {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getStoredUsers();
    const found = users.find(u => u.email === cleanEmail);

    const user: User = found ? {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role || 'user'
    } : {
      id: 'usr_' + Date.now(),
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      role: 'user'
    };

    const session: AuthSession = {
      access_token: 'jwt_' + Date.now(),
      token_type: 'Bearer',
      user
    };

    this.setUserSession(user, session.access_token);
    return of(session);
  }

  logout(): void {
    try {
      localStorage.removeItem('lux_token');
      localStorage.removeItem('lux_user');
    } catch {}
    this.currentUserSubject.next(null);
  }

  private setUserSession(user: User, token?: string): void {
    try {
      if (token) localStorage.setItem('lux_token', token);
      localStorage.setItem('lux_user', JSON.stringify(user));
    } catch {}
    this.currentUserSubject.next(user);
  }

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('lux_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private getStoredUsers(): any[] {
    try {
      const stored = localStorage.getItem('lux_registered_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveStoredUsers(users: any[]): void {
    try {
      localStorage.setItem('lux_registered_users', JSON.stringify(users));
    } catch {}
  }
}

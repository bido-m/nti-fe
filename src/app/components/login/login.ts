import { Component, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCrown,
  faEnvelope,
  faLock,
  faArrowRight,
  faCircleExclamation,
  faUserShield,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../Service/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  faCrown = faCrown;
  faEnvelope = faEnvelope;
  faLock = faLock;
  faArrowRight = faArrowRight;
  faCircleExclamation = faCircleExclamation;
  faUserShield = faUserShield;
  faUser = faUser;

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  fillDemoUser(): void {
    this.loginForm.patchValue({
      email: 'john@example.com',
      password: 'Password123!'
    });
    this.cdr.markForCheck();
  }

  fillDemoAdmin(): void {
    this.loginForm.patchValue({
      email: 'abdelrhmanelshaer35@gmail.com',
      password: 'Password123!'
    });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.cdr.markForCheck();

    const { email, password } = this.loginForm.value;

    this.authService.signIn(email!, password!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = this.authService.getCleanErrorMessage(err);
        this.errorMessage.set(msg);
        this.cdr.markForCheck();
      }
    });
  }
}

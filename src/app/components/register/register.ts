import { Component, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCrown,
  faEnvelope,
  faLock,
  faUser,
  faPhone,
  faLocationDot,
  faBuilding,
  faVenusMars,
  faCheck,
  faCircleCheck,
  faCircleExclamation,
  faArrowRight,
  faEye,
  faEyeSlash,
  faWandMagicSparkles
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../Service/auth';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (!password || !confirmPassword) return null;
  return password.value && confirmPassword.value && password.value !== confirmPassword.value
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  faCrown = faCrown;
  faEnvelope = faEnvelope;
  faLock = faLock;
  faUser = faUser;
  faPhone = faPhone;
  faLocationDot = faLocationDot;
  faBuilding = faBuilding;
  faVenusMars = faVenusMars;
  faCheck = faCheck;
  faCircleCheck = faCircleCheck;
  faCircleExclamation = faCircleExclamation;
  faArrowRight = faArrowRight;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faWandMagicSparkles = faWandMagicSparkles;

  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  rawErrorDetails = signal<string>('');
  successMessage = signal<string>('');

  registerForm = new FormGroup(
    {
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(30)
      ]),
      email: new FormControl('', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]),
      phone: new FormControl('01012345678', [
        Validators.required,
        Validators.pattern(/^[0-9+ ]{8,16}$/)
      ]),
      city: new FormControl('Cairo', [
        Validators.required,
        Validators.minLength(2)
      ]),
      street: new FormControl('El-Tahrir Square', [
        Validators.required,
        Validators.minLength(3)
      ]),
      gender: new FormControl('male', [Validators.required]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6)
      ]),
      confirmPassword: new FormControl('', [Validators.required])
    },
    { validators: passwordMatchValidator }
  );

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get phone() { return this.registerForm.get('phone'); }
  get city() { return this.registerForm.get('city'); }
  get street() { return this.registerForm.get('street'); }
  get gender() { return this.registerForm.get('gender'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  getPasswordStrength(): { level: string; color: string; width: string } {
    const val = this.password?.value || '';
    if (!val) return { level: '', color: 'bg-slate-700', width: '0%' };
    if (val.length < 6) return { level: 'Too Short (min 6 chars)', color: 'bg-rose-500', width: '25%' };

    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 1) return { level: 'Weak', color: 'bg-amber-500', width: '50%' };
    if (score === 2) return { level: 'Good', color: 'bg-blue-400', width: '75%' };
    return { level: 'Strong (Vault Grade)', color: 'bg-emerald-400', width: '100%' };
  }

  autofillApplicant(): void {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.registerForm.patchValue({
      name: 'Alexander Vance',
      email: `alexander_${randomSuffix}@luxury.com`,
      phone: '01098765432',
      city: 'Cairo',
      street: '22 Zamalek Nile Avenue',
      gender: 'male',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    this.errorMessage.set('');
    this.rawErrorDetails.set('');
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage.set('Please correct the highlighted fields before submitting.');
      this.cdr.markForCheck();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.rawErrorDetails.set('');
    this.successMessage.set('');
    this.cdr.markForCheck();

    const formValues = this.registerForm.value;

    this.authService.signUp({
      name: formValues.name!,
      email: formValues.email!,
      password: formValues.password!,
      confirmPassword: formValues.confirmPassword!,
      phone: formValues.phone!,
      city: formValues.city!,
      street: formValues.street!,
      postalCode: '11511',
      gender: formValues.gender!
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('VIP Membership created successfully! Authenticating you into the vault...');
        this.cdr.markForCheck();

        // Auto login on successful registration
        this.authService.signIn(formValues.email!, formValues.password!).subscribe({
          next: () => {
            setTimeout(() => this.router.navigate(['/products']), 1200);
          },
          error: () => {
            setTimeout(() => this.router.navigate(['/login']), 1400);
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        const friendlyMessage = this.authService.getCleanErrorMessage(err);
        const rawMessage = err?.error?.message || err?.message || '';

        this.errorMessage.set(friendlyMessage);
        if (rawMessage && rawMessage !== friendlyMessage) {
          this.rawErrorDetails.set(rawMessage);
        }
        this.cdr.markForCheck();
      }
    });
  }
}

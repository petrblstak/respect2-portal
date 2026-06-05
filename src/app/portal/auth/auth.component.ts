import { Component, OnInit, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { AuthService, LangService, UtilsService } from 'cmp-portal-core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: false,
})
export class AuthComponent implements OnInit {
  // Dependencies
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly langService = inject(LangService);
  private readonly utilsService = inject(UtilsService);

  // Component data and state
  loginError: string | null = null;
  loginForm!: UntypedFormGroup;
  isLoginRunning = false;
  isPassText = false;
  environment = environment;
  isAuthFormPage = false;

  appVersion = '';

  ngOnInit(): void {
    this.loginForm = new UntypedFormGroup({
      login: new UntypedFormControl(null, [Validators.required]),
      password: new UntypedFormControl(null, [Validators.required]),
    });
    if (this.authService.userData.value.isLogged) {
      this.router.navigate(['/']);
    }

    if (this.router.url.indexOf('auth-form') > -1) {
      this.isAuthFormPage = true;
    } else {
      this.isAuthFormPage = false;
    }

    // set app version display string using utils service
    this.appVersion = this.utilsService.getVersionString();
  }

  onSubmit() {
    if (this.isLoginRunning) return;
    if (!this.loginForm.valid) {
      Object.keys(this.loginForm.controls).forEach(field => {
        const control = this.loginForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }

    if (!this.loginForm.valid) {
      return;
    }

    this.isLoginRunning = true;
    this.authService.logIn(this.loginForm.value.login, this.loginForm.value.password).subscribe(
      resultData => {
        this.isLoginRunning = false;
        console.log('We got data with message ', resultData);
        if (resultData === true) {
          let langId = this.langService.getDefaultLanguage();
          if (langId !== this.translate.getCurrentLang()) {
            this.langService.changeLanguage(langId);
          }
          this.loginError = null;
          this.loginForm.reset();

          // Retrieve the redirect URL from sessionStorage
          const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
          sessionStorage.removeItem('redirectUrl'); // Clean up after redirect

          // Navigate to the stored URL or default to '/'
          this.router.navigate([redirectUrl]);
        } else {
          this.loginError = this.translate.instant('LOGIN_ERROR_BAD_CREDENTIALS');
        }
      },
      someError => {
        this.isLoginRunning = false;
        this.loginError = this.translate.instant('LOGIN_ERROR_BAD_CREDENTIALS');
        console.log('Login Error', someError);
      }
    );
  }
}

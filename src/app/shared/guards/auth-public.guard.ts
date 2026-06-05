import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UtilsService } from 'cmp-portal-core';
import { environment } from '../../../environments/environment';

// this is used, when user is already logged in and tries to access a page, that should be accessible only for non-logged users. Specifically /auth, /forgot and /register
export const AuthPublicGuard = () => {
  const authService = inject(AuthService);
  const utilsService = inject(UtilsService);
  const router = inject(Router);

  if (!authService.userData.value.isLogged) {
    // if there is no SSO, Or we would like to display login page first anyway, let user in
    if (environment.sso == null || environment.sso.isDisplayLoginFirst === true) {
      return true;
    }
    // if there is SSO, that protected pages should not serve the user. The SSO service should handle those use-cases
    else {
      let redirectUrl = utilsService.constructSsoUrl('');
      redirectUrl = redirectUrl.replace('aricoma.competent.cz', 'training.aricoma.com');
      console.log('redirecting to SSO ' + redirectUrl);
      window.location.href = redirectUrl;
      return false;
    }
  }

  // if user is logged in, redirect him to the home page (which might redirect him further, if needed)
  return router.parseUrl('/');
};

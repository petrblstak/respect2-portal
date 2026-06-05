import { inject } from '@angular/core';
import { Router, RouterStateSnapshot } from '@angular/router';
import { AuthService, UtilsService } from 'cmp-portal-core';
import { environment } from '../../../environments/environment';

export const AuthLoggedInGuard = (route: any, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const utilsService = inject(UtilsService);
  const router = inject(Router);
  const stateUrl = state.url;

  // user is logged in
  if (authService.userData.value.isLogged) {
    if (stateUrl === '/portal/catalog') {
      // if catalog is allowed
      if (environment.isCatalogAllowed) {
        return true;
      }
      // otherwise send them to home page
      return router.parseUrl('/');
    } else {
      return true;
    }
  }

  // user is not logged in
  // if there is no SSO service defined or we want to display login first, store the attempted URL and redirect to login page
  if (environment.sso == null || environment.sso.isDisplayLoginFirst === true) {
    // Store the attempted URL in sessionStorage
    sessionStorage.setItem('redirectUrl', stateUrl);
    // and redirect to login page
    return router.parseUrl('/portal/auth');
  }
  // if there is SSO service defined and we want to display it directly, pass the original route as parameter and redirect to SSO
  else {
    let redirectUrl = utilsService.constructSsoUrl(stateUrl);
    redirectUrl = redirectUrl.replace('aricoma.competent.cz', 'training.aricoma.com');
    console.log('redirecting to SSO ' + redirectUrl);
    window.location.href = redirectUrl;
    return false;
  }
};

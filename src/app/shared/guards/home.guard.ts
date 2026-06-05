import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'cmp-portal-core';
import { environment } from '../../../environments/environment';

export const HomeGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // console.log('HomeGuard');
  // console.log('isHomePublic', environment.isHomePublic);
  // console.log('redirectFromHome', environment.redirectFromHome);
  // console.log('isLogged', authService.userData.value.isLogged);

  // if homepage is off, redirect to a specified page
  if (environment.redirectFromHome) {
    if (environment.redirectFromHome === '' || environment.redirectFromHome === '/') {
      return router.parseUrl('doesnt-exist');
    }
    return router.parseUrl(environment.redirectFromHome);
  }

  // homepage is public, let in user whatever is his status
  if (environment.isHomePublic) {
    return true;
  }

  // homepage is private, let in only logged users
  if (authService.userData.value.isLogged) {
    return true;
  }

  // otherwise send them to login page
  return router.parseUrl('/portal/auth');
};

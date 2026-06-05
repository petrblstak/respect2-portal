import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'cmp-portal-core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'cmp-logout',
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss',
  standalone: false,
})
export class LogoutComponent implements OnInit {
  // Dependencies
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Component data and state
  environment = environment;

  ngOnInit(): void {
    if (this.authService.userData.value.isLogged) {
      this.router.navigate(['/']);
    }
  }
}

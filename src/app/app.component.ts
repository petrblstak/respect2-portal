import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

import { ScormApiService } from 'cmp-portal-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private readonly scormApiService = inject(ScormApiService);
  private readonly router = inject(Router);
  get playerData() {
    return this.scormApiService.playerData;
  }

  actRoute!: string;
  isDarkPage = false;

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.actRoute = event.url;
        console.log('this.actRoute', this.actRoute);
        // if (
        //   this.actRoute === '/portal/courses' ||
        //   this.actRoute === '/portal/register' ||
        //   this.actRoute === '/portal/auth' ||
        //   this.actRoute === '/portal/forgot' ||
        //   this.actRoute.indexOf('/portal/operations') > -1
        // ) {
        //   this.isDarkPage = true;
        // } else {
        //   this.isDarkPage = false;
        // }
      }
    });
  }
  onActivate() {
    let mainContainer = document.querySelector('.main-container');
    if (mainContainer != null) mainContainer.scrollTo(0, 0);
  }
}

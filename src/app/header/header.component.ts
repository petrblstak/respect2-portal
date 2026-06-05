import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService, CoreDataService, LangObject, LangService, RequestControl, UserData, appConstants } from 'cmp-portal-core';
import { languageConstants } from '../shared/language.constants';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly coreDataService = inject(CoreDataService);
  private readonly router = inject(Router);
  private readonly langService = inject(LangService);
  private readonly document = inject(DOCUMENT);

  private userSub!: Subscription;
  private langSub!: Subscription;

  actRoute!: string;
  cmpUser!: UserData;
  isUserAdmin = false;
  currentLang!: LangObject;
  langSetting = languageConstants;
  langsAvailable: string[] = [];
  environment = environment;
  requestsControl!: RequestControl;
  isMenuCollapsed = true;

  ngOnInit(): void {
    this.userSub = this.authService.userData.subscribe(userData => {
      console.log('got new user', userData);
      this.cmpUser = userData;
      if (this.cmpUser.user?.superUser || (this.cmpUser.globalRoles && this.cmpUser.globalRoles['ADMIN_VIEW'])) {
        this.isUserAdmin = true;
      }
    });
    this.langSub = this.langService.appCurrentLang.subscribe(currentLang => {
      console.log('got currentLang ', currentLang);
      this.currentLang = currentLang;
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.actRoute = event.url;
      }
    });
    this.langsAvailable = this.coreDataService.coreData.LANGS_AVAILABLE;
    this.requestsControl = this.coreDataService.coreData.requestsControl;
  }

  openLms() {
    if (environment.isJwtLogin) {
      this.document.location.href = environment.remoteServer + 'tokenLogin.srv?jwt=' + localStorage.getItem(appConstants.STORAGE.LOGIN_TOKEN_NAME);
    } else {
      this.document.location.href = environment.remoteServer;
    }
  }

  over(drop: NgbDropdown) {
    drop.open();
  }
  out(drop: NgbDropdown) {
    drop.close();
  }

  changeLanguage(langId: string) {
    this.isMenuCollapsed = true;
    this.langService.changeLanguage(langId);
  }

  logOut() {
    this.isMenuCollapsed = true;
    this.authService.logOut().subscribe();
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.langSub.unsubscribe();
  }
}

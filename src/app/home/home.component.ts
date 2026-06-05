import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AuthService, ModalsService, UserData, VideoServiceType } from 'cmp-portal-core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false,
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  // private readonly modalService = inject(NgbModal);
  private readonly translate = inject(TranslateService);
  private readonly modalsService = inject(ModalsService);

  private userSub!: Subscription;
  private langSub!: Subscription;

  cmpUser!: UserData;
  currentLang!: string;

  links: any = {
    1: '/portal/courses',
    2: '/portal/catalog',
    3: '/pages/help',
  };

  ngOnInit(): void {
    this.currentLang = this.translate.getCurrentLang();
    this.userSub = this.authService.userData.subscribe(userData => {
      this.cmpUser = userData;
    });
    this.langSub = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.currentLang = event.lang;
    });
  }

  openVideo() {
    return this.modalsService.openVideoModal({
      type: VideoServiceType.YOUTUBE,
      code: 'F_tlGJLXwSI',
    });
  }

  // goToRegister(isTeacher: boolean) {
  //   if (this.cmpUser.user) {
  //     this.utilsService.showModalMessage(
  //       this.translate.instant('GENERAL_WARNING'),
  //       this.translate.instant('NAVIGATION_ALREADY_REGISTED')
  //     );
  //   } else {
  //     this.router.navigate(['/portal/register'], { queryParams: { regType: isTeacher ? 'teacher' : 'student' } });
  //   }
  // }

  goToCourses() {
    if (this.cmpUser.user) {
      this.router.navigate(['/portal/courses']);
    } else {
      this.router.navigate(['/portal/auth']);
    }
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.langSub.unsubscribe();
  }
}

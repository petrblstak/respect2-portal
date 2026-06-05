import { NgModule } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { RecaptchaModule, RECAPTCHA_LOADER_OPTIONS } from 'ng-recaptcha-2';
import { InlineSVGModule } from 'ng-inline-svg-2';

import { SharedModule } from '../shared/shared.module';
import { PortalRoutingModule } from './portal-routing.module';
import { PortalComponent } from './portal.component';
import { AuthComponent } from './auth/auth.component';
import { CoursesComponent } from './courses/courses.component';
import { OperationsComponent } from './operations/operations.component';
import { AccountComponent } from './account/account.component';
import { RegWarningModalComponent } from './register/reg-warning-modal/reg-warning-modalcomponent';
import { ForgotPassComponent } from './forgot-pass/forgot-pass.component';
import { RegisterComponent } from './register/register.component';
import { CatalogComponent } from './catalog/catalog.component';
import { SearchFieldComponent } from './courses/search-field/search-field.component';
import { RunLineComponent } from './course-cards/run-line/run-line.component';
import { CourseCardRowComponent } from './course-cards/course-card-row/course-card-row.component';
import { ActDataLineComponent } from './course-cards/act-data-line/act-data-line.component';
import { ProgressBarComponent } from './course-cards/progress-bar/progress-bar.component';
import { CourseCardActivityRowComponent } from './course-cards/course-card-activity-row/course-card-activity-row.component';
import { ActDetailComponent } from './act-detail/act-detail.component';
import { CourseCardSimpleComponent } from './course-cards/course-card-simple/course-card-simple.component';
import { CourseTagsComponent } from './course-cards/course-tags/course-tags.component';
import { RequestsComponent } from './requests/requests.component';
import { ActStarsComponent } from './act-detail/act-stars/act-stars.component';
import { CourseCardSimplePlayComponent } from './course-cards/course-card-simple-play/course-card-simple-play.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LogoutComponent } from './logout/logout.component';
import { PswStrengthMeterComponent } from './general/psw-strength-meter/psw-strength-meter';
import { RespectReportNvComponent } from './customer-specific/respect-report-nv/respect-report-nv.component';

@NgModule({
  declarations: [
    PortalComponent,
    AuthComponent,
    LogoutComponent,
    RegisterComponent,
    CoursesComponent,
    OperationsComponent,
    AccountComponent,
    RegWarningModalComponent,
    ForgotPassComponent,
    CourseCardRowComponent,
    CourseCardSimpleComponent,
    RunLineComponent,
    CatalogComponent,
    SearchFieldComponent,
    ActDataLineComponent,
    ProgressBarComponent,
    CourseCardActivityRowComponent,
    ActDetailComponent,
    CourseTagsComponent,
    RequestsComponent,
    CourseCardSimplePlayComponent,
    DashboardComponent,
    PswStrengthMeterComponent,
    RespectReportNvComponent,
  ],
  imports: [SharedModule, FormsModule, ReactiveFormsModule, NgSelectModule, PortalRoutingModule, RecaptchaModule, InlineSVGModule, ActStarsComponent],
  providers: [
    {
      provide: RECAPTCHA_LOADER_OPTIONS,
      useFactory: (translate: TranslateService) => ({
        onBeforeLoad(url: URL) {
          url.searchParams.set('hl', translate.getCurrentLang() || 'cs');
          return { url };
        },
      }),
      deps: [TranslateService],
    },
  ],
})
export class PortalModule {}

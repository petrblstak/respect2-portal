import { NgModule, provideAppInitializer } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { AboutModalComponent } from './pages/team/detail-modal/detail-modal.component';
import { DoesntExistComponent } from './nav-error/doesnt-exist.component';
import { languageConstants } from './shared/language.constants';
import { CreateMergedTranslateLoader } from './shared/merged-translate-loader';
import { HomeComponent } from './home/home.component';

import { AuthInterceptorService, AuthService, CmpPortalCoreModule, CORE_CONFIG, CoreDataService, InitCoreData, LangService, UtilsService } from 'cmp-portal-core';
import { TranslateService } from '@ngx-translate/core';
import { inject } from '@angular/core';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent, HeaderComponent, HomeComponent, DoesntExistComponent, FooterComponent, AboutModalComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: CreateMergedTranslateLoader,
        deps: [HttpClient],
      },
    }),
    InlineSVGModule.forRoot(),
    CmpPortalCoreModule.forRoot({ environment: environment, langSettings: languageConstants }),
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true,
    },
    provideAppInitializer(() => {
      const coreData = inject(CoreDataService);
      const authService = inject(AuthService);
      const translate = inject(TranslateService);
      const utilsService = inject(UtilsService);
      const langService = inject(LangService);
      const config = inject(CORE_CONFIG);

      // InitCoreData returns an initializer function, call it to get the Observable
      return InitCoreData(coreData, authService, translate, utilsService, langService, config)();
    }),
  ],
})
export class AppModule {}

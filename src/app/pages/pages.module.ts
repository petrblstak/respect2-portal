import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { PagesRoutingModule } from './pages-routing.module';
import { PagesComponent } from './pages.component';
import { AboutComponent } from './about/about.component';
import { TeamComponent } from './team/team.component';
import { ContactComponent } from './contact/contact.component';
import { PartnersComponent } from './partners/partners.component';
import { GdprComponent } from './gdpr/gdpr.component';
import { ConditionsComponent } from './conditions/conditions.component';
import { CookiesComponent } from './cookies/cookies.component';
import { HelpComponent } from './help/help.component';

@NgModule({
  declarations: [PagesComponent, AboutComponent, TeamComponent, ContactComponent, PartnersComponent, GdprComponent, ConditionsComponent, CookiesComponent, HelpComponent],
  imports: [SharedModule, PagesRoutingModule],
})
export class PagesModule {}

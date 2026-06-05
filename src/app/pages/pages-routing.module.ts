import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { ConditionsComponent } from './conditions/conditions.component';
import { ContactComponent } from './contact/contact.component';
import { CookiesComponent } from './cookies/cookies.component';
import { GdprComponent } from './gdpr/gdpr.component';
import { PagesComponent } from './pages.component';
import { PartnersComponent } from './partners/partners.component';
import { TeamComponent } from './team/team.component';
import { HelpComponent } from './help/help.component';

const routes: Routes = [
  { path: '', component: PagesComponent },
  { path: 'about', component: AboutComponent },
  { path: 'team', component: TeamComponent },
  { path: 'contacts', component: ContactComponent },
  { path: 'partners', component: PartnersComponent },
  { path: 'gdpr', component: GdprComponent },
  { path: 'conditions', component: ConditionsComponent },
  { path: 'cookies', component: CookiesComponent },
  { path: 'help', component: HelpComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}

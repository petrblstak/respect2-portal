import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthLoggedInGuard } from '../shared/guards/auth-logged.guard';
import { AuthPublicGuard } from '../shared/guards/auth-public.guard';
import { AccountComponent } from './account/account.component';
import { AuthComponent } from './auth/auth.component';
import { CoursesComponent } from './courses/courses.component';
import { ForgotPassComponent } from './forgot-pass/forgot-pass.component';
import { OperationsComponent } from './operations/operations.component';
import { PortalComponent } from './portal.component';
import { RegisterComponent } from './register/register.component';
import { CatalogComponent } from './catalog/catalog.component';
import { ActDetailComponent } from './act-detail/act-detail.component';
import { RequestsComponent } from './requests/requests.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LogoutComponent } from './logout/logout.component';
import { RespectReportNvComponent } from './customer-specific/respect-report-nv/respect-report-nv.component';

const routes: Routes = [
  {
    path: '',
    component: PortalComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'auth',
      },
      { path: 'auth', canActivate: [AuthPublicGuard], component: AuthComponent },
      { path: 'auth-form', component: AuthComponent },
      { path: 'logout', component: LogoutComponent },
      { path: 'forgot', canActivate: [AuthPublicGuard], component: ForgotPassComponent },
      { path: 'forgot-form', component: ForgotPassComponent },
      { path: 'register', canActivate: [AuthPublicGuard], component: RegisterComponent },
      { path: 'operations', component: OperationsComponent },
      { path: 'account', canActivate: [AuthLoggedInGuard], component: AccountComponent },
      { path: 'dash', canActivate: [AuthLoggedInGuard], component: DashboardComponent },
      {
        path: 'courses',
        canActivate: [AuthLoggedInGuard],
        component: CoursesComponent,
      },
      {
        path: 'catalog',
        canActivate: [AuthLoggedInGuard],
        component: CatalogComponent,
      },
      {
        path: 'act-detail/:id',
        canActivate: [AuthLoggedInGuard],
        component: ActDetailComponent,
      },
      {
        path: 'cat-detail/:id',
        canActivate: [AuthLoggedInGuard],
        component: ActDetailComponent,
      },
      {
        path: 'requests',
        canActivate: [AuthLoggedInGuard],
        component: RequestsComponent,
      },
      {
        path: 'report-nv',
        canActivate: [AuthLoggedInGuard],
        component: RespectReportNvComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PortalRoutingModule {}

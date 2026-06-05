import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { UserData, AuthService, CoreDataService, LangService, AccountService, LangObject, UtilsService } from 'cmp-portal-core';
import { languageConstants } from '../../shared/language.constants';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  standalone: false,
})
export class AccountComponent implements OnInit, OnDestroy {
  // Dependencies
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly coreDataService = inject(CoreDataService);
  private readonly translate = inject(TranslateService);
  private readonly accountService = inject(AccountService);
  private readonly langService = inject(LangService);
  private readonly utilsService = inject(UtilsService);

  // Subscriptions
  private userSub!: Subscription;
  private langSub!: Subscription;

  // Component data and state
  cmpUser!: UserData;
  currentLang!: LangObject;
  loginChangeState: 'none' | 'progress' | 'processed' = 'none';
  passChange = {
    isPassChange: false,
    passError: null,
    passPolicy: null as string | null,
  };
  loginErrorMsg = '';
  newLogin = '';
  isPersonalDataEdited = false;
  isConsentUpdated = false;
  isUpdateRunning = false;

  isOldPassText = false;
  isNewPassText = false;

  accFormLogin!: UntypedFormGroup;
  accFormPassword!: UntypedFormGroup;
  accFormPersonal!: UntypedFormGroup;

  langSetting = languageConstants;
  langsAvailable: string[] = [];

  appVersion = '';

  ngOnInit(): void {
    this.userSub = this.authService.userData.subscribe(userData => {
      this.cmpUser = userData;
      console.log('this.cmpUser', this.cmpUser);
    });
    this.langSub = this.langService.appCurrentLang.subscribe(currentLang => {
      this.currentLang = currentLang;
    });
    this.langsAvailable = this.coreDataService.coreData.LANGS_AVAILABLE;

    // set app version display string using utils service
    this.appVersion = this.utilsService.getVersionString();
  }

  personalDataEdit() {
    this.accFormPersonal = new UntypedFormGroup({
      name: new UntypedFormControl(this.cmpUser.user!.firstName, [Validators.required]),
      surname: new UntypedFormControl(this.cmpUser.user!.lastName, [Validators.required]),
    });
    this.isPersonalDataEdited = true;
  }

  onPersonalDataSave() {
    console.log('onPersonalDataSave', this.accFormPersonal);
    if (!this.accFormPersonal.valid) {
      Object.keys(this.accFormPersonal.controls).forEach(field => {
        const control = this.accFormPersonal.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }

    this.isUpdateRunning = true;
    this.cmpUser.user!.firstName = this.accFormPersonal.get('name')?.value;
    this.cmpUser.user!.lastName = this.accFormPersonal.get('surname')?.value;

    this.accountService.updateUserObject(this.cmpUser.user!).subscribe(updateOk => {
      if (updateOk) {
        this.accFormPersonal.reset();
        this.isPersonalDataEdited = false;
      }
      this.isUpdateRunning = false;
    });
  }

  personalDataCancelEdit() {
    this.accFormPersonal.reset();
    this.isPersonalDataEdited = false;
  }

  changeLoginOpen() {
    if (this.cmpUser.userType === 'student') {
      this.accFormLogin = new UntypedFormGroup({
        login: new UntypedFormControl(this.cmpUser.user?.login, [Validators.required, Validators.minLength(6)]),
      });
      this.loginErrorMsg = this.translate.instant('REGISTER_FIELD_ERROR_NAME');
    } else {
      this.accFormLogin = new UntypedFormGroup({
        login: new UntypedFormControl(this.cmpUser.user?.login, [Validators.required, Validators.email]),
      });
      this.loginErrorMsg = this.translate.instant('REGISTER_FIELD_ERROR_EMAIL');
    }
    this.loginChangeState = 'progress';
  }

  onChangeLogin() {
    if (this.cmpUser.userType === 'student') {
      this.accountService.updateStudentLogin(this.accFormLogin.get('login')?.value).subscribe(isNickChanged => {
        if (isNickChanged) {
          this.loginChangeState = 'none';
          this.authService.checkLoggedUser().subscribe(isPassChanged => {});
        }
      });
    } else {
      this.accountService.updateUserEmail(this.accFormLogin.get('login')?.value).subscribe(isEmailChanged => {
        if (isEmailChanged) {
          this.newLogin = this.accFormLogin.get('login')?.value;
          this.loginChangeState = 'processed';
        }
      });
    }
  }

  changePasswordOpen() {
    this.accFormPassword = new UntypedFormGroup({
      oldpassword: new UntypedFormControl(null, [Validators.required]),
      newpassword: new UntypedFormControl(null, [Validators.required, Validators.minLength(6)]),
    });
    this.passChange.passPolicy = this.coreDataService.coreData.FRONTEND_APP_INFO.PASSWORD_STRENGTH_POLICY;
    this.passChange.isPassChange = true;
  }

  onChangePassword() {
    console.log('onChangePassword', this.accFormPassword);
    if (!this.accFormPassword.valid) {
      Object.keys(this.accFormPassword.controls).forEach(field => {
        const control = this.accFormPassword.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }

    this.accountService
      .changePasswordRequest(this.accFormPassword.get('oldpassword')?.value, this.accFormPassword.get('newpassword')?.value, this.cmpUser.user!.login)
      .subscribe((result: { isSuccess: boolean; messageKey?: string }) => {
        if (result.isSuccess === true) {
          this.utilsService.showModalMessage(null, this.translate.instant('ACCOUNT_PASSWORD_CHANGE'));
          this.passChange.isPassChange = false;
          this.passChange.passError = null;
          this.accFormPassword.reset();
        } else {
          this.passChange.passError = this.translate.instant(result.messageKey ? result.messageKey : 'ACCOUNT_PASSWORD_ERROR_UNKNOWN');
        }
      });
  }

  cancelChangePassword() {
    this.accFormPassword.reset();
    this.passChange.isPassChange = false;
  }

  changeLanguage(langId: string) {
    this.langService.changeLanguage(langId);
    if (this.cmpUser.user) {
      let langCmpId = 0;
      for (const key in this.coreDataService.coreData.CODE_TABLES.CtLanguage.idKey) {
        if (this.coreDataService.coreData.CODE_TABLES.CtLanguage.idKey[key].iso === langId) {
          langCmpId = this.coreDataService.coreData.CODE_TABLES.CtLanguage.idKey[key].id;
        }
      }
      if (langCmpId === 0) {
        throw Error('Currently selected language ' + langId + ' is not a usable language for the current user.');
      }
      this.cmpUser.user.idCtLanguage = langCmpId;
      this.accountService.updateUserObject(this.cmpUser.user).subscribe(isOk => {
        console.log('isOk', isOk);
      });
    }
  }

  logOut() {
    this.authService.logOut().subscribe(isLoggedOut => {
      console.log('User was logged out = ' + isLoggedOut);
      if (environment.isHomePublic) {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.langSub.unsubscribe();
  }
}

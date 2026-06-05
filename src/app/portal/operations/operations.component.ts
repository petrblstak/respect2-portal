import { Component, OnInit, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { AuthService, CoreDataService, OperationsService, RegisterService, UtilsService } from 'cmp-portal-core';
@Component({
  selector: 'app-operations',
  templateUrl: './operations.component.html',
  styleUrls: ['./operations.component.scss'],
  standalone: false,
})
export class OperationsComponent implements OnInit {
  // Dependencies
  private readonly route = inject(ActivatedRoute);
  private readonly utilsService = inject(UtilsService);
  private readonly registerService = inject(RegisterService);
  private readonly translate = inject(TranslateService);
  private readonly operationsService = inject(OperationsService);
  private readonly authService = inject(AuthService);
  private readonly coreDataService = inject(CoreDataService);

  // Component data and state
  isRegistred = false;
  isEmailChanged = false;
  optype = '';
  private token = '';

  passChange = {
    isNewPass: false,
    isNewPassText: false,
    passError: null,
    passPolicy: null as string | null,
  };

  forgotPassForm!: UntypedFormGroup;

  ngOnInit(): void {
    console.log('myParams', this.route.snapshot.queryParams);
    switch (this.route.snapshot.queryParams.optype) {
      case 'teacherRegistration':
        if (this.checkTokenOk(this.route.snapshot.queryParams.token)) {
          // this.optype = this.route.snapshot.queryParams.optype;
          this.registerTeacher(this.route.snapshot.queryParams.token, this.route.snapshot.queryParams.optype);
        }
        break;
      case 'publicPreRegistration':
      case 'publicRegistration':
        if (this.checkTokenOk(this.route.snapshot.queryParams.token)) {
          // this.optype = this.route.snapshot.queryParams.optype;
          this.registerPublic(this.route.snapshot.queryParams.token, this.route.snapshot.queryParams.optype);
        }
        break;
      case 'pwdReset':
      case 'firstPass':
        if (this.checkTokenOk(this.route.snapshot.queryParams.token)) {
          this.passChange.passPolicy = this.coreDataService.coreData.FRONTEND_APP_INFO.PASSWORD_STRENGTH_POLICY;
          this.forgotPassForm = new UntypedFormGroup({
            password: new UntypedFormControl(null, [Validators.required]),
          });
          // this.optype = this.route.snapshot.queryParams.optype;
        }
        break;
      case 'emailChange':
        if (this.checkTokenOk(this.route.snapshot.queryParams.token)) {
          // this.optype = this.route.snapshot.queryParams.optype;
          this.confirmEmailChange(this.route.snapshot.queryParams.token, this.route.snapshot.queryParams.optype);
        }
        break;
      default:
        this.translate
          .get(['GENERAL_ERROR', 'OPERATIONS_ERROR_OPTYPE'], {
            optype: this.route.snapshot.queryParams.optype ? this.route.snapshot.queryParams.optype : 'null',
          })
          .subscribe((res: any) => {
            console.log(res);
            this.utilsService.showModalMessage(res['GENERAL_ERROR'], res['OPERATIONS_ERROR_OPTYPE']);
          });
    }
    this.optype = this.route.snapshot.queryParams.optype ? this.route.snapshot.queryParams.optype : '';
  }

  onSubmitPassword() {
    console.log('onSubmitPassword', this.forgotPassForm);

    if (!this.forgotPassForm.valid) {
      Object.keys(this.forgotPassForm.controls).forEach(field => {
        const control = this.forgotPassForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }

    this.operationsService.sendNewPasswordRequest(this.optype, this.forgotPassForm.get('password')?.value, this.token).subscribe(result => {
      // if (isRequestOk) {
      //   this.isNewPass = true;
      //   this.forgotPassForm.reset();
      // }

      if (result.isSuccess === true) {
        // this.utilsService.showModalMessage(null, this.translate.instant('ACCOUNT_PASSWORD_CHANGE'));
        this.passChange.isNewPass = true;
        this.passChange.passError = null;
        this.forgotPassForm.reset();
      } else {
        this.passChange.passError = this.translate.instant(result.messageKey ? result.messageKey : 'ACCOUNT_PASSWORD_ERROR_UNKNOWN');
      }
    });
  }

  private checkTokenOk(token: string): boolean {
    if (!token) {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_ERROR'), this.translate.instant('OPERATIONS_ERROR_NO_PARAMS'));
      return false;
    }
    this.token = token;
    return true;
  }

  private registerTeacher(token: string, linkType: string) {
    this.registerService.registerTeacher(token, linkType).subscribe(isRegistred => {
      this.isRegistred = isRegistred;
    });
  }

  private registerPublic(token: string, linkType: string) {
    this.registerService.registerPublic(token, linkType).subscribe(isRegistred => {
      this.isRegistred = isRegistred;
    });
  }

  private confirmEmailChange(token: string, linkType: string) {
    this.operationsService.confirmEmailChange(token, linkType).subscribe(isEmailChanged => {
      this.isEmailChanged = isEmailChanged;
      this.authService.checkLoggedUser().subscribe(isPassChanged => {});
    });
  }
}

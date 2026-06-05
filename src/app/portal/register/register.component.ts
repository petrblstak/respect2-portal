import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { RecaptchaComponent } from 'ng-recaptcha-2';

import { CoreDataService, RegisterService, SchoolClass, SchoolData, User, UtilsService } from 'cmp-portal-core';
import { RegWarningModalComponent } from './reg-warning-modal/reg-warning-modalcomponent';
import { languageConstants } from '../../shared/language.constants';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: false,
})
export class RegisterComponent implements OnInit {
  // Dependencies
  private readonly registerService = inject(RegisterService);
  private readonly coreDataService = inject(CoreDataService);
  private readonly translate = inject(TranslateService);
  private readonly utilsService = inject(UtilsService);
  private readonly modalService = inject(NgbModal);
  private readonly route = inject(ActivatedRoute);

  @ViewChild('captchaRefPublic') captchaRefPublic!: RecaptchaComponent;

  // Component data and state
  selectedReg: 'public' | 'student' | 'teacher' | null = 'public';
  isDataLoading = false;
  langSettings = languageConstants;
  langsAvailable: string[] = [];
  schoolData!: SchoolData;
  registeredEmail = '';
  environment = environment;

  regFormPublic!: UntypedFormGroup;
  regFormTeacher!: UntypedFormGroup;
  regFormStudent!: UntypedFormGroup;

  selectedState!: string | null;
  selectedRegion!: string | null;
  selectedCity!: string | null;
  availableClasses: number[] = [];
  classesData: { [key: number]: SchoolClass } = {};

  isRegisterDone = false;
  isCaptchaConfirmed = environment.isUseCaptcha ? false : true;
  isShowCaptchaPrompt = false;

  isTeacherPassText = false;
  isStudentPassText = false;
  isStudentRepPassText = false;
  isRegistrationRunning = false;
  isTouchDevice = false;
  isUseCaptcha = environment.isUseCaptcha;
  recaptchaKey = environment.recaptchaKey;
  captchaResponse: string | null = null;

  availableSizes = ['do 100', 'do 500', 'do 1500', 'nad 1500'];
  availableSources = [
    {
      name: 'web',
      desc: 'Z webu educasoftu',
    },
    {
      name: 'meeting',
      desc: 'Z klientské schůzky',
    },
    {
      name: 'other',
      desc: 'Odjinud',
    },
  ];

  ngOnInit(): void {
    if ('ontouchstart' in document.documentElement) {
      this.isTouchDevice = true;
    } else {
      this.isTouchDevice = false;
    }
    this.regFormPublic = new UntypedFormGroup({
      firstName: new UntypedFormControl(null, Validators.required),
      lastName: new UntypedFormControl(null, Validators.required),
      position: new UntypedFormControl(null, Validators.required),
      compSize: new UntypedFormControl(null, Validators.required),
      selectedSource: new UntypedFormControl(null, Validators.required),
      email: new UntypedFormControl(null, [Validators.required, Validators.email]),
      password: new UntypedFormControl(null, [Validators.required, Validators.minLength(6)]),
      gdpr: new UntypedFormControl(false, Validators.requiredTrue),
    });

    this.regFormTeacher = new UntypedFormGroup({
      selectedSchool: new UntypedFormControl(null, Validators.required),
      email: new UntypedFormControl(null, [Validators.required, Validators.email]),
      firstName: new UntypedFormControl(null, Validators.required),
      lastName: new UntypedFormControl(null, Validators.required),
      password: new UntypedFormControl(null, [Validators.required, Validators.minLength(6)]),
      gdpr: new UntypedFormControl(false, Validators.requiredTrue),
    });

    this.regFormStudent = new UntypedFormGroup({
      selectedSchool: new UntypedFormControl(null, Validators.required),
      selectedClass: new UntypedFormControl(null, Validators.required),
      nickname: new UntypedFormControl(null, [Validators.required, Validators.minLength(6)]),
      classPass: new UntypedFormControl(null, [Validators.required, Validators.minLength(6)]),
      password: new UntypedFormControl(null, Validators.minLength(6)),
      confirmPassword: new UntypedFormControl(null, [Validators.minLength(6), this.confirmPasswordValidatorStudent.bind(this)]),
    });
    const regType = this.route.snapshot.queryParams['regType'];
    if (regType === 'teacher' || regType === 'student') {
      this.selectedReg = regType;
    }
    this.langsAvailable = this.coreDataService.coreData.LANGS_AVAILABLE;
  }

  captchaResolved(captchaResponse: string | null) {
    console.log('Resolved captcha with response:' + captchaResponse);
    if (captchaResponse != null) {
      this.captchaResponse = captchaResponse;
      this.isCaptchaConfirmed = true;
      this.isShowCaptchaPrompt = false;
    } else {
      this.captchaResponse = null;
      this.isCaptchaConfirmed = false;
      this.isShowCaptchaPrompt = true;
    }
  }

  getActualLang() {
    if (this.translate.getCurrentLang() === 'cs') return 'cs';
    return 'en';
  }

  resetSelects(selectLevel: 'state' | 'region' | 'city' | 'school', isTeacher: boolean) {
    // reset level class
    if (!isTeacher) this.regFormStudent.get('selectedClass')?.setValue(null);
    this.availableClasses = [];
    if (selectLevel === 'school') return;

    // reset level school
    if (isTeacher) {
      this.regFormTeacher.get('selectedSchool')?.setValue(null);
    } else {
      this.regFormStudent.get('selectedSchool')?.setValue(null);
    }
    if (selectLevel === 'city') return;

    // reset level region
    this.selectedCity = null;
    if (selectLevel === 'region') return;

    // reset level state
    this.selectedRegion = null;
  }

  resetSchool(isTeacher: boolean) {
    this.selectedRegion = null;
    this.selectedCity = null;
    if (environment.isUseCaptcha) this.isCaptchaConfirmed = false;
    this.isShowCaptchaPrompt = false;
    if (isTeacher) {
      this.regFormTeacher.get('selectedSchool')?.setValue(null);
    } else {
      this.regFormStudent.get('selectedSchool')?.setValue(null);
      this.regFormStudent.get('selectedClass')?.setValue(null);
    }
  }

  selectReg(regType: 'public' | 'student' | 'teacher') {
    this.selectedState = null;
    this.selectedRegion = null;
    this.selectedCity = null;
    this.selectedReg = regType;
    if (environment.isUseCaptcha) this.isCaptchaConfirmed = false;
  }

  loadSchoolsByState(isTeacher: boolean) {
    if (!this.selectedState) {
      return;
    }

    this.isDataLoading = true;
    this.resetSelects('state', isTeacher);
    this.registerService.loadSchoolData(this.langSettings.LANG_CONFIG[this.selectedState].langFileKey, isTeacher).subscribe(isLoaded => {
      if (isLoaded && this.registerService.schoolData) {
        this.schoolData = this.registerService.schoolData;
        this.isDataLoading = false;
      }
    });
  }

  getCitiesToSelect(): string[] {
    if (this.selectedRegion == null) return [];
    return this.schoolData.region[this.selectedRegion].cities;
  }

  getSchoolsToSelect(): string[] {
    if (this.selectedCity == null) return [];
    return this.schoolData.city[this.selectedCity].schools;
  }

  setSchoolsEnabled(type: 'teacher' | 'student') {
    let form = type === 'teacher' ? this.regFormTeacher : this.regFormStudent;
    if (this.selectedCity == null) {
      form.get('selectedSchool')?.disable();
    } else {
      form.get('selectedSchool')?.enable();
      if (type === 'teacher') {
        this.resetSelects('city', true);
      } else {
        this.resetSelects('city', false);
      }
    }
  }

  getSchoolClasses() {
    let schoolId = this.regFormStudent.get('selectedSchool')?.value;
    if (schoolId === null) return;
    if (!this.schoolData.school[schoolId]) {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('REGISTER_REQUEST_ERROR_SCHOOL_ID_NOT_FOUND') + ' (' + schoolId + ')');
      this.availableClasses = [];
      this.classesData = {};
      return;
    }
    this.registerService.loadSchoolClasses(this.schoolData.school[schoolId].competentId).subscribe(data => {
      console.log('data', data);
      if (data.length > 0) {
        this.availableClasses = [];
        this.classesData = {};
        for (let classObj of data) {
          this.classesData[classObj.id] = classObj;
          this.availableClasses.push(classObj.id);
        }
        this.regFormStudent.get('selectedClass')?.enable();
      } else {
        this.regFormStudent.get('selectedClass')?.disable();
        this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('REGISTER_INFO_NO_SCHOOL_CLASSES'));
      }
    });
  }

  onSubmitStudent() {
    console.log('onSubmitStudent', this.regFormStudent);
    this.regFormStudent.get('confirmPassword')?.updateValueAndValidity();

    if (!this.isCaptchaConfirmed) {
      this.isShowCaptchaPrompt = true;
    } else {
      this.isShowCaptchaPrompt = false;
    }

    if (!this.regFormStudent.valid) {
      Object.keys(this.regFormStudent.controls).forEach(field => {
        const control = this.regFormStudent.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }
    if (!this.isCaptchaConfirmed) return;

    if (!this.regFormStudent.get('password')?.value) {
      const modalRef = this.modalService.open(RegWarningModalComponent, {
        size: 'md',
        backdrop: 'static',
      });
      modalRef.result.then(
        closedMsg => {
          return;
        },
        dismissMsg => {
          this.finishStudentRegistration();
        }
      );
    } else {
      this.finishStudentRegistration();
    }
  }

  private finishStudentRegistration() {
    this.isRegistrationRunning = true;
    let newStudent = new User(new Date(), this.regFormStudent.get('nickname')?.value, this.getCurrentLangId(), this.regFormStudent.get('nickname')?.value);
    if (this.regFormStudent.get('password')?.value) {
      newStudent.safePassword = this.regFormStudent.get('password')?.value;
    } else {
      newStudent.safePassword = this.regFormStudent.get('classPass')?.value;
    }

    newStudent.firstName = this.regFormStudent.get('nickname')?.value;
    newStudent.lastName = '(' + this.classesData[this.regFormStudent.get('selectedClass')?.value].name + ')';

    this.registerService.sendStudentRegistrationRequest(newStudent, this.regFormStudent.get('classPass')?.value, this.regFormStudent.get('selectedClass')?.value).subscribe(
      useCreated => {
        if (useCreated) {
          setTimeout(() => {
            this.isRegistrationRunning = false;
            this.isRegisterDone = true;
            this.regFormStudent.reset();
          }, 5000);
        } else {
          this.isRegistrationRunning = false;
        }
        // this.isRegistrationRunning = false;
        // if (useCreated) {
        //   this.isRegisterDone = true;
        //   this.regFormStudent.reset();
        // }
      },
      errorData => {
        this.isRegistrationRunning = false;
      }
    );
  }

  onSubmitTeacher() {
    console.log('onSubmitTeacher', this.regFormTeacher);

    if (!this.isCaptchaConfirmed) {
      this.isShowCaptchaPrompt = true;
    } else {
      this.isShowCaptchaPrompt = false;
    }

    if (!this.regFormTeacher.valid) {
      Object.keys(this.regFormTeacher.controls).forEach(field => {
        const control = this.regFormTeacher.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }
    if (!this.isCaptchaConfirmed) return;

    this.isRegistrationRunning = true;
    let newTeacher = new User(new Date(), this.regFormTeacher.get('email')?.value, this.getCurrentLangId(), this.regFormTeacher.get('email')?.value);
    newTeacher.firstName = this.regFormTeacher.get('firstName')?.value;
    newTeacher.lastName = this.regFormTeacher.get('lastName')?.value;
    newTeacher.safePassword = this.regFormTeacher.get('password')?.value;
    this.registeredEmail = this.regFormTeacher.get('email')?.value;

    this.registerService.sendTeacherRegistrationRequest(newTeacher, this.regFormTeacher.get('selectedSchool')?.value).subscribe(
      useCreated => {
        this.isRegistrationRunning = false;
        if (useCreated) {
          this.isRegisterDone = true;
          this.regFormTeacher.reset();
        }
      },
      errorData => {
        this.isRegistrationRunning = false;
      }
    );
  }

  onSubmitPublic() {
    console.log('onSubmitPublic', this.regFormPublic);

    if (!this.isCaptchaConfirmed || this.captchaResponse == null) {
      this.isShowCaptchaPrompt = true;
    } else {
      this.isShowCaptchaPrompt = false;
    }

    if (!this.regFormPublic.valid) {
      Object.keys(this.regFormPublic.controls).forEach(field => {
        const control = this.regFormPublic.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      this.captchaRefPublic.reset();
      return;
    }
    if (!this.isCaptchaConfirmed || this.captchaResponse == null) return;

    this.isRegistrationRunning = true;
    let newUser = new User(new Date(), this.regFormPublic.get('email')?.value, this.getCurrentLangId(), this.regFormPublic.get('email')?.value);
    newUser.firstName = this.regFormPublic.get('firstName')?.value;
    newUser.lastName = this.regFormPublic.get('lastName')?.value;
    newUser.safePassword = this.regFormPublic.get('password')?.value;
    newUser.params = {};
    // newUser.params[environment.USER_PARAMS.OPTIONAL_PARAMS_POSITION] = this.regFormPublic.get('position')?.value;
    // newUser.params[environment.USER_PARAMS.OPTIONAL_PARAMS_COMPANY_SIZE] = this.regFormPublic.get('compSize')?.value;
    // this.registeredEmail = this.regFormPublic.get('email')?.value;

    let extraGrpId: number[] = [];
    // if (this.regFormPublic.get('selectedSource')?.value === 'web') {
    //   extraGrpId.push(environment.GROUP_IDS.REG_WEB_GRP_ID);
    // } else if (this.regFormPublic.get('selectedSource')?.value === 'meeting') {
    //   extraGrpId.push(environment.GROUP_IDS.REG_MEET_GRP_ID);
    // } else {
    //   extraGrpId.push(environment.GROUP_IDS.REG_OTHER_GRP_ID);
    // }

    this.registerService.sendPublicRegistrationRequest(newUser, this.captchaResponse, extraGrpId).subscribe(
      useCreated => {
        this.isRegistrationRunning = false;
        this.captchaRefPublic.reset();
        if (useCreated) {
          this.isRegisterDone = true;
          this.regFormPublic.reset();
        }
      },
      errorData => {
        this.isRegistrationRunning = false;
        this.captchaRefPublic.reset();
      }
    );
  }

  confirmPasswordValidatorPublic(control: UntypedFormControl) {
    if (control.value === this.regFormPublic?.controls.password.value) return null;
    return { passNotMatch: true };
  }

  confirmPasswordValidatorStudent(control: AbstractControl) {
    if (control.value === this.regFormStudent?.controls.password.value) return null;
    return { passNotMatch: true };
  }

  private getCurrentLangId() {
    const langString = this.translate.getCurrentLang();
    for (const key in this.coreDataService.coreData.CODE_TABLES.CtLanguage.idKey) {
      if (this.coreDataService.coreData.CODE_TABLES.CtLanguage.idKey[key].iso === langString) {
        return this.coreDataService.coreData.CODE_TABLES.CtLanguage.idKey[key].id;
      }
    }
    throw Error('Currently selected language ' + langString + ' is not a usable language for the new user.');
  }
}

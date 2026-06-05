import { Component, OnInit, inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { CoreDataService, ForgotPassService, RegisterService, SchoolClass, SchoolData, UtilsService } from 'cmp-portal-core';
import { languageConstants } from '../../shared/language.constants';

@Component({
  selector: 'app-forgot-pass',
  templateUrl: './forgot-pass.component.html',
  styleUrls: ['./forgot-pass.component.scss'],
  standalone: false,
})
export class ForgotPassComponent implements OnInit {
  // Dependencies
  private readonly forgotPassService = inject(ForgotPassService);
  private readonly registerService = inject(RegisterService);
  private readonly translate = inject(TranslateService);
  private readonly utilsService = inject(UtilsService);
  private readonly coreDataService = inject(CoreDataService);

  // Component data and state
  selectedProfile: 'public' | 'student' | 'teacher' | null = 'public';
  isforgotDone = false;
  registeredEmail = '';
  isDataLoading = false;
  langSettings = languageConstants;
  langsAvailable: string[] = [];

  schoolData!: SchoolData;

  selectedState!: string | null;
  selectedRegion!: string | null;
  selectedCity!: string | null;
  selectedSchool!: string | null;
  availableClasses: number[] = [];
  classesData: { [key: number]: SchoolClass } = {};

  forgotFormGeneral!: UntypedFormGroup;
  forgotFormStudent!: UntypedFormGroup;

  ngOnInit(): void {
    this.forgotFormGeneral = new UntypedFormGroup({
      email: new UntypedFormControl(null, [Validators.required, Validators.email]),
    });

    this.forgotFormStudent = new UntypedFormGroup({
      selectedClass: new UntypedFormControl(null, Validators.required),
      nickname: new UntypedFormControl(null, [Validators.required, Validators.minLength(6)]),
      classPass: new UntypedFormControl(null, [Validators.required, Validators.minLength(6)]),
    });
    this.langsAvailable = this.coreDataService.coreData.LANGS_AVAILABLE;
  }

  selectProfile(profileType: 'public' | 'student' | 'teacher') {
    this.selectedProfile = profileType;
  }

  resetSelects(selectLevel?: 'region' | 'city' | 'school') {
    // reset level class
    this.forgotFormStudent.get('selectedClass')?.setValue(null);
    this.availableClasses = [];
    if (selectLevel === 'school') return;

    // reset level school
    this.selectedSchool = null;
    if (selectLevel === 'city') return;

    // reset level region
    this.selectedCity = null;
    if (selectLevel === 'region') return;

    // reset level state
    this.selectedRegion = null;
  }

  onSubmitGeneral() {
    console.log('onSubmitGeneral', this.forgotFormGeneral);

    if (!this.forgotFormGeneral.valid) {
      Object.keys(this.forgotFormGeneral.controls).forEach(field => {
        const control = this.forgotFormGeneral.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }
    this.registeredEmail = this.forgotFormGeneral.get('email')?.value;

    this.forgotPassService.sendGeneralPasswordRequest(this.registeredEmail).subscribe(isRequestOk => {
      if (isRequestOk) {
        this.isforgotDone = true;
        this.forgotFormGeneral.reset();
      }
    });
  }

  onSubmitStudent() {
    console.log('onSubmitStudent', this.forgotFormStudent);

    if (!this.forgotFormStudent.valid) {
      Object.keys(this.forgotFormStudent.controls).forEach(field => {
        const control = this.forgotFormStudent.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      return;
    }

    this.forgotPassService
      .sendStudentPasswordRequest(this.forgotFormStudent.get('nickname')?.value, this.forgotFormStudent.get('selectedClass')?.value, this.forgotFormStudent.get('classPass')?.value)
      .subscribe(useCreated => {
        if (useCreated) {
          this.isforgotDone = true;
          this.forgotFormStudent.reset();
        }
      });
  }

  loadSchoolsByState() {
    if (!this.selectedState) {
      return;
    }

    this.isDataLoading = true;
    this.registerService.loadSchoolData(this.langSettings.LANG_CONFIG[this.selectedState].langFileKey, false).subscribe(isLoaded => {
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

  getSchoolClasses() {
    if (this.selectedSchool === null) return;
    if (!this.schoolData.school[this.selectedSchool!]) {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('REGISTER_REQUEST_ERROR_SCHOOL_ID_NOT_FOUND') + ' (' + this.selectedSchool + ')');
      this.availableClasses = [];
      this.classesData = {};
      return;
    }
    this.registerService.loadSchoolClasses(this.schoolData.school[this.selectedSchool!].competentId).subscribe(data => {
      console.log('data', data);
      if (data.length > 0) {
        this.availableClasses = [];
        this.classesData = {};
        for (let classObj of data) {
          this.classesData[classObj.id] = classObj;
          this.availableClasses.push(classObj.id);
        }
        this.forgotFormStudent.get('selectedClass')?.enable();
      } else {
        this.forgotFormStudent.get('selectedClass')?.disable();
        this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('REGISTER_INFO_NO_SCHOOL_CLASSES'));
      }
    });
  }
}

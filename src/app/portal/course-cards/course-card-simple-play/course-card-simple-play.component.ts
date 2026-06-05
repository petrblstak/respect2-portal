import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ActivityItemData, CompletionData, CoreDataService, CourseData, LaunchType, UtilsService } from 'cmp-portal-core';

import { ActDetailQueryParams } from '../../act-detail/act-detail.component';
import { environment } from '../../../../environments/environment';

const CARD_HEADER_FOLDER = 'assets/img/courses/headers/';

@Component({
  selector: 'cmp-course-card-simple-play',
  templateUrl: './course-card-simple-play.component.html',
  styleUrls: ['./course-card-simple-play.component.scss'],
  standalone: false,
})
export class CourseCardSimplePlayComponent implements OnInit {
  // Dependencies
  private readonly coreDataService = inject(CoreDataService);
  private readonly router = inject(Router);
  private readonly utilsService = inject(UtilsService);
  private readonly translate = inject(TranslateService);

  @Input({ required: true }) rootItem!: ActivityItemData;
  @Input({ required: true }) courseData!: CourseData;
  @Input({ required: false }) isRequested: boolean = false;
  @Output() courseLaunched = new EventEmitter<{ activityId: number; runId: number | null }>();

  // Component data and state
  get attemptEvalType() {
    return this.coreDataService.coreData.CODE_TABLES.CtEvaluationType.idKey;
  }
  environmentVars = environment;
  activityLaunchTypes = LaunchType;
  isSetAllowedPlay = environment.isPlaySetAllowed;

  ngOnInit(): void {}

  getActHeaderImg() {
    if (this.courseData.activities[this.rootItem.activityId].imageUrl != null) {
      return environment.remoteServer + this.courseData.activities[this.rootItem.activityId].imageUrl;
    }
    if (this.rootItem.isActivity) {
      const currentAct = this.courseData.activities[this.rootItem.activityId];
      if (currentAct.launchType == LaunchType.URL && currentAct.launchUrl != null) {
        return CARD_HEADER_FOLDER + 'link.png';
      }
      return CARD_HEADER_FOLDER + 'act.png';
    }
    return CARD_HEADER_FOLDER + 'set.png';
  }

  getActCompletionTreshold(): number {
    if (this.rootItem == null) return 0;
    return this.utilsService.getActCompletionTreshold(this.courseData.activities[this.rootItem.activityId]);
  }

  getActCompletionPercentage(): number {
    if (this.rootItem == null) return 0;
    let accObj = this.courseData.accesses[this.rootItem.accessId];
    return this.utilsService.getActCompletionPercentage(accObj, accObj.idBestAttempt ? this.courseData.attempts[accObj.idBestAttempt] : null);
  }

  getActCompletionData(): CompletionData {
    if (this.rootItem == null)
      return {
        text: this.translate.instant('COURSES_TEST_NOT_PASSED'),
        score: null,
        isDisplayBar: false,
        isPassed: false,
      };
    let accObj = this.courseData.accesses[this.rootItem.accessId];
    let cd = this.utilsService.getActCompletionData(accObj, accObj.idBestAttempt ? this.courseData.attempts[accObj.idBestAttempt] : null, this.courseData.activities[this.rootItem.activityId]);
    cd.isDisplayBar = false;
    return cd;
  }

  isTypeActivity(activityId: number): boolean {
    return this.utilsService.isTypeActivity(activityId, this.courseData);
  }

  isSimpleSet(activityId: number): boolean {
    return this.utilsService.isSimpleSet(activityId, this.courseData);
  }

  isSetPlayable(activityId: number): boolean {
    return this.utilsService.getAccessToPlay(activityId, this.courseData) > 0;
  }

  openPageDetail(rootItem: ActivityItemData, params?: ActDetailQueryParams) {
    if (environment.isLinksAsSpecialCards && this.isActivityLink()) {
      this.gotoLinkActivity();
      return;
    }
    this.router.navigate(['/portal/act-detail', rootItem.activityId], params ? { queryParams: params } : {});
  }

  isActivityLink(): boolean {
    const currentAct = this.courseData.activities[this.rootItem.activityId];
    if (currentAct.launchType == LaunchType.URL && currentAct.launchUrl != null) return true;
    return false;
  }

  gotoLinkActivity() {
    const currentAct = this.courseData.activities[this.rootItem.activityId];
    if (currentAct.launchType == LaunchType.URL && currentAct.launchUrl != null) {
      const newWindow = window.open(currentAct.launchUrl, '_self');
      if (newWindow == null || newWindow.closed || typeof newWindow.closed == 'undefined') {
        this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_URL_NO_POPUP'));
      }
    }
    return;
  }

  hasPlayableContent(activityId: number): boolean {
    if (!this.isTypeActivity(activityId)) return true;
    return this.utilsService.hasCorrectLaunchContent(this.courseData.activities[activityId]);
  }
  playCourse(event: { activityId: number; runId: number | null }) {
    this.courseLaunched.emit(event);
  }
}

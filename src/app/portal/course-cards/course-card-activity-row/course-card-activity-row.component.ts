import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { CompletionData, CoreDataService, CourseData, LaunchType, PlayActivityService, UtilsService } from 'cmp-portal-core';
import { ActDetailQueryParams, Tabs } from '../../act-detail/act-detail.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'cmp-course-card-activity-row',
  templateUrl: './course-card-activity-row.component.html',
  styleUrls: ['./course-card-activity-row.component.scss'],
  standalone: false,
})
export class CourseCardActivityRowComponent implements OnInit {
  // Dependencies
  private readonly coreDataService = inject(CoreDataService);
  private readonly translate = inject(TranslateService);
  private readonly playActivityService = inject(PlayActivityService);
  private readonly utilsService = inject(UtilsService);
  private readonly router = inject(Router);

  @Input({ required: true }) courseData!: CourseData;
  @Input({ required: true }) isRunAct!: boolean;
  @Input({ required: true }) activityId!: number;
  @Input({ required: false }) isCatalog: boolean = false;
  @Input({ required: false }) isInDetail: boolean = false;
  @Output() courseLaunched = new EventEmitter<{ activityId: number; runId: number | null }>();

  // Component data and state
  get attemptEvalType() {
    return this.coreDataService.coreData.CODE_TABLES.CtEvaluationType.idKey;
  }
  accessId!: number;
  activityLaunchTypes = LaunchType;
  isSetAllowedPlay = environment.isPlaySetAllowed;
  clickedItemType = Tabs;

  docs = {
    nonCertNum: 0,
    certNum: 0,
  };

  ngOnInit(): void {
    this.accessId = this.courseData.activityData[this.activityId].accessId;
    if (this.courseData.extraData[this.activityId] && this.courseData.extraData[this.activityId].docs) {
      this.courseData.extraData[this.activityId].docs.forEach(docId => {
        if (!this.courseData.documents[docId].docTemplate) {
          this.docs.nonCertNum++;
        } else {
          this.docs.certNum++;
        }
      });
    }
  }

  getActCompletionTreshold() {
    return this.utilsService.getActCompletionTreshold(this.courseData.activities[this.activityId]);
  }

  getActCompletionPercentage() {
    let accObj = this.courseData.accesses[this.accessId];
    return this.utilsService.getActCompletionPercentage(accObj, accObj.idBestAttempt ? this.courseData.attempts[accObj.idBestAttempt] : null);
  }

  getActCompletionData(): CompletionData {
    let accObj = this.courseData.accesses[this.accessId];
    return this.utilsService.getActCompletionData(accObj, accObj.idBestAttempt ? this.courseData.attempts[accObj.idBestAttempt] : null, this.courseData.activities[this.activityId]);
  }

  toggleActivityExtraExpand() {
    if (this.courseData.extraData[this.activityId] == null) return;
    this.courseData.extraData[this.activityId].isExpanded = !this.courseData.extraData[this.activityId].isExpanded;
  }

  hasPlayableContent(): boolean {
    return this.utilsService.hasCorrectLaunchContent(this.courseData.activities[this.activityId]);
  }

  getActivityScore(): String {
    let evalType = this.attemptEvalType[this.courseData.attempts[this.courseData.accesses[this.accessId].idBestAttempt!].idCtEvaluationType!].name;
    if (!this.courseData.accesses[this.accessId].passed) {
      switch (evalType) {
        case 'PERCENT':
          return this.translate.instant('COURSES_TEST_NOT_PASSED_YET_PERCENT', {
            score: this.courseData.attempts[this.courseData.accesses[this.accessId].idBestAttempt!].score,
            passScore: this.courseData.attempts[this.courseData.accesses[this.accessId].idBestAttempt!].passScore,
          });

        case 'POINTS':
          return this.translate.instant('COURSES_TEST_NOT_PASSED_YET_POINTS', {
            score: this.courseData.attempts[this.courseData.accesses[this.accessId].idBestAttempt!].score,
            passScore: this.courseData.attempts[this.courseData.accesses[this.accessId].idBestAttempt!].passScore,
          });

        default:
          return this.translate.instant('COURSES_TEST_NOT_PASSED_YET_BOOLEAN');
      }
    } else {
      switch (evalType) {
        case 'PERCENT':
          return this.translate.instant('COURSES_TEST_PASSED_PERCENT', {
            score: this.courseData.attempts[this.courseData.accesses[this.accessId].idBestAttempt!].score,
            passScore: this.courseData.attempts[this.courseData.accesses[this.accessId].idBestAttempt!].passScore,
          });

        case 'POINTS':
          return this.translate.instant('COURSES_TEST_PASSED_POINTS', {
            score: this.courseData.attempts[this.courseData.accesses[this.accessId].idBestAttempt!].score,
            passScore: this.courseData.attempts[this.courseData.accesses[this.accessId].idBestAttempt!].passScore,
          });

        default:
          return '';
      }
    }
  }

  openResultLinkById() {
    const attemptExtId = this.courseData.attempts[this.courseData.accesses[this.accessId].idBestAttempt!].externalId;
    if (attemptExtId) {
      this.playActivityService.showItrivioResult(this.courseData.accesses[this.accessId].idActivityMt, attemptExtId);
    } else {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_NO_REPORT'));
      return;
    }
  }

  playCourse() {
    this.courseLaunched.emit({ activityId: this.activityId, runId: null });
  }

  openPageDetail(activityId: number, params?: ActDetailQueryParams) {
    this.router.navigate(['/portal/act-detail', activityId], params ? { queryParams: params } : {});
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
}

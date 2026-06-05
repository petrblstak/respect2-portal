import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ActivityItemData, CompletionData, CoreDataService, CourseData, LaunchType, PlayActivityService, UtilsService, appConstants } from 'cmp-portal-core';

import { ActDetailQueryParams, Tabs } from '../../act-detail/act-detail.component';
import { environment } from '../../../../environments/environment';

const CARD_HEADER_FOLDER = 'assets/img/courses/headers/';

@Component({
  selector: 'cmp-course-card-row',
  templateUrl: './course-card-row.component.html',
  styleUrls: ['./course-card-row.component.scss'],
  standalone: false,
})
export class CourseCardRowComponent implements OnInit {
  // Dependencies
  private readonly coreDataService = inject(CoreDataService);
  private readonly translate = inject(TranslateService);
  private readonly utilsService = inject(UtilsService);
  private readonly playActivityService = inject(PlayActivityService);
  private readonly router = inject(Router);

  @Input({ required: true }) rootItem!: ActivityItemData;
  @Input({ required: true }) courseData!: CourseData;
  @Input({ required: false }) isInDetail: boolean = false;
  @Input({ required: false }) isCatalog: boolean = false;
  @Output() courseLaunched = new EventEmitter<{ activityId: number; runId: number | null }>();

  // Component data and state
  get attemptEvalType() {
    return this.coreDataService.coreData.CODE_TABLES.CtEvaluationType.idKey;
  }
  environmentVars = environment;
  activityLaunchTypes = LaunchType;
  isSetAllowedPlay = environment.isPlaySetAllowed;
  clickedItemType = Tabs;
  isSmallScreen = false;

  docs = {
    nonCertNum: 0,
    certNum: 0,
  };

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    if (this.courseData.extraData[this.rootItem.activityId] && this.courseData.extraData[this.rootItem.activityId].docs) {
      this.courseData.extraData[this.rootItem.activityId].docs.forEach(docId => {
        if (!this.courseData.documents[docId].docTemplate) {
          this.docs.nonCertNum++;
        } else {
          this.docs.certNum++;
        }
      });
    }
  }

  checkScreenSize() {
    this.isSmallScreen = window.innerWidth < 768;
  }

  hasPlayableContent(activityId: number): boolean {
    if (!this.isTypeActivity(activityId)) return true;
    return this.utilsService.hasCorrectLaunchContent(this.courseData.activities[activityId]);
  }

  openPageDetail(rootItem: ActivityItemData, params?: ActDetailQueryParams) {
    if (environment.isLinksAsSpecialCards && this.isActivityLink()) {
      this.gotoLinkActivity();
      return;
    }
    this.router.navigate(['/portal/act-detail', rootItem.activityId], params ? { queryParams: params } : {});
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

  isActivityLink(): boolean {
    const currentAct = this.courseData.activities[this.rootItem.activityId];
    if (currentAct.launchType == LaunchType.URL && currentAct.launchUrl != null) return true;
    return false;
  }

  gotoLinkActivity() {
    const currentAct = this.courseData.activities[this.rootItem.activityId];
    if (currentAct.launchType == LaunchType.URL && currentAct.launchUrl != null) {
      const newWindow = window.open(currentAct.launchUrl, '_blank');
      if (newWindow == null || newWindow.closed || typeof newWindow.closed == 'undefined') {
        this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_URL_NO_POPUP'));
      }
    }
    return;
  }

  // isTypeRunAct(activityId: number): boolean {
  //   const currentAct = this.courseData.activities[activityId];
  //   if (currentAct.idCtActivitySchema === 1) return false;
  //   return true;
  // }

  // isActivityLink(): boolean {
  //   const currentAct = this.courseData.activities[this.rootItem.activityId];
  //   if (currentAct.launchType == LaunchType.URL && currentAct.launchUrl != null) return true;
  //   return false;
  // }

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

  // toggleActivityExtraExpand(activityId: number) {
  //   if (this.courseData.extraData[activityId] == null) return;
  //   this.courseData.extraData[activityId].isExpanded = !this.courseData.extraData[activityId].isExpanded;
  // }

  toggleModuleExpand(activityId: number) {
    if (this.courseData.activityData[activityId]) {
      this.courseData.activityData[activityId].isExpanded = !this.courseData.activityData[activityId].isExpanded;
      // if (this.courseData.activityData[accessId].isExpanded) {
      //   this.courseData.activityData[accessId].accToPlay = this.getAccessToPlay(accessId);
      // }
      this.saveExpandedMap();
    }
  }

  // gotoLinkActivity() {
  //   const currentAct = this.courseData.activities[this.rootItem.activityId];
  //   if (currentAct.launchType == LaunchType.URL && currentAct.launchUrl != null) {
  //     const newWindow = window.open(currentAct.launchUrl, '_blank');
  //     if (newWindow == null || newWindow.closed || typeof newWindow.closed == 'undefined') {
  //       this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_URL_NO_POPUP'));
  //     }
  //   }
  //   return;
  // }

  playCourse(event: { activityId: number; runId: number | null }) {
    this.courseLaunched.emit(event);
  }

  getChildLentghString(childArray: number[]) {
    if (childArray == null || childArray.length < 0) return null;
    if (childArray.length == 1) return childArray.length + ' ' + this.translate.instant('COURSES_PARTS_ONE');
    if (childArray.length > 1 && childArray.length < 5) return childArray.length + ' ' + this.translate.instant('COURSES_PARTS_TWO');
    return childArray.length + ' ' + this.translate.instant('COURSES_PARTS_FIVE');
  }

  getActCompletionTreshold() {
    return this.utilsService.getActCompletionTreshold(this.courseData.activities[this.rootItem.activityId]);
  }

  getActCompletionPercentage() {
    let accObj = this.courseData.accesses[this.rootItem.accessId];
    return this.utilsService.getActCompletionPercentage(accObj, accObj.idBestAttempt ? this.courseData.attempts[accObj.idBestAttempt] : null);
  }

  getActCompletionData(): CompletionData {
    let accObj = this.courseData.accesses[this.rootItem.accessId];
    return this.utilsService.getActCompletionData(accObj, accObj.idBestAttempt ? this.courseData.attempts[accObj.idBestAttempt] : null, this.courseData.activities[this.rootItem.activityId]);
  }

  openResultLinkById(accessId: number) {
    const attemptExtId = this.courseData.attempts[this.courseData.accesses[accessId].idBestAttempt!].externalId;
    if (attemptExtId) {
      this.playActivityService.showItrivioResult(this.courseData.accesses[accessId].idActivityMt, attemptExtId);
    } else {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_NO_REPORT'));
      return;
    }
  }

  private saveExpandedMap() {
    let expandedMap: { [key: number]: boolean } = {};
    for (let rootItem of this.courseData.topRootItems) {
      expandedMap[rootItem.activityId] = this.courseData.activityData[rootItem.activityId].isExpanded;
      // expandedMap[rootItem.activityId] = rootItem.isRegistered
      //   ? this.courseData.activityData[rootItem.accessId].isExpanded
      //   : this.courseData.catalogData[rootItem.activityId].isExpanded;
    }
    localStorage.setItem(appConstants.STORAGE.MODULES_EXPANDED_MAP, JSON.stringify(expandedMap));
  }
}

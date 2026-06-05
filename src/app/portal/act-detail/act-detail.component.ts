import { Component, inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import {
  Activity,
  ActivityAccess,
  ActivityItemData,
  appConstants,
  AuthService,
  CompletionData,
  CoreDataService,
  CourseData,
  CoursesService,
  LaunchType,
  Message,
  ModalButton,
  ModalsService,
  PlayActivityService,
  RequestControl,
  RequestState,
  Role,
  UserData,
  UserRatingItem,
  UtilsService,
} from 'cmp-portal-core';
import { RatingModalService } from './rating-modal/rating-modal.service';
import { environment } from '../../../environments/environment';

const CARD_HEADER_FOLDER = 'assets/img/courses/headers/';

export interface ActDetailQueryParams {
  tab: Tabs | null;
}
export interface ExtraDescParamDef {
  name: string;
  isMain: boolean;
}
export interface ExtraDescParam {
  translation: string;
  value?: any;
  type: string;
}

export enum Tabs {
  about = 'about',
  content = 'content',
  runs = 'runs',
  materials = 'materials',
  reviews = 'reviews',
}

@Component({
  selector: 'cmp-act-detail',
  templateUrl: './act-detail.component.html',
  styleUrl: './act-detail.component.scss',
  providers: [DatePipe],
  standalone: false,
})
export class ActDetailComponent implements OnInit, OnDestroy {
  // Dependencies
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly coreDataService = inject(CoreDataService);
  private readonly coursesService = inject(CoursesService);
  private readonly playActivityService = inject(PlayActivityService);
  private readonly utilsService = inject(UtilsService);
  private readonly zone = inject(NgZone);
  private readonly translate = inject(TranslateService);
  private readonly datePipe = inject(DatePipe);
  private readonly ratingModalService = inject(RatingModalService);
  private readonly modalsService = inject(ModalsService);

  // subscriptions
  private userSub!: Subscription;
  private playActivitySub!: Subscription;
  private actDetailDataSub!: Subscription;

  // Component data and state
  activityLaunchTypes = LaunchType;
  actId: number | null = null;
  activity: Activity | null = null;
  access: ActivityAccess | null = null;
  rootItem: ActivityItemData | null = null;
  isActPage = true;
  isCoursesLoading = true;
  isSignupRunning = false;
  isCoursePreparing = false;
  isMaterialsExpand = true;
  isCourseDataInit = false;
  isSetAllowedPlay = environment.isPlaySetAllowed;
  isActSignOffAllowed = false;
  cmpUser!: UserData;
  courseData!: CourseData;
  userRoles!: { [key: string]: Role };
  aggregatedRunStaff: { [key: number]: { [key: number]: number[] } } = {};
  tabs = {
    currentTab: Tabs.about,
    availableTabs: [] as Tabs[],
    allTabs: Object.values(Tabs),
    tabEnum: Tabs,
  };
  docs = {
    nonCertNum: 0,
    certNum: 0,
  };

  runControl = {
    runEnrolled: null as null | number,
    runsAvailable: null as null | number[],
  };

  dataRefreshTrigger = 0; // Trigger to force child components to refresh

  requestsControl!: RequestControl;
  reqStates: { [key: number]: RequestState } = {};

  ratingData = {
    isInitialized: false,
    ratingItems: [] as UserRatingItem[],
    users: {} as { [key: number]: string },
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as { [key: number]: number }, // Added for distribution bars
    totalDistributionCount: 0, // Added for distribution bars calculation
  };

  extraDescParamsDefs: ExtraDescParamDef[] = [
    { name: 'price', isMain: true },
    // { name: 'name', isMain: true },
    // { name: 'casovaDotace', isMain: false },
  ];
  extraDescParams: ExtraDescParam[] = [];
  optParams = {} as { [key: string]: { [key: number]: number } };

  expandedReviews: { [key: number]: boolean } = {}; // Added to track expanded state
  readonly REVIEW_TEXT_TRUNCATE_THRESHOLD = 150; // Approx chars for 3 lines

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      let pgId = params['id'];
      if (pgId) this.actId = parseInt(pgId);
      console.log('this.route.params.subscribe ', this.actId);
      if (!this.isCourseDataInit) this.coursesService.getUserActivityDetail(this.actId!, 'BOTH');
      this.setupPageForCurrentAct();
    });

    this.userSub = this.authService.userData.subscribe(userData => {
      this.cmpUser = userData;
    });

    this.playActivitySub = this.playActivityService.isActivityLaunching.subscribe(isPlaying => {
      this.isCoursePreparing = isPlaying;
    });

    this.actDetailDataSub = this.coursesService.actDetailUpdate.subscribe(resultData => {
      this.dataUpdated(resultData);
    });

    this.requestsControl = this.coreDataService.coreData.requestsControl;
    this.userRoles = this.coreDataService.coreData.ROLES;
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.playActivitySub.unsubscribe();
    this.actDetailDataSub.unsubscribe();
  }

  selectTab(tabName: Tabs) {
    this.tabs.currentTab = tabName;
    if (this.tabs.currentTab == Tabs.reviews) {
      this.loadReviewData();
    }
  }

  showRequestActivityModal(actId?: number, runId?: number) {
    if ((actId && !this.requestsControl.isReqestAccessAvailable) || (actId == null && !this.requestsControl.isRequestActivityAvailable)) {
      this.utilsService.showModalMessage(this.translate.instant('CATALOG_ACTIVITY_ASSIGNED_HEADER'), this.translate.instant('CATALOG_ACTIVITY_REQUEST_ERROR_CONFIG'));
      return;
    }

    this.modalsService.openRequestModal(actId ? this.courseData.activities[actId] : null, this.requestsControl).then(
      formData => {
        console.log('request-activity modal saved and closed. Modal data: ', actId, formData);

        this.coursesService.requestAccessToActivity(actId, formData, runId ? runId : undefined).subscribe(newMsgObj => {
          if (newMsgObj) {
            this.updateRequestStates(newMsgObj, actId);
            this.utilsService.showModalMessage(
              this.translate.instant('CATALOG_ACTIVITY_REQUEST_HEADER'),
              actId ? this.translate.instant('CATALOG_ACTIVITY_REQUEST_ACT_TEXT') : this.translate.instant('CATALOG_ACTIVITY_REQUEST_NEW_TEXT')
            );
          } else {
            this.utilsService.showModalMessage(this.translate.instant('CATALOG_ACTIVITY_REQUEST_HEADER'), this.translate.instant('CATALOG_ACTIVITY_REQUEST_ERROR'));
          }
        });
      },
      dismissMessage => {
        console.log('Form modal dismissed: ' + dismissMessage);
      }
    );
  }

  activityRequestWithdraw() {
    this.utilsService
      .showModalMessage(
        this.translate.instant('REQUESTS_WITHDRAW_CONFIRM_HEADER'),
        this.translate.instant('REQUESTS_WITHDRAW_CONFIRM_TEXT'),
        this.translate.instant('GENERAL_YES'),
        this.translate.instant('GENERAL_NO')
      )
      .then((closeMsg: string) => {
        if (closeMsg === 'OK') {
          this.coursesService.catalogRequestWithdraw(this.courseData.messages[this.actId!].id).subscribe(newMsgObj => {
            if (newMsgObj) {
              this.updateRequestStates(newMsgObj, this.actId!);
              this.utilsService.showModalMessage(this.translate.instant('CATALOG_ACTIVITY_REQUEST_HEADER'), this.translate.instant('CATALOG_ACTIVITY_REQUEST_WITHDRAW_CONFIRM'));
            } else {
              this.utilsService.showModalMessage(this.translate.instant('CATALOG_ACTIVITY_REQUEST_HEADER'), this.translate.instant('CATALOG_ACTIVITY_REQUEST_ERROR'));
            }
          });
        }
      });
  }

  updateRequestStates(msgObj: Message, actId?: number) {
    if (actId == null) return;
    this.reqStates[actId] = {
      isProcessed: appConstants.MESSAGE_STATE[msgObj.messageStateId] === 'OPENED',
      isWithdrawable: appConstants.MESSAGE_STATE[msgObj.messageStateId] === 'OPENED' && this.requestsControl.isReqestAccessWithdrawable,
      isRejected: appConstants.MESSAGE_STATE[msgObj.messageStateId] === 'WONT_FIX',
      isWithdrawn: appConstants.MESSAGE_STATE[msgObj.messageStateId] === 'WITHDREW',
      isCompleted: appConstants.MESSAGE_STATE[msgObj.messageStateId] === 'SOLVED',
    };
  }

  goBack() {
    if (this.isActPage) {
      this.router.navigate(['/portal/courses']);
    } else {
      this.router.navigate(['/portal/catalog']);
    }
  }

  upOneLevel() {
    if (this.actId && this.courseData.activityData[this.actId].parentActId) {
      this.router.navigate(['/portal/act-detail/' + this.courseData.activityData[this.actId].parentActId]);
    }
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
    return this.utilsService.getActCompletionData(accObj, accObj.idBestAttempt ? this.courseData.attempts[accObj.idBestAttempt] : null, this.courseData.activities[this.rootItem.activityId]);
  }

  getActHeaderImg() {
    if (this.rootItem == null) return null;
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

  enlistCourse(runId?: number) {
    if (this.rootItem == null) return;
    let modalMsg = this.translate.instant('CATALOG_ASSIGN_CONFIRM_BODY', {
      actName: this.courseData.activities[this.rootItem.activityId].localName,
    });
    if (runId != null) {
      let runStart = new Date(this.courseData.actRuns[runId].runStart);
      let runEnd = new Date(this.courseData.actRuns[runId].runEnd);
      modalMsg = this.translate.instant('CATALOG_ASSIGN_CONFIRM_BODY_WITH_RUN', {
        actName: this.courseData.activities[this.rootItem.activityId].localName,
        runName:
          this.datePipe.transform(runStart, 'd.M. yyyy HH:mm') +
          ' - ' +
          this.datePipe.transform(runEnd, 'd.M. yyyy HH:mm') +
          (this.courseData.actRuns[runId].name ? ' (' + this.courseData.actRuns[runId].name + ')' : ''),
      });
    }

    this.utilsService
      .showModalMessage(this.translate.instant('CATALOG_ASSIGN_CONFIRM_HEADER'), modalMsg, this.translate.instant('GENERAL_YES'), this.translate.instant('GENERAL_NO'))
      .then((closeMsg: string) => {
        if (closeMsg === 'OK') {
          this.isSignupRunning = true;
          this.coursesService.catalogSignUp(this.rootItem!.activityId, runId ? runId : null).subscribe(
            result => {
              console.log('signup result ', result);

              if (result != null) {
                this.utilsService.showModalMessage(null, this.translate.instant('CATALOG_SIGNUP_SUCCESS'));
                // reload the page to reflect signup
                this.isCourseDataInit = false;
                if (!this.isCourseDataInit) this.coursesService.getUserActivityDetail(this.actId!, 'BOTH');
              } else {
                this.utilsService.showAndLogError(this.translate.instant('CATALOG_SIGNUP_FAILED'));
              }
              this.isSignupRunning = false;
            },
            err => {
              let warnings = '';
              if (err.type === 'WARN_LIST' && err.warnings && err.warnings.length > 0) {
                warnings = err.warnings.map((w: string) => this.translate.instant(w)).join(',<br>');
              } else {
                warnings = this.translate.instant('CATALOG_SIGNUP_FAILED');
              }
              this.utilsService.showAndLogError(warnings);
              this.isSignupRunning = false;
            }
          );
        }
      });
  }

  playCourse(event: { activityId: number; runId: number | null }) {
    const actIdToPlay = this.utilsService.getAccessToPlay(event.activityId, this.courseData);
    if (actIdToPlay === -1) {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_NOT_PLAYABLE'));
      return;
    }
    if (actIdToPlay === -2) {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_COMPLEX_COURSE'));
      return;
    }
    if (actIdToPlay === 0) {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_ALREADY_COMPLETED'));
      return;
    }
    const launchedAct = this.courseData.activities[actIdToPlay];
    const accessToPlay = this.courseData.activityData[actIdToPlay].accessId;
    if (!this.utilsService.canPlayActivity(launchedAct, this.courseData.accesses[accessToPlay])) {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_PLAY_FORBIDDEN', { actName: launchedAct.name }));
      return;
    }

    // const lastCrsId = localStorage.getItem(appConstants.STORAGE.LAST_COURSE_PLAYED);
    // if (this.launchNextCourseId != null && lastCrsId != null && lastCrsId === launchedAct.id + '') {
    //   console.log('Detected looping course play id ' + lastCrsId + ' and terminated it.');
    //   localStorage.removeItem(appConstants.STORAGE.LAST_COURSE_PLAYED);
    //   this.launchNextCourseId = null;
    //   // TODO modal okno pro pripadne rozhodnuti opakovat?
    //   return;
    // }

    const startDate = new Date();
    switch (launchedAct.launchType) {
      case LaunchType.VIDEO:
        this.playActivityService.playVideoCourse(launchedAct).then(closeMessage => {
          this.finishModalPlayContent(closeMessage, startDate, accessToPlay, launchedAct);
        });
        break;
      case LaunchType.CODE:
        this.playActivityService.playCodeCourse(launchedAct).then(closeMessage => {
          this.finishModalPlayContent(closeMessage, startDate, accessToPlay, launchedAct);
        });
        break;
      case LaunchType.ITRIVIO:
        this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
        this.playActivityService.playItrivioCourse(launchedAct, accessToPlay);
        break;
      case LaunchType.FORM:
        this.playActivityService.playFormCourse(launchedAct, this.courseData.accesses[accessToPlay]).then(
          attemptObj => {
            if (attemptObj != null) {
              this.isCoursesLoading = true;
              this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
              this.coursesService.saveAttemptAndRefresh(attemptObj, this.activity!.id);
            }
          },
          dismissMessage => {
            console.log('Form modal dismissed: ' + dismissMessage);
          }
        );
        break;
      case LaunchType.SCORM:
        this.playActivityService.playScormCourse(launchedAct, this.courseData.accesses[accessToPlay], this.cmpUser!.user!, () => {
          this.isCoursesLoading = true;
          this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
          this.coursesService.getUserActivityDetail(this.actId!, 'BOTH');
        });
        break;
      case LaunchType.PDF:
        this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
        this.playActivityService.playPDFCourse(launchedAct, accessToPlay);
        break;
      case LaunchType.URL:
        const newWindow = this.playActivityService.playUrlCourse(launchedAct, accessToPlay);
        if (newWindow != null) {
          this.registerCourseWindow(newWindow, startDate, accessToPlay, launchedAct);
        }
        break;
      case LaunchType.FILE:
        this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
        this.playActivityService.playFileCourse(launchedAct);
        break;
      default:
        this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_PLAY_NOT_READY'));
    }
  }

  hasPlayableContent(): boolean {
    if (!this.activity) return false;
    if (!this.isTypeActivity(this.activity.id)) return true;
    return this.utilsService.hasCorrectLaunchContent(this.activity);
  }

  openResultLinkById() {
    if (this.rootItem?.accessId == null) return;
    const attemptExtId = this.courseData.attempts[this.courseData.accesses[this.rootItem?.accessId].idBestAttempt!].externalId;
    if (attemptExtId) {
      this.playActivityService.showItrivioResult(this.courseData.accesses[this.rootItem?.accessId].idActivityMt, attemptExtId);
    } else {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_NO_REPORT'));
      return;
    }
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

  toggleMaterialsExpand() {
    this.isMaterialsExpand = !this.isMaterialsExpand;
  }

  downloadDoc(docId: number, accessId: number) {
    const docObj = this.courseData.documents[docId];
    this.utilsService.downloadDoc(docObj, accessId);
  }

  signUpRun(runId: number) {
    if (this.rootItem == null) return;

    let runStart = new Date(this.courseData.actRuns[runId].runStart);
    let runEnd = new Date(this.courseData.actRuns[runId].runEnd);

    this.utilsService
      .showModalMessage(
        this.translate.instant('COURSE_DETAIL_SIGNUP_CONFIRM_HEADER'),
        this.translate.instant('COURSE_DETAIL_SIGNUP_CONFIRM_BODY', {
          runName:
            this.datePipe.transform(runStart, 'd.M. yyyy HH:mm') +
            ' - ' +
            this.datePipe.transform(runEnd, 'd.M. yyyy HH:mm') +
            (this.courseData.actRuns[runId].name ? ' (' + this.courseData.actRuns[runId].name + ')' : ''),
        }),
        this.translate.instant('GENERAL_YES'),
        this.translate.instant('GENERAL_NO')
      )
      .then((closeMsg: string) => {
        if (closeMsg === 'OK') {
          this.coursesService.activityRunUserUpdate(runId, this.rootItem!.accessId, true).subscribe(resultData => {
            if (resultData) {
              this.runControl.runEnrolled = runId;
              // this.runControl.actualRunObject = this.courseData.actRuns[runId];
              this.dataRefreshTrigger++; // Increment to trigger child component refresh
            }
          });
        }
      });
  }

  signOffRun(isOnlyActivitySignOff: boolean = false) {
    if (this.rootItem == null) return;

    let modalMsg = this.translate.instant('COURSE_DETAIL_SIGNOFF_CONFIRM_BODY');
    let yesBtn = this.translate.instant('COURSES_RUNS_SIGN_OFF');
    if (isOnlyActivitySignOff) {
      modalMsg = this.translate.instant('COURSE_DETAIL_ACTIVITY_SIGNOFF_CONFIRM_BODY');
      yesBtn = this.translate.instant('COURSE_SIGNOFF_BTN_FULL');
    }

    let extraBtns: ModalButton[] = [];
    // Check if course has parent access or if it has, the registration through parent is not mandatory (meaning user can sign off fully even if parent access exists)
    if (
      !isOnlyActivitySignOff &&
      (this.courseData.accesses[this.rootItem?.accessId].idParentAccess == null || !this.courseData.activities[this.actId!].parentRegistration) &&
      this.courseData.isCatalogOrigin
    ) {
      const fullSignoffBtn: ModalButton = {
        label: this.translate.instant('COURSE_SIGNOFF_BTN_FULL'),
        returnValue: 'SIGNOFF_COURSE',
      };
      extraBtns.push(fullSignoffBtn);
    }

    this.utilsService
      .showModalMessage(this.translate.instant('COURSE_DETAIL_SIGNOFF_CONFIRM_HEADER'), modalMsg, yesBtn, this.translate.instant('GENERAL_CANCEL'), extraBtns)
      .then((closeMsg: string) => {
        if (closeMsg === 'OK' || closeMsg === 'SIGNOFF_COURSE') {
          let isDeleteAccess = false;
          if (isOnlyActivitySignOff) {
            isDeleteAccess = true;
          } else {
            isDeleteAccess = closeMsg === 'SIGNOFF_COURSE' ? true : false;
          }
          this.coursesService.activityRunUserUpdate(null, this.rootItem!.accessId, false, isDeleteAccess).subscribe(resultData => {
            if (isDeleteAccess && resultData === 'ACCESS_DELETED') {
              // reload the page to reflect access removal
              this.isCourseDataInit = false;
              if (!this.isCourseDataInit) this.coursesService.getUserActivityDetail(this.actId!, 'BOTH');
              this.utilsService.showModalMessage(null, this.translate.instant('COURSE_SIGNOFF_FULL_SUCCESS_MESSAGE'));
            } else {
              if (resultData) {
                this.runControl.runEnrolled = null;
                this.dataRefreshTrigger++; // Increment to trigger child component refresh
                this.utilsService.showModalMessage(null, this.translate.instant('COURSE_SIGNOFF_THERM_SUCCESS_MESSAGE'));
              }
            }
          });
        }
      });
  }
  /**
   * Downloads all non-template documents in a zip file
   */
  downloadAllMaterials(isFutureDocs: boolean): void {
    if (isFutureDocs) {
      if (this.docs.nonCertNum === 0) {
        return;
      }

      const nonTemplateDocs = this.courseData.extraData[this.actId!].docs.filter(docId => {
        return !this.courseData.documents[docId].docTemplate;
      });

      if (nonTemplateDocs.length > 0) {
        this.utilsService.downloadDocMultiple(nonTemplateDocs, 'course-' + this.actId + '-all-material.zip');
      }
    } else {
      this.utilsService.downloadDocMultiple(this.courseData.extraData[this.actId!].docsFuture, 'course-' + this.actId + '-all-material.zip');
    }
  }

  /**
   * Opens the rating modal for the current activity
   */
  openRatingModal(): void {
    if (this.access == null || !this.access.passed || this.activity == null || this.activity.ratingPreset == null) return;
    this.ratingModalService.openRatingModal(this.access.id, this.activity, this.access.rating, this.access.ratingText).subscribe(
      (result: any) => {
        console.log('Rating submitted:', result);
        // Handle the rating submission
        if (result && result.rating) {
          this.ratingModalService.updateRating(this.access!.id, result.rating, result.ratingText).subscribe(response => {
            if (response) {
              // Show confirmation message
              this.utilsService.showModalMessage(this.translate.instant('RATING_MODAL_SUBMITTED_HEADER'), this.translate.instant('RATING_MODAL_SUBMITTED_TEXT'));
              this.isCoursesLoading = true;
              this.coursesService.getUserActivityDetail(this.actId!, 'BOTH');
            } else {
              // Handle error case
              this.utilsService.showAndLogError(this.translate.instant('RATING_MODAL_ERROR'));
            }
          });
        }
      },
      (dismissReason: any) => {
        console.log('Rating modal dismissed:', dismissReason);
      }
    );
  }

  /**
   * Toggles the expanded state of a review text.
   * @param index The index of the review in the ratingItems array.
   */
  toggleReview(index: number): void {
    this.expandedReviews[index] = !this.expandedReviews[index];
  }

  formatNumber(value: number | string): string {
    if (value === null || value === undefined) {
      return '';
    }
    // First format with the number pipe
    const numberPipe = new DecimalPipe('en-US');
    const formattedValue = numberPipe.transform(value);

    // Then replace commas with spaces or whatever character you need
    return formattedValue ? formattedValue.replace(/,/g, ' ') : '';
  }

  private dataUpdated(resultData: CourseData) {
    console.log('Data updated:', resultData);

    this.zone.run(() => {
      if (this.isSignupRunning) return;
      this.courseData = resultData;
      this.isActPage = this.courseData.isCatalogView ? false : true;

      Object.values(this.courseData.messages).forEach(msgObj => {
        this.updateRequestStates(msgObj, msgObj.idTargetActivityMt);
        if (msgObj.idTargetActivityMt == this.actId && msgObj.idTargetActivityRun) {
          this.courseData.activityData[this.actId].firstRunId = msgObj.idTargetActivityRun;
        }
      });
      this.aggregateRunStaffRoles();
      this.isCourseDataInit = true;
      this.setupPageForCurrentAct();
      this.isCoursesLoading = false;
      this.checkAndOpenRatingModal();
    });
  }

  private findAndTranslateParams() {
    let valueTypes = this.coreDataService.coreData.CODE_TABLES['CtParamValueType'].idKey;
    this.extraDescParamsDefs.forEach(paramObj => {
      if (paramObj.isMain) {
        let trString = paramObj.name;
        let paramDef = this.coreDataService.coreData.MAIN_PARAMS['Activity'][paramObj.name];
        if (paramDef) {
          let trJSON = JSON.parse(paramDef.humanReadable);
          if (trJSON[this.translate.getCurrentLang()]) {
            trString = trJSON[this.translate.getCurrentLang()];
          }
        }
        let val = this.activity![paramObj.name as keyof Activity];
        if (val != null && paramDef != null) {
          this.extraDescParams.push({
            translation: trString,
            value: val,
            type: valueTypes[paramDef.idCtParamValueType].name,
          });
        }
      } else {
        let subtypeId = this.activity!.idSubtype;
        let prObj = null as any;
        Object.keys(this.coreDataService.coreData.PARAMS['Activity'][subtypeId]).forEach((paramId: any) => {
          if (this.coreDataService.coreData.PARAMS['Activity'][subtypeId][paramId].name === paramObj.name) {
            prObj = this.coreDataService.coreData.PARAMS['Activity'][subtypeId][paramId];
          }
        });
        if (prObj == null) {
          console.error(`Optional parameter ${paramObj.name} not found in core data.`);
        } else {
          let paramDef = this.coreDataService.coreData.PARAMS['Activity'][subtypeId][prObj.id];
          if (this.activity!.params && this.activity!.params[prObj.id] != null) {
            let trString = paramObj.name;
            if (this.coreDataService.coreData.PARAMS['Activity'][subtypeId][prObj.id].humanReadable) {
              let trJSON = JSON.parse(this.coreDataService.coreData.PARAMS['Activity'][subtypeId][prObj.id].humanReadable);
              if (trJSON[this.translate.getCurrentLang()]) {
                trString = trJSON[this.translate.getCurrentLang()];
              }
            }
            let val = this.activity!.params[prObj.id];
            if (val != null && paramDef != null) {
              this.extraDescParams.push({
                translation: trString,
                value: val,
                type: valueTypes[paramDef.idCtParamValueType].name,
              });
            }
          }
        }
      }
    });
    console.log('extraDescParams', this.extraDescParams);
  }

  private setupPageForCurrentAct() {
    if (!this.isCourseDataInit) return;
    if (this.actId && this.courseData.activities[this.actId] && this.courseData.activityData[this.actId]) {
      this.activity = this.courseData.activities[this.actId];
      this.rootItem = this.courseData.activityData[this.actId];
      this.access = this.courseData.accesses[this.rootItem.accessId];

      this.runControl.runsAvailable = null;
      if (this.courseData.extraData[this.rootItem.activityId] && this.courseData.extraData[this.rootItem.activityId].runs) {
        this.runControl.runsAvailable = [];
        this.courseData.extraData[this.rootItem.activityId].runs.forEach(runId => {
          if (this.courseData.actRuns[runId] && this.courseData.actRuns[runId].isVisible) {
            this.runControl.runsAvailable!.push(runId);
          }
        });
      }
      if (!this.isActPage) {
        this.runControl.runEnrolled = null;
      } else {
        let runId = this.courseData.accesses[this.rootItem.accessId].idActivityRun;
        if (runId && this.courseData.actRuns[runId]) {
          if (this.courseData.actRuns[runId].stateCategory === 'future') {
            this.runControl.runEnrolled = runId;
          }
        }
        this.isActSignOffAllowed = false;
        if (this.rootItem.accessState!.category === 'future' || this.rootItem.accessState!.name === 'LAUNCH') {
          // Check if course has parent access or if it has, the registration through parent is not mandatory (meaning user can sign off fully even if parent access exists)
          if (this.courseData.isCatalogOrigin && (this.courseData.accesses[this.rootItem?.accessId].idParentAccess == null || !this.courseData.activities[this.actId!].parentRegistration))
            this.isActSignOffAllowed = true;
        }
      }

      if (this.courseData.extraData[this.actId] && this.courseData.extraData[this.actId].docs) {
        this.courseData.extraData[this.actId].docs.forEach(docId => {
          if (!this.courseData.documents[docId].docTemplate) {
            this.docs.nonCertNum++;
          } else {
            this.docs.certNum++;
          }
        });
      }
    } else {
      this.activity = null;
      this.rootItem = null;
    }
    this.findAndTranslateParams();
    this.setTabs();
  }

  private aggregateRunStaffRoles() {
    Object.keys(this.courseData.runStaff).forEach((runId: any) => {
      this.courseData.runStaff[runId].forEach(staffObj => {
        if (this.aggregatedRunStaff[runId] == null) this.aggregatedRunStaff[runId] = {};
        if (this.aggregatedRunStaff[runId][staffObj.idObjectRole] == null) this.aggregatedRunStaff[runId][staffObj.idObjectRole] = [];
        this.aggregatedRunStaff[runId][staffObj.idObjectRole].push(staffObj.idUserMt);
      });
    });
    console.log(this.aggregatedRunStaff);
  }

  private setTabs() {
    this.tabs.availableTabs = [];
    for (let tab of this.tabs.allTabs) {
      switch (tab) {
        case Tabs.about:
          if ((this.activity?.description == null || this.activity.description.length <= 0) && this.extraDescParams.length <= 0) {
            continue;
          }
          break;
        case Tabs.content:
          if (this.isTypeActivity(this.actId!) || this.courseData.children[this.actId!] == null) {
            continue;
          }
          break;
        case Tabs.runs:
          if (!this.rootItem!.isRunAct) {
            continue;
          }
          break;
        case Tabs.materials:
          if (this.courseData.extraData[this.actId!] == null || this.courseData.extraData[this.actId!].docs == null || this.courseData.extraData[this.actId!].docs.length <= 0) {
            continue;
          }
          break;
        case Tabs.reviews:
          if (this.activity == null || this.activity.ratingPreset == null) {
            continue;
          }
          break;
        default:
          break;
      }
      this.tabs.availableTabs.push(tab);
    }

    // Check for tab parameter in URL query parameters
    const tabParam = this.route.snapshot.queryParamMap.get('tab') as Tabs | null;
    if (tabParam && this.tabs.availableTabs.includes(tabParam)) {
      this.tabs.currentTab = tabParam;
    } else {
      // Set default tab based on activity type
      this.tabs.currentTab = Tabs.about;
      if (!this.isTypeActivity(this.actId!)) {
        this.tabs.currentTab = Tabs.content;
      }
      // If the selected tab is not available, use the first available tab
      if (this.tabs.availableTabs.length > 0 && !this.tabs.availableTabs.includes(this.tabs.currentTab)) {
        this.tabs.currentTab = this.tabs.availableTabs[0] as Tabs;
      }
    }
    if (this.tabs.currentTab == Tabs.reviews) {
      this.loadReviewData();
    }
  }

  private loadReviewData() {
    if (this.activity == null || this.activity.ratingPreset == null) return;

    this.ratingData.isInitialized = false; // Reset initialization flag
    this.expandedReviews = {}; // Reset expanded states when loading new data

    if (this.activity.ratingCount == null || this.activity.ratingCount <= 0) {
      this.ratingData.isInitialized = true;
      this.ratingData.ratingItems = [];
      this.ratingData.users = {};
      this.ratingData.distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      this.ratingData.totalDistributionCount = 0;
      return;
    }
    this.coursesService.getActivityReviews(this.activity.id).subscribe(data => {
      console.log('Rating data:', data);
      if (data != null) {
        this.ratingData.isInitialized = true;
        this.ratingData.ratingItems = data.ratingItems;
        this.ratingData.users = data.users;
        this.calculateRatingDistribution(); // Calculate distribution after data is loaded
      }
    });
  }

  // Added method to calculate rating distribution
  private calculateRatingDistribution() {
    this.ratingData.distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    this.ratingData.totalDistributionCount = this.ratingData.ratingItems.length;

    if (this.ratingData.totalDistributionCount === 0) return;

    this.ratingData.ratingItems.forEach(review => {
      if (review.ratingScore != null) {
        // Convert percentage rating to 1-5 star scale for distribution
        const starRating = Math.ceil(review.ratingScore / 2);
        if (starRating >= 5) {
          this.ratingData.distribution[5]++;
        } else if (starRating === 4) {
          this.ratingData.distribution[4]++;
        } else if (starRating === 3) {
          this.ratingData.distribution[3]++;
        } else if (starRating === 2) {
          this.ratingData.distribution[2]++;
        } else {
          // starRating is 1 or 0
          this.ratingData.distribution[1]++;
        }
      }
    });
  }

  // Helper method for distribution bar percentage
  getDistributionPercentage(stars: number): number {
    if (this.ratingData.totalDistributionCount === 0) {
      return 0;
    }
    return (this.ratingData.distribution[stars] / this.ratingData.totalDistributionCount) * 100;
  }

  private finishModalPlayContent(closeMessage: string, startDate: Date, accessToPlay: number, launchedAct: Activity) {
    if (closeMessage === 'OK') {
      this.isCoursesLoading = true;
      this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
      this.coursesService.createBooleanAttemptAndRefreshV2(startDate, accessToPlay, undefined, undefined, this.activity!.id);
    }
  }

  private registerCourseWindow(windowObject: Window, startDate: Date, accessToPlay: number, launchedAct: Activity) {
    var interval = window.setInterval(() => {
      if (windowObject == null || windowObject.closed) {
        window.clearInterval(interval);
        this.isCoursesLoading = true;
        this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
        this.coursesService.createBooleanAttemptAndRefreshV2(startDate, accessToPlay, undefined, undefined, this.activity!.id);
      }
    }, 1000);
  }

  private setRatingModalToLoad(accessObj: ActivityAccess, activityObj: Activity) {
    if (activityObj.ratingPreset && accessObj.rating == null && accessObj.ratingText == null) {
      let cData = {
        accId: accessObj.id,
        usrId: this.cmpUser.user!.id,
      };
      localStorage.setItem(appConstants.STORAGE.COMPETENT_REVIEW_OPEN, JSON.stringify(cData));
    }
  }

  private checkAndOpenRatingModal() {
    let revCookie = localStorage.getItem(appConstants.STORAGE.COMPETENT_REVIEW_OPEN);
    if (revCookie != null) {
      let cData = JSON.parse(revCookie);
      if (cData.usrId == this.cmpUser.user!.id && cData.accId == this.access?.id) {
        localStorage.removeItem(appConstants.STORAGE.COMPETENT_REVIEW_OPEN);
        if (this.access?.passed && this.access?.rating == null && this.access?.ratingText == null) {
          this.openRatingModal();
        }
      }
    }
  }
}

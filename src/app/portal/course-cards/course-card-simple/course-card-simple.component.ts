import { Component, Input, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ActivityItemData, CoreDataService, CourseData, LaunchType, UtilsService } from 'cmp-portal-core';
import { environment } from '../../../../environments/environment';

const CARD_HEADER_FOLDER = 'assets/img/courses/headers/';

@Component({
  selector: 'cmp-course-card-simple',
  templateUrl: './course-card-simple.component.html',
  styleUrls: ['./course-card-simple.component.scss'],
  standalone: false,
})
export class CourseCardSimpleComponent implements OnInit {
  // Dependencies
  private readonly coreDataService = inject(CoreDataService);
  private readonly router = inject(Router);
  private readonly utilsService = inject(UtilsService);
  private readonly translate = inject(TranslateService);

  @Input({ required: true }) rootItem!: ActivityItemData;
  @Input({ required: true }) courseData!: CourseData;
  @Input({ required: false }) isRequested: boolean = false;

  // Component data and state
  environmentVars = environment;
  activityLaunchTypes = LaunchType;
  get attemptEvalType() {
    return this.coreDataService.coreData.CODE_TABLES.CtEvaluationType.idKey;
  }

  ngOnInit(): void {}

  openPageDetail(rootItem: ActivityItemData) {
    if (environment.isLinksAsSpecialCards && this.isActivityLink()) {
      this.gotoLinkActivity();
      return;
    }
    this.router.navigate(['/portal/act-detail', rootItem.activityId]);
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
}

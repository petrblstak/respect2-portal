import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ActivityItemData, ActivityRun, CoreDataService, CourseData } from 'cmp-portal-core';
import { Tabs } from '../../act-detail/act-detail.component';

interface DataLineOptions {
  isShowType?: boolean;
  isShowTime?: boolean;
  isShowCompleteUntil?: boolean;
  isShowRun?: boolean;
  isShowNoRunText?: boolean;
  isShowRunTime?: boolean;
  isShowRunLocation?: boolean;
  isShowRunCapacity?: boolean;
  isShowRunStaff?: boolean;
  isShowDocs?: boolean;
  isShowFirstRun?: boolean;
  isHighlightBox?: boolean;
}

@Component({
  selector: 'cmp-act-data-line',
  templateUrl: './act-data-line.component.html',
  styleUrl: './act-data-line.component.scss',
  standalone: false,
})
export class ActDataLineComponent implements OnInit, OnChanges {
  // Dependencies
  private readonly translate = inject(TranslateService);
  private readonly coreDataService = inject(CoreDataService);

  @Input({ required: true }) courseData!: CourseData;
  @Input({ required: true }) rootItem!: ActivityItemData;
  @Input({ required: false }) options?: DataLineOptions;
  @Input({ required: false }) refreshTrigger?: number; // Trigger to force component refresh
  @Output() clickedItem = new EventEmitter<Tabs>();

  // Component data and state
  runObj: ActivityRun | null = null;
  visualType = 0;
  clickedItemType = Tabs;
  courseTime: string | null = null;
  aggregatedRunStaff: { [key: number]: string[] } = {};
  runStaff: string | null = null;

  ngOnInit(): void {
    this.checkOptions();
    this.updateComponentData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only react to refreshTrigger changes - this gives us explicit control over when to refresh
    if (changes['refreshTrigger']) {
      this.updateComponentData();
    }
  }

  private updateComponentData(): void {
    // Reset data
    this.runObj = null;
    this.visualType = 0;
    this.aggregatedRunStaff = {};
    this.runStaff = null;
    this.courseTime = null;

    if (this.rootItem.accessId) {
      let runId = this.courseData.accesses[this.rootItem.accessId].idActivityRun;
      this.runObj = runId ? this.courseData.actRuns[runId] : null;
    } else if (this.options?.isShowFirstRun) {
      this.runObj = this.rootItem.firstRunId ? this.courseData.actRuns[this.rootItem.firstRunId] : null;
    }

    if (this.runObj) {
      let startYear = this.runObj.runStart.slice(0, 4);
      let endYear = this.runObj.runEnd.slice(0, 4);

      let startDM = this.runObj.runStart.slice(5, 10);
      let endDM = this.runObj.runEnd.slice(5, 10);

      if (startYear !== endYear) {
        this.visualType = 2;
      } else if (startDM !== endDM) {
        this.visualType = 1;
      }

      if (this.courseData.runStaff[this.runObj.id]) {
        this.courseData.runStaff[this.runObj.id].forEach(staffObj => {
          if (this.aggregatedRunStaff[staffObj.idObjectRole] == null) {
            this.aggregatedRunStaff[staffObj.idObjectRole] = [];
          }
          let userName = '';
          if (this.courseData.users[staffObj.idUserMt].firstName && this.courseData.users[staffObj.idUserMt].lastName) {
            userName = this.courseData.users[staffObj.idUserMt].firstName + ' ' + this.courseData.users[staffObj.idUserMt].lastName;
          } else {
            userName = this.courseData.users[staffObj.idUserMt].email;
          }
          this.aggregatedRunStaff[staffObj.idObjectRole].push(userName);
        });
        let userRoles = this.coreDataService.coreData.ROLES;
        this.runStaff = '';
        Object.keys(this.aggregatedRunStaff).forEach((roleId: any) => {
          this.runStaff +=
            '<div><strong>' + (userRoles[roleId]?.localName || this.translate.instant('COURSES_ACT_DATA_LINE_UNKNOWN_ROLE')) + '</strong>: ' + this.aggregatedRunStaff[roleId].join(', ') + '</div>';
        });
      }
    }

    if (this.courseData.activities[this.rootItem.activityId]?.timeDemand) {
      this.courseTime = this.getCourseTime();
    }
  }

  onClickItem(type: Tabs): void {
    this.clickedItem.emit(type);
  }

  private checkOptions() {
    this.options = {
      isShowType: this.options?.isShowType ?? true,
      isShowTime: this.options?.isShowTime ?? true,
      isShowCompleteUntil: this.options?.isShowCompleteUntil ?? true,
      isShowRun: this.options?.isShowRun ?? true,
      isShowNoRunText: this.options?.isShowNoRunText ?? true,
      isShowRunTime: this.options?.isShowRunTime ?? true,
      isShowRunLocation: this.options?.isShowRunLocation ?? true,
      isShowRunCapacity: this.options?.isShowRunCapacity ?? true,
      isShowRunStaff: this.options?.isShowRunStaff ?? true,
      isShowDocs: this.options?.isShowDocs ?? true,
      isShowFirstRun: this.options?.isShowFirstRun ?? false,
      isHighlightBox: this.options?.isHighlightBox ?? false,
    };
  }

  private getCourseTime(): string | null {
    let time = this.courseData.activities[this.rootItem.activityId]?.timeDemand;
    if (time == null) return null;
    let days = Math.floor(time / 1440);
    time = time % 1440;
    let hours = Math.floor(time / 60);
    let mins = time % 60;
    let finalString = '';

    if (days) {
      finalString += days;
      if (hours || mins) {
        finalString += ' ' + this.translate.instant('COURSES_TIME_DAYS');
      } else {
        finalString += ' ' + this.translate.instant('COURSES_TIME_DAYS_' + (days === 1 ? '1' : days < 5 ? '2' : '5'));
      }
    }

    if (hours) {
      if (days) {
        finalString += ' ';
      }
      finalString += hours;
      if (days || mins) {
        finalString += ' ' + this.translate.instant('COURSES_TIME_HOURS');
      } else {
        finalString += ' ' + this.translate.instant('COURSES_TIME_HOURS_' + (hours === 1 ? '1' : hours < 5 ? '2' : '5'));
      }
    }

    if (mins) {
      if (days || hours) {
        finalString += ' ' + mins + ' ' + this.translate.instant('COURSES_TIME_MINUTES');
      } else {
        finalString += mins;
        finalString += ' ' + this.translate.instant('COURSES_TIME_MINUTES_' + (mins === 1 ? '1' : mins < 5 ? '2' : '5'));
      }
    }

    return finalString;
  }
}

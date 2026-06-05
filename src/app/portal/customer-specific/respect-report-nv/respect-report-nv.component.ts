import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Subscription } from 'rxjs';

import { Activity, ActivityAccess, appConstants, AuthService, CoreDataService, DataService, TableQuery, UserData, UtilsService } from 'cmp-portal-core';

const USER_OPT_PARAM = 'kvalifMinHistory';
const NV_FOLDER_ID = 32;

interface ReportData {
  years: number[];
  yearSums: {
    [key: number]: number;
  };
  yearCount: {
    [key: number]: number;
  };
  actData: ActData[];
  allCount: number;
}

interface ActData {
  year: number;
  date: Date | null;
  actName: string;
  time: string;
}

@Component({
  selector: 'cmp-respect-report-nv',
  templateUrl: './respect-report-nv.component.html',
  styleUrl: './respect-report-nv.component.scss',
  standalone: false,
})
export class RespectReportNvComponent implements OnInit, OnDestroy {
  private userSub!: Subscription;
  cmpUser!: UserData;
  isDataLoaded = false;
  dataError: string[] = [];
  optParams = {
    user: {} as { [key: number]: number },
    act: {} as { [key: number]: number },
  };
  currentYear: number | null = null;
  currentSum: string = '0 min';
  reportData: ReportData = {
    years: [],
    yearSums: {},
    yearCount: {},
    actData: [],
    allCount: 0,
  };

  constructor(
    private authService: AuthService,
    private coreDataService: CoreDataService,
    private translate: TranslateService,
    private dataService: DataService,
    private utilsService: UtilsService
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.userData.subscribe(userData => {
      this.cmpUser = userData;
      this.dataError = [];
      if (userData.user != null) {
        this.findOptionalParams();
        if (this.dataError.length === 0) {
          this.loadUserNVData();
        }
      } else {
        this.dataError.push(this.translate.instant('RESULTS_NV_ERROR_NO_USER'));
      }
    });
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
  }

  selectYear(year: number | null) {
    if (year == null) {
      this.currentYear = null;
      let minutes = 0;
      this.reportData.years.forEach(year => {
        if (this.reportData.yearSums[year]) {
          minutes += this.reportData.yearSums[year];
        }
      });
      this.currentSum = this.minutesToString(minutes);
      return;
    }

    if (this.currentYear === year) return;

    if (this.reportData.yearSums[year]) {
      this.currentSum = this.minutesToString(this.reportData.yearSums[year]);
    } else {
      this.currentSum = '0 min';
    }

    this.currentYear = year;
  }

  private minutesToString(min: number) {
    let hours = Math.floor(min / 60);
    let minutes = min % 60;
    let result = null;
    if (hours > 0) {
      result = hours + ' h ';
    }
    if (minutes > 0) {
      result = (result ? result : '') + minutes + ' min';
    }
    return result ? result : '0 min';
  }

  private findOptionalParams() {
    let usrParamFound = false;
    Object.keys(this.coreDataService.coreData.PARAMS['User']).forEach((subtypeId: any) => {
      Object.keys(this.coreDataService.coreData.PARAMS['User'][subtypeId]).forEach((paramId: any) => {
        if (this.coreDataService.coreData.PARAMS['User'][subtypeId][paramId].name === USER_OPT_PARAM) {
          this.optParams.user[subtypeId] = this.coreDataService.coreData.PARAMS['User'][subtypeId][paramId].id;
          usrParamFound = true;
        }
      });
    });
    if (!usrParamFound) {
      this.dataError.push(this.translate.instant('RESULTS_NV_ERROR_NO_USER_PARAM', { usrParam: USER_OPT_PARAM }));
    }
    console.log('optParams', this.optParams);
  }

  private loadUserNVData() {
    this.isDataLoaded = false;
    let usrParamId = this.cmpUser.user!.idSubtype ? this.optParams.user[this.cmpUser.user!.idSubtype] : null;
    if (usrParamId != null && this.cmpUser.user!.params != null && this.cmpUser.user!.params[usrParamId] != null) {
      console.log('load data', this.cmpUser.user!.params[usrParamId]);
      let yearsObj = JSON.parse(this.cmpUser.user!.params[usrParamId]);
      console.log('yearsObj', yearsObj);
      if (yearsObj != null && typeof yearsObj === 'object' && Object.keys(yearsObj).length > 0) {
        this.reportData.years = [];
        this.reportData.yearSums = {};
        this.reportData.yearCount = {};

        Object.keys(yearsObj).forEach(year => {
          let yearInt = parseInt(year, 10);
          if (yearInt >= 2024) {
            this.reportData.years.push(yearInt);
            this.reportData.yearSums[yearInt] = yearsObj[year];
            this.reportData.yearCount[yearInt] = 0;
          }
        });

        this.reportData.years.sort((a, b) => a - b);
        console.log('Final reportData', this.reportData);
        this.selectYear(null);
        this.loadReportData();
      } else {
        this.dataError.push(this.translate.instant('RESULTS_NV_ERROR_NO_USR_PARAM_DATA', { usrParam: USER_OPT_PARAM }));
      }
    } else {
      this.dataError.push(this.translate.instant('RESULTS_NV_ERROR_NO_USR_PARAM_DATA', { usrParam: USER_OPT_PARAM }));
    }
  }

  private loadReportData() {
    const params1 = {
      queries: {
        activityAccess: {
          tableName: 'UserActivityAccess',
          queryExpression: {
            operatorType: 'AND',
            expressionType: 'LogicOperator',
            expA: {
              name: 'idUserMt',
              criteriaType: 'EQ',
              criteriaValue: this.authService.userData.value.user!.id,
              expressionType: 'SingleCriteria',
            },
            expB: {
              name: 'passed',
              criteriaType: 'EQ',
              criteriaValue: true,
              expressionType: 'SingleCriteria',
            },
          },
          referenceFields: ['idBestAttempt'],
        },
      },
    };

    let accessesSub = this.dataService.cmpPostCall<TableQuery>(appConstants.SERVICES.QUERY_DATA_MODEL, params1);
    let activitiesSub = this.dataService.loadFolderActivities(NV_FOLDER_ID, true);

    forkJoin({ accessData: accessesSub, activitiesData: activitiesSub }).subscribe((accAndActsData: { accessData: TableQuery; activitiesData: { [key: number]: Activity } }) => {
      console.log('loadReportData', accAndActsData);
      this.reportData.actData = [];

      // save the attempts
      if (accAndActsData.accessData.QUERY_RESULT.hasOwnProperty('activityAccess')) {
        this.reportData.allCount = 0;
        for (const key in accAndActsData.accessData.QUERY_RESULT['activityAccess']) {
          let accObj = <ActivityAccess>accAndActsData.accessData.QUERY_RESULT['activityAccess'][key].entity;
          let actObj = accAndActsData.activitiesData[accObj.idActivityMt];

          if (actObj) {
            let passDate = accObj.passedDate ? new Date(accObj.passedDate) : null;
            let time = 0;
            if (accObj.totalTime != null && accObj.totalTime > 0) {
              time = accObj.totalTime;
            } else if (accObj.idBestAttempt && accAndActsData.accessData.QUERY_RESOURCES['UserActivityAttempt'][accObj.idBestAttempt]) {
              time = accAndActsData.accessData.QUERY_RESOURCES['UserActivityAttempt'][accObj.idBestAttempt].spentTime;
            }
            let newActItem = {
              year: passDate ? passDate.getFullYear() : null,
              date: passDate,
              actName: actObj.localName,
              time: this.minutesToString(Math.floor(time / 60) + 1), // convert seconds to minutes
            } as ActData;
            if (newActItem.year && newActItem.year >= 2024) {
              this.reportData.yearCount[newActItem.year]++;
            }
            this.reportData.allCount++;
            this.reportData.actData.push(newActItem);
          }
        }
      }
      this.reportData.actData.sort(this.compareActData.bind(this));
      console.log('this.reportData', this.reportData);
      this.isDataLoaded = true;
    });
  }

  private compareActData(a: ActData, b: ActData) {
    var diff = a.actName.localeCompare(b.actName, this.translate.currentLang, {
      sensitivity: 'accent',
    });
    if (diff < 0) return -1;
    if (diff > 0) return 1;
    return 0;
  }
}

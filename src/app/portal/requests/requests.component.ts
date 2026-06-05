import { Component, OnInit, inject } from '@angular/core';
import { Activity, ActivityAccess, ActivityRun, appConstants, CoreDataService, Message, RequestControl, RequestsService, UtilsService } from 'cmp-portal-core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'cmp-requests',
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.scss',
  standalone: false,
})
export class RequestsComponent implements OnInit {
  // Dependencies
  private readonly coreDataService = inject(CoreDataService);
  private readonly requestsService = inject(RequestsService);
  private readonly utilsService = inject(UtilsService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  requestsData = {
    messages: [] as Message[],
    activities: {} as { [key: number]: Activity },
    runs: {} as { [key: number]: ActivityRun },
    accesses: {} as { [key: number]: ActivityAccess },
  };
  requestsControl!: RequestControl;
  messageStates = appConstants.MESSAGE_STATE;
  msgWithdrawable = {} as { [key: number]: boolean };

  ngOnInit(): void {
    this.requestsService.getAllUserRequests().subscribe(requests => {
      if (requests) {
        this.requestsData.messages = requests.DATA;
        this.requestsData.activities = requests.ACTIVITIES;
        this.requestsData.runs = requests.RUNS;
        if (requests.ACCESSES && requests.ACCESSES.length > 0) {
          requests.ACCESSES.forEach(accObj => {
            this.requestsData.accesses[accObj.idActivityMt] = accObj;
          });
        }
        this.requestsData.messages.sort(this.sortMessages.bind(this));
        this.setMsgWithdrawable();
      }
      console.log('requestsData', this.requestsData);
    });

    this.requestsControl = this.coreDataService.coreData.requestsControl;
  }

  withdrawRequest(msgId: number, index: number) {
    this.utilsService
      .showModalMessage(
        this.translate.instant('REQUESTS_WITHDRAW_CONFIRM_HEADER'),
        this.translate.instant('REQUESTS_WITHDRAW_CONFIRM_TEXT'),
        this.translate.instant('GENERAL_YES'),
        this.translate.instant('GENERAL_NO')
      )
      .then((closeMsg: string) => {
        if (closeMsg === 'OK') {
          this.requestsService.generalRequestWithdraw(msgId).subscribe(response => {
            if (response) {
              this.requestsData.messages[index] = response;
              this.msgWithdrawable[msgId] = false;
            }
          });
        }
      });
  }

  openActivity(index: number) {
    const actMsg = this.requestsData.messages[index];
    if (actMsg.idTargetActivityMt == null) return;
    this.router.navigate(['/portal/act-detail/' + actMsg.idTargetActivityMt]);
  }

  private setMsgWithdrawable() {
    this.requestsData.messages.forEach(msg => {
      let allow = false;
      if (appConstants.MESSAGE_TYPE[msg.messageTypeId] === 'REQ_ACCESS' && this.requestsControl.isReqestAccessWithdrawable && appConstants.MESSAGE_STATE[msg.messageStateId] === 'OPENED') {
        allow = true;
      }
      if (appConstants.MESSAGE_TYPE[msg.messageTypeId] === 'REQ_ACT_CREATION' && this.requestsControl.isRequestActivityWithdrawable && appConstants.MESSAGE_STATE[msg.messageStateId] === 'OPENED') {
        allow = true;
      }
      this.msgWithdrawable[msg.id] = allow;
    });
  }

  private sortMessages(itemA: Message, itemB: Message): number {
    let dateA = itemA.created;
    let dateB = itemB.created;
    if (dateA == null && dateB == null) return 0;
    if (dateA == null) return -1;
    if (dateB == null) return 1;
    if (dateA < dateB) return 1;
    if (dateA > dateB) return -1;
    return 0;
  }
}

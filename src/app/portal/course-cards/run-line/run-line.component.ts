import { Component, Input, OnInit } from '@angular/core';
import { ActivityRun } from 'cmp-portal-core';

@Component({
    selector: 'cmp-run-line',
    templateUrl: './run-line.component.html',
    styleUrl: './run-line.component.scss',
    standalone: false
})
export class RunLineComponent implements OnInit {
  @Input({ required: true }) runObj!: ActivityRun;
  @Input({ required: false }) place: null | string = null;
  @Input({ required: false }) icon: null | 'drop' | 'check' = null;
  @Input({ required: false }) isDisabled: boolean = false;

  visualType = 0;

  ngOnInit(): void {
    // "2024-06-20T15:00:00.000Z"
    let startYear = this.runObj.runStart.slice(0, 4);
    let endYear = this.runObj.runEnd.slice(0, 4);

    let startDM = this.runObj.runStart.slice(5, 10);
    let endDM = this.runObj.runEnd.slice(5, 10);

    if (startYear !== endYear) {
      this.visualType = 2;
    } else if (startDM !== endDM) {
      this.visualType = 1;
    }
  }
}

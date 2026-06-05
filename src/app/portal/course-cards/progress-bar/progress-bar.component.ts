import { Component, Input, OnInit } from '@angular/core';
import { CompletionData } from 'cmp-portal-core';

@Component({
    selector: 'cmp-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrl: './progress-bar.component.scss',
    standalone: false
})
export class ProgressBarComponent implements OnInit {
  @Input({ required: true }) treshold!: number;
  @Input({ required: true }) completion!: number;
  @Input({ required: true }) completionData!: CompletionData;
  @Input({ required: false }) isInDetail: boolean = false;
  isSmallScreen = false;

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  checkScreenSize() {
    this.isSmallScreen = window.innerWidth < 768;
  }
}

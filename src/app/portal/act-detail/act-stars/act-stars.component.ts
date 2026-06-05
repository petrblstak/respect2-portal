
import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'cmp-act-stars',
    imports: [],
    templateUrl: './act-stars.component.html',
    styleUrl: './act-stars.component.scss'
})
export class ActStarsComponent implements OnInit {
  @Input({ required: true }) rating!: number;
  starArray: number[] = [0, 0, 0, 0, 0];

  ngOnInit(): void {
    for (let i = 0; i < 5; i++) {
      let low = i * 20;
      let high = (i + 1) * 20;
      if (this.rating >= high) {
        this.starArray[i] = 1;
      } else if (this.rating > low && this.rating < high) {
        this.starArray[i] = 0.5;
      } else {
        this.starArray[i] = 0;
      }
    }
  }
}

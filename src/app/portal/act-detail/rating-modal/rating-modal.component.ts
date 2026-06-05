import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { InlineSVGModule } from 'ng-inline-svg-2';

import { Activity, appConstants, AuthService, CoreDataService, RatingPreset, UserData } from 'cmp-portal-core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'cmp-rating-modal',
  imports: [FormsModule, TranslateModule, InlineSVGModule],
  templateUrl: './rating-modal.component.html',
  styleUrl: './rating-modal.component.scss',
})
export class RatingModalComponent implements OnInit, OnDestroy {
  public readonly activeModal = inject(NgbActiveModal);
  private readonly coreDataService = inject(CoreDataService);
  private readonly translate = inject(TranslateService);
  private readonly authService = inject(AuthService);

  @Input() prevRating: number | null = null;
  @Input() prevRatingText: string | null = null;
  @Input() activityObj!: Activity;
  @Input() accessId!: number;

  userRating: number = 0;
  userRatingText: string = '';
  ratingSettings!: RatingPreset;
  ratingQuestion: string = '';
  starArray: number[] = [0, 0, 0, 0, 0];
  userData!: UserData;
  userSub!: Subscription;
  errors: string | null = null;

  ngOnInit(): void {
    if (this.activityObj.ratingPreset == null) {
      console.error('Rating settings are null or undefined');
      return;
    } else {
      this.ratingSettings = JSON.parse(this.activityObj.ratingPreset);
    }
    this.userSub = this.authService.userData.subscribe(userData => {
      this.userData = userData;
      if (this.userData.user && this.ratingSettings.mandatory) {
        let revCookie = localStorage.getItem(appConstants.STORAGE.COMPETENT_REVIEW_OPEN);
        if (revCookie == null) {
          let cData = {
            accId: this.accessId,
            usrId: this.userData.user.id,
          };
          localStorage.setItem(appConstants.STORAGE.COMPETENT_REVIEW_OPEN, JSON.stringify(cData));
        }
      }
    });

    // set rating question, but first check if it is in multilanguage format
    let ratingQ: string | null = this.coreDataService.coreData.ENVIRONMENT_CONFIG.CLIENT_CONFIG == null ? null : this.coreDataService.coreData.ENVIRONMENT_CONFIG.CLIENT_CONFIG.default_review_question;
    if (this.ratingSettings.ratingQuestion != null && this.ratingSettings.ratingQuestion.length > 0) {
      ratingQ = this.ratingSettings.ratingQuestion;
    }
    console.log('Rating question1:', ratingQ);
    let innerRatingQ = null;
    if (ratingQ != null && ratingQ.length > 0) {
      let names = ratingQ.split('|');
      console.log('Rating question2:', names);
      if (names.length <= 1) {
        innerRatingQ = names[0];
      } else if (this.coreDataService.localLangNameIndex >= names.length) {
        innerRatingQ = names[0];
      } else {
        innerRatingQ = names[this.coreDataService.localLangNameIndex];
      }
    }
    if (innerRatingQ == null) {
      this.ratingQuestion = this.translate.instant('RATING_MODAL_QUESTION');
    } else {
      this.ratingQuestion = innerRatingQ;
    }
    console.log('Rating question2:', this.ratingQuestion);

    // Initialize with default values if needed
    this.userRatingText = this.prevRatingText || '';
    this.userRating = this.prevRating || 0;
    this.setRatingTemp(this.userRating);
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
  }

  /**
   * Set rating value (0-10)
   */
  setRating(rating: number): void {
    this.userRating = rating;
  }

  /**
   * Submit the rating
   */
  submitRating(): void {
    this.errors = null;
    if (this.ratingSettings.numberRating && this.ratingSettings.textRating) {
      if (this.userRating == 0) {
        this.errors = this.translate.instant('RATING_MODAL_RATE_STARS_ERROR');
      }
    } else {
      if (this.ratingSettings.numberRating && this.userRating == 0) {
        this.errors = this.translate.instant('RATING_MODAL_RATE_STARS_ERROR');
      }
      if (this.ratingSettings.textRating && (this.userRatingText == null || this.userRatingText.trim() == '')) {
        if (this.errors != null) this.errors += '<br>';
        this.errors += this.translate.instant('RATING_MODAL_RATE_TEXT_ERROR');
      }
    }

    if (this.errors != null) return;
    localStorage.removeItem(appConstants.STORAGE.COMPETENT_REVIEW_OPEN);
    // Create rating payload
    const ratingData = {
      rating: this.userRating,
      ratingText: this.userRatingText,
    };

    // Close modal and return data
    this.activeModal.close(ratingData);
  }

  /**
   * Cancel the rating
   */
  cancel(): void {
    this.activeModal.dismiss('cancel');
  }

  setRatingTemp(rating: number): void {
    for (let i = 0; i < 5; i++) {
      let high = (i + 1) * 2;
      if (rating >= high) {
        this.starArray[i] = 1;
      } else {
        this.starArray[i] = 0;
      }
    }
  }
}

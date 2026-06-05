import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of } from 'rxjs';

import { RatingModalComponent } from './rating-modal.component';
import { Activity, appConstants, DataService, GeneralServerResponse, RatingPreset } from 'cmp-portal-core';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RatingModalService {
  private readonly modalService = inject(NgbModal);
  private readonly dataService = inject(DataService);

  /**
   * Open the rating modal for a specific activity
   * @param activityId The ID of the activity to rate
   * @returns Observable that resolves with the rating data or rejects if canceled
   */

  openRatingModal(uaaId: number, activityObj: Activity, prevRating: number | null, prevRatingText: string | null): Observable<any> {
    if (activityObj.ratingPreset == null) {
      console.error('Rating settings are null or undefined');
      return of(false);
    }
    const modalRef = this.modalService.open(RatingModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'md',
    });

    // Pass input data to the modal component
    modalRef.componentInstance.prevRating = prevRating;
    modalRef.componentInstance.prevRatingText = prevRatingText;
    modalRef.componentInstance.accessId = uaaId;
    modalRef.componentInstance.activityObj = activityObj;

    // Return result as observable
    return new Observable(observer => {
      modalRef.result.then(
        result => {
          observer.next(result);
          observer.complete();
        },
        reason => {
          observer.error(reason);
          observer.complete();
        }
      );
    });
  }

  updateRating(uaaId: number, rating: number | null, ratingText: string | null): Observable<boolean> {
    const params = {
      uaaId: uaaId,
      rating: rating,
      ratingText: ratingText,
    };
    return this.dataService.cmpPostCall<GeneralServerResponse>(appConstants.SERVICES.UPDATE_UAA_RATING, params).pipe(
      map(data => {
        if (data.RESULT_OK === true) {
          return true;
        } else {
          return false;
        }
      })
    );
  }
}

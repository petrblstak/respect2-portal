import { Component, OnInit, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'hb-reg-warning-modal',
  templateUrl: './reg-warning-modal.component.html',
  standalone: false,
})
export class RegWarningModalComponent implements OnInit {
  // Dependencies
  public readonly activeModal = inject(NgbActiveModal);

  ngOnInit() {}
}

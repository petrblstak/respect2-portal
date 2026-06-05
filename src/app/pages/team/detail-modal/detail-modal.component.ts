import { Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'hb-about-modal',
  templateUrl: './detail-modal.component.html',
  styleUrls: ['./detail-modal.component.scss'],
  standalone: false,
})
export class AboutModalComponent {
  public readonly activeModal = inject(NgbActiveModal);
  @Input() name = '';
  @Input() lang = '';
}

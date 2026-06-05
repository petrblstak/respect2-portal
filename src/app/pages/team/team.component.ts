import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AboutModalComponent } from './detail-modal/detail-modal.component';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
  standalone: false,
})
export class TeamComponent implements OnInit, OnDestroy {
  private readonly modalService = inject(NgbModal);
  private readonly translate = inject(TranslateService);

  private langSub!: Subscription;

  currentLang!: string;

  ngOnInit(): void {
    this.currentLang = this.translate.getCurrentLang();
    this.langSub = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.currentLang = event.lang;
    });
  }

  showDetailModal(name: string) {
    const modalRef = this.modalService.open(AboutModalComponent, {
      size: 'xl',
      backdrop: 'static',
      scrollable: true,
    });
    modalRef.componentInstance.name = name;
    modalRef.componentInstance.lang = this.currentLang;
  }

  ngOnDestroy() {
    this.langSub.unsubscribe();
  }
}

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  standalone: false,
})
export class ContactComponent implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);

  private langSub!: Subscription;

  currentLang!: string;

  ngOnInit(): void {
    this.currentLang = this.translate.getCurrentLang();
    this.langSub = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.currentLang = event.lang;
    });
  }

  ngOnDestroy() {
    this.langSub.unsubscribe();
  }
}

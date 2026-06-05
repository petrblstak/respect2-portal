import { Component, OnInit, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false,
})
export class FooterComponent implements OnInit {
  private readonly translate = inject(TranslateService);

  isFooterDisplayed = environment.isFooterDisplayed;

  ngOnInit(): void {}

  getActualLang() {
    if (this.translate.getCurrentLang() === 'cs') return 'cs';
    return 'en';
  }
}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

/**
 * SharedModule - Import this in lazy-loaded feature modules
 * Exports commonly used modules to avoid duplication
 *
 * Note: NgbModule is imported here so lazy-loaded modules have access
 * to NgBootstrap components without causing duplication errors
 */
@NgModule({
  imports: [
    CommonModule,
    NgbModule,
    TranslateModule.forChild({
      extend: true,
    }),
  ],
  exports: [CommonModule, NgbModule, TranslateModule],
})
export class SharedModule {}

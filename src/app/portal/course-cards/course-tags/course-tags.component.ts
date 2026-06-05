import { Component, Input } from '@angular/core';
import { ActivityItemData, CourseData } from 'cmp-portal-core';

interface TagsOptions {
  isShowMain?: boolean;
  isShowCatalog?: boolean;
  isShowSpecials?: boolean;
  isShowDefaults?: boolean;
}

@Component({
    selector: 'cmp-course-tags',
    templateUrl: './course-tags.component.html',
    styleUrl: './course-tags.component.scss',
    standalone: false
})
export class CourseTagsComponent {
  @Input({ required: true }) rootItem!: ActivityItemData;
  @Input({ required: true }) courseData!: CourseData;
  @Input({ required: true }) optionsObj!: TagsOptions;
}

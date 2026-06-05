import { Component, NgZone, OnDestroy, OnInit, ElementRef, Renderer2, ViewChild, AfterViewInit, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

import {
  AuthService,
  CoreDataService,
  UserData,
  UtilsService,
  ActivityItemData,
  CourseData,
  CoursesService,
  LangService,
  RequestControl,
  Message,
  appConstants,
  RequestState,
  ModalsService,
} from 'cmp-portal-core';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { CatalogFilterService, CatalogFilterUrlParams } from './catalog-filter.service';
import { SearchFieldComponent } from '../courses/search-field/search-field.component';
import { environment } from '../../../environments/environment';

enum SortType {
  Alpha = 'alpha',
  Time = 'time',
  Order = 'order',
}

const CARD_WIDTH = 285;

interface FilterPanel {
  filterOrder: string[];
  isActive: boolean;
  isSideOpen: boolean;
  filters: {
    [key: string]: {
      filterName: string;
      isActive: boolean;
      isExpanded: boolean;
      options: FilterOption[];
    };
  };
}

interface FilterOption {
  name: string;
  value: any;
  isChecked: boolean;
}

interface SpecialCategory {
  name: string;
  id: number;
  items: number[];
}

@Component({
  selector: 'cmp-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss'],
  standalone: false,
})
export class CatalogComponent implements OnInit, OnDestroy, AfterViewInit {
  // Dependencies
  private readonly authService = inject(AuthService);
  private readonly coreDataService = inject(CoreDataService);
  private readonly coursesService = inject(CoursesService);
  private readonly utilsService = inject(UtilsService);
  private readonly langService = inject(LangService);
  private readonly translate = inject(TranslateService);
  private readonly zone = inject(NgZone);
  private readonly renderer = inject(Renderer2);
  private readonly el = inject(ElementRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogFilterService = inject(CatalogFilterService);
  private readonly modalsService = inject(ModalsService);
  private readonly config = inject(NgbCarouselConfig);

  @ViewChild('catalogContainer', { static: false }) catalogContainer!: ElementRef<HTMLElement>;
  @ViewChild('searchFieldRef') searchFieldComponent!: SearchFieldComponent;

  // subscriptions
  private userSub!: Subscription;
  private langSub!: Subscription;
  private catalogDataSub!: Subscription;
  private carouselEventListeners: { [catId: number]: Array<() => void> } = {};

  // Component data and state
  get uaStateCodeTables() {
    return this.coreDataService.coreData.CODE_TABLES.CtUserActivityState.idKey;
  }
  isCoursesLoading = true;
  isCoursePreparing = false;
  cmpUser!: UserData;
  courseData: CourseData = new CourseData();
  launchNextCourseId: number | null = null;
  environmentVars = environment;
  isCatalogFilterEnabled = environment.isCatalogFilterEnabled;
  isCatalogBannerEnabled = environment.isCatalogBannerEnabled;
  isShowAssigned = false;
  displayControl = {
    category: 0 as number,
    sort: SortType.Order,
    search: null as string | null,
    isAnyFilterActive: false,
  };
  categories = {
    catObjects: {} as { [key: number]: string },
    catOrder: [] as number[],
  };
  tags = {
    allTags: [] as number[],
    catTags: [] as { tagId: number; isActive: boolean }[],
    activeCount: 0,
    isSubCatOpen: false,
  };
  specCats = {
    catIds: [] as number[],
    catObj: {} as { [key: number]: SpecialCategory },
  };
  requestsControl!: RequestControl;
  reqStates: { [key: number]: RequestState } = {};

  displayControlSort: SortType[] = [SortType.Alpha, SortType.Time, SortType.Order];
  filterPanel: FilterPanel = {
    filterOrder: ['form', 'fLength', 'term', 'special', 'signup'],
    isActive: false,
    isSideOpen: false,
    filters: {
      form: {
        filterName: 'CATALOG_FILTER_FORM_HEADER',
        isExpanded: true,
        isActive: false,
        options: [
          { name: 'CATALOG_FILTER_FORM_ELEARN', value: 'elearn', isChecked: false },
          { name: 'CATALOG_FILTER_FORM_PREZ', value: 'prez', isChecked: false },
          { name: 'CATALOG_FILTER_FORM_SET', value: 'set', isChecked: false },
        ],
      },
      fLength: {
        filterName: 'CATALOG_FILTER_LENGTH_HEADER',
        isExpanded: true,
        isActive: false,
        options: [
          { name: 'CATALOG_FILTER_LENGTH_2HR', value: '2hr', isChecked: false },
          { name: 'CATALOG_FILTER_LENGTH_1D', value: 'day', isChecked: false },
          { name: 'CATALOG_FILTER_LENGTH_MORE', value: 'more', isChecked: false },
        ],
      },
      term: {
        filterName: 'CATALOG_FILTER_THERM_HEADER',
        isExpanded: true,
        isActive: false,
        options: [
          { name: 'CATALOG_FILTER_THERM_7', value: 7, isChecked: false },
          { name: 'CATALOG_FILTER_THERM_14', value: 14, isChecked: false },
          { name: 'CATALOG_FILTER_THERM_30', value: 30, isChecked: false },
        ],
      },
      special: {
        filterName: 'CATALOG_FILTER_SPECIAL_HEADER',
        isExpanded: true,
        isActive: false,
        options: [],
      },
      signup: {
        filterName: 'CATALOG_FILTER_SIGNUP_HEADER',
        isExpanded: true,
        isActive: false,
        options: [{ name: 'CATALOG_FILTER_SIGNUP_SIMPLE', value: 'simple', isChecked: false }],
      },
    },
  };

  rootItems: ActivityItemData[] = [];

  ngOnInit(): void {
    this.config.wrap = false;
    this.config.interval = 0;
    this.config.showNavigationIndicators = false;
    this.config.animation = false;
    this.isCoursesLoading = true;
    this.isCoursePreparing = false;

    // Check for isShowAssigned in URL first
    this.checkShowAssignedFromUrl();

    this.userSub = this.authService.userData.subscribe(userData => {
      this.cmpUser = userData;
      if (userData.user) {
        this.coursesService.getCatalogCoursesV2(this.isShowAssigned);
      }
    });
    this.catalogDataSub = this.coursesService.catalogUpdate.subscribe(resultData => {
      this.dataUpdated(resultData);
    });
    this.langSub = this.langService.appCurrentLang.pipe(skip(1)).subscribe(() => {
      this.coursesService.updateLangBasedData('catalog');
    });

    this.requestsControl = this.coreDataService.coreData.requestsControl;
  }

  private checkShowAssignedFromUrl() {
    const hasUrlParams = Object.keys(this.route.snapshot.queryParams).length > 0;
    if (hasUrlParams) {
      // External URL with parameters - check for showAssigned
      if (this.route.snapshot.queryParams.showAssigned !== undefined) {
        this.isShowAssigned = this.route.snapshot.queryParams.showAssigned === 'true';
      }
    } else if (this.catalogFilterService.hasStoredFilters()) {
      // Internal navigation - check service for showAssigned
      const storedFilters = this.catalogFilterService.getStoredFilters()!;
      if (storedFilters.showAssigned !== undefined) {
        this.isShowAssigned = storedFilters.showAssigned;
      }
    }
  }

  ngAfterViewInit(): void {
    // Initialize carousels after view is initialized if data is already available
    if (!this.isCoursesLoading && !this.displayControl.isAnyFilterActive) {
      setTimeout(() => this.initAllCarousels(), 0);
    }
  }

  changeShowAssigned() {
    this.isCoursesLoading = true;
    this.isShowAssigned = !this.isShowAssigned;
    this.coursesService.getCatalogCoursesV2(this.isShowAssigned);
    this.updateUrlWithCurrentFilters();
  }

  showRequestActivityModal(actId?: number) {
    if ((actId && !this.requestsControl.isReqestAccessAvailable) || (actId == null && !this.requestsControl.isRequestActivityAvailable)) {
      this.utilsService.showModalMessage(this.translate.instant('CATALOG_ACTIVITY_ASSIGNED_HEADER'), this.translate.instant('CATALOG_ACTIVITY_REQUEST_ERROR_CONFIG'));
      return;
    }

    this.modalsService.openRequestModal(actId ? this.courseData.activities[actId] : null, this.requestsControl).then(
      // const modalRef = this.modalService.open(ActReqModalComponent, {
      //   size: 'xl',
      //   backdrop: 'static',
      // });
      // modalRef.componentInstance.activityObject = actId ? this.courseData.activities[actId] : null;
      // modalRef.componentInstance.requestsControl = this.requestsControl;
      // modalRef.result.then(
      formData => {
        console.log('request-activity modal saved and closed. Modal data: ', actId, formData);

        this.coursesService.requestAccessToActivity(actId, formData).subscribe(newMsgObj => {
          if (newMsgObj) {
            // updateRequestStates(actId, newMsgObj);
            this.utilsService.showModalMessage(
              this.translate.instant('CATALOG_ACTIVITY_REQUEST_HEADER'),
              actId ? this.translate.instant('CATALOG_ACTIVITY_REQUEST_ACT_TEXT') : this.translate.instant('CATALOG_ACTIVITY_REQUEST_NEW_TEXT')
            );
          } else {
            this.utilsService.showModalMessage(this.translate.instant('CATALOG_ACTIVITY_REQUEST_HEADER'), this.translate.instant('CATALOG_ACTIVITY_REQUEST_ERROR'));
          }
        });
      },
      dismissMessage => {
        console.log('Form modal dismissed: ' + dismissMessage);
      }
    );
  }

  changeCategoryDisplay(category: number) {
    this.displayControl.category = category;
    if (category === -1) {
      return;
    }
    if (category === -2) {
      this.filterCalendarCourses();
      return;
    }
    this.getTagsForCategory();
    this.filterRootCourses();
    this.updateUrlWithCurrentFilters();
  }

  scrollToBottom() {
    let coursesContainer = document.querySelector('#id-form-more-courses');
    // console.log('coursesContainer', coursesContainer);

    if (coursesContainer != null) coursesContainer.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  }

  toggleSelectedTag(index: number) {
    this.tags.catTags[index].isActive = !this.tags.catTags[index].isActive;
    if (this.tags.catTags[index].isActive) {
      this.tags.activeCount++;
    } else {
      this.tags.activeCount--;
    }
    this.filterRootCourses();
    this.updateUrlWithCurrentFilters();
  }

  resetSelectedTags() {
    for (let tagObj of this.tags.catTags) {
      tagObj.isActive = false;
    }
    this.tags.activeCount = 0;
    this.filterRootCourses();
    this.updateUrlWithCurrentFilters();
  }

  filterPanelChange(option: FilterOption) {
    option.isChecked = !option.isChecked;
    this.checkActiveFilterBlocks();
    this.filterRootCourses();
    this.updateUrlWithCurrentFilters();
  }

  clearFilterPanel() {
    for (let filter in this.filterPanel.filters) {
      let filterObj = this.filterPanel.filters[filter];
      filterObj.isActive = false;
      for (let filterOpt of filterObj.options) {
        filterOpt.isChecked = false;
      }
    }
    this.filterPanel.isActive = false;
    this.filterRootCourses();
    this.updateUrlWithCurrentFilters();
  }

  private checkActiveFilterBlocks() {
    let isActive = false;
    for (let filter in this.filterPanel.filters) {
      let filterObj = this.filterPanel.filters[filter];
      let activeOption = filterObj.options.find(option => option.isChecked);
      filterObj.isActive = activeOption != null;
      if (filterObj.isActive) isActive = true;
    }
    this.filterPanel.isActive = isActive;
  }

  changeSorting(sort: SortType) {
    this.displayControl.sort = sort;
    this.rootItems.sort(this.sortRootArray.bind(this));
    this.updateUrlWithCurrentFilters();
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.langSub.unsubscribe();
    this.catalogDataSub.unsubscribe();

    // Clean up all carousel event listeners
    Object.values(this.carouselEventListeners).forEach(listeners => {
      listeners.forEach(removeListener => removeListener());
    });
    this.carouselEventListeners = {};
  }

  // //////////////////////////////
  // SEARCH FUNCTIONS SECTION
  // //////////////////////////////

  runSearchName($event: { searchTerm: null | string }) {
    this.displayControl.search = $event.searchTerm;
    this.filterRootCourses();
    this.updateUrlWithCurrentFilters();
  }

  getTagsForCategory() {
    this.tags.catTags = [];
    this.tags.activeCount = 0;
    if (this.displayControl.category === 0) {
      for (let tagId of this.tags.allTags) {
        this.tags.catTags.push({ tagId: tagId, isActive: false });
      }
      this.tags.isSubCatOpen = false;
    } else if (this.displayControl.category > 0) {
      let tempCatItems = {} as { [key: number]: boolean };
      for (const rootItem of this.courseData.actualRootItems) {
        if (rootItem.category?.id === this.displayControl.category && this.courseData.extraData[rootItem.activityId]) {
          for (let tagId in this.courseData.extraData[rootItem.activityId].tagIds) {
            if (!this.courseData.tags[tagId].isCategory) {
              tempCatItems[tagId] = true;
            }
          }
        }
      }
      for (let tagId in tempCatItems) {
        this.tags.catTags.push({ tagId: +tagId, isActive: false });
      }
      this.tags.isSubCatOpen = true;
    }
    this.tags.catTags.sort(this.sortCatTagsByName.bind(this));

    // console.log('getTagsForCategory result:', {
    //   category: this.displayControl.category,
    //   catTagsLength: this.tags.catTags.length,
    //   isSubCatOpen: this.tags.isSubCatOpen,
    //   activeCount: this.tags.activeCount,
    // });
  }

  // //////////////////////////////
  // Sets and Activites functions
  // //////////////////////////////
  enlistCourse(event: { activityId: number; runId: number | null }) {
    this.utilsService
      .showModalMessage(
        this.translate.instant('CATALOG_ASSIGN_CONFIRM_HEADER'),
        this.translate.instant('CATALOG_ASSIGN_CONFIRM_BODY', {
          actName: this.courseData.activities[event.activityId].localName,
        }),
        this.translate.instant('GENERAL_YES'),
        this.translate.instant('GENERAL_NO')
      )
      .then((closeMsg: string) => {
        if (closeMsg === 'OK') {
          this.isCoursePreparing = true;
          this.coursesService.catalogSignUp(event.activityId, event.runId).subscribe(
            result => {
              if (result != null) {
                this.utilsService.showModalMessage(null, this.translate.instant('CATALOG_SIGNUP_SUCCESS'));
              } else {
                this.utilsService.showAndLogError(this.translate.instant('CATALOG_SIGNUP_FAILED'));
              }
              this.isCoursePreparing = false;
            },
            err => {
              let warnings = '';
              if (err.type === 'WARN_LIST' && err.warnings && err.warnings.length > 0) {
                warnings = err.warnings.map((w: string) => this.translate.instant(w)).join(',<br>');
              } else {
                warnings = this.translate.instant('CATALOG_SIGNUP_FAILED');
              }
              this.utilsService.showAndLogError(warnings);
              this.isCoursePreparing = false;
            }
          );
        }
      });
  }

  isTypeActivity(activityId: number) {
    const currentAct = this.courseData.activities[activityId];
    if (
      this.coreDataService.coreData.CODE_TABLES.CtActivityType.idKey[currentAct.idCtActivityType].name === 'ACTIVITY' ||
      this.coreDataService.coreData.CODE_TABLES.CtActivityType.idKey[currentAct.idCtActivityType].name === 'FEEDBACK'
    ) {
      return true;
    }
    return false;
  }

  upOneLevel() {
    if (this.courseData.parentSetId == null) return;
    let parentRootItem = this.courseData.activityData[this.courseData.parentSetId];
    if (parentRootItem.parentActId == null) {
      this.rootItems = JSON.parse(JSON.stringify(this.courseData.actualRootItems));
      this.courseData.parentSetId = null;
    } else {
      this.setChildrenAsRoots(parentRootItem.parentActId);
    }
  }

  setChildrenAsRoots(activityId: number) {
    const newRoot: ActivityItemData[] = [];
    if (this.courseData.children[activityId] == null) return;
    for (let childId of this.courseData.children[activityId]) {
      newRoot.push(this.courseData.activityData[childId]);
    }
    this.rootItems = newRoot;
    this.courseData.parentSetId = activityId;

    let mainContainer = document.querySelector('.main-container');
    if (mainContainer != null) mainContainer.scrollTo(0, 0);
  }

  updateRequestStates(msgObj: Message, actId?: number) {
    if (actId == null) return;
    this.reqStates[actId] = {
      isProcessed: appConstants.MESSAGE_STATE[msgObj.messageStateId] === 'OPENED',
      isWithdrawable: appConstants.MESSAGE_STATE[msgObj.messageStateId] === 'OPENED' && this.requestsControl.isReqestAccessWithdrawable,
      isRejected: appConstants.MESSAGE_STATE[msgObj.messageStateId] === 'WONT_FIX',
      isWithdrawn: appConstants.MESSAGE_STATE[msgObj.messageStateId] === 'WITHDREW',
      isCompleted: appConstants.MESSAGE_STATE[msgObj.messageStateId] === 'SOLVED',
    };
  }

  private dataUpdated(resultData: CourseData) {
    this.zone.run(() => {
      this.courseData = resultData;
      Object.values(this.courseData.messages).forEach(msgObj => {
        this.updateRequestStates(msgObj, msgObj.idTargetActivityMt);
      });
      this.collectCategoryTags();

      // Handle filter restoration with precedence: URL > Service > Defaults
      const hasUrlParams = Object.keys(this.route.snapshot.queryParams).length > 0;

      // URL has parameters
      if (hasUrlParams) {
        // set filters from the url
        this.setFiltersFromUrl();
        // Clear stored filters as we're using URL params
        this.catalogFilterService.clearStoredFilters();
        // store current filters in service for potential later use
        const params = this.buildUrlFromFilters();
        this.catalogFilterService.storeCurrentFilters(params);
      }
      // url has no parameters but we have stored filters
      else if (this.catalogFilterService.hasStoredFilters()) {
        // Internal navigation or returning from detail
        const storedFilters = this.catalogFilterService.getStoredFilters()!;
        // apply filters to controller
        this.applyStoredFilters(storedFilters);
        // Update URL to reflect current state
        this.updateUrlWithCurrentFilters();
      }
      // otherwise do nothing since we have no filters to apply

      this.filterRootCourses();
      this.isCoursesLoading = false;

      // Force change detection after everything is set up
      // setTimeout(() => {
      //   console.log('Final state check:', {
      //     category: this.displayControl.category,
      //     catTagsLength: this.tags.catTags.length,
      //     isSubCatOpen: this.tags.isSubCatOpen,
      //     activeCount: this.tags.activeCount,
      //     activeTags: this.tags.catTags.filter((t) => t.isActive).map((t) => t.tagId),
      //   });
      // }, 0);

      this.initAllCarousels();
    });
  }

  private setFiltersFromUrl() {
    const params = this.route.snapshot.queryParams;

    // Category
    if (params.catId) {
      const catNumber = parseInt(params.catId);
      if (this.categories.catObjects[catNumber] != null) {
        this.displayControl.category = catNumber;
        this.getTagsForCategory();
      }
    }

    // Sort
    if (params.sort && Object.values(SortType).includes(params.sort)) {
      this.displayControl.sort = params.sort;
    }

    // Search
    if (params.search) {
      this.displayControl.search = params.search;
      // Update the search field UI
      this.updateSearchFieldValue(params.search);
    }

    // Tags
    if (params.tags) {
      const tagIds = Array.isArray(params.tags) ? params.tags.map((t: any) => parseInt(t)) : [parseInt(params.tags)];
      this.tags.activeCount = 0; // Reset active count
      tagIds.forEach(tagId => {
        const tagIndex = this.tags.catTags.findIndex(t => t.tagId === tagId);
        if (tagIndex !== -1) {
          this.tags.catTags[tagIndex].isActive = true;
          this.tags.activeCount++;
        }
      });
    }

    // Restore tag section open state
    if (params.isSubCatOpen !== undefined) {
      this.tags.isSubCatOpen = params.isSubCatOpen;
    } else {
      // If we have active tags and we're in "All" category, make sure tags are visible
      if (this.tags.activeCount > 0 && this.displayControl.category === 0) {
        this.tags.isSubCatOpen = true;
      }
    }

    // console.log('Tags restored from URL:', {
    //   tagIds: params.tags,
    //   activeCount: this.tags.activeCount,
    //   category: this.displayControl.category,
    //   isSubCatOpen: this.tags.isSubCatOpen,
    //   catTagsLength: this.tags.catTags.length,
    // });

    // Filter panel options
    this.applyFilterPanelFromUrl(params);
  }

  private applyFilterPanelFromUrl(params: any) {
    // Form filter
    if (params.form) {
      const formValues = Array.isArray(params.form) ? params.form : params.form.split(',');
      this.filterPanel.filters.form.options.forEach(option => {
        option.isChecked = formValues.includes(option.value);
      });
    }

    // Length filter
    if (params.fLength) {
      const lengthValues = Array.isArray(params.fLength) ? params.fLength : params.fLength.split(',');
      this.filterPanel.filters.fLength.options.forEach(option => {
        option.isChecked = lengthValues.includes(option.value);
      });
    }

    // Term filter
    if (params.term) {
      const termValues = Array.isArray(params.term) ? params.term.map((t: any) => parseInt(t)) : params.term.split(',').map((t: any) => parseInt(t));
      this.filterPanel.filters.term.options.forEach(option => {
        option.isChecked = termValues.includes(option.value);
      });
    }

    // Special filter
    if (params.special) {
      const specialValues = Array.isArray(params.special) ? params.special.map((t: any) => parseInt(t)) : params.special.split(',').map((t: any) => parseInt(t));
      this.filterPanel.filters.special.options.forEach(option => {
        option.isChecked = specialValues.includes(option.value);
      });
    }

    // Signup filter
    if (params.signup) {
      const signupValues = Array.isArray(params.signup) ? params.signup : params.signup.split(',');
      this.filterPanel.filters.signup.options.forEach(option => {
        option.isChecked = signupValues.includes(option.value);
      });
    }

    this.checkActiveFilterBlocks();
  }

  private applyStoredFilters(filters: CatalogFilterUrlParams) {
    if (filters.catId !== undefined) {
      this.displayControl.category = filters.catId;
      this.getTagsForCategory();
    }
    if (filters.sort) {
      this.displayControl.sort = filters.sort;
    }
    if (filters.search) {
      this.displayControl.search = filters.search;
      // Update the search field UI
      this.updateSearchFieldValue(filters.search);
    }

    // Apply tags
    if (filters.tags && filters.tags.length > 0) {
      this.tags.activeCount = 0; // Reset active count
      filters.tags.forEach(tagId => {
        const tagIndex = this.tags.catTags.findIndex(t => t.tagId === tagId);
        if (tagIndex !== -1) {
          this.tags.catTags[tagIndex].isActive = true;
          this.tags.activeCount++;
        }
      });
    }

    // Restore tag section open state
    if (filters.isSubCatOpen !== undefined) {
      this.tags.isSubCatOpen = filters.isSubCatOpen;
    } else {
      // If we have active tags and we're in "All" category, make sure tags are visible
      if (this.tags.activeCount > 0 && this.displayControl.category === 0) {
        this.tags.isSubCatOpen = true;
      }
    }

    // console.log('Tags restored from service:', {
    //   tagIds: filters.tags,
    //   activeCount: this.tags.activeCount,
    //   category: this.displayControl.category,
    //   isSubCatOpen: this.tags.isSubCatOpen,
    //   catTagsLength: this.tags.catTags.length,
    // });

    // Apply filter panel options
    this.applyFilterPanelFromStored(filters);
  }

  private applyFilterPanelFromStored(filters: CatalogFilterUrlParams) {
    // Form filter
    if (filters.form && filters.form.length > 0) {
      this.filterPanel.filters.form.options.forEach(option => {
        option.isChecked = filters.form!.includes(option.value);
      });
    }

    // Length filter
    if (filters.fLength && filters.fLength.length > 0) {
      this.filterPanel.filters.fLength.options.forEach(option => {
        option.isChecked = filters.fLength!.includes(option.value);
      });
    }

    // Term filter
    if (filters.term && filters.term.length > 0) {
      this.filterPanel.filters.term.options.forEach(option => {
        option.isChecked = filters.term!.includes(option.value);
      });
    }

    // Special filter
    if (filters.special && filters.special.length > 0) {
      this.filterPanel.filters.special.options.forEach(option => {
        option.isChecked = filters.special!.includes(option.value);
      });
    }

    // Signup filter
    if (filters.signup && filters.signup.length > 0) {
      this.filterPanel.filters.signup.options.forEach(option => {
        option.isChecked = filters.signup!.includes(option.value);
      });
    }

    this.checkActiveFilterBlocks();
  }

  private buildUrlFromFilters(): CatalogFilterUrlParams {
    const params: CatalogFilterUrlParams = {};

    // Show assigned
    if (this.isShowAssigned) {
      params.showAssigned = this.isShowAssigned;
    }

    // Category
    if (this.displayControl.category !== 0) {
      params.catId = this.displayControl.category;
    }

    // Sort
    if (this.displayControl.sort !== SortType.Order) {
      params.sort = this.displayControl.sort;
    }

    // Search
    if (this.displayControl.search) {
      params.search = this.displayControl.search;
    }

    // Tags
    const activeTags = this.tags.catTags.filter(t => t.isActive).map(t => t.tagId);
    if (activeTags.length > 0) {
      params.tags = activeTags;
    }

    // Tag section open state (only store if it's different from default)
    if ((this.displayControl.category === 0 && this.tags.isSubCatOpen) || (this.displayControl.category > 0 && !this.tags.isSubCatOpen)) {
      params.isSubCatOpen = this.tags.isSubCatOpen;
    }

    // Filter panel options
    if (this.filterPanel.isActive) {
      // Form filter
      const formChecked = this.filterPanel.filters.form.options.filter(o => o.isChecked).map(o => o.value);
      if (formChecked.length > 0) {
        params.form = formChecked;
      }

      // Length filter
      const lengthChecked = this.filterPanel.filters.fLength.options.filter(o => o.isChecked).map(o => o.value);
      if (lengthChecked.length > 0) {
        params.fLength = lengthChecked;
      }

      // Term filter
      const termChecked = this.filterPanel.filters.term.options.filter(o => o.isChecked).map(o => o.value);
      if (termChecked.length > 0) {
        params.term = termChecked;
      }

      // Special filter
      const specialChecked = this.filterPanel.filters.special.options.filter(o => o.isChecked).map(o => o.value);
      if (specialChecked.length > 0) {
        params.special = specialChecked;
      }

      // Signup filter
      const signupChecked = this.filterPanel.filters.signup.options.filter(o => o.isChecked).map(o => o.value);
      if (signupChecked.length > 0) {
        params.signup = signupChecked;
      }
    }

    return params;
  }

  private updateUrlWithCurrentFilters() {
    const params = this.buildUrlFromFilters();
    const queryParams = Object.keys(params).length > 0 ? this.catalogFilterService.buildQueryParams(params) : {};

    // Store current filters in service for later restoration
    this.catalogFilterService.storeCurrentFilters(params);

    this.router.navigate(['/portal/catalog'], {
      queryParams,
      replaceUrl: true,
    });
  }

  private updateSearchFieldValue(searchValue: string | null) {
    // Update the search field component with the restored value
    if (this.searchFieldComponent) {
      this.searchFieldComponent.setSearchTerm(searchValue);
    }
  }

  private initAllCarousels() {
    if (!this.displayControl.isAnyFilterActive && this.catalogContainer) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        for (let catId of this.specCats.catIds) {
          this.initializeCarousel(catId);
        }
      }, 0);
    }
  }

  private initializeCarousel(catId: number) {
    // Clean up existing listeners for this carousel
    if (this.carouselEventListeners[catId]) {
      this.carouselEventListeners[catId].forEach(removeListener => removeListener());
    }
    this.carouselEventListeners[catId] = [];

    // Use native querySelector within the component's element
    const containerElement = this.catalogContainer?.nativeElement || this.el.nativeElement;
    const carElement = containerElement.querySelector(`#cat-carousel-${catId} .carousel-inner`) as HTMLElement;
    const carElementPrev = containerElement.querySelector(`#cat-carousel-${catId} .carousel-control-prev`) as HTMLElement;
    const carElementNext = containerElement.querySelector(`#cat-carousel-${catId} .carousel-control-next`) as HTMLElement;

    if (!carElement || !carElementNext || !carElementPrev) return;

    // Get carousel dimensions
    const carouselWidthScroll = carElement.scrollWidth;
    const carouselWidthVisible = carElement.clientWidth;

    // Initialize scroll position using Renderer2
    this.renderer.setProperty(carElement, 'scrollLeft', 0);

    const cardWidth = CARD_WIDTH + 20;
    let scrollPosition = 0;

    // Add click listeners using Renderer2
    const nextClickListener = this.renderer.listen(carElementNext, 'click', () => {
      const maxScroll = carouselWidthScroll - carouselWidthVisible;
      if (scrollPosition < maxScroll) {
        let newScroll = scrollPosition + cardWidth;
        if (newScroll > maxScroll) newScroll = maxScroll;
        scrollPosition = newScroll;

        // Use native scrollTo with smooth behavior
        carElement.scrollTo({
          left: scrollPosition,
          behavior: 'smooth',
        });
      }
    });

    const prevClickListener = this.renderer.listen(carElementPrev, 'click', () => {
      if (scrollPosition > 0) {
        let newScroll = scrollPosition - cardWidth;
        if (newScroll < 0) newScroll = 0;
        scrollPosition = newScroll;

        // Use native scrollTo with smooth behavior
        carElement.scrollTo({
          left: scrollPosition,
          behavior: 'smooth',
        });
      }
    });

    // Store cleanup functions
    this.carouselEventListeners[catId].push(nextClickListener);
    this.carouselEventListeners[catId].push(prevClickListener);
  }

  private collectCategoryTags() {
    this.categories.catObjects = {};
    this.categories.catOrder = [];
    this.tags.allTags = [];
    this.tags.catTags = [];
    this.tags.activeCount = 0;
    this.tags.isSubCatOpen = false;

    let allTagIds = {} as { [key: number]: boolean };

    this.specCats.catIds = [];
    this.specCats.catObj = {};

    this.filterPanel.filters.special.options = [];

    for (let rootItem of this.courseData.actualRootItems) {
      if (this.courseData.extraData[rootItem.activityId]) {
        for (let tagObj of this.courseData.extraData[rootItem.activityId].tags) {
          if (tagObj.isCategory) {
            if (tagObj.cats && tagObj.cats.catalog) {
              rootItem.category = { id: tagObj.id, name: tagObj.localName! };
              this.courseData.activityData[rootItem.activityId] = rootItem;
              if (this.categories.catObjects[tagObj.id] == null) {
                this.categories.catObjects[tagObj.id] = tagObj.localName!;
                this.categories.catOrder.push(tagObj.id);
              }
            } else if (tagObj.cats && tagObj.cats.special) {
              if (rootItem.specCat == null) rootItem.specCat = {};
              rootItem.specCat[tagObj.id] = true;
              this.courseData.activityData[rootItem.activityId] = rootItem;
              if (this.specCats.catObj[tagObj.id] == null) {
                this.specCats.catIds.push(tagObj.id);
                this.specCats.catObj[tagObj.id] = { name: tagObj.localName!, id: tagObj.id, items: [] };
                this.filterPanel.filters.special.options.push({ name: tagObj.localName!, value: tagObj.id, isChecked: false });
              }
              this.specCats.catObj[tagObj.id].items.push(rootItem.activityId);
            }
          } else if (allTagIds[tagObj.id] == null) {
            this.tags.allTags.push(tagObj.id);
            allTagIds[tagObj.id] = true;
          }
        }
      }
    }

    this.categories.catOrder.sort(this.sortCatsByName.bind(this));

    for (let tagId of this.tags.allTags) {
      this.tags.catTags.push({ tagId: tagId, isActive: false });
    }
    this.tags.catTags.sort(this.sortCatTagsByName.bind(this));
  }

  sortCatsByName(a: number, b: number) {
    let nameA = this.categories.catObjects[a];
    let nameB = this.categories.catObjects[b];
    if ((nameA == null && nameB == null) || nameA == nameB) {
      return 0;
    }
    if (nameA == null) return 1;
    if (nameB == null) return -1;

    var diff = nameA.localeCompare(nameB, this.translate.getCurrentLang(), {
      sensitivity: 'accent',
    });
    if (diff < 0) return -1;
    if (diff > 0) return 1;
    return 0;
  }

  sortCatTagsByName(a: { tagId: number; isActive: boolean }, b: { tagId: number; isActive: boolean }) {
    let nameA = this.courseData.tags[a.tagId].localName;
    let nameB = this.courseData.tags[b.tagId].localName;
    if ((nameA == null && nameB == null) || nameA == nameB) {
      return 0;
    }
    if (nameA == null) return 1;
    if (nameB == null) return -1;

    var diff = nameA.localeCompare(nameB, this.translate.getCurrentLang(), {
      sensitivity: 'accent',
    });
    if (diff < 0) return -1;
    if (diff > 0) return 1;
    return 0;
  }

  private filterCalendarCourses() {
    let newRoot: ActivityItemData[] = [];
    for (const rootItem of this.courseData.actualRootItems) {
      if (rootItem.isRunAct) newRoot.push(rootItem);
    }
    this.rootItems = newRoot;
    this.rootItems.sort(this.sortRootArray.bind(this));
  }

  private filterRootCourses() {
    let newRoot: ActivityItemData[] = [];
    for (const rootItem of this.courseData.actualRootItems) {
      // check state
      let itemFits = true;
      if (this.displayControl.category !== 0) {
        if (rootItem.category == null) {
          itemFits = false;
        } else {
          itemFits = false;
          if (this.displayControl.category === rootItem.category.id) itemFits = true;
        }
      }
      if (!itemFits) continue;

      // check search
      // itemFits = true; // no need to reset, cause if false we would exit the loop
      let finalSearchStr: string | null = null;
      if (this.displayControl.search != null && this.displayControl.search !== '') {
        let crlSearch = this.utilsService.removeStringDiacritics(this.displayControl.search.trim());
        if (crlSearch != null && crlSearch !== '') {
          finalSearchStr = crlSearch;
        }
      }
      if (finalSearchStr) {
        itemFits = false;
        let reg = new RegExp(finalSearchStr!, 'i');
        let activityObj = this.courseData.activities[rootItem.activityId];
        if (activityObj.searchName && reg.test(activityObj.searchName)) {
          itemFits = true;
        }
      }
      if (!itemFits) continue;

      // check tags - we need at least one active tag to fit rootItem tags
      for (const tagObj of this.tags.catTags) {
        if (tagObj.isActive) {
          itemFits = false;
          if (this.courseData.extraData[rootItem.activityId] && this.courseData.extraData[rootItem.activityId].tagIds[tagObj.tagId]) {
            itemFits = true;
            break;
          }
        }
      }
      if (!itemFits) continue;

      // check filter panel
      if (this.filterPanel.isActive) {
        //filter course form
        if (this.filterPanel.filters.form.isActive) {
          itemFits = false;
          for (let option of this.filterPanel.filters.form.options) {
            if (option.isChecked) {
              if (option.value === 'elearn' && rootItem.isActivity && !rootItem.isRunAct) {
                itemFits = true;
                break;
              } else if (option.value === 'prez' && rootItem.isActivity && rootItem.isRunAct) {
                itemFits = true;
                break;
              } else if (option.value === 'set' && !rootItem.isActivity) {
                itemFits = true;
                break;
              }
            }
          }
        }
        if (!itemFits) continue;

        //filter course length
        if (this.filterPanel.filters.fLength.isActive) {
          itemFits = false;
          let timeDemand = this.courseData.activities[rootItem.activityId].timeDemand;
          if (timeDemand == null) continue;
          for (let option of this.filterPanel.filters.fLength.options) {
            if (option.isChecked) {
              if (option.value === '2hr' && timeDemand <= 120) {
                itemFits = true;
                break;
              } else if (option.value === 'day' && timeDemand <= 1440) {
                itemFits = true;
                break;
              } else if (option.value === 'more' && timeDemand > 1440) {
                itemFits = true;
                break;
              }
            }
          }
        }
        if (!itemFits) continue;

        //filter course term
        if (this.filterPanel.filters.term.isActive) {
          itemFits = false;
          let dateA = this.getItemDate(rootItem, 'end');
          if (dateA == null) continue;
          let dateB = new Date();
          let diffTime = dateA.getTime() - dateB.getTime();
          if (diffTime <= 0) continue;
          let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          for (let option of this.filterPanel.filters.term.options) {
            if (option.isChecked && option.value >= diffDays) {
              itemFits = true;
              break;
            }
          }
        }
        if (!itemFits) continue;

        //filter special tags
        if (this.filterPanel.filters.special.isActive) {
          itemFits = false;
          if (rootItem.specCat == null) continue;
          for (let option of this.filterPanel.filters.special.options) {
            if (option.isChecked && rootItem.specCat[option.value]) {
              itemFits = true;
              break;
            }
          }
        }
        if (!itemFits) continue;

        //filter signup
        if (this.filterPanel.filters.signup.isActive) {
          itemFits = false;
          for (let option of this.filterPanel.filters.signup.options) {
            if (option.isChecked && option.value === 'simple') {
              if (!this.courseData.activityData[rootItem.activityId].requestAccess) {
                itemFits = true;
                break;
              }
            }
          }
        }
      }

      if (itemFits) newRoot.push(rootItem);
    }
    this.rootItems = newRoot;

    // this.filterPanel.filters.special.options.push({ name: tagObj.localName!, value: tagObj.id, isChecked: false });
    // sort all root items
    this.rootItems.sort(this.sortRootArray.bind(this));
    this.checkAnyFilterActive();
    // if (!this.displayControl.isAnyFilterActive) {
    //   $(document).ready(() => {
    //     for (let catId of this.specCats.catIds) {
    //       this.initializeCarousel(catId);
    //     }
    //   });
    // }
  }

  private checkAnyFilterActive() {
    this.displayControl.isAnyFilterActive = false;
    if (this.displayControl.search != null && this.displayControl.search !== '') {
      this.displayControl.isAnyFilterActive = true;
      return;
    }
    if (this.displayControl.category !== 0) {
      this.displayControl.isAnyFilterActive = true;
      return;
    }
    if (this.filterPanel.isActive) {
      this.displayControl.isAnyFilterActive = true;
      return;
    }
    if (this.tags.activeCount > 0) {
      this.displayControl.isAnyFilterActive = true;
      return;
    }
  }

  private sortRootArray(itemA: ActivityItemData, itemB: ActivityItemData): number {
    // sort by time
    if (this.displayControl.category === -2 || this.displayControl.sort === SortType.Time) {
      let dateA = this.getItemDate(itemA);
      let dateB = this.getItemDate(itemB);
      if (dateA == null && dateB == null) return 0;
      if (dateA == null) return 1;
      if (dateB == null) return -1;
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    }

    const a = this.courseData.activities[itemA.activityId];
    const b = this.courseData.activities[itemB.activityId];

    // sort by order and name
    if (this.displayControl.sort === SortType.Order) {
      if ((a.itemOrder == null && b.itemOrder == null) || a.itemOrder == b.itemOrder) {
        var diff = a.name.localeCompare(b.name, this.translate.getCurrentLang(), {
          sensitivity: 'accent',
        });
        if (diff < 0) return -1;
        if (diff > 0) return 1;
        return 0;
      }
      if (a.itemOrder == null) return 1;
      if (b.itemOrder == null) return -1;

      // sort by order
      if (a.itemOrder < b.itemOrder) return -1;
      if (a.itemOrder > b.itemOrder) return 1;
      return 0;
    }

    // sort by name
    var diff = a.name.localeCompare(b.name, this.translate.getCurrentLang(), {
      sensitivity: 'accent',
    });
    if (diff < 0) return -1;
    if (diff > 0) return 1;
    return 0;
  }

  private getItemDate(item: ActivityItemData, dateType: 'start' | 'end' = 'start'): Date | null {
    if (!item.isRunAct && item.accessId) {
      let dateParamName: keyof (typeof this.courseData.accesses)[number] = dateType === 'start' ? 'accessStart' : 'completeUntil';
      return this.courseData.accesses[item.accessId][dateParamName] ? new Date(this.courseData.accesses[item.accessId][dateParamName]!) : null;
    }
    if (this.courseData.extraData[item.activityId] && this.courseData.extraData[item.activityId].runs.length > 0) {
      let dateParamName: keyof (typeof this.courseData.actRuns)[number] = dateType === 'start' ? 'runStart' : 'runEnd';
      if (item.firstRunId && this.courseData.actRuns[item.firstRunId]) {
        return new Date(this.courseData.actRuns[item.firstRunId][dateParamName]!);
      }
      return new Date(this.courseData.actRuns[this.courseData.extraData[item.activityId].runs[0]][dateParamName]!);
    }
    return null;
  }
}

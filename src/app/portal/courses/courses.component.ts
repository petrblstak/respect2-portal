import { Component, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';

import {
  AuthService,
  CoreDataService,
  LaunchType,
  PlayActivityService,
  UserData,
  UtilsService,
  ActivityItemData,
  CourseData,
  CoursesService,
  LangService,
  Activity,
  ActivityAccess,
  appConstants,
} from 'cmp-portal-core';
import { RatingModalService } from '../act-detail/rating-modal/rating-modal.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CoursesFilterService, FilterUrlParams, SortType, StateType } from './courses-filter.service';
import { SearchFieldComponent } from './search-field/search-field.component';
import { environment } from '../../../environments/environment';

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
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss'],
  standalone: false,
})
export class CoursesComponent implements OnInit, OnDestroy {
  // Dependencies
  private readonly authService = inject(AuthService);
  private readonly coreDataService = inject(CoreDataService);
  private readonly playActivityService = inject(PlayActivityService);
  private readonly coursesService = inject(CoursesService);
  private readonly utilsService = inject(UtilsService);
  private readonly translate = inject(TranslateService);
  private readonly langService = inject(LangService);
  private readonly zone = inject(NgZone);
  private readonly ratingModalService = inject(RatingModalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly coursesFilterService = inject(CoursesFilterService);

  @ViewChild('searchFieldRef') searchFieldComponent!: SearchFieldComponent;

  // subscriptions
  private userSub!: Subscription;
  private langSub!: Subscription;
  private playActivitySub!: Subscription;
  private assignedDataSub!: Subscription;
  private resizeHandler = () => this.checkScreenSize();

  // Component data and state
  get uaStateCodeTables() {
    return this.coreDataService.coreData.CODE_TABLES.CtUserActivityState.idKey;
  }
  isCoursesLoading = true;
  isCoursePreparing = false;
  cmpUser!: UserData;
  courseData!: CourseData;
  launchNextCourseId: number | null = null;
  environmentVars = environment;
  isCourseFilterEnabled = environment.isCourseFilterEnabled;
  isCourseBannerEnabled = environment.isCourseBannerEnabled;
  isSectionFutureExisting = false;
  isSectionActionExisting = false;
  stateType = StateType;
  displayControl = {
    category: 0 as number,
    state: environment.courseSectionAllDisplayed ? StateType.All : environment.courseSectionFutureDisplayed ? StateType.Running : StateType.NonFinish,
    sort: SortType.Time,
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
  displayControlSort: SortType[] = [SortType.Alpha, SortType.Time, SortType.Order];

  rootItems: ActivityItemData[] = [];

  // View toggle: true = list, false = grid
  isListView: boolean = true;
  isSmallScreen = false;
  filterPanel: FilterPanel = {
    filterOrder: ['manager', 'form', 'fLength', 'term'],
    isActive: false,
    isSideOpen: false,
    filters: {
      manager: {
        filterName: 'CATALOG_FILTER_MANDATORY_HEADER',
        isExpanded: true,
        isActive: false,
        options: [
          { name: 'CATALOG_FILTER_MANDATORY_MANAGER', value: 'mng', isChecked: false },
          { name: 'CATALOG_FILTER_MANDATORY_OPTIONAL', value: 'opt', isChecked: false },
        ],
      },
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
    },
  };

  ngOnInit(): void {
    this.isCoursesLoading = true;
    this.userSub = this.authService.userData.subscribe(userData => {
      this.cmpUser = userData;
      if (userData.user) {
        this.coursesService.getAssignedCoursesV2('BOTH');
      }
    });
    this.playActivitySub = this.playActivityService.isActivityLaunching.subscribe(isPlaying => {
      this.isCoursePreparing = isPlaying;
    });
    this.assignedDataSub = this.coursesService.dataUpdate.subscribe(resultData => {
      this.dataUpdated(resultData);
    });
    this.langSub = this.langService.appCurrentLang.pipe(skip(1)).subscribe(() => {
      this.coursesService.updateLangBasedData('assigned');
    });
    this.checkScreenSize();
    window.addEventListener('resize', this.resizeHandler);
    // part of autoplay next course - left here for later
    // let nextCrs = localStorage.getItem(appConstants.STORAGE.COURSE_AUTO_PLAY);
    // if (nextCrs != null) {
    //   this.launchNextCourseId = parseInt(nextCrs);
    //   localStorage.removeItem(appConstants.STORAGE.COURSE_AUTO_PLAY);
    // }
    // console.log('launchNextCourseId = ' + this.launchNextCourseId);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
    this.userSub.unsubscribe();
    this.langSub.unsubscribe();
    this.playActivitySub.unsubscribe();
    this.assignedDataSub.unsubscribe();
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

  checkScreenSize() {
    this.isSmallScreen = window.innerWidth < 768;
    if (this.isSmallScreen) {
      this.setListView(false);
    }
  }

  // Add a method to switch view
  setListView(isList: boolean) {
    this.isListView = isList;
    this.updateUrlWithCurrentFilters();
  }

  changeStateDisplay(state: StateType) {
    // do not change state if user selected the same
    if (state === this.displayControl.state) return;
    const checkedState = this.checkSectionStateAllowed(state);
    this.displayControl.state = checkedState;
    this.filterRootCourses();
    this.updateUrlWithCurrentFilters();
  }

  changeCategoryDisplay(category: number) {
    this.displayControl.category = category;
    this.getTagsForCategory();
    this.filterRootCourses();
    this.updateUrlWithCurrentFilters();
  }

  changeSorting(sort: SortType) {
    this.displayControl.sort = sort;
    this.rootItems.sort(this.sortRootArray.bind(this));
    this.updateUrlWithCurrentFilters();
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
  }

  // //////////////////////////////
  // Sets and Activites functions
  // //////////////////////////////

  playCourse(event: { activityId: number; runId: number | null }) {
    // const accessId = this.courseData.activityData[event.activityId].accessId;
    const actIdToPlay = this.utilsService.getAccessToPlay(event.activityId, this.courseData);
    if (actIdToPlay === -1) {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_NOT_PLAYABLE'));
      return;
    }
    if (actIdToPlay === -2) {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_COMPLEX_COURSE'));
      return;
    }
    if (actIdToPlay === 0) {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_ALREADY_COMPLETED'));
      return;
    }
    const launchedAct = this.courseData.activities[actIdToPlay];
    const accessToPlay = this.courseData.activityData[actIdToPlay].accessId;
    if (!this.utilsService.canPlayActivity(launchedAct, this.courseData.accesses[accessToPlay])) {
      this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_PLAY_FORBIDDEN', { actName: launchedAct.name }));
      return;
    }

    // const lastCrsId = localStorage.getItem(appConstants.STORAGE.LAST_COURSE_PLAYED);
    // if (this.launchNextCourseId != null && lastCrsId != null && lastCrsId === launchedAct.id + '') {
    //   console.log('Detected looping course play id ' + lastCrsId + ' and terminated it.');
    //   localStorage.removeItem(appConstants.STORAGE.LAST_COURSE_PLAYED);
    //   this.launchNextCourseId = null;
    //   // TODO modal okno pro pripadne rozhodnuti opakovat?
    //   return;
    // }

    // this.playActivityService.startActivityLaunch();
    const startDate = new Date();
    switch (launchedAct.launchType) {
      case LaunchType.VIDEO:
        this.playActivityService.playVideoCourse(launchedAct).then(closeMessage => {
          this.finishModalPlayContent(closeMessage, startDate, accessToPlay, launchedAct);
        });
        break;
      case LaunchType.CODE:
        this.playActivityService.playCodeCourse(launchedAct).then(closeMessage => {
          this.finishModalPlayContent(closeMessage, startDate, accessToPlay, launchedAct);
        });
        break;
      case LaunchType.ITRIVIO:
        this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
        this.playActivityService.playItrivioCourse(launchedAct, accessToPlay);
        break;
      case LaunchType.FORM:
        this.playActivityService.playFormCourse(launchedAct, this.courseData.accesses[accessToPlay]).then(
          attemptObj => {
            if (attemptObj != null) {
              this.isCoursesLoading = true;
              this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
              this.coursesService.saveAttemptAndRefresh(attemptObj);
            }
          },
          dismissMessage => {
            console.log('Form modal dismissed: ' + dismissMessage);
          }
        );
        break;
      case LaunchType.SCORM:
        this.playActivityService.playScormCourse(launchedAct, this.courseData.accesses[accessToPlay], this.cmpUser!.user!, () => {
          this.isCoursesLoading = true;
          this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
          this.coursesService.getAssignedCoursesV2('BOTH');
        });
        break;
      case LaunchType.PDF:
        this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
        this.playActivityService.playPDFCourse(launchedAct, accessToPlay);
        break;
      case LaunchType.URL:
        const newWindow = this.playActivityService.playUrlCourse(launchedAct, accessToPlay);
        if (newWindow != null) {
          this.registerCourseWindow(newWindow, startDate, accessToPlay, launchedAct);
        }
        break;
      case LaunchType.FILE:
        this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
        this.playActivityService.playFileCourse(launchedAct);
        break;
      default:
        this.utilsService.showModalMessage(this.translate.instant('GENERAL_WARNING'), this.translate.instant('COURSES_ERROR_PLAY_NOT_READY'));
    }
  }

  isTypeActivity(activityId: number) {
    return this.utilsService.isTypeActivity(activityId, this.courseData);
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

  private finishModalPlayContent(closeMessage: string, startDate: Date, accessToPlay: number, launchedAct: Activity) {
    if (closeMessage === 'OK') {
      this.isCoursesLoading = true;
      this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
      this.coursesService.createBooleanAttemptAndRefreshV2(startDate, accessToPlay);
    }
  }

  private registerCourseWindow(windowObject: Window, startDate: Date, accessToPlay: number, launchedAct: Activity) {
    var interval = window.setInterval(() => {
      if (windowObject == null || windowObject.closed) {
        window.clearInterval(interval);
        this.isCoursesLoading = true;
        this.setRatingModalToLoad(this.courseData.accesses[accessToPlay], launchedAct);
        this.coursesService.createBooleanAttemptAndRefreshV2(startDate, accessToPlay);
      }
    }, 1000);
  }

  private dataUpdated(resultData: CourseData) {
    this.zone.run(() => {
      this.courseData = resultData;
      this.collectCategoryTags();

      // Precedence: URL > Service > Defaults
      const hasUrlParams = Object.keys(this.route.snapshot.queryParams).length > 0;

      // URL has parameters
      if (hasUrlParams) {
        // set filters from the url
        this.setFiltersFromUrl();
        // Clear stored filters as we're using URL params
        this.coursesFilterService.clearStoredFilters();
        // store current filters in service for potential later use
        const params = this.buildUrlFromFilters();
        this.coursesFilterService.storeCurrentFilters(params);
      }
      // url has no parameters but we have stored filters
      else if (this.coursesFilterService.hasStoredFilters()) {
        // get stored filters
        const storedFilters = this.coursesFilterService.getStoredFilters()!;
        // apply filters to controller
        this.applyStoredFilters(storedFilters);

        // Update URL to reflect current state
        this.updateUrlWithCurrentFilters();
      }
      // otherwise do nothing since we have no filters to apply

      // now filter the loaded courses based on filters we just set
      this.filterRootCourses();
      this.isCoursesLoading = false;
      this.checkAndOpenRatingModal();

      // conditional playing
      // implement later, now it was only working if Block was playing which only happens in Hobit
      // when I implement this as an option, conditional playing will be needed again...
      //   this.conditionalPlayNext(accessId);
    });
  }

  private collectCategoryTags() {
    this.categories.catObjects = {};
    this.categories.catOrder = [];
    this.tags.allTags = [];
    let allTagIds = {} as { [key: number]: boolean };

    for (let rootItem of this.courseData.actualRootItems) {
      if (this.courseData.extraData[rootItem.activityId]) {
        for (let tagObj of this.courseData.extraData[rootItem.activityId].tags) {
          if (tagObj.isCategory) {
            if (tagObj.cats && tagObj.cats.main) {
              rootItem.category = { id: tagObj.id, name: tagObj.localName! };
              this.courseData.activityData[rootItem.activityId] = rootItem;
              if (this.categories.catObjects[tagObj.id] == null) {
                this.categories.catObjects[tagObj.id] = tagObj.localName!;
                this.categories.catOrder.push(tagObj.id);
              }
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
    console.log('Categories and tags collected:', this.categories, this.tags);
  }

  // private setUrlFilters() {
  //   // console.log('myParams', this.route.snapshot.queryParams);
  //   if (this.route.snapshot.queryParams.catId) {
  //     let catNumber: number = parseInt(this.route.snapshot.queryParams.catId);
  //     if (this.categories.catObjects[catNumber] != null) {
  //       this.displayControl.category = catNumber;
  //       this.getTagsForCategory();
  //     }
  //   }
  // }

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

    // State
    if (params.state && Object.values(StateType).includes(params.state)) {
      const checkedState = this.checkSectionStateAllowed(params.state);
      this.displayControl.state = checkedState;
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

    // View
    if (params.view === 'grid') {
      this.isListView = false;
    }

    // Tags
    if (params.tags) {
      const tagIds = Array.isArray(params.tags) ? params.tags.map(t => parseInt(t)) : [parseInt(params.tags)];
      tagIds.forEach(tagId => {
        const tagIndex = this.tags.catTags.findIndex(t => t.tagId === tagId);
        if (tagIndex !== -1) {
          this.tags.catTags[tagIndex].isActive = true;
          this.tags.activeCount++;
        }
      });
    }

    // If we have active tags and we're in "All" category, make sure tags are visible
    if (this.tags.activeCount > 0 && this.displayControl.category === 0) {
      this.tags.isSubCatOpen = true;
    }

    // Filter panel options
    this.applyFilterPanelFromUrl(params);
  }

  private applyStoredFilters(filters: FilterUrlParams) {
    if (filters.catId !== undefined) {
      this.displayControl.category = filters.catId;
      this.getTagsForCategory();
    }
    if (filters.state) {
      const checkedState = this.checkSectionStateAllowed(filters.state);
      this.displayControl.state = checkedState;
    }
    if (filters.sort) {
      this.displayControl.sort = filters.sort;
    }
    if (filters.search) {
      this.displayControl.search = filters.search;
      // Update the search field UI
      this.updateSearchFieldValue(filters.search);
    }
    if (filters.view) {
      this.isListView = filters.view === 'list';
    }

    // Apply tags
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tagId => {
        const tagIndex = this.tags.catTags.findIndex(t => t.tagId === tagId);
        if (tagIndex !== -1) {
          this.tags.catTags[tagIndex].isActive = true;
          this.tags.activeCount++;
        }
      });
    }

    // If we have active tags and we're in "All" category, make sure tags are visible
    if (this.tags.activeCount > 0 && this.displayControl.category === 0) {
      this.tags.isSubCatOpen = true;
    }

    // Apply filter panel options
    this.applyFilterPanelFromStored(filters);
  }

  private applyFilterPanelFromUrl(params: any) {
    // Manager filter
    if (params.manager) {
      const managerValues = Array.isArray(params.manager) ? params.manager : params.manager.split(',');
      this.filterPanel.filters.manager.options.forEach(option => {
        option.isChecked = managerValues.includes(option.value);
      });
    }

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

    this.checkActiveFilterBlocks();
  }

  private applyFilterPanelFromStored(filters: FilterUrlParams) {
    // Manager filter
    if (filters.manager && filters.manager.length > 0) {
      this.filterPanel.filters.manager.options.forEach(option => {
        option.isChecked = filters.manager!.includes(option.value);
      });
    }

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

    this.checkActiveFilterBlocks();
  }

  private buildUrlFromFilters(): FilterUrlParams {
    const params: FilterUrlParams = {};

    // Category
    if (this.displayControl.category !== 0) {
      params.catId = this.displayControl.category;
    }

    // State
    if (this.displayControl.state !== StateType.All) {
      const checkedState = this.checkSectionStateAllowed(this.displayControl.state);
      params.state = checkedState;
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

    // View type
    if (!this.isListView) {
      params.view = 'grid';
    }

    // Filter panel options
    if (this.filterPanel.isActive) {
      // Manager filter
      const managerChecked = this.filterPanel.filters.manager.options.filter(o => o.isChecked).map(o => o.value);
      if (managerChecked.length > 0) {
        params.manager = managerChecked;
      }

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
    }

    return params;
  }

  private checkSectionStateAllowed(state: StateType): StateType {
    // if user selected future state and it is not allowed to be displayed based on environment settings, change it to non-finish to avoid showing empty section
    if (state === StateType.Future && !environment.courseSectionFutureDisplayed) return StateType.NonFinish;
    // if user selected all state and it is not allowed to be displayed based on environment settings, change it to non-finish
    if (state === StateType.All && !environment.courseSectionAllDisplayed) return StateType.NonFinish;
    return state;
  }

  private updateUrlWithCurrentFilters() {
    const params = this.buildUrlFromFilters();
    const queryParams = Object.keys(params).length > 0 ? this.coursesFilterService.buildQueryParams(params) : {};

    // Store current filters in service for later restoration
    this.coursesFilterService.storeCurrentFilters(params);

    this.router.navigate(['/portal/courses'], {
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

  private filterRootCourses() {
    let newRoot: ActivityItemData[] = [];
    this.isSectionFutureExisting = false;
    this.isSectionActionExisting = false;
    for (const rootItem of this.courseData.actualRootItems) {
      // check state
      let itemFits = true;
      // check if state exists - if not, the course will not be displayed anywhere
      if (rootItem.accessState == null) continue;

      // check if we should display Future and Action sections
      if (rootItem.accessState.category === StateType.Future && rootItem.accessState.name !== 'CHOOSE_RUN') {
        this.isSectionFutureExisting = true;
      }
      if (rootItem.accessState.name === 'CHOOSE_RUN') {
        this.isSectionActionExisting = true;
      }

      // now check the actual state of item and secide if it fits the filter or not
      if (this.displayControl.state !== StateType.All) {
        itemFits = false;
        switch (this.displayControl.state) {
          case StateType.NonFinish:
            if (rootItem.accessState.category != StateType.Finish) itemFits = true;
            break;
          case StateType.Finish:
            if (rootItem.accessState.category === StateType.Finish) itemFits = true;
            break;
          case StateType.Future:
            // here are displayed:
            // - courses with future state EXCEPT those in action state (CHOOSE_RUN) because they are in separate section
            // - courses with double access object for both actual AND future state - in this case we rely on environment variable which defines if courses with future access are displayed in future section (if not, they are displayed in actual state section based on their actual state access)
            if ((rootItem.accessState.category === StateType.Future && rootItem.accessState.name !== 'CHOOSE_RUN') || (environment.isCoursesWithFutureDisplayedInFuture && rootItem.future != null))
              itemFits = true;
            break;
          case StateType.Running:
            if (rootItem.accessState.category === StateType.Running) itemFits = true;
            break;
          case StateType.Action:
            if (rootItem.accessState.name === 'CHOOSE_RUN') itemFits = true;
            break;
          default:
            itemFits = false;
        }
      }

      // old code
      // if (this.displayControl.state !== StateType.All) {
      //   itemFits = false;
      //   if (this.displayControl.state === StateType.NonFinish) {
      //     if (rootItem.accessState.category != StateType.Finish) itemFits = true;
      //   } else {
      //     if (rootItem.accessState.category == this.displayControl.state) itemFits = true;
      //   }
      // }
      if (!itemFits) continue;

      // check category
      itemFits = true;
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
      itemFits = true;
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
        //filter course from manager or optional
        if (this.filterPanel.filters.manager.isActive) {
          itemFits = false;
          let accessObjCustData = this.courseData.accesses[rootItem.accessId]?.customDataObj;
          for (let option of this.filterPanel.filters.manager.options) {
            if (option.isChecked) {
              if (option.value === 'mng' && accessObjCustData && accessObjCustData['from_manager'] === true) {
                itemFits = true;
                break;
              } else if (option.value === 'opt' && (accessObjCustData == null || accessObjCustData['from_manager'] !== true)) {
                itemFits = true;
                break;
              }
            }
          }
        }
        if (!itemFits) continue;

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
      }

      if (itemFits) newRoot.push(rootItem);
    }
    this.rootItems = newRoot;

    // sort all root items
    this.rootItems.sort(this.sortRootArray.bind(this));
    this.checkAnyFilterActive();
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
    const a = this.courseData.activities[itemA.activityId];
    const b = this.courseData.activities[itemB.activityId];

    // sort by time
    if (this.displayControl.sort === SortType.Time) {
      let dateA = this.getItemDate(itemA, 'end');
      let dateB = this.getItemDate(itemB, 'end');
      if (dateA == null && dateB == null) return this.sortByName(a, b);
      if (dateA == null) return 1;
      if (dateB == null) return -1;
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return this.sortByName(a, b);
    }

    // sort by order and name
    if (this.displayControl.sort === SortType.Order) {
      if ((a.itemOrder == null && b.itemOrder == null) || a.itemOrder == b.itemOrder) {
        return this.sortByName(a, b);
      }
      if (a.itemOrder == null) return 1;
      if (b.itemOrder == null) return -1;

      // sort by order
      if (a.itemOrder < b.itemOrder) return -1;
      if (a.itemOrder > b.itemOrder) return 1;
      return 0;
    }

    // sort by name
    return this.sortByName(a, b);
  }

  sortByName(a: Activity, b: Activity) {
    var diff = a.name.localeCompare(b.name, this.translate.getCurrentLang(), {
      sensitivity: 'accent',
    });
    if (diff < 0) return -1;
    if (diff > 0) return 1;
    return 0;
  }

  sortCatsByName(a: number, b: number) {
    var diff = this.categories.catObjects[a].localeCompare(this.categories.catObjects[b], this.translate.getCurrentLang(), {
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

  private setRatingModalToLoad(accessObj: ActivityAccess, activityObj: Activity) {
    if (activityObj.ratingPreset && accessObj.rating == null && accessObj.ratingText == null) {
      let cData = {
        accId: accessObj.id,
        usrId: this.cmpUser.user!.id,
      };
      localStorage.setItem(appConstants.STORAGE.COMPETENT_REVIEW_OPEN, JSON.stringify(cData));
    }
  }

  private checkAndOpenRatingModal() {
    let revCookie = localStorage.getItem(appConstants.STORAGE.COMPETENT_REVIEW_OPEN);
    if (revCookie != null) {
      let cData = JSON.parse(revCookie);
      if (cData.usrId == this.cmpUser.user!.id) {
        let accessObj = this.courseData.accesses[cData.accId];
        let activityObj = this.courseData.activities[accessObj.idActivityMt];
        localStorage.removeItem(appConstants.STORAGE.COMPETENT_REVIEW_OPEN);
        if (accessObj?.passed && accessObj.rating == null && accessObj.ratingText == null && activityObj?.ratingPreset != null) {
          this.ratingModalService.openRatingModal(accessObj.id, activityObj, null, null).subscribe(
            (result: any) => {
              console.log('Rating submitted:', result);
              // Handle the rating submission
              if (result && result.rating) {
                this.ratingModalService.updateRating(accessObj.id, result.rating, result.ratingText).subscribe(response => {
                  if (response) {
                    // Show confirmation message
                    this.utilsService.showModalMessage(this.translate.instant('RATING_MODAL_SUBMITTED_HEADER'), this.translate.instant('RATING_MODAL_SUBMITTED_TEXT'));
                  } else {
                    // Handle error case
                    this.utilsService.showAndLogError(this.translate.instant('RATING_MODAL_ERROR'));
                  }
                });
              }
            },
            (dismissReason: any) => {
              console.log('Rating modal dismissed:', dismissReason);
            }
          );
        }
      }
    }
  }

  // private conditionalPlayNext(accessId: number) {
  //   const currentAct = this.courseData.activities[this.courseData.accesses[accessId].idActivityMt];
  //   if (
  //     this.coreDataService.coreData.CODE_TABLES.CtActivityType.idKey[currentAct.idCtActivityType].name === 'ACTIVITY'
  //   ) {
  //     return;
  //   } else if (
  //     this.coreDataService.coreData.CODE_TABLES.CtActivityType.idKey[currentAct.idCtActivityType].name === 'BLOCK'
  //   ) {
  //     this.playCourse(accessId);
  //   } else {
  //     return;
  //   }
  // }
}

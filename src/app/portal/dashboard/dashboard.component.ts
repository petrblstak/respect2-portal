import { Component, NgZone, OnDestroy, OnInit, ElementRef, Renderer2, ViewChild, AfterViewInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { Activity, ActivityItemData, AuthService, CoreDataService, CourseData, CoursesService, DashboardService, FirstNameService, LaunchType, SignpostData, UserData } from 'cmp-portal-core';
import { environment } from '../../../environments/environment';

const CARD_WIDTH = 413; // width of the card in px, used for carousel scrolling
const CARD_WIDTH_SM = 330; // width of the card in px, used for carousel scrolling
const NUM_DAYS_BEFORE_CERT_ENDS = 7; // how many days before the end of the certificate validity we want to show the reminder

const AninymousUser = {
  cs: 'Anonyme',
  en: 'Anonymous',
  sk: 'Anonym',
} as { [lang: string]: string };

@Component({
  selector: 'cmp-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: false,
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  // Dependencies
  private readonly authService = inject(AuthService);
  private readonly coreDataService = inject(CoreDataService);
  private readonly coursesService = inject(CoursesService);
  private readonly dashboardService = inject(DashboardService);
  private readonly translate = inject(TranslateService);
  private readonly zone = inject(NgZone);
  private readonly firstNameService = inject(FirstNameService);
  private readonly router = inject(Router);
  private readonly renderer = inject(Renderer2);
  private readonly el = inject(ElementRef);

  @ViewChild('dashboardContainer', { static: false }) dashboardContainer!: ElementRef<HTMLElement>;

  // subscriptions
  private userSub!: Subscription;
  private dashDataSub!: Subscription;
  private bannerDataSub!: Subscription;
  private signpostDataSub!: Subscription;
  private carouselEventListeners: { [carouselId: string]: Array<() => void> } = {};
  private resizeHandler = () => this.checkScreenSize();

  // Component data and state
  isDataLoading = true;
  isBannerLoading = true;
  isSignpostLoading = true;
  cmpUser!: UserData;
  activityData!: CourseData;
  bannerData!: CourseData;
  signpostData: SignpostData = {};

  dashFolderIds = environment.dashboardFolders;
  isSmallScreen = false;
  bannerParamLinkId: number | null = null;

  userFirstName!: string;
  completionData = {
    tagIds: {
      mandatory: null as number | null,
      manager: null as number | null,
      optional: null as number | null,
      certs: null as number | null,
    },
    sections: {
      all: { total: 0, completed: 0, percent: 0 },
      mandatory: { total: 0, completed: 0, percent: 0 },
      manager: { total: 0, completed: 0, percent: 0 },
      optional: { total: 0, completed: 0, percent: 0 },
      certs: { total: 0, completed: 0 },
    },
    stateMsg: {
      top: 1 as 1 | 2 | 3 | 4,
      mandatory: 1 as 1 | 2 | 3,
      manager: 1 as 1 | 2 | 3,
      optional: 1 as 1 | 2 | 3,
    },
    reminderMsg: {
      mandatory: {
        dueDate: false,
        file: false,
        term: false,
      },
      optional: {
        dueDate: false,
        file: false,
        term: false,
      },
      manager: {
        dueDate: false,
        file: false,
        term: false,
      },
      certs: {
        dueDateSoon: false,
        dueDateAfter: false,
      },
    },
  };

  ngOnInit(): void {
    // Default anonymous name based on current language (covers no-user or no-firstName cases)
    this.userFirstName = AninymousUser[this.translate.getCurrentLang()] || AninymousUser['cs'];

    this.isDataLoading = true;
    this.isBannerLoading = true;
    this.isSignpostLoading = true;
    this.userSub = this.authService.userData.subscribe(userData => {
      this.cmpUser = userData;
      if (userData.user?.firstName != null) {
        if (this.translate.getCurrentLang() != 'en') {
          this.userFirstName = this.firstNameService.transformNameToCallForm(userData.user.firstName);
        } else {
          this.userFirstName = userData.user.firstName;
        }
      }
      if (userData.user) {
        this.coursesService.getAssignedCoursesV2('NO_FUTURE');
        this.dashboardService.getBannerCourses(environment.dashboardFolders.banner);
        this.dashboardService.getSignpostCourses([environment.dashboardFolders.library, environment.dashboardFolders.community]);
      }
    });
    this.dashDataSub = this.coursesService.dataUpdate.subscribe(resultData => {
      this.dataUpdated(resultData);
    });
    this.bannerDataSub = this.dashboardService.dataUpdate.subscribe(bannerData => {
      this.bannerUpdated(bannerData);
    });
    this.signpostDataSub = this.dashboardService.signpostUpdate.subscribe(signpostData => {
      this.signpostUpdated(signpostData);
    });
    this.checkScreenSize();
    window.addEventListener('resize', this.resizeHandler);
  }

  ngAfterViewInit(): void {
    // Initialize carousels after view is initialized if signpost data is already available
    if (!this.isSignpostLoading && this.signpostData) {
      setTimeout(() => this.initSignpostCarousels(), 0);
    }
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
    this.userSub.unsubscribe();
    this.dashDataSub.unsubscribe();
    this.bannerDataSub.unsubscribe();
    this.signpostDataSub.unsubscribe();

    // Clean up all carousel event listeners
    Object.values(this.carouselEventListeners).forEach(listeners => {
      listeners.forEach(removeListener => removeListener());
    });
    this.carouselEventListeners = {};
  }

  checkScreenSize() {
    this.isSmallScreen = window.innerWidth < 575;
  }

  private initSignpostCarousels() {
    if (this.dashboardContainer) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        this.initializeCarousel('id-cat-carousel-library');
        this.initializeCarousel('id-cat-carousel-community');
      }, 0);
    }
  }

  private initializeCarousel(elId: string) {
    // Clean up existing listeners for this carousel
    if (this.carouselEventListeners[elId]) {
      this.carouselEventListeners[elId].forEach(removeListener => removeListener());
    }
    this.carouselEventListeners[elId] = [];

    let actualCardWidth = CARD_WIDTH;
    if (this.isSmallScreen) {
      actualCardWidth = CARD_WIDTH_SM;
    }

    // Use native querySelector within the component's element
    const containerElement = this.dashboardContainer?.nativeElement || this.el.nativeElement;
    const carElement = containerElement.querySelector(`#${elId} .carousel-inner`) as HTMLElement;
    const carElementPrev = containerElement.querySelector(`#${elId} .carousel-control-prev`) as HTMLElement;
    const carElementNext = containerElement.querySelector(`#${elId} .carousel-control-next`) as HTMLElement;

    if (!carElement || !carElementNext || !carElementPrev) return;

    // Get carousel dimensions
    const carouselWidthScroll = carElement.scrollWidth;
    const carouselWidthVisible = carElement.clientWidth;

    // Initialize scroll position using Renderer2
    this.renderer.setProperty(carElement, 'scrollLeft', 0);

    const cardWidth = actualCardWidth + 20;
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
    this.carouselEventListeners[elId].push(nextClickListener);
    this.carouselEventListeners[elId].push(prevClickListener);
  }

  goToCourses(catNumber: number | null = null, managerOption?: string) {
    let queryParams = {} as any;
    if (catNumber != null) {
      queryParams['catId'] = catNumber;
    }
    if (managerOption != undefined) {
      queryParams['manager'] = managerOption;
    }
    this.router.navigate(['/portal/courses'], { queryParams });
  }

  getSignpostHeaderImg(actObj: Activity): string {
    if (actObj.imageUrl != null) {
      return environment.remoteServer + actObj.imageUrl;
    }
    return 'assets/img/dash/placeholder.jpg';
  }

  private dataUpdated(resultData: CourseData) {
    this.zone.run(() => {
      console.log('Dash data', resultData);
      this.activityData = resultData;
      this.collectCategoryTags();
      this.crunchCourseNumbers();
      this.isDataLoading = false;
    });
  }

  private signpostUpdated(resultData: { [key: string]: Activity[] }) {
    this.zone.run(() => {
      this.signpostData = resultData;
      this.isSignpostLoading = false;
      this.initSignpostCarousels();
      // console.log('Signpost data updated', this.signpostData);
    });
  }

  private bannerUpdated(resultData: CourseData) {
    this.zone.run(() => {
      this.bannerData = resultData;
      Object.values(this.coreDataService.coreData.actOptParams).forEach(subParams => {
        Object.keys(subParams).forEach(key => {
          if (key === 'calendarLink') this.bannerParamLinkId = subParams[key];
        });
      });
      this.isBannerLoading = false;
    });
  }

  private collectCategoryTags() {
    for (let rootItem of this.activityData.actualRootItems) {
      if (this.activityData.extraData[rootItem.activityId]) {
        for (let tagObj of this.activityData.extraData[rootItem.activityId].tags) {
          if (tagObj.isCategory) {
            if (tagObj.cats && tagObj.cats.main) {
              rootItem.category = { id: tagObj.id, name: tagObj.localName! };
              this.activityData.activityData[rootItem.activityId] = rootItem;
            }
          }
        }
      }
    }
  }

  private crunchCourseNumbers() {
    // indetify categories across languages
    Object.values(this.activityData.tags).forEach(tagObj => {
      if (tagObj.isCategory && tagObj.cats != null && tagObj.cats.main != null) {
        if (tagObj.name.indexOf('main::Povinné vzdělávání') > -1) {
          this.completionData.tagIds.mandatory = tagObj.id;
        } else if (tagObj.name.indexOf('main::Kurzy z katalogu') > -1) {
          this.completionData.tagIds.optional = tagObj.id;
          this.completionData.tagIds.manager = tagObj.id;
        } else if (tagObj.name.indexOf('main::Certifikace') > -1) {
          this.completionData.tagIds.certs = tagObj.id;
        }
      }
    });

    // count activities in categories
    let today = new Date();
    Object.values(this.activityData.activityData).forEach(actObj => {
      if (actObj.category) {
        if (actObj.category.id === this.completionData.tagIds.mandatory) {
          this.completionData.sections.mandatory.total++;
          this.completionData.sections.all.total++;
          if (actObj.completed) {
            this.completionData.sections.mandatory.completed++;
            this.completionData.sections.all.completed++;
          }
          this.checkActivityReminders(actObj, 'mandatory', today);
        } else if (actObj.category.id === this.completionData.tagIds.optional) {
          let accessObjCustData = this.activityData.accesses[actObj.accessId]?.customDataObj;
          if (accessObjCustData && accessObjCustData['from_manager'] === true) {
            this.completionData.sections.manager.total++;
            this.completionData.sections.all.total++;
            if (actObj.completed) {
              this.completionData.sections.manager.completed++;
              this.completionData.sections.all.completed++;
            }
            this.checkActivityReminders(actObj, 'manager', today);
          } else {
            this.completionData.sections.optional.total++;
            this.completionData.sections.all.total++;
            if (actObj.completed) {
              this.completionData.sections.optional.completed++;
              this.completionData.sections.all.completed++;
            }
            this.checkActivityReminders(actObj, 'optional', today);
          }
        } else if (actObj.category.id === this.completionData.tagIds.certs) {
          this.completionData.sections.certs.total++;
          if (actObj.completed) {
            this.completionData.sections.certs.completed++;
          }
          this.checkActivityReminders(actObj, 'certs', today);
        }
      }

      // count percentages for all sections for progress bars display
      if (this.completionData.sections.all.total > 0) {
        this.completionData.sections.all.percent = Math.round((this.completionData.sections.all.completed / this.completionData.sections.all.total) * 100);
      } else {
        this.completionData.sections.all.percent = 0;
      }
      if (this.completionData.sections.mandatory.total > 0) {
        this.completionData.sections.mandatory.percent = Math.round((this.completionData.sections.mandatory.completed / this.completionData.sections.mandatory.total) * 100);
      } else {
        this.completionData.sections.mandatory.percent = 0;
      }
      if (this.completionData.sections.optional.total > 0) {
        this.completionData.sections.optional.percent = Math.round((this.completionData.sections.optional.completed / this.completionData.sections.optional.total) * 100);
      } else {
        this.completionData.sections.optional.percent = 0;
      }
      if (this.completionData.sections.manager.total > 0) {
        this.completionData.sections.manager.percent = Math.round((this.completionData.sections.manager.completed / this.completionData.sections.manager.total) * 100);
      } else {
        this.completionData.sections.manager.percent = 0;
      }

      // set states for block status messages
      if (this.completionData.sections.mandatory.total > 0 && this.completionData.sections.mandatory.percent < 100) {
        this.completionData.stateMsg.top = 2;
      } else if (this.completionData.sections.optional.total > 0 && this.completionData.sections.optional.percent < 100) {
        this.completionData.stateMsg.top = 3;
      } else {
        this.completionData.stateMsg.top = 4;
      }

      if (this.completionData.sections.mandatory.total > 0) {
        if (this.completionData.sections.mandatory.percent < 100) {
          this.completionData.stateMsg.mandatory = 2;
        } else {
          this.completionData.stateMsg.mandatory = 3;
        }
      }

      if (this.completionData.sections.manager.total > 0) {
        if (this.completionData.sections.manager.percent < 100) {
          this.completionData.stateMsg.manager = 2;
        } else {
          this.completionData.stateMsg.manager = 3;
        }
      }

      if (this.completionData.sections.optional.total > 0) {
        if (this.completionData.sections.optional.percent < 100) {
          this.completionData.stateMsg.optional = 2;
        } else {
          this.completionData.stateMsg.optional = 3;
        }
      }
    });
    console.log('Crunching course numbers for dashboard', this.completionData);
  }

  private checkActivityReminders(act: ActivityItemData, section: 'mandatory' | 'manager' | 'optional' | 'certs', today: Date) {
    if (section === 'certs') {
      if (this.completionData.reminderMsg.certs.dueDateSoon === false) {
        // activity is completed
        if (act.completed) {
          let accObj = this.activityData.accesses[act.accessId];
          let validUntil = null as Date | null;
          if (accObj.successValidUntil) {
            validUntil = new Date(accObj.successValidUntil);
          }
          if (validUntil && validUntil > today) {
            // if the certificate is valid and the date is within NUM_DAYS_BEFORE_CERT_ENDS, set reminder flag
            let daysLeft = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 3600 * 24));
            if (daysLeft <= NUM_DAYS_BEFORE_CERT_ENDS) {
              this.completionData.reminderMsg.certs.dueDateSoon = true;
            }
          }
        }
      }
      if (this.completionData.reminderMsg.certs.dueDateAfter === false) {
        // activity is completed
        if (act.completed) {
          let accObj = this.activityData.accesses[act.accessId];
          let validUntil = null as Date | null;
          if (accObj.successValidUntil) {
            validUntil = new Date(accObj.successValidUntil);
          }
          if (validUntil && validUntil < today) {
            // if the certificate is not valid anymore, set reminder flag
            this.completionData.reminderMsg.certs.dueDateAfter = true;
          }
        }
      }
    } else {
      if (this.completionData.reminderMsg[section].dueDate === false) {
        // activity is not completed
        if (!act.completed) {
          let accObj = this.activityData.accesses[act.accessId];
          // get the completeUntil date, either from originalCompleteUntil (if it has been already prolonged) or from completeUntil
          let completeUntil = null as Date | null;
          if (accObj.originalCompleteUntil) {
            completeUntil = new Date(accObj.originalCompleteUntil);
          } else if (accObj.completeUntil) {
            completeUntil = new Date(accObj.completeUntil);
          }
          // if completeUntil is set and is sooner than today, set reminder flag
          if (completeUntil && completeUntil < today) {
            this.completionData.reminderMsg[section].dueDate = true;
          }
        }
      }
      if (this.completionData.reminderMsg[section].file === false) {
        // activity is not completed
        if (!act.completed) {
          let actObj = this.activityData.activities[act.activityId];
          // if activity is in launched state (once the file is uploaded, it switches to the EVALUATION state) and the launch type is FILE, set the reminder flag
          if (act.accessState?.name === 'LAUNCH' && actObj.launchType === LaunchType.FILE) {
            this.completionData.reminderMsg[section].file = true;
          }
        }
      }
      if (this.completionData.reminderMsg[section].term === false) {
        if (act.accessState?.name === 'CHOOSE_RUN') {
          this.completionData.reminderMsg[section].term = true;
        }
      }
    }
  }
}

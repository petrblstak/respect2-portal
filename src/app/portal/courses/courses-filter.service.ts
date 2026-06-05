import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

enum SortType {
  Alpha = 'alpha',
  Time = 'time',
  Order = 'order',
}

enum StateType {
  All = 'all',
  NonFinish = 'non-finished',
  Finish = 'finished',
  Future = 'future',
  Running = 'running',
  Action = 'action',
}

interface FilterUrlParams {
  catId?: number;
  state?: StateType;
  sort?: SortType;
  search?: string;
  tags?: number[];
  manager?: string[];
  form?: string[];
  fLength?: string[];
  term?: number[];
  view?: 'list' | 'grid';
}

@Injectable({
  providedIn: 'root',
})
export class CoursesFilterService {
  // Dependencies
  private readonly router = inject(Router);

  // Component data and state
  private storedFilters: FilterUrlParams | null = null;
  // private isNavigatingFromInternal = false;

  // For internal navigation with clean URLs
  // setFiltersAndNavigate(filters: FilterUrlParams) {
  //   this.storedFilters = { ...filters };
  //   this.isNavigatingFromInternal = true;
  //   this.router.navigate(['/portal/courses']);
  // }

  // For direct filter setting without navigation
  storeCurrentFilters(filters: FilterUrlParams) {
    this.storedFilters = { ...filters };
  }

  // For navigation with URL parameters (shareable)
  navigateWithUrlParams(filters: FilterUrlParams) {
    const queryParams = this.buildQueryParams(filters);
    this.router.navigate(['/portal/courses'], { queryParams });
  }

  getStoredFilters(): FilterUrlParams | null {
    return this.storedFilters ? { ...this.storedFilters } : null;
  }

  clearStoredFilters() {
    this.storedFilters = null;
    // this.isNavigatingFromInternal = false;
  }

  hasStoredFilters(): boolean {
    return this.storedFilters !== null;
  }

  // isInternalNavigation(): boolean {
  //   return this.isNavigatingFromInternal;
  // }

  buildQueryParams(filters: FilterUrlParams): any {
    const params: any = {};

    if (filters.catId && filters.catId !== 0) params.catId = filters.catId;
    if (filters.state && filters.state !== StateType.All) params.state = filters.state;
    if (filters.sort && filters.sort !== SortType.Order) params.sort = filters.sort;
    if (filters.search) params.search = filters.search;
    if (filters.tags && filters.tags.length > 0) params.tags = filters.tags.join(',');
    if (filters.view && filters.view !== 'list') params.view = filters.view;

    // Filter panel params
    if (filters.manager && filters.manager.length > 0) {
      params.manager = filters.manager.join(',');
    }
    if (filters.form && filters.form.length > 0) {
      params.form = filters.form.join(',');
    }
    if (filters.fLength && filters.fLength.length > 0) {
      params.fLength = filters.fLength.join(',');
    }
    if (filters.term && filters.term.length > 0) {
      params.term = filters.term.join(',');
    }

    return params;
  }
}

export { FilterUrlParams, SortType, StateType };

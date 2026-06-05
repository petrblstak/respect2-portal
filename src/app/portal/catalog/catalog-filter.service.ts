import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

enum SortType {
  Alpha = 'alpha',
  Time = 'time',
  Order = 'order',
}

interface CatalogFilterUrlParams {
  showAssigned?: boolean;
  catId?: number;
  sort?: SortType;
  search?: string;
  tags?: number[];
  isSubCatOpen?: boolean;
  form?: string[];
  fLength?: string[];
  term?: number[];
  special?: number[];
  signup?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class CatalogFilterService {
  // Dependencies
  private readonly router = inject(Router);

  private storedFilters: CatalogFilterUrlParams | null = null;
  // private isNavigatingFromInternal = false;

  // For internal navigation with clean URLs
  // setFiltersAndNavigate(filters: CatalogFilterUrlParams) {
  //   this.storedFilters = { ...filters };
  //   this.isNavigatingFromInternal = true;
  //   this.router.navigate(['/portal/catalog']);
  // }

  // For direct filter setting without navigation
  storeCurrentFilters(filters: CatalogFilterUrlParams) {
    this.storedFilters = { ...filters };
  }

  // For navigation with URL parameters (shareable)
  navigateWithUrlParams(filters: CatalogFilterUrlParams) {
    const queryParams = this.buildQueryParams(filters);
    this.router.navigate(['/portal/catalog'], { queryParams });
  }

  getStoredFilters(): CatalogFilterUrlParams | null {
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

  buildQueryParams(filters: CatalogFilterUrlParams): any {
    const params: any = {};

    // Show assigned toggle
    if (filters.showAssigned !== undefined) {
      params.showAssigned = filters.showAssigned;
    }

    // Category
    if (filters.catId && filters.catId !== 0) {
      params.catId = filters.catId;
    }

    // Sort
    if (filters.sort && filters.sort !== SortType.Order) {
      params.sort = filters.sort;
    }

    // Search
    if (filters.search) {
      params.search = filters.search;
    }

    // Tags
    if (filters.tags && filters.tags.length > 0) {
      params.tags = filters.tags.join(',');
    }

    // Tag section open state
    if (filters.isSubCatOpen !== undefined) {
      params.isSubCatOpen = filters.isSubCatOpen;
    }

    // Filter panel options
    if (filters.form && filters.form.length > 0) {
      params.form = filters.form.join(',');
    }
    if (filters.fLength && filters.fLength.length > 0) {
      params.fLength = filters.fLength.join(',');
    }
    if (filters.term && filters.term.length > 0) {
      params.term = filters.term.join(',');
    }
    if (filters.special && filters.special.length > 0) {
      params.special = filters.special.join(',');
    }
    if (filters.signup && filters.signup.length > 0) {
      params.signup = filters.signup.join(',');
    }

    return params;
  }
}

export { CatalogFilterUrlParams, SortType };

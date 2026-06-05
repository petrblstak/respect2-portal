import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'cmp-search-field',
    templateUrl: './search-field.component.html',
    styleUrl: './search-field.component.scss',
    standalone: false
})
export class SearchFieldComponent implements OnInit {
  @Input() initialValue: string | null = null;
  @Output() searchChanged = new EventEmitter<{
    searchTerm: null | string;
  }>();
  searchStringChanged = new Subject<string>();
  searchTerm: null | string = null;

  ngOnInit(): void {
    // Set initial value if provided
    if (this.initialValue) {
      this.searchTerm = this.initialValue;
    }

    this.searchStringChanged.pipe(debounceTime(300), distinctUntilChanged()).subscribe((query) => {
      console.log('this.searchTerm', query, this.searchTerm);
      this.runSearch();
    });
  }

  runSearch() {
    this.searchChanged.emit({
      searchTerm: this.searchTerm,
    });
  }

  onSearchChange(query: string) {
    this.searchStringChanged.next(query);
  }

  clearSearch() {
    this.searchTerm = null;
    this.runSearch();
  }

  // Method to programmatically set the search term
  setSearchTerm(value: string | null) {
    this.searchTerm = value;
  }
}

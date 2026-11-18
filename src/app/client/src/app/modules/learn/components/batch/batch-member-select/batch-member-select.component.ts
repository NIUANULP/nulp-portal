import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

/**
 * Multi-select for batch members with checkboxes, "Select all" and a
 * scrollable, fixed-height area for the selected members.
 */
@Component({
  selector: 'app-batch-member-select',
  templateUrl: './batch-member-select.component.html',
  styleUrls: ['./batch-member-select.component.scss']
})
export class BatchMemberSelectComponent {
  /** Users returned by the latest search */
  @Input() users: any[] = [];
  /** User ids that must not be offered (e.g. selected mentors) */
  @Input() excludeIds: string[] = [];
  /** Currently selected users (objects with id, name, avatar, otherDetail) */
  @Input() selectedUsers: any[] = [];
  /** Selected user ids that cannot be unselected */
  @Input() lockedIds: string[] = [];
  @Input() disabled = false;
  /** True while more users are still being fetched */
  @Input() loading = false;
  @Input() placeholder = '';
  @Input() selectAllLabel = 'Select all';
  @Input() inputId = 'userSelList';

  @Output() selectedUsersChange = new EventEmitter<any[]>();
  @Output() search = new EventEmitter<string>();

  isOpen = false;
  query = '';

  constructor(private elementRef: ElementRef) { }

  get visibleUsers(): any[] {
    const excluded = this.excludeIds || [];
    return (this.users || []).filter(user => !excluded.includes(user.id));
  }

  get selectedCount(): number {
    return (this.selectedUsers || []).length;
  }

  get allVisibleSelected(): boolean {
    const visible = this.visibleUsers;
    return visible.length > 0 && visible.every(user => this.isSelected(user.id));
  }

  get someVisibleSelected(): boolean {
    return !this.allVisibleSelected && this.visibleUsers.some(user => this.isSelected(user.id));
  }

  /** True when "Clear all" would remove at least one user */
  get canClearAll(): boolean {
    return (this.selectedUsers || []).some(user => !this.isLocked(user.id));
  }

  isLocked(id: string): boolean {
    return (this.lockedIds || []).includes(id);
  }

  isSelected(id: string): boolean {
    return (this.selectedUsers || []).some(user => user.id === id);
  }

  open() {
    if (!this.disabled) {
      this.isOpen = true;
    }
  }

  toggleOpen() {
    this.isOpen ? (this.isOpen = false) : this.open();
  }

  onQueryChange(value: string) {
    this.query = value;
    this.open();
    this.search.emit(value);
  }

  toggleUser(user: any) {
    if (this.disabled) {
      return;
    }
    if (this.isSelected(user.id)) {
      if (this.isLocked(user.id)) {
        return;
      }
      this.emit(this.selectedUsers.filter(selected => selected.id !== user.id));
    } else {
      this.emit([...(this.selectedUsers || []), user]);
    }
  }

  toggleSelectAll(checkbox?: HTMLInputElement) {
    if (this.disabled) {
      return;
    }
    const visible = this.visibleUsers;
    if (this.allVisibleSelected) {
      const visibleIds = visible.map(user => user.id);
      this.emit(this.selectedUsers.filter(user => !visibleIds.includes(user.id) || this.isLocked(user.id)));
    } else {
      const toAdd = visible.filter(user => !this.isSelected(user.id));
      if (toAdd.length) {
        this.emit([...(this.selectedUsers || []), ...toAdd]);
      }
    }
    // when the locked users mean nothing changed, the [checked]/[indeterminate] bindings keep their
    // old values and Angular would leave the native checkbox out of sync, so set it directly
    if (checkbox) {
      checkbox.checked = this.allVisibleSelected;
      checkbox.indeterminate = this.someVisibleSelected;
    }
  }

  remove(user: any) {
    if (!this.disabled && !this.isLocked(user.id)) {
      this.emit(this.selectedUsers.filter(selected => selected.id !== user.id));
    }
  }

  clearAll() {
    if (!this.disabled) {
      this.emit(this.selectedUsers.filter(user => this.isLocked(user.id)));
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('keydown.escape')
  onEscape() {
    this.isOpen = false;
  }

  private emit(users: any[]) {
    this.selectedUsers = users;
    this.selectedUsersChange.emit(users);
  }
}

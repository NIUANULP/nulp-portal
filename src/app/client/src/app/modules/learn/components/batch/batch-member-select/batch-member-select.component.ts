import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { MatDatepicker } from '@angular/material/datepicker';
import { from, Subject } from 'rxjs';
import { concatMap, map, takeUntil, toArray } from 'rxjs/operators';
import { UserService } from '@sunbird/core';
import { CourseBatchService } from '../../../services/course-batch/course-batch.service';

/** Result of adding members from an uploaded CSV of user ids */
export interface IMemberImportSummary {
  fileName: string;
  /** ids of the users this upload selected (used by "Undo") */
  addedIds: string[];
  /** added users whose root org differs from the current user's */
  addedFromOtherOrgs: number;
  alreadyInBatch: number;
  alreadySelected: number;
  mentors: number;
  self: number;
  /** ids with no active user */
  notFound: string[];
}

/**
 * Batch member picker: search with checkboxes and "Select all", a "Joined since" filter, CSV upload
 * of user ids, and a scrollable list of the selected members (existing members are locked).
 */
@Component({
  selector: 'app-batch-member-select',
  templateUrl: './batch-member-select.component.html',
  styleUrls: ['./batch-member-select.component.scss']
})
export class BatchMemberSelectComponent implements OnDestroy {
  /** NULP user ids are UUIDs; anything else in a CSV (names, emails, headers) is ignored */
  static readonly USER_ID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  /** ids looked up per user search request */
  static readonly IMPORT_CHUNK_SIZE = 200;
  static readonly MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

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
  /** "Joined since" filter as yyyy-mm-dd (local date), empty when off */
  joinedSince = '';
  /** joinedSince as a Date for the calendar; kept as a field so the binding stays stable */
  joinedSinceDate: Date | null = null;
  /** Latest day the calendar allows: today */
  readonly maxJoinedDate = new Date();

  @ViewChild('joinedPicker') joinedPicker: MatDatepicker<Date>;

  /** Whether the existing (locked) members are listed; folded by default so new picks stand out */
  showLocked = false;

  /** CSV upload state */
  importing = false;
  importingFileName = '';
  importError = '';
  importSummary: IMemberImportSummary | null = null;
  showNotFound = false;
  notFoundCopied = false;

  /** Join time (ms) per user object, parsed once */
  private joinedAtCache = new WeakMap<any, number | null>();
  /** visibleUsers is read many times per change detection, so it is rebuilt only when its inputs change */
  private visibleCache: { users: any[]; excludeKey: string; joinedSince: string; result: any[] };
  private unsubscribe = new Subject<void>();

  constructor(private elementRef: ElementRef, private courseBatchService: CourseBatchService,
    private userService: UserService) { }

  /** Unique user ids (lowercased, in order of appearance) found anywhere in the text */
  static extractUserIds(text: string): string[] {
    const matches = (text || '').match(BatchMemberSelectComponent.USER_ID_PATTERN) || [];
    return Array.from(new Set(matches.map(id => id.toLowerCase())));
  }

  /** Same shape the batch pages build from user search results */
  static toMember(userData: any) {
    const contact = [userData.maskedEmail, userData.maskedPhone].filter(Boolean).join(', ');
    return {
      id: userData.identifier,
      name: (userData.firstName || '') + (userData.lastName ? ' ' + userData.lastName : ''),
      avatar: userData.avatar,
      createdDate: userData.createdDate,
      rootOrgId: userData.rootOrgId,
      otherDetail: contact ? ' (' + contact + ')' : undefined
    };
  }

  /**
   * Parses user search dates such as "2017-10-31 10:47:04:723+0000" (UTC, milliseconds after a
   * colon), which Date.parse does not read consistently across browsers. ISO strings also work.
   */
  static parseDate(value: any): number | null {
    if (typeof value !== 'string') {
      return null;
    }
    const match = value.trim().match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:[:.](\d{1,3}))?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i
    );
    if (!match) {
      return null;
    }
    const [, year, month, day, hour = '0', minute = '0', second = '0', millis = '0', zone] = match;
    let time = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second, +millis.padEnd(3, '0'));
    if (zone && zone.toUpperCase() !== 'Z') {
      const sign = zone[0] === '-' ? -1 : 1;
      const digits = zone.slice(1).replace(':', '');
      time -= sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2))) * 60000;
    }
    return isNaN(time) ? null : time;
  }

  static toDateInputValue(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  /**
   * Users offered in the list: search results minus excluded ids, limited to users who joined on or
   * after `joinedSince` when it is set, newest first. "Select all" acts on exactly this list, so the
   * date filter is how an admin picks only the recently joined users of a large org.
   */
  get visibleUsers(): any[] {
    const users = this.users || [];
    const excluded = this.excludeIds || [];
    const excludeKey = excluded.join(',');
    const cache = this.visibleCache;
    if (cache && cache.users === users && cache.excludeKey === excludeKey && cache.joinedSince === this.joinedSince) {
      return cache.result;
    }
    const since = this.joinedSinceTime();
    const result = users
      .filter(user => !excluded.includes(user.id))
      .filter(user => since === null || (this.joinedAt(user) !== null && this.joinedAt(user) >= since))
      // newest first; users without a join date go last, otherwise the search order is kept
      .map((user, index) => ({ user, index, time: this.joinedAt(user) }))
      .sort((a, b) => {
        if (a.time === b.time) {
          return a.index - b.index;
        }
        if (a.time === null) {
          return 1;
        }
        if (b.time === null) {
          return -1;
        }
        return b.time - a.time;
      })
      .map(entry => entry.user);
    this.visibleCache = { users, excludeKey, joinedSince: this.joinedSince, result };
    return result;
  }

  get selectedCount(): number {
    return (this.selectedUsers || []).length;
  }

  /** Selected users that the save will add (not existing, locked members) */
  get newSelectedCount(): number {
    return (this.selectedUsers || []).filter(user => !this.isLocked(user.id)).length;
  }

  get lockedSelectedCount(): number {
    return this.selectedCount - this.newSelectedCount;
  }

  get visibleSelectedCount(): number {
    return this.visibleUsers.filter(user => this.isSelected(user.id)).length;
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
    return this.newSelectedCount > 0;
  }

  /** New (removable) selections, latest first */
  get newSelectedUsers(): any[] {
    return (this.selectedUsers || []).filter(user => !this.isLocked(user.id)).reverse();
  }

  /** Existing members of the batch */
  get lockedSelectedUsers(): any[] {
    return (this.selectedUsers || []).filter(user => this.isLocked(user.id));
  }

  /** Join time of a user in ms, or null when the user has no usable createdDate */
  joinedAt(user: any): number | null {
    if (!user) {
      return null;
    }
    if (!this.joinedAtCache.has(user)) {
      this.joinedAtCache.set(user, BatchMemberSelectComponent.parseDate(user.createdDate));
    }
    return this.joinedAtCache.get(user);
  }

  /** Masked email/phone without the surrounding brackets the batch pages add */
  contactOf(user: any): string {
    return String((user && user.otherDetail) || '').trim().replace(/^\(|\)$/g, '');
  }

  trackById(index: number, user: any) {
    return user && user.id;
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

  close() {
    this.isOpen = false;
  }

  onQueryChange(value: string) {
    this.query = value;
    this.open();
    this.search.emit(value);
  }

  clearQuery(input?: HTMLInputElement) {
    this.onQueryChange('');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  onJoinedSinceChange(value: string) {
    this.setJoinedSince(value);
    this.open();
  }

  /** Date picked in the calendar */
  onJoinedSinceDate(date: Date | null) {
    this.onJoinedSinceChange(date ? BatchMemberSelectComponent.toDateInputValue(date) : '');
  }

  openJoinedPicker() {
    if (!this.disabled && this.joinedPicker) {
      this.joinedPicker.open();
    }
  }

  clearJoinedSince() {
    this.setJoinedSince('');
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

  /**
   * Reads an uploaded CSV/text file, finds the user ids in any column, looks them up and selects
   * the users found. Nothing is saved until the batch form is submitted.
   */
  onImportFile(input: HTMLInputElement) {
    const file = input.files && input.files[0];
    input.value = ''; // lets the same file be picked again
    if (!file || this.disabled || this.importing) {
      return;
    }
    this.importError = '';
    if (file.size > BatchMemberSelectComponent.MAX_IMPORT_FILE_BYTES) {
      this.importError = `${file.name} is larger than 5 MB. Upload a smaller file.`;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const ids = BatchMemberSelectComponent.extractUserIds(String(reader.result || ''));
      if (!ids.length) {
        this.importError = `No user IDs found in ${file.name}. The file needs a column of NULP user IDs.`;
        return;
      }
      this.addUsersByIds(ids, file.name);
    };
    reader.onerror = () => {
      this.importError = `Could not read ${file.name}.`;
    };
    reader.readAsText(file);
  }

  /**
   * Looks the ids up (across every org, active users only) and selects the users found.
   * Existing members, already selected users, mentors and the current user are skipped.
   */
  addUsersByIds(ids: string[], fileName: string) {
    if (this.disabled || this.importing || !ids.length) {
      return;
    }
    const lockedIds = new Set((this.lockedIds || []).map(id => String(id).toLowerCase()));
    const selectedIds = new Set((this.selectedUsers || []).map(user => String(user.id).toLowerCase()));
    const excludedIds = new Set((this.excludeIds || []).map(id => String(id).toLowerCase()));
    const ownId = String(this.userService.userid || '').toLowerCase();
    const summary: IMemberImportSummary = {
      fileName, addedIds: [], addedFromOtherOrgs: 0, alreadyInBatch: 0, alreadySelected: 0, mentors: 0, self: 0, notFound: []
    };
    const toLookUp = ids.filter(id => {
      if (lockedIds.has(id)) {
        summary.alreadyInBatch++;
      } else if (selectedIds.has(id)) {
        summary.alreadySelected++;
      } else if (excludedIds.has(id)) {
        summary.mentors++;
      } else if (id === ownId) {
        summary.self++;
      } else {
        return true;
      }
      return false;
    });
    if (!toLookUp.length) {
      this.finishImport(summary);
      return;
    }
    const chunks = [];
    for (let i = 0; i < toLookUp.length; i += BatchMemberSelectComponent.IMPORT_CHUNK_SIZE) {
      chunks.push(toLookUp.slice(i, i + BatchMemberSelectComponent.IMPORT_CHUNK_SIZE));
    }
    this.importing = true;
    this.importingFileName = fileName;
    this.importSummary = null;
    from(chunks).pipe(
      concatMap((chunk: string[]) => this.courseBatchService.getUserList(
        { filters: { identifier: chunk, status: '1' }, limit: chunk.length }, 'participant', true
      ).pipe(map(res => (res && res.result && res.result.response && res.result.response.content) || []))),
      toArray(),
      takeUntil(this.unsubscribe)
    ).subscribe((pages: any[][]) => {
      const found = new Map<string, any>();
      [].concat(...pages).forEach(userData => {
        if (userData && userData.identifier) {
          found.set(String(userData.identifier).toLowerCase(), userData);
        }
      });
      const rootOrgId = this.userService.rootOrgId;
      const added = [];
      toLookUp.forEach(id => {
        const userData = found.get(id);
        if (!userData) {
          summary.notFound.push(id);
          return;
        }
        added.push(BatchMemberSelectComponent.toMember(userData));
        if (rootOrgId && userData.rootOrgId && userData.rootOrgId !== rootOrgId) {
          summary.addedFromOtherOrgs++;
        }
      });
      summary.addedIds = added.map(user => user.id);
      if (added.length) {
        this.emit([...(this.selectedUsers || []), ...added]);
      }
      this.importing = false;
      this.finishImport(summary);
    }, () => {
      this.importing = false;
      this.importError = `Could not look up the users in ${fileName}. Please try again.`;
    });
  }

  /** Removes the users the last upload selected, unless they were removed or saved since */
  undoImport() {
    const summary = this.importSummary;
    if (!summary || this.disabled) {
      return;
    }
    const addedIds = new Set(summary.addedIds);
    if (addedIds.size) {
      this.emit(this.selectedUsers.filter(user => !addedIds.has(user.id) || this.isLocked(user.id)));
    }
    this.importSummary = null;
  }

  dismissImportSummary() {
    this.importSummary = null;
  }

  copyNotFound() {
    const ids = this.importSummary ? this.importSummary.notFound : [];
    const clipboard = typeof navigator !== 'undefined' && navigator.clipboard;
    if (!ids.length || !clipboard) {
      return;
    }
    clipboard.writeText(ids.join('\n')).then(() => this.notFoundCopied = true, () => this.notFoundCopied = false);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    // clicks in the calendar overlay belong to this picker even though they are outside its element
    const inOverlay = target && typeof target.closest === 'function' && !!target.closest('.cdk-overlay-container');
    if (this.isOpen && !inOverlay && !this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }

  @HostListener('keydown.escape')
  onEscape() {
    this.close();
  }

  private setJoinedSince(value: string) {
    this.joinedSince = /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : '';
    if (!this.joinedSince) {
      this.joinedSinceDate = null;
    } else if (!this.joinedSinceDate || BatchMemberSelectComponent.toDateInputValue(this.joinedSinceDate) !== this.joinedSince) {
      const [year, month, day] = this.joinedSince.split('-').map(Number);
      this.joinedSinceDate = new Date(year, month - 1, day);
    }
  }

  /** Start of the chosen day in the viewer's time zone, in ms */
  private joinedSinceTime(): number | null {
    if (!this.joinedSince) {
      return null;
    }
    const [year, month, day] = this.joinedSince.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  private finishImport(summary: IMemberImportSummary) {
    this.importSummary = summary;
    this.importingFileName = '';
    this.showNotFound = false;
    this.notFoundCopied = false;
  }

  private emit(users: any[]) {
    this.selectedUsers = users;
    this.selectedUsersChange.emit(users);
  }
}

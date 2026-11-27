import { of, throwError } from 'rxjs';
import { BatchMemberSelectComponent } from './batch-member-select.component';

describe('BatchMemberSelectComponent', () => {
  let component: BatchMemberSelectComponent;
  let courseBatchService: { getUserList: jest.Mock };
  let userService: { userid: string; rootOrgId: string };
  const user = (id: string, createdDate?: string) => ({ id, name: id, createdDate });

  beforeEach(() => {
    courseBatchService = { getUserList: jest.fn() };
    userService = { userid: 'me', rootOrgId: 'org-1' };
    component = new BatchMemberSelectComponent({ nativeElement: document.createElement('div') } as any,
      courseBatchService as any, userService as any);
  });

  describe('parseDate', () => {
    it('reads the user search format (UTC, millis after a colon)', () => {
      expect(BatchMemberSelectComponent.parseDate('2017-10-31 10:47:04:723+0000'))
        .toBe(Date.UTC(2017, 9, 31, 10, 47, 4, 723));
    });

    it('applies a non-UTC offset', () => {
      expect(BatchMemberSelectComponent.parseDate('2026-11-20 02:00:00:000+0530'))
        .toBe(Date.UTC(2026, 10, 19, 20, 30));
    });

    it('reads ISO strings and plain dates', () => {
      expect(BatchMemberSelectComponent.parseDate('2026-11-20T08:15:30.5Z')).toBe(Date.UTC(2026, 10, 20, 8, 15, 30, 500));
      expect(BatchMemberSelectComponent.parseDate('2026-11-20')).toBe(Date.UTC(2026, 10, 20));
    });

    it('returns null for missing or unreadable values', () => {
      expect(BatchMemberSelectComponent.parseDate(undefined)).toBeNull();
      expect(BatchMemberSelectComponent.parseDate(null)).toBeNull();
      expect(BatchMemberSelectComponent.parseDate('not a date')).toBeNull();
    });
  });

  describe('visibleUsers', () => {
    beforeEach(() => {
      component.users = [
        user('old', '2025-01-10 09:00:00:000+0000'),
        user('noDate'),
        user('newest', '2026-11-25 09:00:00:000+0000'),
        user('new', '2026-11-20 09:00:00:000+0000'),
        user('mentor', '2026-11-26 09:00:00:000+0000')
      ];
      component.excludeIds = ['mentor'];
    });

    it('lists users newest first, users without a join date last', () => {
      expect(component.visibleUsers.map(u => u.id)).toEqual(['newest', 'new', 'old', 'noDate']);
    });

    it('keeps only users who joined on or after the chosen date', () => {
      component.onJoinedSinceChange('2026-11-15');
      expect(component.visibleUsers.map(u => u.id)).toEqual(['newest', 'new']);
      expect(component.isOpen).toBe(true);
    });

    it('ignores an invalid date and clears the filter', () => {
      component.onJoinedSinceChange('2026-11');
      expect(component.joinedSince).toBe('');
      component.onJoinedSinceChange('2026-11-15');
      component.clearJoinedSince();
      expect(component.visibleUsers.length).toBe(4);
    });

    it('rebuilds the list when the users input changes', () => {
      component.onJoinedSinceChange('2026-11-15');
      expect(component.visibleUsers.length).toBe(2);
      component.users = [...component.users, user('later', '2026-11-27 01:00:00:000+0000')];
      expect(component.visibleUsers.map(u => u.id)).toEqual(['later', 'newest', 'new']);
    });

    it('select all picks only the filtered users and keeps earlier selections', () => {
      component.selectedUsers = [component.users[0]];
      component.onJoinedSinceChange('2026-11-15');
      let emitted: any[] = [];
      component.selectedUsersChange.subscribe(users => emitted = users);
      component.toggleSelectAll();
      expect(emitted.map(u => u.id)).toEqual(['old', 'newest', 'new']);
    });

    it('unselect all leaves selections outside the filter alone', () => {
      component.selectedUsers = [component.users[0], component.users[2], component.users[3]];
      component.onJoinedSinceChange('2026-11-15');
      let emitted: any[] = [];
      component.selectedUsersChange.subscribe(users => emitted = users);
      component.toggleSelectAll();
      expect(emitted.map(u => u.id)).toEqual(['old']);
    });
  });

  describe('joined since calendar', () => {
    it('applies a date picked in the calendar and opens the list', () => {
      component.onJoinedSinceDate(new Date(2026, 10, 15));
      expect(component.joinedSince).toBe('2026-11-15');
      expect(component.joinedSinceDate.getDate()).toBe(15);
      expect(component.isOpen).toBe(true);
      component.onJoinedSinceDate(null);
      expect(component.joinedSince).toBe('');
      expect(component.joinedSinceDate).toBeNull();
    });

    it('keeps the same Date object while the date is unchanged', () => {
      component.onJoinedSinceChange('2026-11-15');
      const first = component.joinedSinceDate;
      component.onJoinedSinceChange('2026-11-15');
      expect(component.joinedSinceDate).toBe(first);
    });

    it('opens the calendar from anywhere on the filter, except in view mode', () => {
      const open = jest.fn();
      component.joinedPicker = { open, close: jest.fn() } as any;
      component.openJoinedPicker();
      expect(open).toHaveBeenCalledTimes(1);
      component.disabled = true;
      component.openJoinedPicker();
      expect(open).toHaveBeenCalledTimes(1);
    });

    it('keeps the member list open while clicking inside the calendar overlay', () => {
      const overlay = document.createElement('div');
      overlay.className = 'cdk-overlay-container';
      const cell = document.createElement('button');
      overlay.appendChild(cell);
      document.body.appendChild(overlay);
      component.isOpen = true;
      component.onDocumentClick({ target: cell } as any);
      expect(component.isOpen).toBe(true);
      component.onDocumentClick({ target: document.body } as any);
      expect(component.isOpen).toBe(false);
      overlay.remove();
    });
  });

  describe('CSV upload', () => {
    // ids are UUIDs; uid(n) gives a distinct valid one
    const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
    const searchResult = (users: any[]) => of({ result: { response: { content: users, count: users.length } } });
    const apiUser = (n: number, rootOrgId = 'org-1') => ({
      identifier: uid(n), firstName: 'User', lastName: String(n), rootOrgId,
      createdDate: '2026-11-20 09:00:00:000+0000', maskedEmail: 'u***@x.com'
    });
    const upload = (content: string, name = 'members.csv', size?: number) => {
      const file = new File([content], name, { type: 'text/csv' });
      if (size) {
        Object.defineProperty(file, 'size', { value: size });
      }
      const input = { files: [file], value: 'C:\\fakepath\\' + name };
      component.onImportFile(input as any);
      return input;
    };
    // FileReader is async in jsdom
    const afterRead = (check: () => void, done: jest.DoneCallback) => setTimeout(() => {
      try {
        check();
        done();
      } catch (e) {
        done(e);
      }
    }, 50);

    it('extracts unique ids from any CSV column, ignoring headers and names', () => {
      const csv = `Name,User ID,Email\nAsha,${uid(1).toUpperCase()},a@x.com\nRavi,"${uid(2)}",r@x.com\nAsha,${uid(1)},a@x.com`;
      expect(BatchMemberSelectComponent.extractUserIds(csv)).toEqual([uid(1), uid(2)]);
      expect(BatchMemberSelectComponent.extractUserIds('Rahul Sharma\n12345')).toEqual([]);
    });

    it('selects the users in an uploaded CSV right away', done => {
      courseBatchService.getUserList.mockReturnValue(searchResult([apiUser(9)]));
      const input = upload(`id,name\n${uid(9)},Asha\n`);
      expect(input.value).toBe('');
      afterRead(() => {
        expect(component.selectedUsers.map(u => u.id)).toEqual([uid(9)]);
        expect(component.importSummary.fileName).toBe('members.csv');
        expect(component.importSummary.addedIds).toEqual([uid(9)]);
      }, done);
    });

    it('reports a CSV with no user ids without calling the API', done => {
      upload('name\nAsha\n', 'names.csv');
      afterRead(() => {
        expect(courseBatchService.getUserList).not.toHaveBeenCalled();
        expect(component.importError).toContain('No user IDs found in names.csv');
      }, done);
    });

    it('rejects files over 5 MB', () => {
      upload(uid(1), 'big.csv', 6 * 1024 * 1024);
      expect(component.importError).toContain('big.csv is larger than 5 MB');
    });

    it('selects found users and reports skipped and missing ids', () => {
      component.lockedIds = [uid(1)];
      component.selectedUsers = [{ id: uid(1) }, { id: uid(2) }];
      component.excludeIds = [uid(3)];
      courseBatchService.getUserList.mockReturnValue(searchResult([apiUser(4), apiUser(5, 'org-2')]));
      let emitted: any[] = [];
      component.selectedUsersChange.subscribe(users => emitted = users);

      component.addUsersByIds([uid(1), uid(2), uid(3), uid(4), uid(5), uid(6)], 'members.csv');

      expect(courseBatchService.getUserList).toHaveBeenCalledTimes(1);
      expect(courseBatchService.getUserList).toHaveBeenCalledWith(
        { filters: { identifier: [uid(4), uid(5), uid(6)], status: '1' }, limit: 3 }, 'participant', true);
      expect(emitted.map(u => u.id)).toEqual([uid(1), uid(2), uid(4), uid(5)]);
      expect(emitted[2]).toEqual(expect.objectContaining({ name: 'User 4', otherDetail: ' (u***@x.com)' }));
      expect(component.importSummary).toEqual({
        fileName: 'members.csv', addedIds: [uid(4), uid(5)], addedFromOtherOrgs: 1,
        alreadyInBatch: 1, alreadySelected: 1, mentors: 1, self: 0, notFound: [uid(6)]
      });
      expect(component.importing).toBe(false);
    });

    it('undo removes only the users the upload selected', () => {
      component.lockedIds = [uid(1)];
      component.selectedUsers = [{ id: uid(1) }, { id: uid(2) }];
      courseBatchService.getUserList.mockReturnValue(searchResult([apiUser(4), apiUser(5)]));
      component.addUsersByIds([uid(4), uid(5)], 'members.csv');
      expect(component.selectedUsers.length).toBe(4);
      component.undoImport();
      expect(component.selectedUsers.map(u => u.id)).toEqual([uid(1), uid(2)]);
      expect(component.importSummary).toBeNull();
    });

    it('skips the current user without calling the API', () => {
      userService.userid = uid(7);
      component.addUsersByIds([uid(7)], 'me.csv');
      expect(courseBatchService.getUserList).not.toHaveBeenCalled();
      expect(component.importSummary.self).toBe(1);
      expect(component.importSummary.addedIds).toEqual([]);
    });

    it('looks ids up in chunks of 200', () => {
      const ids = Array.from({ length: 450 }, (_, i) => uid(i + 1));
      courseBatchService.getUserList.mockImplementation(req =>
        searchResult(req.filters.identifier.map(id => ({ identifier: id, firstName: 'U' }))));
      component.addUsersByIds(ids, 'big.csv');
      expect(courseBatchService.getUserList.mock.calls.map(call => call[0].filters.identifier.length)).toEqual([200, 200, 50]);
      expect(component.importSummary.addedIds.length).toBe(450);
      expect(component.selectedUsers.length).toBe(450);
    });

    it('shows an error and selects nothing when the lookup fails', () => {
      courseBatchService.getUserList.mockReturnValue(throwError({ status: 500 }));
      component.addUsersByIds([uid(1)], 'members.csv');
      expect(component.importError).toContain('Could not look up the users in members.csv');
      expect(component.selectedUsers).toEqual([]);
      expect(component.importing).toBe(false);
    });
  });

  describe('selected members', () => {
    it('lists new selections latest first, apart from existing members', () => {
      component.lockedIds = ['a'];
      component.selectedUsers = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      expect(component.newSelectedUsers.map(u => u.id)).toEqual(['c', 'b']);
      expect(component.lockedSelectedUsers.map(u => u.id)).toEqual(['a']);
      expect(component.newSelectedCount).toBe(2);
      expect(component.lockedSelectedCount).toBe(1);
    });

    it('shows contact details without brackets', () => {
      expect(component.contactOf({ otherDetail: ' (a***@x.com, ******1234)' })).toBe('a***@x.com, ******1234');
      expect(component.contactOf({})).toBe('');
    });
  });
});

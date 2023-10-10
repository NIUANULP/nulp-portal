
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import {ResourceService, ToasterService, RecaptchaService, LayoutService} from '@sunbird/shared';
import { Component, OnInit, Output, EventEmitter, OnDestroy, ViewChild } from '@angular/core';
import { UserService } from '@sunbird/core';
import * as _ from 'lodash-es';
import { IGroupMember, IGroupCard, IMember } from '../../interfaces';
import { GroupsService } from '../../services';
import { Subject } from 'rxjs';
import { IImpressionEventInput } from '@sunbird/telemetry';
import { RecaptchaComponent } from 'ng-recaptcha';
import { TelemetryService } from '@sunbird/telemetry';
import { VERIFY_USER, USER_SEARCH } from '../../interfaces/telemetryConstants';
import { sessionKeys } from '../../../../modules/groups';
import { LazzyLoadScriptService } from 'LazzyLoadScriptService';
import { Angular2Csv } from 'angular2-csv';

@Component({
  selector: 'app-add-member',
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.scss']
})
export class AddMemberComponent implements OnInit, OnDestroy {
  showModal = false;
  instance: string;
  membersList: IGroupMember[] ;
  groupData: IGroupCard;
  showLoader = false;
  isVerifiedUser = false;
  memberId: string;
  config = { size: 'medium', isBold: true, isSelectable: false, view: 'horizontal' };
  isInvalidUser = false;
  disableBtn = false;
  verifiedMember: IGroupMember;
  telemetryImpression: IImpressionEventInput;
  public unsubscribe$ = new Subject<void>();
  @Output() members = new EventEmitter<any>();
  @ViewChild('captchaRef') captchaRef: RecaptchaComponent;
  captchaResponse = '';
  googleCaptchaSiteKey = '';
  isCaptchEnabled = false;
  layoutConfiguration: any;
  public VERIFY_USER = VERIFY_USER;
  private userService: UserService;
  userList = [];
  notAddedUserList = [];
  file: any;
  activateUpload: boolean;
  private userSearchTime: any;

  constructor(public resourceService: ResourceService, private groupsService: GroupsService,
    private toasterService: ToasterService,
    private activatedRoute: ActivatedRoute,
    private groupService: GroupsService,
    private router: Router,
    private location: Location,
    public recaptchaService: RecaptchaService,
    public telemetryService: TelemetryService,
    public layoutService: LayoutService,
    userService: UserService,
    private lazzyLoadScriptService: LazzyLoadScriptService,
    ) {
      this.userService = userService;
  }

  ngOnInit() {
    const requestBody = {
      filters: {'status': '1'},
    };
    this.initLayout();
    this.showModal = !localStorage.getItem('login_members_ftu');
    this.groupData = this.groupsService.groupData || JSON.parse(sessionStorage.getItem(sessionKeys.GROUPDATA));
    this.initRecaptcha();
    this.instance = _.upperCase(this.resourceService.instance);
    this.membersList = this.groupsService.addFieldsToMember(_.get(this.groupData, 'members'));
    this.telemetryImpression = this.groupService.getImpressionObject(this.activatedRoute.snapshot, this.router.url, {type: USER_SEARCH});
    this.groupsService.getUserList(requestBody).subscribe((data) => {
      const users = this.getUsers(data)
      this.userList = users.userList;
      this.getNotAddedUsers();
      this.initDropDown();
    })
  }

   initLayout() {
    this.layoutConfiguration = this.layoutService.initlayoutConfig();
    this.layoutService.switchableLayout().pipe(takeUntil(this.unsubscribe$)).subscribe(layoutConfig => {
      if (layoutConfig != null) {
        this.layoutConfiguration = layoutConfig.layout;
      }
    });
  }

  initRecaptcha() {
    this.groupService.getRecaptchaSettings().subscribe((res: any) => {
      if (res.result.response) {
        try {
          const captchaConfig = _.get(res, 'result.response.value') ? JSON.parse(_.get(res, 'result.response.value')) : {};
          this.googleCaptchaSiteKey = captchaConfig.key || '';
          this.isCaptchEnabled = captchaConfig.isEnabled || false;
        } catch (e) {
          console.log(_.get(res, 'result.response'));
        }
      }
    });
  }

  reset() {
    this.showLoader = false;
    this.isInvalidUser = false;
    this.isVerifiedUser = false;
  }

  resetValue(memberId?) {
    this.setInteractData('reset-userId', {searchQuery: memberId});
    this.memberId = '';
    this.groupsService.emitShowLoader(false);
    this.reset();
  }

  captchaResolved(captchaResponse: string) {
    this.captchaResponse = captchaResponse;
    this.verifyMember();
  }

  onVerifyMember() {
    this.reset();
    if (this.isCaptchEnabled) {
      this.showLoader = true;
      this.captchaRef.execute();
    } else {
      this.verifyMember();
    }
  }

  verifyMember() {
    this.showLoader = true;
    this.memberId = (this.memberId.replace(/([^\w\s]|_)+(?=\s|$)/g, ''));
      this.groupsService.getUserData((this.memberId), {token: this.captchaResponse})
      .pipe(takeUntil(this.unsubscribe$)).subscribe(member => {
        this.verifiedMember = this.groupsService.addFields(member);
        if (member.exists) {
          this.showLoader = false;
          this.isVerifiedUser = !this.isExistingMember();
          this.captchaRef.reset();
        } else {
          this.showInvalidUser();
        }
      }, (err) => {
        this.showInvalidUser();
      });
  }

  showInvalidUser () {
    this.isInvalidUser = true;
    this.showLoader = false;
    this.captchaRef.reset();
  }

  isExistingMember() {
    const isExisting = _.find(this.membersList, { userId: _.get(this.verifiedMember, 'id') });
    if (isExisting) {
      this.resetValue();
      this.toasterService.error(this.resourceService.messages.emsg.m007);
      return true;
    }
    return false;
  }
  public fileChanged(event) {
    this.file = event.target.files[0];
    this.activateUpload = true;
  }
  uploadUsersCSV(){
    let reader: FileReader = new FileReader();   
    reader.readAsText(this.file);
    reader.onload = (e) => {
      let csv:string = reader.result as string;
      var memberstoAdd = this.csvToArr(csv);
      const member = {members: memberstoAdd};
      this.addMembersById(member);
    }
  }
   csvToArr(csv) {
   
    const [keys, ...rest] = csv.trim( ).split("\n").map((item) => item.split(','));
    
  const formedArr = rest.map((item) => {
    const object = {};
    keys.forEach((key, index) => (object[key] = item.at(index)));
    return object;
  });
  return formedArr;
  }

  addMemberToGroup() {
    this.setInteractData('add-user-to-group', {}, {id: _.get(this.verifiedMember, 'id'),  type: 'Member'});
    this.groupsService.emitShowLoader(true);
    this.disableBtn = true;
    if (!this.isExistingMember()) {
      const member: IMember = {members: [{ userId: _.get(this.verifiedMember, 'id'), role: 'member' }]};
      const groupId = _.get(this.groupData, 'id') || _.get(this.activatedRoute.snapshot, 'params.groupId');
      this.groupsService.addMemberById(groupId, member).pipe(takeUntil(this.unsubscribe$)).subscribe(response => {
        this.getUpdatedGroupData();
        this.disableBtn = false;
        const value = _.isEmpty(response.error) ? this.toasterService.success((this.resourceService.messages.smsg.m004).replace('{memberName}',
          this.verifiedMember['title'])) : this.showErrorMsg(response);
          this.memberId = '';
          this.reset();
      }, err => {
        this.groupsService.emitShowLoader(false);
        this.disableBtn = false;
        this.memberId = '';
        this.reset();
        this.showErrorMsg();
      });
    }
  }
  private getUserListWithQuery(query) {
    if (this.userSearchTime) {
      clearTimeout(this.userSearchTime);
    }
    this.userSearchTime = setTimeout(() => {
      this.getUserList(query);
    }, 1000);
  }
  private getUserList(query: string = '') {
    const requestBody = {
      filters: {'status': '1'},
      query: query
    };
    this.groupsService.getUserList(requestBody).subscribe((data) => {
      const users = this.getUsers(data)
      this.userList = users.userList;
      this.getNotAddedUsers();
      this.initDropDown();
    })
  }

  private initDropDown() {
    this.lazzyLoadScriptService.loadScript('semanticDropdown.js').subscribe(() => {
      $('#users').dropdown({
        forceSelection: false,
        fullTextSearch: true,
        onAdd: () => {
        }
      });
      $('#users input.search').on('keyup', (e) => {
        this.getUserListWithQuery($('#users input.search').val());
      });
      // $('#mentors input.search').on('keyup', (e) => {
      //   this.getUserListWithQuery($('#mentors input.search').val(), 'mentor');
      // });
    });
  }

  private getUsers(res) {
    const userList = [];
    if (res.result.response.content && res.result.response.content.length > 0) {
      _.forEach(res.result.response.content, (userData) => {
                if (userData.identifier !== this.userService.userid) {
          const user = {
            id: userData.identifier,
            name: userData.firstName + (userData.lastName ? ' ' + userData.lastName : ''),
            avatar: userData.avatar,
            otherDetail: this.getUserOtherDetail(userData)
          };
          userList.push(user);
        }
      });
    }
    return {
      userList: _.uniqBy(userList, 'id'),
    };
  }

  private getUserOtherDetail(userData) {
    if (userData.maskedEmail && userData.maskedPhone) {
      return ' (' + userData.maskedEmail + ', ' + userData.maskedPhone + ')';
    }
    if (userData.maskedEmail && !userData.maskedPhone) {
      return ' (' + userData.maskedEmail + ')';
    }
    if (!userData.maskedEmail && userData.maskedPhone) {
      return ' (' + userData.maskedPhone + ')';
    }
  }

  addMemberToGroupByDropdown() {
    let users = [];
    users = $('#users').dropdown('get value') ? $('#users').dropdown('get value').split(',') : [];

    $('#users').dropdown('restore defaults')

    if (!users.length) {
      this.toasterService.error("Please Select user to add");
      return;
    }
    
    const memberstoAdd =  users.map((user) => ({userId: user, role: 'member'}))
    const member = {members: memberstoAdd};
    this.addMembersById(member);
  }

  addMembersById(member){
    const groupId = _.get(this.groupData, 'id') || _.get(this.activatedRoute.snapshot, 'params.groupId');
    this.groupsService.addMembersById(groupId, member).pipe(takeUntil(this.unsubscribe$)).subscribe(response => {
      this.getUpdatedGroupData();

      this.disableBtn = false;
      const value = _.isEmpty(response.error) ? this.toasterService.success((this.resourceService.messages.smsg.m004).replace('{memberName}',
        "Member")) : this.showErrorMsg(response, "selection");
        this.memberId = '';
        this.reset();
    }, err => {
      this.groupsService.emitShowLoader(false);
      this.disableBtn = false;
      this.memberId = '';
      this.reset();
      this.showErrorMsg();
    });    
  }



  getNotAddedUsers() {
    const existingUsersIds = this.membersList.map(({userId}) => userId)
    const nonExistingUsers = _.filter(this.userList, (value, key) => {
     return !_.includes(existingUsersIds, value.id);
    });
    this.notAddedUserList = nonExistingUsers;
    return nonExistingUsers;
  }

  showErrorMsg(response?, from = "") {

    if (_.get(response, 'error.members[0].errorCode') === 'EXCEEDED_MEMBER_MAX_LIMIT') {
      this.toasterService.error(this.resourceService.messages.groups.emsg.m002);
      this.setInteractData('exceeded-member-max-limit', {searchQuery: this.memberId,
        member_count: this.membersList.length});
    } else if (from === "selection") {
      this.toasterService.error(this.resourceService.messages.emsg.m007); 
    } else {
      this.toasterService.error((this.resourceService.messages.emsg.m006).replace('{name}', _.get(response, 'errors')
      || _.get(this.verifiedMember, 'title')));
    }
  }

  getUpdatedGroupData() {
    const groupId = _.get(this.groupData, 'id') || _.get(this.activatedRoute.snapshot, 'params.groupId');
    this.groupsService.getGroupById(groupId, true).pipe(takeUntil(this.unsubscribe$)).subscribe(groupData => {
      this.groupsService.groupData = groupData || JSON.parse(sessionStorage.getItem(sessionKeys.GROUPDATA));
      this.groupData = groupData;
      this.membersList = this.groupsService.addFieldsToMember(_.get(groupData, 'members'));
      this.groupsService.emitMembers(this.membersList);
      this.groupsService.emitShowLoader(false);
      this.getNotAddedUsers();
    }, err => {
      this.groupsService.emitShowLoader(false);
      this.membersList.push(this.verifiedMember);
    });
  }

  toggleModal(visibility: boolean = false) {
    this.showModal = visibility;
  }

  setInteractData (id, extra?, Cdata?, edata?, obj?) {
    const interactData = {
      context: {
        env: _.get(this.activatedRoute, 'snapshot.data.telemetry.env'),
        cdata: [
          {
            id: _.get(this.groupData, 'id'),
            type: 'Group'
          }
        ]
      },
      edata: {
        id: id,
        type: 'CLICK',
        pageid:  _.get(this.activatedRoute, 'snapshot.data.telemetry.pageid')
      }
    };
    if (edata) {
      interactData.edata.type = edata.type;
    }
    if (extra) {
      interactData.edata['extra'] = extra;
    }
    if (Cdata) {
      interactData.context.cdata.push(Cdata);
    }
    if (obj) {
      interactData['object'] = obj;
    }
    this.telemetryService.interact(interactData);
  }
   /**
 * This method helps to download a sample csv file
 */
    public downloadSampleCSV() {
      const options = {
        fieldSeparator: ',',
        // quoteStrings: '"',
        decimalseparator: '.',
        showLabels: true,
        useBom: false,
        headers: ['userId', 'role'],
      };
      const csvData = [{
        'userId': '',
        'role': ''
      }];
     
        const csv = new Angular2Csv(csvData, 'Sample_members', options);
     
    }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

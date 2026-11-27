import { IInteractEventEdata } from './../../../../telemetry/interfaces/telemetry';

import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {combineLatest, Subject, Subscription, forkJoin} from 'rxjs';
import { takeUntil, mergeMap } from 'rxjs/operators';
import { RouterNavigationService, ResourceService, ToasterService, NavigationHelperService } from '@sunbird/shared';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UserService } from '@sunbird/core';
import { CourseConsumptionService, CourseBatchService } from './../../../services';
import { IImpressionEventInput, IInteractEventObject, TelemetryService } from '@sunbird/telemetry';
import * as _ from 'lodash-es';
import dayjs from 'dayjs';
import { LazzyLoadScriptService } from 'LazzyLoadScriptService';
import { CsModule } from '@project-sunbird/client-services';
import { CsLibInitializerService } from '../../../../../service/CsLibInitializer/cs-lib-initializer.service';
import { IFetchForumConfig } from '../../../../groups/interfaces';
import { DiscussionService } from '../../../../../../app/modules/discussion/services/discussion/discussion.service';
import { BatchMemberSelectComponent } from '../batch-member-select/batch-member-select.component';

@Component({
  selector: 'app-update-course-batch',
  templateUrl: './update-course-batch.component.html'
})
export class UpdateCourseBatchComponent implements OnInit, OnDestroy, AfterViewInit {

  private updateBatchModal;

  @ViewChild('updateBatchModal') set setBatchModal(element) {
    if (element) {
      this.updateBatchModal = element;
    }
    this.initDropDown();
  }
  /**
  * batchId
  */
  private batchId: string;

  public showUpdateModal = false;

  public disableSubmitBtn = false;

  private courseId: string;

  /**
  * participants already in the batch (loaded from backend)
  */
  public selectedParticipants: any = [];
  /**
  * members shown/selected in the members dropdown: existing participants + newly picked users
  */
  public batchMembers: any[] = [];
  /**
  * ids of participants already in the batch
  */
  public existingParticipantIds: string[] = [];
  /**
  * when true, typed member searches look in every org; the list shown before typing is always the creator's org
  */
  public includeOtherOrgs = false;
  @ViewChild(BatchMemberSelectComponent) private memberSelect: BatchMemberSelectComponent;
  /**
  * latest text typed in the members search, reused when the org toggle changes
  */
  private participantQuery = '';
  /**
  * running member search; cancelled when a newer search starts so its pages can't overwrite the list
  */
  private participantSearchSub: Subscription;
  /**
  * running mentor search; cancelled when a newer one starts so an older, slower result can't overwrite it
  */
  private mentorSearchSub: Subscription;
  /**
  * true while member search pages are still loading
  */
  public participantsLoading = false;

  public showFormInViewMode: boolean;

  public selectedMentors: any = [];

  /**
  * separate debounce timers so a mentor search and a member search never cancel each other
  */
  private mentorSearchTime: any;
  private participantSearchTime: any;

  forumIds: any;
  fetchForumIdReq: any;
  private discussionCsService: any;
  createForumRequest: any;
  showDiscussionForum: string;

  /**
   * To fetch create-forum request payload for batch
   */
   fetchForumConfigReq: Array<IFetchForumConfig>;
  /**
	 * This variable hepls to show and hide loader.
   * It is kept true by default as at first when we comes
   * to a popup the loader should be displayed before the
   * data is loaded
	 */
  public showLoader = true;

  /**
  * courseCreator
  */
  public courseCreator = false;
  /**
  * participantList for users
  */
  public participantList = [];
  /**
  * batchDetails for form
  */
  private batchDetails: any;
  /**
  * mentorList for mentors in the batch
  */
  public mentorList: Array<any> = [];
  /**
   * form group for batchAddUserForm
  */
  public batchUpdateForm: FormGroup;
  /**
  * To navigate to other pages
  */
  public router: Router;
  /**
   * To send activatedRoute.snapshot to router navigation
   * service for redirection to update batch  component
  */
  private activatedRoute: ActivatedRoute;
  /**
  * Refrence of UserService
  */
  private userService: UserService;
  /**
  * Refrence of UserService
  */
  private courseBatchService: CourseBatchService;
  /**
  * To call resource service which helps to use language constant
  */
  public resourceService: ResourceService;
  /**
  * To show toaster(error, success etc) after any API calls
  */
  private toasterService: ToasterService;
  /**
   * telemetryImpression object for update batch page
  */
  public telemetryImpression: IImpressionEventInput;

  public pickerMinDate = new Date(new Date().setHours(0, 0, 0, 0));

  public pickerMinDateForEndDate = new Date(this.pickerMinDate.getTime() + (24 * 60 * 60 * 1000));

  public pickerMinDateForEnrollmentEndDate;

  public courseConsumptionService: CourseConsumptionService;

  public unsubscribe = new Subject<void>();
  public enrolmentType: string;

  updateBatchInteractEdata: IInteractEventEdata;
  telemetryInteractObject: IInteractEventObject;
  clearButtonInteractEdata: IInteractEventEdata;
  telemetryCdata: Array<{}> = [];
  isCertificateIssued: string;
  isEnableDiscussions: string;
  callCreateDiscussion = true;
  /**
   * Constructor to create injected service(s) object
   * @param {RouterNavigationService} routerNavigationService Reference of routerNavigationService
   * @param {Router} router Reference of Router
   * @param {ActivatedRoute} activatedRoute Reference of ActivatedRoute
   * @param {UserService} UserService Reference of UserService
  */
  constructor(routerNavigationService: RouterNavigationService,
    activatedRoute: ActivatedRoute,
    route: Router,
    resourceService: ResourceService, userService: UserService,
    courseBatchService: CourseBatchService,
    toasterService: ToasterService,
    courseConsumptionService: CourseConsumptionService,
    public navigationhelperService: NavigationHelperService, private lazzyLoadScriptService: LazzyLoadScriptService,
    private telemetryService: TelemetryService,
    private csLibInitializerService: CsLibInitializerService,
    private discussionService: DiscussionService) {
    this.resourceService = resourceService;
    this.router = route;
    this.activatedRoute = activatedRoute;
    this.userService = userService;
    this.courseBatchService = courseBatchService;
    this.toasterService = toasterService;
    this.courseConsumptionService = courseConsumptionService;
    if (!CsModule.instance.isInitialised) {
      this.csLibInitializerService.initializeCs();
    }
    this.discussionCsService = CsModule.instance.discussionService;
  }

  /**
   * Initialize form fields and getuserlist
  */
  ngOnInit() {
    combineLatest(this.activatedRoute.params, this.activatedRoute.parent.params,
      this.activatedRoute.queryParams,
      (params, parentParams, queryParams) => ({ ...params, ...parentParams, ...queryParams })).pipe(
        mergeMap((params) => {
          this.batchId = params.batchId;
          this.courseId = params.courseId;
          this.enrolmentType = params.enrollmentType;
          this.setTelemetryInteractData();
          return this.fetchBatchDetails();
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe((data) => {
        this.showDiscussionForum = _.get(data.courseDetails, 'discussionForum.enabled');
        this.generateDataForDF();
        if (this.showDiscussionForum === 'Yes') {
          this.fetchForumConfig();
        }
        this.showUpdateModal = true;
        if (data.courseDetails.createdBy === this.userService.userid) {
          this.courseCreator = true;
        }
        this.batchDetails = data.batchDetails;
        if (this.batchDetails.enrollmentType !== 'open' && data.participantList && data.participantList.length > 0) {
          this.batchDetails.participants = data.participantList;
        }
        const userList = this.sortUsers(data.userDetails);
        this.participantList = userList.participantList;
        this.mentorList = userList.mentorList;
        if (this.batchDetails.mentors) {
          this.batchDetails.mentors.forEach(id => {
            _.remove(this.mentorList, mentor => mentor.id === id);
          });
        }
        this.initializeUpdateForm();
        this.getEnabledForumId();
        this.fetchParticipantDetails();
      }, (err) => {
        if (err.error && err.error.params.errmsg) {
          this.toasterService.error(err.error.params.errmsg);
        } else {
          this.toasterService.error(this.resourceService.messages.fmsg.m0054);
        }
        this.redirect();
      });
  }

  private fetchBatchDetails() {
    if (this.enrolmentType === 'open') {
      const requestBody = {
        filters: { 'status': '1' },
      };
      const participantList = {};
      return combineLatest(
        this.courseBatchService.getAllUserList(requestBody),
        this.courseConsumptionService.getCourseHierarchy(this.courseId),
        this.courseBatchService.getUpdateBatchDetails(this.batchId),
        (userDetails, courseDetails, batchDetails) => (
          { userDetails, courseDetails, batchDetails, participantList}
        ));
    } else {
      const requestBody = {
        filters: { 'status': '1' },
      };
      return combineLatest(
        this.courseBatchService.getAllUserList(requestBody),
        this.courseConsumptionService.getCourseHierarchy(this.courseId),
        this.courseBatchService.getUpdateBatchDetails(this.batchId),
        this.courseBatchService.getParticipantList(
          { 'request': { 'batch': { 'batchId': this.batchId } } }),
        (userDetails, courseDetails, batchDetails, participantList) => (
          { userDetails, courseDetails, batchDetails, participantList }
        ));
    }
  }
  /**
  * initializes form fields and apply field level validation
  */
  private initializeUpdateForm(): void {
    this.isCertificateIssued = _.get(this.batchDetails, 'cert_templates') &&
    Object.keys(_.get(this.batchDetails, 'cert_templates')).length ? 'yes' : 'no';
    const endDate = this.batchDetails.endDate ? new Date(this.batchDetails.endDate) : null;
    const enrollmentEndDate = this.batchDetails.enrollmentEndDate ? new Date(this.batchDetails.enrollmentEndDate) : null;
    if (!dayjs(this.batchDetails.startDate).isBefore(dayjs(this.pickerMinDate).format('YYYY-MM-DD'))) {
      this.pickerMinDateForEnrollmentEndDate = new Date(new Date(this.batchDetails.startDate).setHours(0, 0, 0, 0));
    } else {
      this.pickerMinDateForEnrollmentEndDate = this.pickerMinDate;
    }

    this.batchUpdateForm = new FormGroup({
      name: new FormControl(this.batchDetails.name, [Validators.required]),
      description: new FormControl(this.batchDetails.description),
      enrollmentType: new FormControl(this.batchDetails.enrollmentType, [Validators.required]),
      startDate: new FormControl(new Date(this.batchDetails.startDate), [Validators.required]),
      endDate: new FormControl(endDate),
      mentors: new FormControl(),
      users: new FormControl(),
      enrollmentEndDate: new FormControl(enrollmentEndDate),
      issueCertificate: new FormControl(this.isCertificateIssued, [Validators.required]),
      enableDiscussions: new FormControl(this.isEnableDiscussions, [Validators.required])
    });

    this.batchUpdateForm.get('startDate').valueChanges.subscribe(value => {
      const startDate: any = dayjs(value);
      if (startDate.isValid()) {
        if (!dayjs(startDate).isBefore(dayjs(this.pickerMinDate).format('YYYY-MM-DD'))) {
          this.pickerMinDateForEnrollmentEndDate = new Date(new Date(startDate).setHours(0, 0, 0, 0));
        } else {
          this.pickerMinDateForEnrollmentEndDate = this.pickerMinDate;
        }
      }
    });

    this.batchUpdateForm.valueChanges.subscribe(val => {
      this.refreshSubmitState();
    });
    this.disableSubmitBtn = true;
    if (this.batchDetails.createdBy !== this.userService.userid) {
      this.showFormInViewMode = true;
      this.batchUpdateForm.disable();
    }
  }
  /**
  * fetch mentors and participant details of current batch
  */
  private fetchParticipantDetails() {
    let userList = [];
    if (this.batchDetails.participants || (this.batchDetails.mentors && this.batchDetails.mentors.length > 0)) {
      if (this.batchDetails.enrollmentType !== 'open') {
        userList = _.union(this.batchDetails.participants, this.batchDetails.mentors);
      } else {
        userList = this.batchDetails.mentors;
      }
      if (!userList.length) {
        this.showLoader = false;
        this.disableSubmitBtn = false;
        return ;
      }

      const request = {
        filters: {
          identifier: userList
        },
        limit : userList.length
      };
      // look the ids up across every org: members added through 'Include other orgs in search'
      // are outside the creator's org and would otherwise be missing from the list
      this.courseBatchService.getUserList(request, 'participant', true).pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          this.processParticipantDetails(res);
        }, (err) => {
          if (err.error && err.error.params.errmsg) {
            this.toasterService.error(err.error.params.errmsg);
          } else {
            this.toasterService.error(this.resourceService.messages.fmsg.m0056);
          }
          this.redirect();
        });
    } else {
      this.showLoader = false;
      this.disableSubmitBtn = false;
    }
  }
  private processParticipantDetails(res) {
    const users = this.sortUsers(res);
    const participantList = users.participantList;
    const mentorList = users.mentorList;
    _.forEach(this.batchDetails.participants, (value, key) => {
      const user = _.find(participantList, ['id', value]);
      if (user) {
        this.selectedParticipants.push(user);
      }
    });
    _.forEach(this.batchDetails.mentors, (value, key) => {
      const mentor = _.find(mentorList, ['id', value]);
      if (mentor) {
        this.selectedMentors.push(mentor);
      }
    });
    this.selectedParticipants = _.uniqBy(this.selectedParticipants, 'id');
    // keep any users picked before the existing participants finished loading
    this.batchMembers = _.uniqBy([...this.selectedParticipants, ...this.batchMembers], 'id');
    this.existingParticipantIds = _.map(this.selectedParticipants, 'id');
    this.selectedMentors = _.uniqBy(this.selectedMentors, 'id');
    this.disableSubmitBtn = false;
    this.showLoader = false;
  }
  private sortUsers(res) {
    const participantList = [];
    const mentorList = [];
    if (res.result.response.content && res.result.response.content.length > 0) {
      _.forEach(res.result.response.content, (userData) => {
        if (_.find(this.selectedMentors, { 'id': userData.identifier })) {
          return;
        }
        if (userData.identifier !== this.userService.userid) {
          const user = {
            id: userData.identifier,
            name: userData.firstName + (userData.lastName ? ' ' + userData.lastName : ''),
            avatar: userData.avatar,
            createdDate: userData.createdDate,
            otherDetail: this.getUserOtherDetail(userData)
          };
          _.forEach(userData.roles, (roles) => {
            if (roles.role === 'COURSE_MENTOR') {
              mentorList.push(user);
            }
          });
          participantList.push(user);
        }
      });
    }
    return {
      participantList: _.uniqBy(participantList, 'id'),
      mentorList: _.uniqBy(mentorList, 'id')
    };
  }

  private getUserListWithQuery(query, type) {
    if (type === 'participant') {
      clearTimeout(this.participantSearchTime);
      this.participantSearchTime = setTimeout(() => this.getUserList(query, type), 1000);
    } else {
      clearTimeout(this.mentorSearchTime);
      this.mentorSearchTime = setTimeout(() => this.getUserList(query, type), 1000);
    }
  }
  private initDropDown() {
    this.lazzyLoadScriptService.loadScript('semanticDropdown.js').subscribe(() => {
      if (!$('#mentors input.search').val()) {
        $('#mentors').dropdown({
          fullTextSearch: true,
          forceSelection: false,
          onAdd: () => {
          }
        });
      }
      $('#mentors input.search').attr('aria-label', 'select batch mentor'); // fix accessibility on screen reader
      $('#mentors input.search').on('keyup', (e) => {
        this.getUserListWithQuery($('#mentors input.search').val(), 'mentor');
      });
    });
  }
  /**
  *  api call to get user list
  */
  private getUserList(query: string = '', type) {
    const requestBody = {
      filters: {'status': '1'},
      query: query
    };
    const isParticipant = type === 'participant';
    let users$;
    if (isParticipant) {
      // drop the previous member search so its remaining pages don't overwrite this one
      if (this.participantSearchSub) {
        this.participantSearchSub.unsubscribe();
      }
      this.participantsLoading = true;
      // other orgs only apply to a typed search; an empty search box lists the creator's org
      const searchOtherOrgs = this.includeOtherOrgs && !!_.trim(query);
      users$ = this.courseBatchService.streamAllUserList(requestBody, type, searchOtherOrgs);
    } else {
      if (this.mentorSearchSub) {
        this.mentorSearchSub.unsubscribe();
      }
      users$ = this.courseBatchService.getAllUserList(requestBody, type);
    }
    const sub = users$.pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const userList = this.sortUsers(res);
        if (isParticipant) {
          this.participantList = userList.participantList;
        } else {
          this.mentorList = userList.mentorList;
        }
      },
        (err) => {
          if (isParticipant) {
            this.participantsLoading = false;
          }
          if (err.error && err.error.params.errmsg) {
            this.toasterService.error(err.error.params.errmsg);
          } else {
            this.toasterService.error(this.resourceService.messages.fmsg.m0056);
          }
        },
        () => {
          if (isParticipant) {
            this.participantsLoading = false;
          }
        });
    if (isParticipant) {
      this.participantSearchSub = sub;
    } else {
      this.mentorSearchSub = sub;
    }
  }

  public removeMentor(mentor: any) {
    _.remove(this.selectedMentors, (data) => {
      return data === mentor;
    });
  }

  private removeParticipantFromBatch(batchId, participantId) {
    return this.courseBatchService.removeUsersFromBatch(participantId,batchId, this.courseId);
  }

  private addParticipantToBatch(batchId, participantId) {
    return this.courseBatchService.addUsersToBatch(participantId, batchId,this.courseId);
  }

  public updateBatch() {
    this.disableSubmitBtn = true;
    let participants = [];
    const selectedMentors = [];
    let mentors = [];
    mentors = $('#mentors').dropdown('get value') ? $('#mentors').dropdown('get value').split(',') : [];
    const memberIds = _.map(this.batchMembers, 'id');
    const existingIds = _.map(this.selectedParticipants, 'id');
    const removedUsers = _.difference(existingIds, memberIds);
    if (this.batchUpdateForm.value.enrollmentType !== 'open') {
      participants = _.difference(memberIds, existingIds);
    }
    participants = participants.filter(participantId => !mentors.some(mentorId => mentorId == participantId));
    if ((this.selectedMentors).length > 0) {
      _.forEach(this.selectedMentors, (obj) => {
        selectedMentors.push(obj.id);
      });
    }
    mentors = _.concat(mentors, selectedMentors);
    const startDate = dayjs(this.batchUpdateForm.value.startDate).format('YYYY-MM-DD');
    const endDate = this.batchUpdateForm.value.endDate && dayjs(this.batchUpdateForm.value.endDate).format('YYYY-MM-DD');
    const requestBody = {
      id: this.batchId,
      courseId: this.courseId,
      name: this.batchUpdateForm.value.name,
      description: this.batchUpdateForm.value.description,
      enrollmentType: this.batchUpdateForm.value.enrollmentType,
      startDate: startDate,
      endDate: endDate || null,
      createdFor: this.userService.userProfile.organisationIds,
      mentors: _.compact(mentors)
    };
    if (this.batchUpdateForm.value.enrollmentType === 'open' && this.batchUpdateForm.value.enrollmentEndDate) {
      requestBody['enrollmentEndDate'] = dayjs(this.batchUpdateForm.value.enrollmentEndDate).format('YYYY-MM-DD');
    }
    const selected = [];
    _.forEach(this.selectedMentors, (value) => {
      selected.push(value.id);
    });
    requestBody['mentors'] = _.concat(_.compact(requestBody['mentors']), selected);
    const requests = [];
    requests.push(this.courseBatchService.updateBatch(requestBody));
    if (removedUsers.length > 0) {
      _.forEach(removedUsers, (id) => {
        requests.push(this.removeParticipantFromBatch(this.batchId, id));
      });
    }
    if (participants && participants.length > 0) {
      const userRequest = {
        userIds: _.compact(participants)
      };
      _.forEach(userRequest.userIds, (participantId) => {
        requests.push(this.addParticipantToBatch(this.batchId, participantId));
      });
    }

    forkJoin(requests).subscribe(results => {
      // this.disableSubmitBtn = false;
      this.toasterService.success(this.resourceService.messages.smsg.m0034);
      this.reload();
      this.checkIssueCertificate(this.batchId, this.batchDetails);
      this.checkEnableDiscussions(this.batchId);
    }, (err) => {
      this.disableSubmitBtn = false;
      if (err.error && err.error.params && err.error.params.errmsg) {
        this.toasterService.error(err.error.params.errmsg);
      } else {
        this.toasterService.error(this.resourceService.messages.fmsg.m0052);
      }
    });
  }

  /**
   * @since - release-3.2.10
   * @param  {string} batchId
   * @param {Object} batchDetails
   * @description - It will emit an event;
   */
  checkIssueCertificate(batchId, batchDetails?: any) {
    let isCertInBatch = true;
    if (batchDetails && _.get(batchDetails, 'cert_templates')) {
      isCertInBatch = _.isEmpty(_.get(batchDetails, 'cert_templates')) ? false : true;
    }
    this.courseBatchService.updateEvent.emit({ event: 'issueCert', value: this.batchUpdateForm.value.issueCertificate,
    mode: 'edit', batchId: batchId , isCertInBatch : isCertInBatch});
  }
  public redirect() {
    this.router.navigate(['./'], { relativeTo: this.activatedRoute.parent });
  }
  private reload() {
    setTimeout(() => {
      this.courseBatchService.updateEvent.emit({ event: 'update' });
      this.router.navigate(['./'], { relativeTo: this.activatedRoute.parent });
    }, 1000);
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

  ngAfterViewInit () {
    setTimeout(() => {
      this.telemetryImpression = {
        context: {
          env: this.activatedRoute.snapshot.data.telemetry.env
        },
        edata: {
          type: this.activatedRoute.snapshot.data.telemetry.type,
          pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
          uri: this.router.url,
          duration: this.navigationhelperService.getPageLoadTime()
        },
        object: {
          id: this.activatedRoute.snapshot.params.batchId,
          type: this.activatedRoute.snapshot.data.telemetry.object.type,
          ver: this.activatedRoute.snapshot.data.telemetry.object.ver,
          rollup: {
            l1: this.activatedRoute.snapshot.params.courseId,
            l2: this.activatedRoute.snapshot.params.batchId
          }
        }
      };
    });
  }
  setTelemetryInteractData() {
    this.updateBatchInteractEdata = {
      id: 'update-batch',
      type: 'click',
      pageid: this.activatedRoute.snapshot.data.telemetry.pageid
    };
    this.clearButtonInteractEdata = {
      id: 'clear-button',
      type: 'click',
      pageid: this.activatedRoute.snapshot.data.telemetry.pageid
    };
    this.telemetryInteractObject = {
      id: this.batchId,
      type: this.activatedRoute.snapshot.data.telemetry.object.type,
      ver: this.activatedRoute.snapshot.data.telemetry.object.ver
    };
  }
  setTelemetryCData(cdata: []) {
    this.telemetryCdata = _.unionBy(this.telemetryCdata, cdata, 'id');
  }
  ngOnDestroy() {
    if (this.updateBatchModal && this.updateBatchModal.deny) {
      this.updateBatchModal.deny();
    }
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
  resetForm() {
    if (this.batchDetails.status === 1) {
      this.batchUpdateForm.controls['name'].reset();
      this.batchUpdateForm.controls['description'].reset();
      this.batchUpdateForm.controls['enrollmentEndDate'].reset();
      this.batchUpdateForm.controls['endDate'].reset();
    } else {
      this.batchUpdateForm.reset();
    }
  }

  getEnabledForumId() {
    this.discussionCsService.getForumIds(this.fetchForumIdReq).subscribe(forumDetails => {
      this.forumIds = _.map(_.get(forumDetails, 'result'), 'cid');
      this.isEnableDiscussions = (this.forumIds && this.forumIds.length > 0) ? 'true' : 'false';
      if (this.isEnableDiscussions === 'true') {
        this.callCreateDiscussion = false;
      }
      this.initializeUpdateForm();
      // form re-init disables update; re-enable if participant details have already loaded
      if (!this.showLoader) {
        this.refreshSubmitState();
      }
    }, error => {
      this.toasterService.error(this.resourceService.messages.emsg.m0005);
    });
  }

  generateDataForDF() {
    this.fetchForumIdReq = {
      type: 'batch',
      identifier: [this.batchId]
    };
  }

  fetchForumConfig() {
    this.fetchForumConfigReq = [{
      type: 'batch',
      identifier: this.batchId
  }];
    const subType = 'batch';
    this.discussionService.fetchForumConfig(subType).subscribe((formData: any) => {
      this.createForumRequest = formData[0];
      this.createForumRequest['category']['context'] =  this.fetchForumConfigReq;
    }, error => {
      this.toasterService.error(this.resourceService.messages.emsg.m0005);
    });
  }

  checkEnableDiscussions(batchId) {
    if (this.batchUpdateForm.value.enableDiscussions === 'true') {
      this.enableDiscussionForum();
    } else {
      this.disableDiscussionForum(batchId);
    }
  }

  enableDiscussionForum() {
    if (this.createForumRequest && this.callCreateDiscussion) {
      this.discussionService.createForum(this.createForumRequest).subscribe(resp => {
        this.handleInputChange('enable-DF-yes');
        location.reload();
        this.toasterService.success(_.get(this.resourceService, 'messages.smsg.m0065'));
      }, error => {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
      });
    }
  }

  disableDiscussionForum(batchId) {
    if (this.forumIds && this.forumIds.length > 0) {
      const requestBody = {
        'sbType': 'batch',
        'sbIdentifier': batchId,
        'cid': this.forumIds
      };
      this.discussionService.removeForum(requestBody).subscribe(resp => {
        this.handleInputChange('enable-DF-no');
        location.reload();
        this.toasterService.success(_.get(this.resourceService, 'messages.smsg.m0066'));
      }, error => {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
      });
    }
  }

  handleInputChange(inputId) {
    const telemetryData = {
      context: {
        env:  this.activatedRoute.snapshot.data.telemetry.env,
        cdata: [{
          id: this.courseId,
          type: 'Course'
        }, {
          id: this.batchId,
          type: 'Batch'
        }]
      },
      edata: {
        id: inputId,
        type: 'click',
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid
      }
    };
    this.telemetryService.interact(telemetryData);
  }
  public onParticipantSearch(query: string) {
    this.participantQuery = query || '';
    this.getUserListWithQuery(query, 'participant');
  }
  /**
  * re-runs the current member search right away for the chosen scope; picked members stay selected.
  * With an empty search box there is nothing to re-run, as that list is always the creator's org.
  */
  public onIncludeOtherOrgsChange(includeOtherOrgs: boolean) {
    this.includeOtherOrgs = includeOtherOrgs;
    if (!_.trim(this.participantQuery)) {
      return;
    }
    clearTimeout(this.participantSearchTime);
    this.getUserList(this.participantQuery, 'participant');
    // the toggle click closes the members list (it is outside it); reopen so the new results are visible
    setTimeout(() => this.memberSelect && this.memberSelect.open());
  }
  getSelectedMembers() {
    if(this.batchUpdateForm.value.enrollmentType !== 'open'){
      return $('#mentors').dropdown('get value') ? $('#mentors').dropdown('get value').split(',') : [];
    } else {
      return [];
    }
  }
  checkList(field) {
    // selecting mentors/members is a valid change; enable update when the form is valid
    if (field === 'mentor' || field === 'participant') {
      this.refreshSubmitState();
    }
  }
  /**
  * enables update when the required batch fields are valid. enableDiscussions is not checked as it
  * is only filled once the forum API responds and may stay empty when that call fails.
  */
  private refreshSubmitState() {
    const controls = this.batchUpdateForm.controls;
    const invalid = ['name', 'enrollmentType', 'startDate', 'issueCertificate'].some(key => controls[key].invalid);
    this.disableSubmitBtn = this.showFormInViewMode || this.showLoader || invalid || this.hasInvalidEditedDates();
  }
  /**
  * end date and enrollment end date only block update once they are edited, so an untouched date
  * stored on an older batch (e.g. an end date that is now in the past) does not lock the form.
  * The enrollment end date is re-checked when the end date changes, as its max is the end date,
  * and only matters for open batches, the only ones that send it.
  */
  private hasInvalidEditedDates(): boolean {
    const { endDate, enrollmentEndDate, enrollmentType } = this.batchUpdateForm.controls;
    const endDateInvalid = endDate.dirty && endDate.invalid;
    const enrollmentEndDateInvalid = enrollmentType.value === 'open' && enrollmentEndDate.invalid &&
      (enrollmentEndDate.dirty || endDate.dirty);
    return endDateInvalid || enrollmentEndDateInvalid;
  }
  
}

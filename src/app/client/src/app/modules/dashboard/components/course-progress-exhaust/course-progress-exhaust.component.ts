import { Subject, Subscription, combineLatest, of } from 'rxjs';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService, UserService } from '@sunbird/core';
import {
  ConfigService,
  IPagination,
  NavigationHelperService,
  PaginationService,
  ResourceService,
  ServerResponse,
  ToasterService
} from '@sunbird/shared';
import { IImpressionEventInput, TelemetryService } from '@sunbird/telemetry';
import * as _ from 'lodash-es';
import { debounceTime, distinctUntilChanged, first, switchMap, takeUntil } from 'rxjs/operators';
import { OnDemandReportService } from '../../../shared/services/on-demand-report/on-demand-report.service';
import { IBatchListData, ICourseProgressData, IForumContext } from '../../interfaces';
import { CourseProgressService, UsageService } from '../../services';
import { courseProgressData } from "./data";

@Component({
  selector: 'app-course-progress-exhaust',
  templateUrl: './course-progress-exhaust.component.html',
  styleUrls: ['./course-progress-exhaust.component.scss']
})
export class CourseProgressExhaustComponent implements OnInit, OnDestroy { //, AfterViewInit
  modelChanged: Subject<string> = new Subject<string>();

  /**
   * Variable to gather and unsubscribe all observable subscriptions in this component.
   */
  public unsubscribe = new Subject<void>();

  interactObject: any;
  /**
	 * This variable helps to show and hide page loader.
	 */
  showLoader = true;
  /**
	 * This variable sets the batch list data related to the given course
	 */
  batchlist: Array<IBatchListData>;
  /**
	 * This variable sets the course id
	 */
  courseId: string;
  userDataSubscription: Subscription;

  // TODO: We have to remove this & use currentBatch.id
  batchId: string;
  /**
	 * This variable sets the user id
	 */
  userId: string;
  /**
 * value typed
 */
  searchText: string;
  /**
	 * This variable sets the dashboard result related to the given batch
	 */
  dashboarData: ICourseProgressData;
  /**
	 * This variable is set to true when the length of batch is 0.
   * It helps to show a message div on html
	 */
  showNoBatch = false;
  /**
	 * This variable helps to show the download modal after successful download API call
	 */
  // showDownloadModal = false;
  /**
	 * This variable sets the filter description which is displayed inside the dashboard
	 */
  filterText: string;
  /**
	 * This variable sets the name of the field which is to be sorted
	 */
  order: string;
  /**
	 * This variable sets the order to true or false
	 */
  reverse = true;
  /**
	 * This variable sets the queryparams on url
	 */
  queryParams: any;
  /**
	 * This variable sets selected batch id, if exist
	 */
  selectedOption: string;
  /**
	 * This variable helps to unsubscribe the params and queryparams
	 */
  paramSubcription: any;
  /**
	 * This variable helps to show the warning div
	 */
  showWarningDiv = false;
  /**
  * This variable helps to show the csv downloadURl
  */
  showDownloadLink = true;
  /**
   * To navigate to other pages
   */
  route: Router; 

  /**
      * Contains page limit of inbox list
   */
  pageLimit: 10;

  /**
    * Current page number of inbox list
  */
  pageNumber = 1;

  /**
    * totalCount of the list
  */
  totalCount = 0;
  /**
   *  to store the current batch when updated;
   */
  currentBatch: any;

  /**
    * Contains returned object of the pagination service
  * which is needed to show the pagination on inbox view
    */
  pager: IPagination;
  /**
   * input data for fetchforum Ids
   */
   fetchForumIdReq: IForumContext;

  /**
   * To send activatedRoute.snapshot to router navigation
   * service for redirection to parent component
   */
  private activatedRoute: ActivatedRoute;
  /**
   * To call resource service which helps to use language constant
   */
  public resourceService: ResourceService;
  /**
   * To show toaster(error, success etc) after any API calls
   */
  private toasterService: ToasterService;
  /**
  * To get user profile of logged-in user
  */
  public user: UserService;
  /**
  * To get user profile of logged-in user
  */
  public courseProgressService: CourseProgressService;
  /**
  * For showing pagination on draft list
  */
  private paginationService: PaginationService;
  /**
    * To get url, app configs
    */
  public config: ConfigService;
  /**
    * To display score report updated date
    */
  public scoreReportUpdatedOn;
  /**
    * To display progress report updated date
    */
  public progressReportUpdatedOn;

  /**
	 * This variable sets the course progress data related to the given course
	 */
  courseProgressExhaustData: any;

  /**
   * To show / hide no result message when no result found
   */
  noResult = false;

  /**
   * To show / hide error
  */
  showError = false;

  /**
   * To show / hide error
  */
  showCourseData = false;


  /**
	 * telemetryImpression object for course progress page
	*/
  telemetryImpression: IImpressionEventInput;
  telemetryCdata: Array<{}>;
  subscription: Subscription;
  isDownloadReport = false;
  stateWiseReportData = [];
  public message = 'There is no data available';
  columns = [
    { name: 'State', isSortable: true, prop: 'state', placeholder: 'Filter state' },
    { name: 'District', isSortable: true, prop: 'district', placeholder: 'Filter district' },
    { name: 'No. of Enrolment', isSortable: false, prop: 'noOfEnrollments', placeholder: 'Filter enrollment' }];
  
  
  userRoles;
  
  /**
	 * Constructor to create injected service(s) object
   * @param {UserService} user Reference of UserService
   * @param {Router} route Reference of Router
   * @param {ActivatedRoute} activatedRoute Reference of ActivatedRoute
   * @param {ResourceService} resourceService Reference of ResourceService
   * @param {ToasterService} toasterService Reference of ToasterService
   * @param {CourseProgressService} courseProgressService Reference of CourseProgressService
	 */
  constructor(user: UserService,
    route: Router,
    activatedRoute: ActivatedRoute,
    resourceService: ResourceService,
    toasterService: ToasterService,
    public telemetryService: TelemetryService,
    courseProgressService: CourseProgressService, paginationService: PaginationService,
    config: ConfigService,
    public onDemandReportService: OnDemandReportService,
    public formService: FormService,
    public navigationhelperService: NavigationHelperService, private usageService: UsageService,
   ) {
    this.user = user;
    this.route = route;
    this.activatedRoute = activatedRoute;
    this.resourceService = resourceService;
    this.toasterService = toasterService;
    this.courseProgressService = courseProgressService;
    this.paginationService = paginationService;
    this.config = config;
    this.route.onSameUrlNavigation = 'ignore';
    this.pageLimit = this.config.appConfig.DASHBOARD.PAGE_LIMIT;
  }

  /**
  * To method helps to get all batches related to the course.
  * Then it helps to set flag dependeing on number of batches.
  */
  populateBatchData(): void {
    // this.showLoader = true;
    const searchParamsCreator = {
      courseId: this.courseId,
      status: ['0', '1', '2'],
      createdBy: this.userId
    };
    const searchParamsMentor = {
      courseId: this.courseId,
      status: ['0', '1', '2'],
      mentors: [this.userId]
    };
    combineLatest(
      this.courseProgressService.getBatches(searchParamsCreator),
      this.courseProgressService.getBatches(searchParamsMentor),
    ).pipe(takeUntil(this.unsubscribe))
      .subscribe((results) => {
        this.batchlist = _.union(results[0].result.response.content, results[1].result.response.content);
        this.showLoader = false;
        const isBatchExist = _.find(this.batchlist, (batch) => batch.id === this.queryParams.batchIdentifier);
        if (this.batchlist.length === 0) {
          this.showCourseData = false;
          this.showNoBatch = true;
        } else if (isBatchExist) {
          this.showCourseData = false;
          this.selectedOption = this.queryParams.batchIdentifier;
          this.currentBatch = isBatchExist;
          this.populateCourseDashboardData(isBatchExist);          
          this.populateCourseProgressExhaustData(isBatchExist);
        } else if (this.batchlist.length === 1 && isBatchExist === undefined) {
          this.showCourseData = false;
          this.queryParams.batchIdentifier = this.batchlist[0].id;
          this.selectedOption = this.batchlist[0].id;
          this.currentBatch = this.batchlist[0];
          this.generateDataForDF(this.currentBatch);
          this.setBatchId(this.currentBatch);
          this.populateCourseDashboardData(this.batchlist[0]);
          this.populateCourseProgressExhaustData(this.currentBatch);
        } else if (this.batchlist.length > 1 && isBatchExist === undefined) {
          this.generateDataForDF(this.currentBatch);
          this.showCourseData = true;
          // this.setBatchId(this.currentBatch);
          // this.populateCourseDashboardData(this.batchlist[0]);
          this.currentBatch = undefined;
          this.populateCourseProgressExhaustData(this.currentBatch);
        } else {
          this.showWarningDiv = true;
        }
        this.paramSubcription.unsubscribe();
      }, (err) => {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
        this.showLoader = false;
        this.showNoBatch = true;
      });
  }


  populateCourseProgressExhaustData(batch: any) {
    // debugger;
    let option: any;

    // If there are multiple batches and none of the batch is selected.
    if ( this.showCourseData) {
      option = {
        courseId : this.courseId,
        limit: this.pageLimit,
        offset: (this.pageNumber - 1) * (this.pageLimit),
      }
    } else {
      option = {
        courseId : this.courseId,
        batchId: batch.batchId,
        limit: this.pageLimit,
        offset: (this.pageNumber - 1) * (this.pageLimit),
      }
    }

    // if (this.order) {
    //   option.sortBy = this.order;
    //   option.sortOrder = this.reverse ? 'desc' : 'asc';
    // }
    // if (this.searchText) {
    //   option.username = this.searchText;
    // }
    this.courseProgressService.getCourseProgressExhaustData(option).pipe(
      takeUntil(this.unsubscribe))
      .subscribe(
        (apiResponse: ServerResponse) => {
          if (!apiResponse.result.count && _.get(apiResponse, 'result.data.length')) {
            apiResponse.result.count = _.get(apiResponse, 'result.data.length');
          } else {
            apiResponse.result.count = 0;
          }
          this.showLoader = false;
          this.courseProgressExhaustData = apiResponse.result.content;
          this.totalCount = apiResponse.result.total_items;
          
          // // API call will be made to get the data
          // this.courseProgressExhaustData = courseProgressData.result.content;

          // this.totalCount = courseProgressData.result.total_items
          this.pager = this.paginationService.getPager(this.totalCount, this.pageNumber, 5);
          this.showLoader = false;
          this.noResult = false;

          // this.showDownloadLink = apiResponse.result.showDownloadLink ? apiResponse.result.showDownloadLink : false;
          // this.dashboarData.count = _.get(batch, 'participantCount') || _.get(apiResponse, 'result.data.length');
          // this.totalCount = _.get(batch, 'participantCount') || _.get(apiResponse, 'result.data.length');
          // if (this.totalCount >= 10000) {
          //   this.pager = this.paginationService.getPager(10000, this.pageNumber, this.config.appConfig.DASHBOARD.PAGE_LIMIT);
          // } else {
          //   this.pager = this.paginationService.getPager(
          //     apiResponse.result.count, this.pageNumber, this.config.appConfig.DASHBOARD.PAGE_LIMIT);
          // }
        },
        err => {
          this.toasterService.error(err.error.params.errmsg);
          this.showLoader = false;
        }
      );
      console.log("Error block skipped >>>>>>>>>>>>>");
      // The error block was also not encountered, so put this block  
      // // API call will be made to get the data
      // this.courseProgressExhaustData = courseProgressData.result.content;

      // this.totalCount = courseProgressData.result.total_items
      // this.pager = this.paginationService.getPager(this.totalCount, this.pageNumber, 5);
      // this.showLoader = false;
      // this.noResult = false;      
    }

  /**
  * To method helps to set batch id and calls the populateCourseDashboardData
  *
	* @param {string} batchId batch identifier
  */
  setBatchId(batch?: any): void {
    this.fetchForumIdReq = null;
    this.showWarningDiv = false;
    this.queryParams.batchIdentifier = batch.id;
    this.queryParams.pageNumber = this.pageNumber;
    this.searchText = '';
    this.currentBatch = batch;
    // this.currentBatch.lastUpdatedOn = dayjs(this.currentBatch.lastUpdatedOn).format('DD-MMM-YYYY hh:mm a');
    this.batchId = batch.id;
    this.setCounts(this.currentBatch);
    this.populateCourseDashboardData(batch);
  }


  /**
   * Method to update the url with selected query params
   */
  navigate(): void {
    this.route.navigate([], { queryParams: this.queryParams });
  }
  redirect() {
    this.route.navigate(['/learn/course', this.courseId]);
  }

  setInteractEventDataForTabs(id) {
    const telemetryObj = {
      context: {
        env: 'reports',
        cdata: [
          {id: _.get(this.currentBatch , 'courseId'), type: 'Course'},
          {id: _.get(this.currentBatch , 'batchId'), type: 'Batch'}
        ]
      },
      edata: {
        id: id,
        type: 'click',
        pageid: id
      }
    };
    this.telemetryService.interact(telemetryObj);
  }
  /**
  * To method fetches the dashboard data with specific batch id and timeperiod
  */
 // TODO: This function will be removed. API got deprecated.
  populateCourseDashboardData(batch?: any): void {
    return ;
    if (!batch && this.currentBatch) {
      batch = this.currentBatch;
    }
    this.showWarningDiv = false;
    this.navigate();
    this.showLoader = true;
    const option: any = {
      batchIdentifier: this.queryParams.batchIdentifier,
      limit: this.pageLimit,
      offset: (this.pageNumber - 1) * (this.pageLimit),
    };
    if (this.order) {
      option.sortBy = this.order;
      option.sortOrder = this.reverse ? 'desc' : 'asc';
    }
    if (this.searchText) {
      option.username = this.searchText;
    }
    this.courseProgressService.getDashboardData(option).pipe(
      takeUntil(this.unsubscribe))
      .subscribe(
        (apiResponse: ServerResponse) => {
          if (!apiResponse.result.count && _.get(apiResponse, 'result.data.length')) {
            apiResponse.result.count = _.get(apiResponse, 'result.data.length');
          } else {
            apiResponse.result.count = 0;
          }
          this.showLoader = false;
          this.dashboarData = apiResponse.result;
          this.showDownloadLink = apiResponse.result.showDownloadLink ? apiResponse.result.showDownloadLink : false;
          this.dashboarData.count = _.get(batch, 'participantCount') || _.get(apiResponse, 'result.data.length');
          this.totalCount = _.get(batch, 'participantCount') || _.get(apiResponse, 'result.data.length');
          if (this.totalCount >= 10000) {
            this.pager = this.paginationService.getPager(10000, this.pageNumber, this.config.appConfig.DASHBOARD.PAGE_LIMIT);
          } else {
            this.pager = this.paginationService.getPager(
              apiResponse.result.count, this.pageNumber, this.config.appConfig.DASHBOARD.PAGE_LIMIT);
          }
        },
        err => {
          this.toasterService.error(err.error.params.errmsg);
          this.showLoader = false;
        }
      );
  }

  
  navigateToPage(page: number): undefined | void {
    if (page < 1 || page > this.pager.totalPages) {
      return;
    }
    this.pageNumber = page;
    this.queryParams.pageNumber = this.pageNumber;
    this.navigate();
    if (this.currentBatch) {
      this.populateCourseProgressExhaustData(this.currentBatch);
    }
  }    // if (!batch) {
    //   option.batchId === undefined;
    // }

  keyup(event) {
    this.modelChanged.next(_.trim(event));
  }
  searchBatch() {
    this.modelChanged.pipe(debounceTime(1000),
      distinctUntilChanged(),
      switchMap(search => of(search))
    ).
      subscribe(query => {
        this.populateCourseDashboardData();
      });
  }


  getFieldValue(array, field) {
    if (_.find(array, {'type': field})) {
      return _.find(array, {'type': field}).count;
    } else {
      return;
    }
  }

  /**
  * To method subscribes the user data to get the user id.
  * It also subscribes the activated route params to get the
  * course id and timeperiod
  */
  ngOnInit() {

/*    
    // API call will be made to get the data
    this.courseProgressExhaustData = courseProgressData.result.content;

    this.totalCount = courseProgressData.result.total_items
    this.pager = this.paginationService.getPager(this.totalCount, this.pageNumber, 5);
    this.showLoader = false;
    this.noResult = false;
    //---- The above code is for testing purpose only
*/
    this.userDataSubscription = this.user.userData$.pipe(first()).subscribe(userdata => {
      if (userdata && !userdata.err) {
        this.userId = userdata.userProfile.userId;
        this.userRoles = _.get(userdata, 'userProfile.userRoles');
        this.paramSubcription = combineLatest(this.activatedRoute.parent.params,
          this.activatedRoute.params, this.activatedRoute.queryParams,
          (parentParams: any, params: any, queryParams: any) => {
            return {
              params: parentParams || params,
              queryParams: queryParams
            };
          })
          .subscribe(bothParams => {
            this.courseId = bothParams.params.courseId;
            this.batchId = bothParams.params.batchId;
            this.queryParams = { ...bothParams.queryParams };
            this.interactObject = { id: this.courseId, type: 'Course', ver: '1.0' };
            this.populateBatchData();
          });
      }
    });
    this.searchBatch();
    this.setInteractEventData();
  }


  /**
   * @since - #SH-601
   * @param  {} currentBatch
   * @description - This will set completedCount and participantCount to the currentBatch object;
   */
    setCounts(currentBatch) {
      this.currentBatch['completedCount'] = _.get(currentBatch, 'completedCount') ? _.get(currentBatch, 'completedCount') : 0;
      this.currentBatch['participantCount'] = _.get(currentBatch, 'participantCount') ? _.get(currentBatch, 'participantCount') : 0;
    }

  setInteractEventData() {
    if (_.get(this.queryParams, 'batchIdentifier')) {
      this.telemetryCdata = [{ 'type': 'batch', 'id': this.queryParams.batchIdentifier }];
    } else {
      this.telemetryCdata = [{ 'type': 'course', 'id': this.courseId }];
    }
  }

  ngOnDestroy() {
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  generateDataForDF(batchId) {
    this.fetchForumIdReq = null;
    if (batchId) {
      this.fetchForumIdReq = {
        type: 'batch',
        identifier: [batchId.id]
      };
    }
  }
} 

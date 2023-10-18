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
import { UsageService } from '../../services';
import { CourseProgressService } from '../../services';

import { courseProgressData } from "./data";
import { ExportCsvService } from './../../services/course-progress/export-csv.service';
import * as moment from 'moment';

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
  pageLimit: 0;

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
	 * This variable holds the course name
	 */
  courseName: string;

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
  
  columns: string[] = [];
  fileName = 'course-progress-exhaust-data';
  
  userRoles;
  firstTime = false;
  
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
    public exportCsvService: ExportCsvService
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
  * And populates the course progress exhaust data
  */
  populateBatchData(): void {
    this.showLoader = true;
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
        console.log("results Batch -", results);
        this.batchlist = _.union(results[0].result.response.content, results[1].result.response.content);
        this.showLoader = false;
        const isBatchExist = _.find(this.batchlist, (batch) => batch.id === this.queryParams.batchIdentifier);
        if (this.batchlist.length === 0) {
          this.showCourseData = false;          
          this.showLoader = false;
          this.showNoBatch = true;
        } else if (isBatchExist) {
          this.showCourseData = false;
          this.selectedOption = this.queryParams.batchIdentifier;
          this.currentBatch = isBatchExist;
          this.populateCourseProgressExhaustData(isBatchExist);
        } else if (this.batchlist.length === 1 && isBatchExist === undefined) {
          this.showCourseData = false;
          this.queryParams.batchIdentifier = this.batchlist[0].id;
          this.selectedOption = this.batchlist[0].id;
          this.currentBatch = this.batchlist[0];
          this.generateDataForDF(this.currentBatch);
          this.populateCourseProgressExhaustData(this.currentBatch);
        } else if (this.batchlist.length > 1 && isBatchExist === undefined) {
          this.generateDataForDF(this.currentBatch);
          this.showCourseData = true;
          this.currentBatch = undefined;
          this.populateCourseProgressExhaustData(this.currentBatch);
        } else {
          this.showWarningDiv = true;
        }
        // this.paramSubcription.unsubscribe();
      }, (err) => {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
        this.showLoader = false;
        this.showNoBatch = true;
        this.paramSubcription.unsubscribe();
      });
  }


  populateCourseProgressExhaustData(batch: any) {
    let option: any;

    // If there are multiple batches and none of the batch is selected.
    if (this.showCourseData) {
      option = {
        courseId: this.courseId,
        limit: this.pageLimit,
        offset: (this.pageNumber - 1) * (this.pageLimit),
      }
    } else {
      option = {
        courseId: this.courseId,
        batchId: batch.batchId,
        limit: this.pageLimit,
        offset: (this.pageNumber - 1) * (this.pageLimit),
      }
    }

    if (this.searchText) {
      option.query = this.searchText;
    }


    this.courseProgressService.getCourseProgressExhaustData(option).subscribe(
      (apiResponse) => {
        console.log("Success Handler => getCourseProgressExhaustData() : ", apiResponse);
        this.courseProgressExhaustData = apiResponse?.result?.content;
        this.totalCount = apiResponse?.result?.total_items;
        this.pager = this.paginationService.getPager(this.totalCount, this.pageNumber, this.pageLimit);
        this.showLoader = false;
        if (this.totalCount === 0) {
          this.noResult = true;
        }
        this.noResult = false;
        if (this.firstTime){
          this.searchBatch();
          this.setInteractEventData();
        }
        this.paramSubcription.unsubscribe();
      },
      (err) => {
        console.log("Error Handler => getCourseProgressExhaustData():",  err);
        this.toasterService.error(err);
        this.showLoader = false;
        this.paramSubcription.unsubscribe();
      }
    );

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
    this.searchText = '';
    this.currentBatch = batch;
    // this.currentBatch.lastUpdatedOn = dayjs(this.currentBatch.lastUpdatedOn).format('DD-MMM-YYYY hh:mm a');
    this.batchId = batch.id;
    this.setCounts(this.currentBatch);
    // this.populateCourseDashboardData(batch);
    this.showCourseData = false;
    this.populateCourseProgressExhaustData(batch);
  }

  redirect() {
    this.route.navigate(['/learn/course', this.courseId]);
  }

  navigateToPage(page: number): undefined | void {
    if (page < 1 || page > this.pager.totalPages) {
      return;
    }
    this.pageNumber = page;
    const isBatchExist = _.find(this.batchlist, (batch) => batch.id === this.queryParams.batchIdentifier);
    this.currentBatch = isBatchExist;
    this.populateCourseProgressExhaustData(this.currentBatch);
  }   

  keyup(event) {
    // console.log("event", event);
    this.modelChanged.next(_.trim(event));
    // this.searchBatch();
    this.searchText = _.trim(event);
    this.populateCourseProgressExhaustData(this.currentBatch);
  }
  
  searchBatch() {
    this.modelChanged.pipe(debounceTime(1000),
      distinctUntilChanged(),
      switchMap(search => of(search))
    ).
      subscribe(searchText => {
        this.searchText = searchText;
        this.populateCourseProgressExhaustData(this.currentBatch);
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
  * To method subscribes the course data using course id.
  */
  populateCourseData(courseId: string) {
    this.courseProgressService.getCourseData(courseId).subscribe(
      (apiResponse: ServerResponse)  => {
        this.courseName = apiResponse.result.content.name;
      },
      (err) => {  
        this.toasterService.error(err.error.params.errmsg);
        this.showLoader = false;
      }
    )
  }

  /**
  * To method subscribes the user data to get the user id.
  * It also subscribes the activated route params to get the
  * course id and timeperiod
  */
  ngOnInit() {
    this.userDataSubscription = this.user.userData$.pipe(first()).subscribe(userdata => {
      if (userdata && !userdata.err) {
        this.userId = userdata.userProfile.userId;
        this.userRoles = _.get(userdata, 'userProfile.userRoles');
        this.paramSubcription = combineLatest(this.activatedRoute.parent.params,
          this.activatedRoute.params, this.activatedRoute.queryParams,
          (parentParams: any, params: any, queryParams: any) => {
            return {
              parentParams: parentParams,
              params: params,
              queryParams: queryParams
            };
          })
          .subscribe(allParams => {
            this.courseId = undefined;
            this.batchId = undefined;
            if ( allParams?.parentParams?.courseId) {
              this.courseId = allParams?.parentParams?.courseId;
              this.batchId = allParams?.parentParams?.batchId;
              this.queryParams = { ...allParams?.parentParams?.queryParams };  
            } else if (allParams?.params?.courseId) {
              this.courseId = allParams?.params?.courseId;
              this.batchId = allParams?.params?.batchId;
              this.queryParams = { ...allParams.params.queryParams };  
            }
            this.interactObject = { id: this.courseId, type: 'Course', ver: '1.0' };
            this.populateCourseData(this.courseId);
            this.populateBatchData();
          });
      }
    });
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

  exportToCsv(batch: any) {
    let option: any;
    this.columns = this.getColumns();

    // If there are multiple batches and none of the batch is selected.
    if (this.showCourseData) {
      option = {
        courseId: this.courseId,
      }
      this.fileName = this.courseId;
    } else {
      option = {
        courseId: this.courseId,
        batchId: batch.batchId,
      }
      this.fileName = this.courseId + '_' + batch.batchId;
    }

    if (this.searchText) {
      option.query = this.searchText;
      this.fileName = this.fileName + '_' + this.searchText;
    }

    let currentDate = moment(new Date(), 'DD-MM-YYYY');
    this.fileName = this.fileName + '_' + currentDate;

    this.courseProgressService.getExportData(option).subscribe(
      (apiResponse) => {
        console.log("Success Handler => exportToCsv() : ", apiResponse);
        this.courseProgressExhaustData = apiResponse?.result?.content;
        this.totalCount = apiResponse?.result?.total_items;
        this.exportCsvService.downloadFile(this.courseProgressExhaustData, this.columns, this.fileName);
        this.paramSubcription.unsubscribe();
      },
      err => {
        console.log("Error Handler => exportToCsv()  : ", err);
        this.toasterService.error(err);
        this.paramSubcription.unsubscribe();
      }
    );
  }

  getColumns() {
    this.columns = [
      'userName', 
      'maskedEmail', 
      'maskedPhone', 
      'coursename', 
      'batchname',
      'start_date',
      'end_date',
      'enrolled_date',
      'completedon',
      'progress',
      'completionpercentage',
      'issued_certificates'  
    ];
    return this.columns;
  }
} 

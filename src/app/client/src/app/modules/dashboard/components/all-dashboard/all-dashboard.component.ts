import { IInteractEventEdata, IInteractEventObject, TelemetryInteractDirective } from '@sunbird/telemetry';
import { IImpressionEventInput } from './../../../telemetry/interfaces/telemetry';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UsageService, ReportService } from './../../services';
import * as _ from 'lodash-es';
import { DomSanitizer } from '@angular/platform-browser';
import { UserService } from '@sunbird/core';
import {
  ToasterService, ResourceService,
  INoResultMessage, ConfigService, LayoutService, UtilService,
  ConnectionService
} from '@sunbird/shared';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CertificateDownloadAsPdfService } from 'sb-svg2pdf';
import { CsCourseService } from '@project-sunbird/client-services/services/course/interface';
import { ProfileService } from '@sunbird/profile';
@Component({
  selector: 'app-all-dashboard',
  templateUrl: './all-dashboard.component.html',
  styleUrls: ['./all-dashboard.component.scss'],
  providers: [CertificateDownloadAsPdfService]
})
export class AllReportsComponent implements OnInit {
  /**
* Admin Dashboard access roles
*/
 layoutConfiguration: any;
  azureUrl: string;
  adminDashboard: Array<string>;
  reportMetaData: any;
  donutChartData: any = [];
  chartData: Array<object> = [];
  table: any;
  showTrainingstats: boolean = true;
  isTableDataLoaded = false;
  enrolledCourseData: any = [];
  currentReport: any;
  slug: string;
  cols: any = [];
  noResult: boolean;
  noResultMessage: INoResultMessage;
  noRecorsFoundMessage:any
  private activatedRoute: ActivatedRoute;
  telemetryImpression: IImpressionEventInput;
  telemetryInteractEdata: IInteractEventEdata;
  telemetryInteractDownloadEdata: IInteractEventEdata;
  urlPathValue: string;
  private unsubscribe$ = new Subject<void>();
  isDesktopApp;
  isConnected = true;

  constructor(public configService: ConfigService, private layoutService: LayoutService, private usageService: UsageService, private sanitizer: DomSanitizer,
    public userService: UserService, private toasterService: ToasterService, public utilService: UtilService,private connectionService: ConnectionService,
    public resourceService: ResourceService, activatedRoute: ActivatedRoute, private certDownloadAsPdf: CertificateDownloadAsPdfService,
    private router: Router, public reportService: ReportService,
    @Inject('CS_COURSE_SERVICE') private courseCService: CsCourseService,
    public profileService: ProfileService
  ) {
    this.activatedRoute = activatedRoute;
  }

  ngOnInit() {
    this.isDesktopApp = this.utilService.isDesktopApp;
    this.setTelemetryImpression();
    this.adminDashboard = this.configService.rolesConfig.headerDropdownRoles.adminDashboard;
    this.urlPathValue='';
    this.urlPathValue=  sessionStorage.getItem("urlPath");
    this.getEnrolledCourses();
    this.initLayout()
    this.noRecorsFoundMessage = {
      'messageText': "No Records found"
    };

    if (this.isDesktopApp) {
      this.connectionService.monitor()
      .pipe(takeUntil(this.unsubscribe$)).subscribe(isConnected => {
        this.isConnected = isConnected;
      });
    }
  }

  initLayout() {
    this.layoutConfiguration = this.layoutService.initlayoutConfig();
    this.layoutService.switchableLayout().pipe(takeUntil(this.unsubscribe$)).subscribe(layoutConfig => {
      if (layoutConfig != null) {
        this.layoutConfiguration = layoutConfig.layout;
      }
    });
  }
  getEnrolledCourses() {
    this.reportService.getEnrolledCourses().subscribe(response => {
      this.enrolledCourseData = [];
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.courses.length > 0) {
          this.enrolledCourseData = response.result.courses;
          var self = this;
          _.map(this.enrolledCourseData, function (obj) {
            obj.batchName = obj.batch.name;
            obj.courseName = obj.courseName;
            obj.enrollmentType = obj.batch.enrollmentType;
            if(obj.batch.startDate) obj.startDate = moment(obj.batch.startDate).format('DD-MMM-YYYY')
            if(obj.batch.endDate) obj.endDate = moment(obj.batch.endDate).format('DD-MMM-YYYY');
            if(obj.enrolledDate) obj.enrollmentDate = moment(obj.enrolledDate).format('DD-MMM-YYYY');
            obj.statusName = (obj.progress === 0) ? 'Not-Started' : ((obj.progress === obj.leafNodesCount || obj.progress > obj.leafNodesCount) ? 'Completed' : 'In-Progress');
            obj.statusName = (obj.statusName != 'Completed' && (new Date(obj.batch.endDate) < new Date())) ? 'Expired' : obj.statusName;
            if(obj.statusName === 'Completed'){
              obj.completedOn = moment(obj.completedOn).format('DD-MMM-YYYY')
            }
            else if(obj.statusName === 'Expired'){
              obj.completedOn = 'Incomplete'
            }
            else if(obj.statusName === 'In-Progress'){
              obj.completedOn = 'Ongoing'
            }
            obj.downloadUrl = self.azureUrl + obj.courseName + '-' + self.userService.userid + '-' + obj.courseId + '.pdf';
          });
          this.initializeColumns();
          this.initializeDonutChart();
        }
        this.showTrainingstats = true;
        if (_.isEmpty(this.enrolledCourseData)) {
          this.showTrainingstats = false;
        }
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
      }
    }, (err) => {
      this.noResultMessage = {
        'messageText': 'messages.stmsg.m0131'
      };
    });
  }
  initializeColumns() {
    this.cols = [
      { field: 'batchName', header: 'Batch Name' },
      { field: 'courseName', header: 'Course Name' },
      { field: 'enrollmentType', header: 'Enrollment Type' },
      { field: 'startDate', header: 'Batch Start Date' },
      { field: 'enrollmentDate', header: 'Enrollment Date' },
      { field: 'endDate', header: 'Batch End Date' },
      { field: 'completedOn', header: 'Completion Date' },
      { field: 'statusName', header: 'Status' },
      { field: 'certificate', header: 'Certificate', width: '75px' }
    ]
  }

  downloadCert(course) {
    if (this.isDesktopApp && !this.isConnected) {
      this.toasterService.error(this.resourceService.messages.desktop.emsg.cannotAccessCertificate);
      return;
    }
    // Check for V2
    if (_.get(course, 'issuedCertificates.length')) {
      this.toasterService.success(_.get(this.resourceService, 'messages.smsg.certificateGettingDownloaded'));
      const certificateInfo = course.issuedCertificates[0];
      const courseName = course.courseName || _.get(course, 'issuedCertificates[0].name') || 'certificate';
      if (_.get(certificateInfo, 'identifier')) {
        this.courseCService.getSignedCourseCertificate(_.get(certificateInfo, 'identifier'))
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((resp) => {
          if (_.get(resp, 'printUri')) {
            this.certDownloadAsPdf.download(resp.printUri, null, courseName);
          } else if (_.get(course, 'certificates.length')) {
            this.downloadPdfCertificate(course.certificates[0]);
          } else {
            this.toasterService.error(this.resourceService.messages.emsg.m0076);
          }
        }, error => {
          this.downloadPdfCertificate(certificateInfo);
        });
      } else {
        this.downloadPdfCertificate(certificateInfo);
      }
    } else if (_.get(course, 'certificates.length')) { // For V1 - backward compatibility
      this.toasterService.success(_.get(this.resourceService, 'messages.smsg.certificateGettingDownloaded'));
      this.downloadPdfCertificate(course.certificates[0]);
    } else {
      this.toasterService.error(this.resourceService.messages.emsg.m0076);
    }
  }

  downloadPdfCertificate(value) {
    if (_.get(value, 'url')) {
      const request = {
        request: {
          pdfUrl: _.get(value, 'url')
        }
      };
      this.profileService.downloadCertificates(request).subscribe((apiResponse) => {
        const signedPdfUrl = _.get(apiResponse, 'result.signedUrl');
        if (signedPdfUrl) {
          window.open(signedPdfUrl, '_blank');
        } else {
          this.toasterService.error(this.resourceService.messages.emsg.m0076);
        }
      }, (err) => {
        this.toasterService.error(this.resourceService.messages.emsg.m0076);
      });
    } else {
      this.toasterService.error(this.resourceService.messages.emsg.m0076);
    }
  }

  downloadCertificate(url) {
    window.open(url, '_blank');
  }
  initializeDonutChart() {
    let labelArray = [];
    let datasets = [];
    let self = this;
    _.map(_.uniqBy(this.enrolledCourseData, 'statusName'), function (obj) {
      labelArray.push(' ' + _.get(obj, 'statusName'));
      datasets.push(_.filter(self.enrolledCourseData, { statusName: _.get(obj, 'statusName') }).length);
    });
    this.donutChartData = {
      labels: labelArray,
      datasets: [
        {
          data: datasets,
          backgroundColor: ["#42a5f5", "#26a69a", "#8bc34a", "#43a047"],
          hoverBackgroundColor: ["#42a5f5", "#26a69a", "#8bc34a", "#43a047"]
        }]
    };
  }
  setTelemetryInteractObject(val) {
    return {
      id: val,
      type: 'view',
      ver: '1.0'
    };
  }

  setTelemetryImpression() {
    this.telemetryInteractEdata = {
      id: 'report-view',
      type: 'click',
      pageid: this.activatedRoute.snapshot.data.telemetry.pageid
    };

    this.telemetryInteractDownloadEdata = {
      id: 'report-download',
      type: 'click',
      pageid: this.activatedRoute.snapshot.data.telemetry.pageid
    };

    this.telemetryImpression = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      object: {
        id: this.userService.userid,
        type: 'user',
        ver: '1.0'
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        uri: this.router.url
      }
    };
  }

  ngOnDestroy(){
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

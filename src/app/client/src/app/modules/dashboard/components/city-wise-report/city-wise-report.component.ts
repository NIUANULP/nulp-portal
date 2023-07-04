import { IInteractEventEdata, IInteractEventObject, TelemetryInteractDirective } from '@sunbird/telemetry';
import { IImpressionEventInput } from './../../../telemetry/interfaces/telemetry';
import { Component, OnInit, ViewChild, ViewEncapsulation, OnDestroy } from '@angular/core';
import { UsageService } from './../../services';
import * as _ from 'lodash-es';
import { DomSanitizer } from '@angular/platform-browser';
import { UserService } from '@sunbird/core';
import { ToasterService, ResourceService, INoResultMessage, ConfigService } from '@sunbird/shared';
import { UUID } from 'angular2-uuid';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../services/report/report.service';
import { DatePipe } from '@angular/common';
import { OnDelete } from 'fine-uploader/lib/core';
import { Subject } from 'rxjs';
import * as moment from 'moment';
@Component({
  selector: 'app-city-wise-report',
  templateUrl: './city-wise-report.component.html',
  styleUrls: ['./city-wise-report.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CityWiseReportComponent implements OnInit, OnDestroy {
  pieChartData: any;
  public unsubscribe = new Subject<void>();
  noResult: boolean = false;
  value: Date;
  moment: any;
  currentDate: Date = new Date();
  fromDate: Date;
  toDate: Date;
  tableData: any = [];
  allOrgName: any = [];
  allUserName: any = [];
  cityList: any = [];
  selectedCity: string;
  cols: any[];
  noResultMessage: INoResultMessage;
  private activatedRoute: ActivatedRoute;
  telemetryImpression: IImpressionEventInput;
  constructor(private usageService: UsageService, private sanitizer: DomSanitizer, private configService: ConfigService,
    public userService: UserService, private toasterService: ToasterService,
    public resourceService: ResourceService, activatedRoute: ActivatedRoute, private router: Router, public reportService: ReportService, private datePipe: DatePipe
  ) {
    this.activatedRoute = activatedRoute;
  }
  ngOnInit() {
    this.initializeDateFields();
    this.getOrgList();
    this.getOrgDetails();
    // this.getUserDetails();
  }
  initializeDateFields() {
    this.moment = moment();
    this.fromDate = new Date(this.moment.subtract(7, "days"));
    this.toDate = new Date();
  }
  getContentCreationStaticsReport() {
    let channelfilter = [];
    // _.map(_.filter(_.cloneDeep(this.allOrgName), { rootOrgId: _.get(this.selectedCity, 'rootOrgId') }), function (obj) {
    //   channelfilter.push(obj.rootOrgId);
    // });
    const data = {
      "request": {
        "query": "",
        "filters": {
          "status": [
            "Live"
          ],
          "framework": ["nulp"],
          "channel": [_.get(this.selectedCity, 'id')],
          // "channel": channelfilter,
          "contentType": ["Course", 'Resource', 'Collection'],
          "lastUpdatedOn": { ">=": this.datePipe.transform(this.fromDate, 'yyyy-MM-ddTHH:MM'), "<=": this.datePipe.transform(this.toDate, 'yyyy-MM-ddTHH:MM') }
        },
        "limit": "1000",
        "sort_by": {
          "lastUpdatedOn": "desc"
        },
        "fields": ["identifier", "creator", "organisation", "name", "contentType", "createdFor", "channel", "board", "medium", "gradeLevel", "subject", "lastUpdatedOn", "status", "createdBy", "framework", "createdOn", "lastPublishedOn"]
      }
    };
    if (!_.isEmpty(this.selectedCity)) {
      this.reportService.getContentCreationStaticsReport(data).subscribe((response) => {
        if (_.get(response, 'responseCode') === 'OK') {
          if (response.result.count > 0) {
            this.tableData = [];
            let tempObj = _.cloneDeep(response.result.content);
            var self = this;
            _.map(tempObj, function (obj) {
              obj.createdOn = self.datePipe.transform(obj.lastPublishedOn, 'MM/dd/yyyy');
              obj.OrgName = _.get(self.selectedCity, 'orgName');
              if (_.toArray(obj.createdFor).length === 1) {
                // obj.departmentName = _.toArray(obj.organisation)[0];
                obj.departmentName = _.get(_.find(self.allOrgName, { 'id': _.toArray(obj.createdFor)[0] }), 'orgName');
              } else if (_.toArray(obj.createdFor).length > 1) {
                if (_.get(self.selectedCity, 'identifier') === _.toArray(obj.createdFor)[0]) {
                  // obj.departmentName = _.toArray(obj.organisation)[1];
                  obj.departmentName = _.get(_.find(self.allOrgName, { 'id': _.toArray(obj.createdFor)[1] }), 'orgName');
                } else {
                  // obj.departmentName = _.toArray(obj.organisation)[0];
                  obj.departmentName = _.get(_.find(self.allOrgName, { 'id': _.toArray(obj.createdFor)[0] }), 'orgName');
                }
              }
              // if (!_.isEmpty(obj.channel)) {
              //   obj.departmentName = _.lowerCase(_.get(_.find(self.allOrgName, { 'id': obj.channel }), 'orgName'));
              // } else {
              //   obj.departmentName = '';
              // }
              obj.UserName = obj.creator;
              // if (!_.isEmpty(obj.createdBy)) {
              //   obj.UserName = _.get(_.find(self.allUserName, { 'id': obj.createdBy }), 'firstName') + " " + _.get(_.find(self.allUserName, { 'id': obj.createdBy }), 'lastName');
              // } else {
              //   obj.UserName = '';
              // }
            });
            this.noResult = false;
            this.tableData = tempObj;
            // this.tableData = _.get(this.selectedCity, 'orgName') != 'All' ? _.filter(tempObj, { OrgName: _.get(this.selectedCity, 'orgName') }) : tempObj;
            this.initializeColumns();
            this.initializePieChart();
            // if (_.isEmpty(this.tableData)) {
            //   this.noResultMessage = {
            //     'messageText': 'messages.stmsg.m0131'
            //   };
            //   this.noResult = true;
            // }
          } else {
            this.noResultMessage = {
              'messageText': 'messages.stmsg.m0131'
            };
            this.noResult = true;
          }
        } else {
          this.toasterService.error(this.resourceService.messages.emsg.m0007);
        }
      }, (err) => {
        console.log(err);
        this.toasterService.error(this.resourceService.messages.emsg.m0007);
      });
    } else {
      this.toasterService.error("Please select the city");
    }
  }
  initializePieChart() {
    let pieChartLabels = [];
    let pieChartData = [];
    let pieChartColors = [];
    let staticColors = ["#42a5f5", "#26a69a", "#8bc34a", "#43a047", "#0097a7"];
    let self = this;
    _.map(_.uniqBy(_.cloneDeep(this.tableData), 'departmentName'), function (obj) {
      pieChartLabels.push(_.get(obj, 'departmentName'));
      pieChartData.push(_.filter(_.cloneDeep(self.tableData), { departmentName: _.get(obj, 'departmentName') }).length);
    });
    _.map(pieChartLabels, function (obj, index) {
      pieChartColors.push(staticColors[index % 5]);
    });
    this.pieChartData = {
      labels: pieChartLabels,
      datasets: [
        {
          data: pieChartData,
          backgroundColor: pieChartColors,
          hoverBackgroundColor: pieChartColors
        }]
    };
  }
  getOrgList() {
    this.cityList = [];
    const data = {
      "request": {
        "filters": {
          "isTenant":true,
          "status":1
        },
        limit: 10000
      }
    };
    this.reportService.getOrganizationName(data).subscribe((response) => {
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.response.count > 0) {
          // this.cityList = _.reject(response.result.channels, function (obj) {
          //   if (obj.name === 'nuis_test' || obj.name === 'niua_test' || obj.name === 'nuis' || obj.name === 'pwc') {
          //     return obj;
          //   }
          // });
          this.cityList = _.reject(response.result.response.content,obj=>_.isEmpty(obj.orgName));
        }
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0007);
      }
    }, (err) => {
      console.log(err);
      this.toasterService.error(this.resourceService.messages.emsg.m0007);
    });
  }
  getOrgDetails() {
    this.allOrgName = [];
    const data = {
      "request": {
        "filters": {}
      }
    };
    this.reportService.getOrganizationName(data).subscribe((response) => {
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.response.content.length > 0) {
          this.allOrgName = response.result.response.content;
          // this.cityList = _.map(_.compact(_.reject(_.cloneDeep(response.result.response.content), function (obj) {
          //   if (_.lowerCase(obj.orgName) == 'nuis' || _.lowerCase(obj.orgName) == 'test nuis' || _.lowerCase(obj.orgName) == 'pwc' || _.lowerCase(obj.orgName) == 'test niua' || obj.isRootOrg === false || _.isEmpty(obj.orgName))
          //     return obj;
          // })), function (obj) {
          //   obj['orgName'] = _.lowerCase(obj['orgName']);
          //   return obj;
          // });
          // this.cityList.splice(0, 0, { orgName: "All" });
        }
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0007);
      }
    }, (err) => {
      console.log(err);
      this.toasterService.error(this.resourceService.messages.emsg.m0007);
    });
  }
  getUserDetails() {
    this.allUserName = [];
    this.reportService.getUserList().subscribe((response) => {
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.response.content.length > 0) {
          this.allUserName = response.result.response.content;
        }
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0007);
      }
    }, (err) => {
      console.log(err);
      this.toasterService.error(this.resourceService.messages.emsg.m0007);
    });
  }
  initializeColumns() {
    this.cols = [
      { field: 'OrgName', header: 'City Name' },
      // { field: 'departmentName', header: 'Creator Department' },
      { field: 'name', header: 'Name' },
      { field: 'board', header: 'Category' },
      { field: 'gradeLevel', header: 'Sub Category' },
      // { field: 'identifier', header: 'Identifier' },
      { field: 'subject', header: 'Topic' },
      { field: 'medium', header: 'Language' },
      { field: 'createdOn', header: 'Last Published On' },
      // { field: 'objectType', header: 'Object Type' },
      { field: 'framework', header: 'Framework' },
      { field: 'UserName', header: 'Created By' },
      { field: 'contentType', header: 'Content Type' },
      // { field: 'status', header: 'Status' }
    ]
  }
  resetFields() {
    this.initializeDateFields();
    this.selectedCity = null;
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
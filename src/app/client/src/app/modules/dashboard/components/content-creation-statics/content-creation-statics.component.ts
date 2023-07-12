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
  selector: 'app-content-creation-statics',
  templateUrl: './content-creation-statics.component.html',
  styleUrls: ['./content-creation-statics.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ContentCreationStaticsComponent implements OnInit, OnDestroy {
  public unsubscribe = new Subject<void>();
  noResult: boolean = false;
  value: Date;
  currentDate: Date = new Date();
  moment: any;
  fromDate: Date;
  toDate: Date;
  tableData: any = [];
  allOrgName: any = [];
  orgList: any = [];
  allUserName: any = [];
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
    // this.getOrgList();
    this.getOrgDetails();
    // this.getUserDetails();
    this.getContentCreationStaticsReport();
  }
  initializeDateFields() {
    this.moment = moment();
    this.fromDate = new Date(this.moment.subtract(7, "days"));
    this.toDate = new Date();
  }
  getContentCreationStaticsReport() {
    // let channelFilter = [];
    // _.map(this.orgList, function (obj) {
    //   channelFilter.push(obj.identifier)
    // });
    const data = {
      "request": {
        "query": "",
        "filters": {
          "status": [
            "Live"
          ],
          "framework": ["nulp"],
          // "channel": channelFilter,
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
    this.reportService.getContentCreationStaticsReport(data).subscribe((response) => {
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.count > 0) {
          this.tableData = [];
          let tempObj = _.cloneDeep(response.result.content);
          var self = this;
          _.map(tempObj, function (obj) {
            obj.createdOn = self.datePipe.transform(obj.lastPublishedOn, 'MM/dd/yyyy');
            // obj.OrgName = _.toArray(obj.organisation)[_.indexOf(_.toArray(obj.createdFor), _.get(obj, 'channel'))];
            obj.UserName = obj.creator;
            if (!_.isEmpty(obj.channel)) {
              obj.OrgName = _.get(_.find(self.allOrgName, { 'id': obj.channel }), 'orgName');
            } else {
              obj.OrgName = '';
            }
            // if (!_.isEmpty(obj.createdBy)) {
            //   obj.UserName = _.get(_.find(self.allUserName, { 'id': obj.createdBy }), 'firstName') + " " + _.get(_.find(self.allUserName, { 'id': obj.createdBy }), 'lastName');
            // } else {
            //   obj.UserName = '';
            // }
          });
          this.noResult = false;
          this.tableData = tempObj;
          // this.tableData = _.reject(tempObj, function (obj) {
          //   if (_.isEmpty(obj.OrgName)) {
          //     return obj;
          //   }
          // });
          this.initializeColumns();
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
        }
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0007);
      }
    }, (err) => {
      console.log(err);
      this.toasterService.error(this.resourceService.messages.emsg.m0007);
    });
  }
  getOrgList() {
    this.orgList = [];
    this.reportService.getOrgList().subscribe((response) => {
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.count > 0) {
          this.orgList = _.reject(response.result.channels, function (obj) {
            if (obj.name === 'nuis_test' || obj.name === 'niua_test' || obj.name === 'nuis' || obj.name === 'pwc') {
              return obj;
            }
          });
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
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
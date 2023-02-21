// import { IInteractEventEdata, IInteractEventObject, TelemetryInteractDirective } from '@sunbird/telemetry';
import { IImpressionEventInput } from './../../../telemetry/interfaces/telemetry';
import { Component, OnInit, ViewChild, ViewEncapsulation, OnDestroy } from '@angular/core';
import { UsageService } from './../../services';
import * as _ from 'lodash-es';
import { DomSanitizer } from '@angular/platform-browser';
import { UserService, SearchService } from '@sunbird/core';
import { ToasterService, ResourceService, INoResultMessage, ConfigService } from '@sunbird/shared';
// import { UUID } from 'angular2-uuid';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../services/report/report.service';
import { DatePipe } from '@angular/common';
// import { OnDelete } from 'fine-uploader/lib/core';
import { Subject } from 'rxjs';
import * as moment from 'moment';

// import { ContentSectionModule } from 'content-section';

@Component({
  selector: 'app-learnathonDashboard',
  templateUrl: './learnathonDashboard.component.html',
  styleUrls: ['./learnathonDashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class learnathonDashboardComponent implements OnInit {
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
  UserNameValues: any[] = new Array();
  noResultMessage: INoResultMessage;
  private activatedRoute: ActivatedRoute;
  telemetryImpression: IImpressionEventInput;
  constructor(public searchService: SearchService,private usageService: UsageService, private sanitizer: DomSanitizer, private configService: ConfigService,
    public userService: UserService, private toasterService: ToasterService,
    public resourceService: ResourceService, activatedRoute: ActivatedRoute, private router: Router, public reportService: ReportService, private datePipe: DatePipe
  ) {
    // super(searchService, userService);
    this.activatedRoute = activatedRoute;
  }
  ngOnInit() {
    this.initializeDateFields();
    this.getAllContent();
    this.getOrgList();
    this.getOrgDetails();
    // this.getUserDetails();
  }
  initializeDateFields() {
    this.moment = moment();
    this.fromDate = new Date(this.moment.subtract(7, "days"));
    this.toDate = new Date();
  }
  getAllContent(){
    const data = 
    {
      filters: {
        status:["Draft", "FlagDraft", "Review", "Processing", "Live", "Unlisted", "FlagReview"],
        primaryCategory:["Course","Digital Textbook","Content Playlist","Explanation Content","Learning Resource","Practice Question Set","eTextbook","Teacher Resource","Course Assessment"],
        objectType:"Content",
        // framework: ["nulp"],
        mimeType:["application/pdf", "video/x-youtube", "application/vnd.ekstep.html-archive", "application/epub", "application/vnd.ekstep.h5p-archive", "video/mp4", "video/webm", "text/x-url"],
        contentType: ["Course", 'Resource', 'Collection'],
      },
      fields: ["identifier", "creator", "organisation", "name", "contentType", "createdFor", "channel", "board", "medium", "gradeLevel", "subject", "category", "lastUpdatedOn", "status", "createdBy","createdOn", "framework"],
      limit: 10000,
      // offset: (pageNumber - 1) * (limit),
      offset: 0,
      query: ""
    };

    this.searchService.compositeSearch(data).subscribe(
      (response) => {
        this.UserNameValues = [];
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
            tempObj.forEach(element => {

              this.UserNameValues.push({ "label":element.UserName, "value": element.UserName })
            });
            // this.tableData = _.get(this.selectedCity, 'orgName') != 'All' ? _.filter(tempObj, { OrgName: _.get(this.selectedCity, 'orgName') }) : tempObj;
            this.initializeColumns();
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
        
      }
    );
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
        console.log("resp===", response)
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
      { field: 'name', header: 'Name' },
      { field: 'UserName', header: 'Created By' },
      // { field: 'createdOn', header: 'Created On' },
      { field: 'status', header: 'Status' },
      { field: 'contentType', header: 'Content Type' },

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

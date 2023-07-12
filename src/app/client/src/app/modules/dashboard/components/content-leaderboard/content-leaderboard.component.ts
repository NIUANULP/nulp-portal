import { IImpressionEventInput } from '../../../telemetry/interfaces/telemetry';
import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash-es';
import { SearchService } from '@sunbird/core';
import { ToasterService, ResourceService } from '@sunbird/shared';
import { ReportService } from '../../services/report/report.service';



import { Chart } from 'chart.js';
//import 'chartjs-plugin-labels';
////////////////////////////////////////
import { AddusserService } from '../../services/addusser/addusser.service';

@Component({
  selector: 'app-content-leaderboard',
  templateUrl: './content-leaderboard.component.html',
  styleUrls: ['./content-leaderboard.component.scss']
})
export class ContentLeaderboardComponent implements OnInit {

  telemetryImpression: IImpressionEventInput;
  constructor
    (
      private _httpService: AddusserService,
      public reportService: ReportService,
      private searchService: SearchService,
      private toasterService: ToasterService,
      public resourceService: ResourceService,
  ) { }

  ////////////Tab///////////////////////

  checkoutForm: Object;
  //createOrgForm: FormGroup;
  organizationTab: boolean = true;
  userTab: boolean = true;
  //////////////////////////////////////
  selectedCity: string;
  filters = [];
  titleCity = '';
  cityList1: any = [];
  cityList: any = [];
  userList: any = [];
  Graph_Data_List = [];
  noResultMessage: any;
  noResult = true;
  strList = "";
  colsUser = [];
  colsUser2 = [];
  subOrgs = []
  ////////popup//////////////////////
  tableData = [];

  popupTitle = "Content wise Graphical Reports";
  selectedItems = [];
  addUserPopup: boolean = false;
  ////////////extra////////////////
  i = 0;
  ////////////////////////////
  hideme = [];
  Index: any;
  //////////////////////
  Table_Data_List = [];
  L1_Root_list = [];
  L2_Root_list = [];
  L1_Piechart: any;
  L2_Piechart: any;
  // rr=[];
  strTxt = '';
  tooltip = '';
  selectedSubOrg: any
  rootOrgId:any = []
  ////////////extra////////////////
  ngOnInit() {
    this.getOrgList();
    this.getContentData();
    this.colsUser = [

      { field: 'Rank', header: 'Rank', width: '50px' },
      { field: 'User_Name', header: 'Creator Name', width: '184px' },
      { field: 'Email', header: 'Email', width: '245px' },
      { field: 'Phone', header: 'Phone', },
      { field: 'organisation', header: 'Copyright', },
      { field: 'Root_Organisation', header: 'Root Organisation', },
      { field: 'Sub_Organisation', header: 'Sub Organisation', },
      { field: 'Total_Content', header: 'Total Content', },
    ]

  }

  /////Load content List////////////////////////////
  getOrgList() {
    this.cityList = [];

    const data = { "request": { "filters": { "isTenant": true, "status": 1 } } };
    this.reportService.getOrganizationName(data).subscribe((response) => {
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.response.count > 0) {
          this.cityList = _.reject(response.result.response.content, obj => _.isEmpty(obj.orgName));
          this.cityList.push({ "orgName": "---Select All---", "id": 0, "rootOrgId": "0" });
          this.sortArray(this.cityList)
        }
      } else {
        this.toasterService.error(this.resourceService.messages.emsg.m0007);
      }
    }, (err) => {
      this.toasterService.error(this.resourceService.messages.emsg.m0007);
    });
  }

  sortArray(arr){
    arr.sort((a, b) => {
      if (a.orgName < b.orgName)
        return -1;
      if (a.orgName > b.orgName)
        return 1;
      return 0;
    });
  }

  getContentData() {
    this.subOrgs = [];
    this.selectedSubOrg = { "orgName": null, "id": 0, "rootOrgId": "0" }
    this.filters = [];
    this.titleCity = "NULP platform"
    if (!_.isEmpty(this.selectedCity)) {
      this.filters = [_.get(this.selectedCity, 'channel')];  //rootOrgId
      this.rootOrgId = [_.get(this.selectedCity, 'id')]
      this.titleCity = _.get(this.selectedCity, 'orgName');
      this.L1_Chart(null, null, null, null, "");
      this.Table_Data_List = [];
      this.Graph_Data_List = [];
      if (_.get(this.selectedCity, 'id') == 0) {
        this.filters = [];
        this.rootOrgId = [];
        this.titleCity = "NULP platform";
      }
    }

    const data = {
      "request":
      {
        "query": "",
        "filters": { "status": ["Live"], "framework": ["nulp"], "channel": this.rootOrgId, "contentType": ["Course", 'Resource', 'Collection'] },
        "limit": "1000",
        "sort_by": { "lastUpdatedOn": "desc" },
        "fields":
          ["identifier", "creator", "organisation", "copyright",
            "name", "contentType", "createdFor", "channel",
            "board", "medium", "gradeLevel", "subject",
            "lastUpdatedOn", "status", "createdBy",
            "framework", "createdOn", "lastPublishedOn"]
      }
    };
    //alert('titleCity'+this.titleCity+ '\n filters'+JSON.stringify(this.filters)+ '\n request :-'+JSON.stringify(data));

    if(this.filters.length > 0){
      const reqPayload = { "request": { "filters": { "channel": this.filters, "isTenant": false }, 
                          limit: 100, offset: 0 } };
      this.reportService.getOrganizationName(reqPayload).subscribe((response) => {
          this.subOrgs = response.result.response.content
          this.sortArray(this.subOrgs)
          this.subOrgs.unshift({ "orgName": "---Select All---", "id": 0, "rootOrgId": "0" });
      })
    }

    this.reportService.getContentCreationStaticsReport(data).subscribe((response) => {
      if (_.get(response, 'responseCode') === 'OK') {
        if (response.result.count > 0) {
          var tableData = [];
          let tempObj = _.cloneDeep(response.result.content);
          tableData = tempObj;
          var self = this;
          ///////////////LOOPING ROOT ORG/////////////////////////////////
          var ChnlIds = [];
          var UserIds = [];
          ChnlIds = _.uniq(_.map(tempObj, 'channel'));
          UserIds = _.uniq(_.map(tempObj, 'createdBy'));
          /////////////////GET USER LIST/////////////////////////////////
          const reqParam = { filters: { id: UserIds } }
          this.searchService.getUserList(reqParam).subscribe(response => {
            this.userList = [];
            let userObj = _.cloneDeep(response.result.response.content);
            this.userList = userObj;
            //////////////////GET CITY/ORG LIST/////////////////////////////
            const reqPayload = { "request": { "filters": { "id": ChnlIds, "isTenant": true } } };
            //const reqPayload = { "request": { "filters": { "id":ChnlIds, "isRootOrg":true, "status":1 } } };
            //const reqPayload = { "request": { "filters": { "isRootOrg":true, "status":1 } } };
            //const reqPayload = { "request": { "filters": { "isRootOrg":true} } };
            this.reportService.getOrganizationName(reqPayload).subscribe((response) => {
              this.cityList1 = [];
              let cityObj = _.cloneDeep(response.result.response.content);
              this.cityList1 = cityObj;
              this.cityList1 = _.reject(response.result.response.content, obj => _.isEmpty(obj.orgName));
              //////////////////////////////////////////////////////////////////

              this.InitializeGraph(tableData);
              ////////////////////////////////////////////////////
            }); //City close
            /////////////////////////////////////////////////////////////////
          }); //User Close
        }
        else {
          this.noResultMessage = { 'messageText': 'messages.stmsg.m0131' };
          this.noResult = true;
        }
      }
      else {
        this.toasterService.error(this.resourceService.messages.emsg.m0007);
      }
    }, (err) => {
      this.toasterService.error(this.resourceService.messages.emsg.m0007);
    }); //Content close
    ////////////////////////////////////////////////////////////
  }

  InitializeGraph(C_List: any) {
    ///////UPDATE USER LIST//////USER-ID-to-SUB-ORG-MAPING////////////////////
    ///////UPDATE USER LIST//////USER-ID-to-SUB-ORG-MAPING////////////////////
    this.userList.forEach(element => {
      this.cityList.forEach(element1 => {
        //if(element1.identifier==orgId)
        //{
        //  this.rootOrgNameUser_new  = element1.orgName
        //}

        if (element.organisations.length > 1) {
          if ((element1.identifier == element.organisations[1].organisationId) &&
            (element.rootOrgId != element.organisations[1].organisationId)) {
            element.orgNameUser_new = element1.orgName
            element.orgTypeUser_new = 'Sub Organization';
          }
          else if (element.rootOrgId == element.organisations[1].organisationId) {
            element.orgNameUser_new = element.organisations[0].orgName;
            element.orgTypeUser_new = 'Sub Organization';
          } else {
            element.orgNameUser_new = element.organisations[1].orgName;
            element.orgTypeUser_new = 'Sub Organization';
          }
        }
        else if (element.organisations.length == 1) {
          element.orgNameUser_new = element.organisations[0].orgName;
          element.orgTypeUser_new = 'Root  Organization';
        }
      });
    });
    //////////////////Camposing comman content data list//////////////////////////
    this.Graph_Data_List = [];
    C_List.forEach(x => {
      let CityTraced = this.cityList1.find(el => el.id === x.channel);
      let UserTraced = this.userList.find(el => el.id === x.createdBy);
      this.Graph_Data_List.push({
        "identifier": x.identifier,
        "copyright": x.copyright,
        "createdFor": x.createdFor,
        "creator": x.creator,
        "subject": x.subject,
        "channel": x.channel,
        "organisation": x.organisation,
        /////////////////////////////////////
        "RootOrgName_new_user": CityTraced["orgName"],
        "rootOrgName_new_city": UserTraced["rootOrgName"],
        "orgNameUser_new": UserTraced["orgNameUser_new"],
        "orgTypeUser_new": UserTraced["orgTypeUser_new"],
        "lastNameUser_new": UserTraced["lastName"],
        "email": UserTraced["email"],
        "maskedPhone": UserTraced["maskedPhone"],
        ////////////////////////////////////
        "createdBy": x.createdBy,
        "medium": x.medium,
        "name": x.name,
        "createdOn": x.createdOn,
        "objectType": x.objectType,
        "gradeLevel": x.gradeLevel,
        "framework": x.framework,
        "contentType": x.contentType,
        "Category": x.board,
        "lastPublishedOn": x.lastPublishedOn,
        "lastUpdatedOn": x.lastUpdatedOn,
        "status": x.status
      });
    });
    this.strList = JSON.stringify(this.Graph_Data_List);
    ///////SHORTING//////////////////////////////////////////////////
    this.CreateLeaderBoardChart(this.Graph_Data_List);
  }

  CreateLeaderBoardChart(ResultCT: any) {
    var L1_Name = [];
    var L1_Value = [];
    var L1_Filter = [];
    var L1_Colour = [];
    /////////////////////////////////////////////////////////////////
    this.L1_Root_list = this.groupBy1(ResultCT, "creator");
    var leader = [];
    Object.keys(this.L1_Root_list).forEach(x => {
      var xx = this.L1_Root_list[x];
      leader.push(
        {
          "User_Name": x,
          "Email": xx[0].email,
          "Phone": xx[0].maskedPhone,
          "organisation": xx[0].organisation,
          "Root_Organisation": xx[0].rootOrgName_new_city,
          "Sub_Organisation": xx[0].orgNameUser_new,
          "Content_Data": this.L1_Root_list[x],
          "Total_Content": this.L1_Root_list[x].length,
        })
    });

    if(this.selectedSubOrg.rootOrgId != 0){
      leader = leader.filter((obj => obj.Sub_Organisation === this.selectedSubOrg.orgName))
    }
    
    var top10 = leader.sort(function (a, b) { return a.Total_Content < b.Total_Content ? 1 : -1; }).slice(0, 10);
    var Rank = 0;
    top10.forEach(y => {
      Rank++;
      L1_Name.push(y.User_Name);
      L1_Value.push(y.Total_Content);
      L1_Filter.push(y.User_Name);
      L1_Colour.push(this.getRandomColorHex());
      y.Rank = Rank;
    });
    
    this.popupTitle = "List of Top 10 Content Creators in '" + this.titleCity + "'.";
    this.L1_Chart(L1_Name, L1_Value, L1_Filter, L1_Colour, "");
    this.Table_Data_List = top10;
  }


  L1_Chart(L1_Name: any, L1_Value: any, L1_Filter: any, L1_Colour: any, L1_Title: any) {
    if (this.L1_Piechart) // != undefined
    {
      this.L1_Piechart.destroy();
    }
    this.L1_Piechart = new Chart('L1_Canvas',
      {
        type: 'bar',
        data:
        {
          labels: L1_Name,
          datasets: [{
            data: L1_Value,
            borderColor: L1_Filter,
            borderSkipped: L1_Filter,
            backgroundColor: L1_Colour,
            borderWidth: 1,
            fill: true
          }
          ]
        },
        options:
        {
          tooltips: { mode: 'index' },
          //hover: { mode: 'index', intersect: true  },
          title: { display: true, text: L1_Title, fontSize: 18, fontColor: "#111", },
          legend: { display: false, labels: { fontColor: "green", } },
          scales: {
            xAxes: [{ scaleLabel: { display: true, labelString: 'Content Contributors' } }],
            yAxes: [{ scaleLabel: { display: true, labelString: 'Content Count' } }],
          },
          // plugins: {
          //   labels: [
          //             { render: 'label', fontColor: '#000', position: 'outside' },
          //             { render:'value',fontColor: '#000'}
          //           ]
          //         },
        }
      });
  }

  //////////////////////////////////////
  getRandomColorHex() {
    //  var hex = "0123456789ABCDEF",
    //      color = "#";
    //  for (var i = 1; i <= 6; i++)
    //  {
    //    color += hex[Math.floor(Math.random() * 16)];
    //  }
    var color = ["red", "green", "blue", "purple", "magenta", "aqua", "salmon", "darkgray", "pink", "coral"];
    //var min=0;
    //var max=color.length-1;
    //var rand= Math.floor(Math.random() * (max - min + 1) + min);
    this.i++;
    //return color[this.i%color.length-1];
    return "blue";
  }

  groupBy1(list, key) {
    return list.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };

  onChangeSubOrg(){
    this.CreateLeaderBoardChart(this.Graph_Data_List)
  }
}

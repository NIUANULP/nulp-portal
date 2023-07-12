import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import * as _ from 'lodash-es';
import { AddusserService } from '../../services/addusser/addusser.service';

@Component({
  selector: 'app-user-report',
  templateUrl: './user-report.component.html',
  styleUrls: ['./user-report.component.scss']
})
export class UserReportComponent implements OnInit {
  currentDate: Date = new Date();
  fromDate: Date = null;
  toDate: Date = null;
  showUserDataOrg: any = new Array()
  userData: any = new Array()
  status: string;
  colsUser: any[];
  userOrgLength: any;
  getAllOrgChartData: any = new Array()
  orgNameUser: any;
  myStartDateOrg = [];
  newStartDateOrg: Date;
  newTimeStampStartDateOrg: number;
  myEndDateOrg = [];
  newEndDateOrg: Date;
  newTimeStampEndDateOrg: number;
  showLineChartUserDataOrg: any = new Array()
  groupedUserDataOrg: any = new Array()
  rootOrgNameUser: any = null;
  organizationData = [];
  orgName = [];
  OrgLength = [];
  Linechart3: any = null;
  subOrg: any;
  colourList: any = new Array()
  // groupedUserData: any = new Array()



  //start  here-----------
  myStartDate = [];
  myEndDate = [];
  aa: any = new Array()
  labelChartRootOrgId: any = new Array()
  dateChartresults: any = new Array()
  newTimeStampEndDate: number;
  chartrootValue = [];
  Linechart12: any;
  newEndDate: Date;
  chartrootName = [];
  allChanelName = [];
  newTimeStampStartDate: number;
  newStartDate: Date;
  pushLineChartUserData: any = new Array()
  showLineChartUserData: any = new Array()
  noResultMessage: any;
  sucesErrorPopup: boolean = false;
  popupMsg: string;
  //end here-----------




  orgList: any[];
  orgListData: any[] = new Array();
  orgListArry: any;

  constructor(private datePipe: DatePipe, private _httpService: AddusserService) { }

  ngOnInit() {

    this.noResultMessage = {
      'messageText': "No Records found"
    };
    this.getAllOrgData();

    //  this.dateWiseLineChart();
    this.initializeColumns();

  }
  initializeColumns() {
    this.colsUser = [
      { field: 'rootOrgName', header: 'Organization', width: '150px' },
      // { field: 'orgType', header: 'Organization Type', width: '150px' },
      { field: 'firstName', header: ' First Name', width: '150px' },
      { field: 'lastName', header: 'Last Name', width: '150px' },
      { field: 'email', header: 'Email', width: '150px' },
      { field: 'phone', header: 'Mobile', width: '150px' },
      { field: 'status', header: 'Status', width: '150px' },
    ]
  }
  getAllOrgData() {
    let tempArray: any
    tempArray = {
      "request": {
        "filters": {
        },
        "limit": 1000,
        "offset": 0
      }
    }
    this._httpService.getSuborgData(tempArray).subscribe(res => {


      res.result.response.content.forEach(element => {
        this.getAllOrgChartData.push({ "orgName": element.orgName, "identifier": element.identifier })

      });
    }, err => {
      // this.popupMsg=err.params.errmsg;
      console.log(err)
    });
  }

  getAllSubOrgData(orgId: any) {
    let subOrgList: any;
    // let orgId:any;
    let tempArray: any;
    // orgId = "013178749854662656164";
    subOrgList = {
      "request": {
        "filters": {
          "rootOrgId": orgId,
          isRootOrg: false
        },
        "limit": 100,
        "offset": 0
      }
    }

    this._httpService.getSuborgData(subOrgList).subscribe(res => {
      this.subOrg = res.result.response.content;
      this.getAllOrgChartData.forEach(element1 => {
        if (element1.identifier == orgId) {
          this.rootOrgNameUser = element1.orgName
        }

      });
      this.subOrg.push({ "orgName": this.rootOrgNameUser });

    }, err => {
      // this.popupMsg=err.params.errmsg;
      console.log(err)
    });

    //this.getAllData();

  }


  getAllData(orgId: any, channel: any) {
    // alert(this.datePipe.transform(this.fromDate, 'yyyy-MM-ddTHH:MM'))
    // alert(this.datePipe.transform(this.fromDate, 'yyyy-MM-dd'))
    //  alert(this.datePipe.transform(this.toDate, 'yyyy-MM-dd'))
    this.orgName = [];
    this.OrgLength = [];
    this.subOrg = [];
    this.organizationData = [];
    this.groupedUserDataOrg = [];
    this.showLineChartUserData = [];
    let tempArray: any;
    let subOrgList: any;
    subOrgList = {
      "request": {
        "filters": {
          isTenant: false,
          channel: channel
        },
        "limit": 2000,
        "offset": 0
      }
    }
    this._httpService.getSuborgData(subOrgList).subscribe(res => {
      this.subOrg = res.result.response.content;
      this.getAllOrgChartData.forEach(element1 => {
        if (element1.identifier == orgId) {
          this.rootOrgNameUser = element1.orgName
        }

      });
      // this.subOrg.push({ "orgName": this.rootOrgNameUser });

    }, err => {
      // this.popupMsg=err.params.errmsg;
      console.log(err)
    });


    tempArray = {
      'request': {
        'query': '',
        'filters': {
          "channel": channel
        },
        limit: 10000
      }
    }
    this.showUserDataOrg = [];
    this.groupedUserDataOrg = [];
    // this.canvas1 = [];
    this._httpService.userSearch(tempArray).subscribe(res => {
      this.userData = res.result.response.content;
      this.showUserDataOrg = [];
      this.orgListData = [];
      res.result.response.content.forEach(element => {
        if (element.status == 1) {
          this.status = 'Active';
        }
        else if (element.status == 0) {
          this.status = 'Inactive';
        }
        this.userOrgLength = element.organisations.length;
        this.getAllOrgChartData.forEach(element1 => {
          if (element1.identifier == orgId) {
            this.rootOrgNameUser = element1.orgName
          }
          if (element.organisations.length > 1) {
            if ((element1.identifier == element.organisations[1].organisationId) && (element.rootOrgId != element.organisations[1].organisationId)) {
              this.orgNameUser = element1.orgName
            }
            else if (element.rootOrgId == element.organisations[1].organisationId) {
              this.orgNameUser = element.organisations[0].orgName;
            }

          }
        });
        if (element.organisations.length == 1) {
          this.orgNameUser = element.organisations[0].orgName;

        }
        this.showUserDataOrg.push({ "userId": element.id, "createdDate": element.createdDate, "uStatus": element.status, "firstName": element.firstName, "lastName": element.lastName, "email": element.email, "phone": element.phone, "orgLength": element.organisations.length, "orgName": this.orgNameUser, "status": this.status, "userOrglengths": this.userOrgLength, "rootOrgName": this.orgNameUser })
      });


      // var startDate = "2020-12-25"; //yy-mm-dd
      //var endDate = "2021-08-12"; 
      var startDate = this.datePipe.transform(this.fromDate, 'yyyy-MM-dd')
      var endDate = this.datePipe.transform(this.toDate, 'yyyy-MM-dd')
      this.myStartDateOrg = startDate.split("-");
      this.newStartDateOrg = new Date(this.myStartDateOrg[0], this.myStartDateOrg[1] - 1, this.myStartDateOrg[2]);
      this.newTimeStampStartDateOrg = this.newStartDateOrg.getTime()
      this.myEndDateOrg = endDate.split("-");
      this.newEndDateOrg = new Date(this.myEndDateOrg[0], this.myEndDateOrg[1] - 1, this.myEndDateOrg[2]);
      this.newTimeStampEndDateOrg = this.newEndDateOrg.getTime()
      this.showLineChartUserDataOrg = [];
      this.showLineChartUserData = [];
      this.showUserDataOrg.forEach(xy => {
        var myDate = xy.createdDate.split(" ");
        var myNewDate = myDate[0].split("-");
        var newDate = new Date(myNewDate[0], myNewDate[1] - 1, myNewDate[2]);
        var newTimeStampDate = newDate.getTime()
        if (newTimeStampDate >= this.newTimeStampStartDateOrg && newTimeStampDate <= this.newTimeStampEndDateOrg) {
          this.showLineChartUserDataOrg.push(xy)
          this.showLineChartUserData.push(xy)
        }
      });


      this.orgList = this.showLineChartUserData
        .map(item => item.orgName)
        .filter((value, index, self) => self.indexOf(value) === index)
      this.orgListArry = this.orgList.filter(f => f !== undefined && f !== null) as any;
      this.orgListArry.forEach(element => {
        this.orgListData.push({ "label": element, "value": element })
      });

      this.groupedUserDataOrg = this.showLineChartUserDataOrg.reduce(function (rv, x) { // grouping of userdata
        (rv[x['orgName']] = rv[x['orgName']] || []).push(x);
        return rv;
      }, {});


      this.orgName = [];
      this.OrgLength = [];
      this.organizationData = [];

      if (this.subOrg.length > 0 || this.subOrg.length == 0) {
        this.orgName = [];
        this.OrgLength = [];
        this.organizationData = [];
        this.subOrg.forEach(element => {
          let orgNameVal: string;
          orgNameVal = element.orgName

          if (this.groupedUserDataOrg[orgNameVal] != undefined) {
            this.organizationData.push({ "orgNameVal": orgNameVal, "length": this.groupedUserDataOrg[orgNameVal].length });
          }
          else if (this.groupedUserDataOrg[orgNameVal] == undefined) {
            this.organizationData.push({ "orgNameVal": orgNameVal, "length": 0 });
          }
        });
        this.orgName = [];
        this.OrgLength = [];
        // this.organizationData = [];
        this.organizationData.forEach(element => {
          this.orgName.push(element.orgNameVal);
          this.OrgLength.push(element.length);
          this.colourList.push(this.getRandomColorHex());
        });
      }
      if (this.Linechart3) {
        this.Linechart3.destroy();
      }
      var data1 = {
        labels: this.orgName,
        datasets: [{ label: "Count", data: this.OrgLength, backgroundColor: "#0000FF", }]
      };
      var options =
      {
        title: { display: true, text: "User Onboarded in Sub Organization", fontSize: 18, fontColor: "#111" },
        legend: { display: true },
        scales: {
          yAxes: [{ ticks: { min: 0 }, scaleLabel: { display: true, labelString: 'User Count' } }],
          xAxes: [{ ticks: { min: 0 }, scaleLabel: { display: true, labelString: 'Organization' } }],
          gridLines: { color: 'red' },
          angleLines: { color: 'blue' }
        }
      };
      this.Linechart3 = new Chart('canvas13', { type: 'bar', data: data1, options: options });


    }, err => {
      console.log(err)
    });


  }

  getRandomColorHex() {
    //  var hex = "0123456789ABCDEF",
    //      color = "#";
    //  for (var i = 1; i <= 6; i++) 
    //  {
    //    color += hex[Math.floor(Math.random() * 16)];
    //  }
    var color = ["red", "green", "blue", "purple", "magenta", "aqua", "salmon", "darkgray", "pink", "coral"];
    return color[Math.floor(Math.random() * 16) % color.length - 1];
  }

  closeSucesErrorPopup() {
    this.sucesErrorPopup = false
  }
  dateWiseLineChart() {
    //alert(this.fromDate);
    //alert(this.toDate);
    if (this.fromDate == null || this.fromDate == undefined) {
      this.popupMsg = "Please Enter From Date";
      this.sucesErrorPopup = true

    }
    else if (this.toDate == null || this.toDate == undefined) {
      this.popupMsg = "Please Enter  To Date";
      this.sucesErrorPopup = true

    }
    let tempArray: any;
    tempArray = {
      'request': {
        'query': '',
        'filters': {
        },
        limit: 10000
      }
    }
    this.pushLineChartUserData = [];
    this._httpService.userSearch(tempArray).subscribe(res => {
      this.userData = res.result.response.content;
      this.orgListData = [];
      res.result.response.content.forEach(element => {
        if (element.status == 1) {
          this.status = 'Active';
        }
        else if (element.status == 0) {
          this.status = 'Inactive';
        }
        this.userOrgLength = element.organisations.length;
        this.getAllOrgChartData.forEach(element1 => {
          // debugger
          if (this.userOrgLength > 1) {
            if ((element1.identifier == element.organisations[0].organisationId) && (element.rootOrgId != element.organisations[0].organisationId)) {
              this.orgNameUser = element1.orgName
            }
          }
        });

        if (this.userOrgLength == 1) {
          this.orgNameUser = element.organisations[0].orgName;
        }
        this.pushLineChartUserData.push({ "userId": element.id, "uStatus": element.status, "createdDate": element.createdDate, "firstName": element.firstName, "lastName": element.lastName, "email": element.email, "phone": element.phone, "orgLength": element.organisations.length, "orgName": this.orgNameUser, "status": this.status, "userOrglengths": this.userOrgLength, "channel": element.channel, "rootOrgId": element.rootOrgId, "rootOrgName": element.rootOrgName })
      });



      // date wise function  start   here---------------------------
      var startDate = this.datePipe.transform(this.fromDate, 'yyyy-MM-dd'); //yy-mm-dd
      var endDate = this.datePipe.transform(this.toDate, 'yyyy-MM-dd');
      this.myStartDate = startDate.split("-");
      this.newStartDate = new Date(this.myStartDate[0], this.myStartDate[1] - 1, this.myStartDate[2]);
      this.newTimeStampStartDate = this.newStartDate.getTime()

      this.myEndDate = endDate.split("-");
      this.newEndDate = new Date(this.myEndDate[0], this.myEndDate[1] - 1, this.myEndDate[2]);
      this.newTimeStampEndDate = this.newEndDate.getTime()
      this.showLineChartUserData = [];
      this.pushLineChartUserData.forEach(xy => {
        var myDate = myDate = xy.createdDate.split(" ");
        var myNewDate = myDate[0].split("-");
        var newDate = new Date(myNewDate[0], myNewDate[1] - 1, myNewDate[2]);
        var newTimeStampDate = newDate.getTime()
        if (newTimeStampDate >= this.newTimeStampStartDate && newTimeStampDate <= this.newTimeStampEndDate) {

          this.showLineChartUserData.push(xy)
        }


        // this.colourList.push(this.getRandomColorHex());
      });


      this.orgList = this.showLineChartUserData
        .map(item => item.rootOrgName)
        .filter((value, index, self) => self.indexOf(value) === index)
      this.orgListArry = this.orgList.filter(f => f !== undefined && f !== null) as any;
      this.orgListArry.forEach(element => {
        this.orgListData.push({ "label": element, "value": element })
      });
      this.chartrootName = [];
      this.aa = [];
      this.chartrootValue = [];
      this.labelChartRootOrgId = [];
      this.dateChartresults = [];
      this.dateChartresults = this.showLineChartUserData.reduce(function (r, b) {
        r[b.channel] = r[b.channel] || [];
        r[b.channel].push(b);
        return r;
      }, Object.create(null));
      var arr1 = Object.entries(this.dateChartresults)
      arr1.forEach(chartvalue => {
        this.allChanelName.push(chartvalue[0]);
        this.chartrootName.push(chartvalue[1][0].rootOrgName);
        this.aa = chartvalue[1]
        this.chartrootValue.push(this.aa.length);
        this.labelChartRootOrgId.push(chartvalue[1][0].rootOrgId);

        // this.colourList.push(this.getRandomColorHex());
      });

      var data1 = {
        labels: this.chartrootName,
        datasets: [{ label: "Count", data: this.chartrootValue, borderColor: this.labelChartRootOrgId, borderWidth: this.allChanelName, backgroundColor: "#0000FF", }]
      };
      var options =
      {
        title: { display: true, text: "User Onboarded in Root Organization", fontSize: 18, fontColor: "#111" },
        legend: { display: true },
        scales: {
          yAxes: [{ ticks: { min: 0 }, scaleLabel: { display: true, labelString: 'User Count' } }],
          xAxes: [{ ticks: { min: 0 }, scaleLabel: { display: true, labelString: 'Organization' } }],
          gridLines: { color: 'red' },
          angleLines: { color: 'blue' }
        }
      };

      if (this.Linechart12 ) {
        this.Linechart12.destroy();
      }

      this.Linechart12 = new Chart('canvas12', { type: 'bar', data: data1, options:options });

      //  date  wise function  end here--------------------------

    });
  }


  showData(evt: any) {
    var data = this.Linechart12.getElementsAtEvent(evt)
    // alert(JSON.stringify(data[0]));
    //  alert(JSON.stringify(data[0]._model));
    // alert(JSON.stringify(data[0]._chart.id));
    // alert(JSON.stringify(data[0]._model.label));
    // alert(JSON.stringify(data[0]._options.borderColor));

    var activePoint = this.Linechart12.getElementAtEvent(evt);
    if (activePoint.length > 0) {
      var clickedDatasetIndex = activePoint[0]._datasetIndex;
      var clickedElementindex = activePoint[0]._index;
      var filter_data = activePoint[0]._model.borderColor;
      var filter_channel = activePoint[0]._model.borderWidth;
      var label = this.Linechart12.data.labels[clickedElementindex];
      var value = this.Linechart12.data.datasets[clickedDatasetIndex].data[clickedElementindex];
      // alert("Clicked: label:-" + label + " value- " + value +  " - " + clickedElementindex +' filter-'+filter_data+'filter id--'+filter_id);
      this.getAllData(filter_data, filter_channel)

    }
  }




  showData3(evt: any) {
    var data = this.Linechart3.getElementsAtEvent(evt)
    // alert(JSON.stringify(data[0]));
    //  alert(JSON.stringify(data[0]._model));
    // alert(JSON.stringify(data[0]._chart.id));
    // alert(JSON.stringify(data[0]._model.label));
    // alert(JSON.stringify(data[0]._options.borderColor));

    var activePoint = this.Linechart3.getElementAtEvent(evt);
    if (activePoint.length > 0) {
      var clickedDatasetIndex = activePoint[0]._datasetIndex;
      var clickedElementindex = activePoint[0]._index;
      var filter_data = activePoint[0]._options.borderColor;
      var filter_channel = activePoint[0]._options.borderWidth;
      var label = this.Linechart3.data.labels[clickedElementindex];
      var value = this.Linechart3.data.datasets[clickedDatasetIndex].data[clickedElementindex];
      //alert("Clicked: label:-" + label + " value- " + value +  " - " + clickedElementindex +' filter-'+filter_data);
      //this.getSubOrgData(label)

    }
  }

}

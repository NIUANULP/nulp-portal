import { Component, OnInit } from '@angular/core';
import { AddusserService } from '../../services/addusser/addusser.service';
import { DatePipe } from '@angular/common';
import { Chart } from 'chart.js';
import * as moment from 'moment';

@Component({
  selector: 'app-organization-report',
  templateUrl: './organization-report.component.html',
  styleUrls: ['./organization-report.component.scss']
})
export class OrganizationReportComponent implements OnInit {
  currentDate: Date = new Date();
  fromDate: Date;
  toDate: Date;
  orgSearchData: any;
  countOrgRecord: any;
  showOrgData: any[] = new Array();
  status: string;
  orgType: string;
  rootOrgName: any;
  myStartDateOrg=[];
  newStartDateOrg: Date;
  newTimeStampStartDateOrg: number;
  myEndDateOrg=[];
  newEndDateOrg: Date;
  newTimeStampEndDateOrg: number;
  showLineChartUserData: any = new Array()
  cols: { field: string; header: string; width: string; }[];
  noResultMessage:any;
  sucesErrorPopup: boolean= false;
  popupMsg: string;
  orgTypelListOrg: any[];
  orgTypeOrgArry: any;
  orgTypeListOrgArryData: any[] = new Array();
  Linechart3:any = null;
  graphError = false
  filteredResult:any = []
  first = 0;

  constructor(private datePipe: DatePipe,private _httpService: AddusserService) { }
  ngOnInit() {
    this.initializeColumnsOrg();
    this.getOrgChartDetail()
    this.noResultMessage = {
      'messageText': "No Records found"
    };
  }
  initializeColumnsOrg()
  {
    this.cols = [
      { field: 'orgName', header: 'Organization', width: '170px' },
      { field: 'orgType', header: 'Organization Type', width: '170px' },
      { field: 'description', header: 'Description', width: '170px' },
      { field: 'channel', header: 'Channel', width: '170px' },
      { field: 'status', header: 'Status', width: '170px' }, 
    ]
  
  }

closeSucesErrorPopup()
{
this.sucesErrorPopup = false
}

populateData(data){
  this.showOrgData = []
  data.forEach(element => {
    if (element.status == 1) {
      this.status = 'Active';
    }
    else if (element.status == 0) {
      this.status = 'Inactive';
    }

    if (element.isRootOrg == true) {
      this.orgType = 'Root  Organization';
    }
    else if (element.isRootOrg == false) {
      this.orgType = 'Sub Organization';
    }

    if (element.isRootOrg) {
      this.rootOrgName = element.orgName;
    }
    this.showOrgData.push({ "createdDate": element.createdDate, "orgType": this.orgType, "id": element.id, "orgName": element.orgName, "description": element.description, "channel": element.channel, "status": this.status })
  });
  return this.showOrgData
}

renderGraph(){
  let orgNames = Object.keys(this.filteredResult);
  // @ts-ignore 
  let orgLength = Object.values(this.filteredResult).map(arr => arr.length)
  
  if (this.Linechart3 ) {
    this.Linechart3.destroy();
  }

  this.Linechart3 = new Chart('canvas98',
  {
    type: 'bar', //'bar',//'doughnut',//'pie',//'polarArea'
    data:
    {
      labels: orgNames,
      datasets: [{ label: "Count", data: orgLength, borderColor: '#000', borderWidth: 0, backgroundColor: "blue", }]
    },

    options:
    {
      title: { display: true, text: "Organization Wise Dashboard ", fontSize: 18, fontColor: "#111" },
      legend: { display: true },
      scales: {
        xAxes: [{ scaleLabel: { display: true, labelString: 'Month' }, ticks : { min : 0} }],
        yAxes: [{ scaleLabel: { display: true, labelString: 'Organization Count' }, ticks : { min : 0} }],
      },

    }
  });
}

getOrgChartDetail(submit = false)
{
  if (submit) {
    if (this.fromDate == null || this.fromDate == undefined) {
      this.popupMsg = "Please Enter From Date";
      this.sucesErrorPopup = true

    }
    else if (this.toDate == null || this.toDate == undefined) {
      this.popupMsg = "Please Enter To Date";
      this.sucesErrorPopup = true
    }
  }

  let tempArray:any;
  tempArray= {
    'request': {
      'query': '',
      'filters': {
      }
    }
  }
  this._httpService.orgSearch(tempArray).subscribe(res => {
    this.orgSearchData = res.result.response.content;
    this.countOrgRecord = res.result.response.count;
    this.orgTypeListOrgArryData = [];
    this.populateData(res.result.response.content)
    if (this.toDate != null && this.fromDate != null) {
      var startDate = this.datePipe.transform(this.fromDate, 'yyyy-MM-dd')
      var endDate = this.datePipe.transform(this.toDate, 'yyyy-MM-dd')
      this.myStartDateOrg = startDate?.split("-");
      this.newStartDateOrg = new Date(this.myStartDateOrg[0], this.myStartDateOrg[1] - 1, this.myStartDateOrg[2]);
      this.newTimeStampStartDateOrg = this.newStartDateOrg.getTime()
      this.myEndDateOrg = endDate?.split("-");
      this.newEndDateOrg = new Date(this.myEndDateOrg[0], this.myEndDateOrg[1] - 1, this.myEndDateOrg[2]);
      this.newTimeStampEndDateOrg = this.newEndDateOrg.getTime()
      this.showLineChartUserData = [];
      this.showOrgData.forEach(xy => {
        var myDate = xy?.createdDate?.split(" ");
        if (myDate) {
          var myNewDate = myDate[0]?.split("-");
          var newDate = new Date(myNewDate[0], myNewDate[1] - 1, myNewDate[2]);
          var newTimeStampDate = newDate.getTime()
        }
        if (newTimeStampDate >= this.newTimeStampStartDateOrg && newTimeStampDate <= this.newTimeStampEndDateOrg) {
          this.showLineChartUserData.push(xy)
        }
      });

      if (this.Linechart3) {
        this.filteredResult = this.showLineChartUserData.reduce(function (r, a) {
          r[moment(a.createdDate).format('YYYY-MM-DD')] = r[moment(a.createdDate).format('YYYY-MM-DD')] || [];
          r[moment(a.createdDate).format('YYYY-MM-DD')].push(a);
          return r;
        }, Object.create(null));
        this.renderGraph()
      }
    }
    else{
      this.showLineChartUserData = this.showOrgData
    }

    this.orgTypelListOrg = this.showOrgData.map(item => item.orgType).filter((value, index, self) => self.indexOf(value) === index)
    this.orgTypeOrgArry = this.orgTypelListOrg.filter(f => f !== undefined && f !== null) as any;
    this.orgTypeOrgArry.forEach(element => {
      this.orgTypeListOrgArryData.push({ "label": element, "value": element })
    });
  });
}

  showGraph() {
    let tempArray:any;
    tempArray= {
      'request': {
        'query': '',
        'filters': {
        }
      }
    }
    this._httpService.orgSearch(tempArray).subscribe(res => {
      this.graphError = false
      this.populateData(res.result.response.content)
      this.showLineChartUserData = this.showOrgData
      this.filteredResult = res.result.response.content.reduce(function (r, a) {
        r[moment(a.createdDate).format('MMMM YYYY')] = r[moment(a.createdDate).format('MMMM YYYY')] || [];
        r[moment(a.createdDate).format('MMMM YYYY')].push(a);
        return r;
      }, Object.create(null));
      this.renderGraph()      
    },
    (err) => {
        this.graphError = true
    })
  }

  filterData(evt){
    var activePoint = this.Linechart3.getElementAtEvent(evt);
    this.first = 0
    if (activePoint.length > 0)
     {
      var clickedElementindex = activePoint[0]._index;
      var label = this.Linechart3.data.labels[clickedElementindex];
      this.showLineChartUserData = this.populateData(this.filteredResult[label])
    }

  }

}

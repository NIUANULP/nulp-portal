import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';
import * as _ from 'lodash-es';
import { AddusserService } from '../../services/addusser/addusser.service';

//import 'chartjs-plugin-labels';
@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  rootName = [];
  rootValue = [];
  allReportChanelName= [];
  Linechart :any;
  userData: any = new Array()
  getAllOrgChartData: any = new Array()
  showUserData: any = new Array()
  results: any = new Array()
  results1: any = new Array()
  colourList: any = new Array()
  mapChildrenIntoArray: any = new Array()
  abcd: any = new Array()
  status: string;
  userOrgLength: any;
  orgNameUser: any;
  aa: any = new Array()
  TeamA: any = new Array()
  TeamB: any = new Array()
  TeamN: any = new Array()
  TeamA1: any = new Array()
  TeamB1: any = new Array()
  TeamN1: any = new Array()
  teamaLength: any;
  teambLength: any;
 
showUserDataOrg: any = new Array()
Linechart3:any = null;
groupedUserData: any = new Array()
organizationData=[];
orgName= [];
OrgLength= [];
orgTypeUser: string;
rootOrgId: any;
rootOrgName: string;
subOrg:any
  subOrgData: any;
  subOrgDatActiveInactive: any;
  subOrgActiveData: any = new Array()
  subOrgInActiveData: any = new Array()
  subRootName: any;
  subRootNameArry: any = new Array()
  Linechart4: any;
  subOrgLabel: string = null;
  labelRootOrgId: any = new Array()
  rootOrgNameUser: any = null;
  showSubOrgActInActGraph: boolean = false;
  TeamOrgRootNaN1: any = new Array()
  
  constructor( private _httpService: AddusserService,private router: Router) { }
  Linechart1 :any;
  
  ngOnInit() {
    this.ChartTest();
    this.getOrgData(null,null,null,null);
    this.getAllOrgData();
	
  }

  getAllOrgData()
  {
      let tempArray : any
      tempArray= {
      "request": {
      "filters": {
      },
      "limit": 1000,
      "offset": 0
      }
      }
      this._httpService.getSuborgData(tempArray).subscribe(res => {


      res.result.response.content.forEach(element => {
      this.getAllOrgChartData.push({"orgName":element.orgName,"identifier":element.identifier})
  
      });
      },err=>{
      // this.popupMsg=err.params.errmsg;
      });
  }
  
  

 getOrgData(orgLabel:string,orgId:any,subOrgLabel:string,channel:any)
{
     // this.rootOrgId ='013178749854662656164';
      //this.rootOrgName =  orgLabel;
    
      let tempArray:any;
      if(subOrgLabel!=null)
      {
        tempArray= {
          'request': {
          'query': '',
          'filters': {

          },
          "limit": 10000,
          }
          }

      }
      else
      {
      tempArray= {
      'request': {
      'query': '',
      'filters': {
        "channel":channel
      },
      "limit": 10000,
      }
      }
    }
     this.showUserDataOrg = [];
     this.organizationData = [];
     this.subOrg = [];
     this.organizationData = [];
    // this.orgName = [];
     this._httpService.userSearch(tempArray).subscribe(res => {
      this.userData = res.result.response.content;
      this.showUserDataOrg = [];
      res.result.response.content.forEach(element => {
       if(element.status==1)
       {
         this.status =   'Active';
       }
       else if(element.status==0)
       {
         this.status =   'Inactive';
       }
        this.userOrgLength =  element.organisations.length;
        this.getAllOrgChartData.forEach(element1 => {

      if(element1.identifier==orgId)
      {
        this.rootOrgNameUser  = element1.orgName
      }
       
        if( element.organisations.length>1)
        {
        if((element1.identifier==element.organisations[1].organisationId) && (element.rootOrgId!=element.organisations[1].organisationId))
        {
         this.orgNameUser  = element1.orgName
         this.orgTypeUser =   'Sub Organization';
        }
        else if(element.rootOrgId==element.organisations[1].organisationId)
        {
          this.orgNameUser  = element.organisations[0].orgName;
          this.orgTypeUser =   'Sub Organization';
        }
  
        }
       });
       if( element.organisations.length==1)
        {
          this.orgNameUser  = element.organisations[0].orgName;
          this.orgTypeUser =   'Root  Organization';
        }    
       this.showUserDataOrg.push({"orgType": this.orgTypeUser,"userId":element.id,"uStatus":element.status,"createdDate":element.createdDate,"firstName": element.firstName,"lastName":element.lastName,"email":element.email,"phone":element.phone,"orgLength":  element.organisations.length,"orgName":this.orgNameUser,"status":this.status,"userOrglengths":this.userOrgLength})   
      });
      this.groupedUserData =   this.showUserDataOrg.reduce(function(rv, x) { // grouping of userdata
      (rv[x['orgName']] = rv[x['orgName']] || []).push(x);
      return rv;
      }, {});
     // let subOrgLabel:string;
      //subOrgLabel =  sessionStorage.getItem("subOrgLabel")
      if(subOrgLabel!=null)
      {
      let subOrgVal:string; 
      subOrgVal = subOrgLabel
      this.subOrgDatActiveInactive =  this.groupedUserData[subOrgVal]
      /***get the active and the inactive recorrd for sub organization  */
      this.subRootName = subOrgVal;
      this.subRootNameArry = [];
      this.subRootNameArry.push(this.subRootName); 
      let activeRecord = 0;
      let inActiveRecord = 0;
      this.subOrgActiveData = [];
      this.subOrgInActiveData = [];
      this.subOrgDatActiveInactive.forEach(element => {

        if(element.uStatus == 1)
        {
          activeRecord++;
        }
        else if(element.uStatus == 0)
        {
          inActiveRecord++;
        }

      });
      this.subOrgActiveData.push(activeRecord);
      this.subOrgInActiveData.push(inActiveRecord);


      var Team_A={ label: "Active", data: this.subOrgActiveData,backgroundColor: "green", borderWidth : 1 };
      var Team_B={ label: "In Active", data: this.subOrgInActiveData,backgroundColor: "red",  borderWidth : 1 };
     // var Team_C={ label: "TeamC score", data: this.TeamC,backgroundColor: "green",borderWidth : 1 };
    
      var data = {
          labels  :this.subRootNameArry,
          datasets:[Team_A,Team_B]
        };
        var options =
        {
          title:  { display : true,text:"Root/Subroot wise Active And Inactive Users",fontSize : 18, fontColor : "#111"},
          legend: { display : true },
          scales: { yAxes: [{ ticks : { min : 0},scaleLabel: { display: true, labelString: 'User Count' }}],
                    xAxes: [{ ticks : { min : 0},scaleLabel: { display: true, labelString: 'Organization' }}],
                    gridLines:  { color: 'blue' },
                    angleLines: { color: 'blue' }
                  }
        };
        this.Linechart4 = new Chart('canvas4', { type: 'bar', data: data, options:options });
      }
     
      let subOrgList : any;
      subOrgList={
        "request": {
          "filters": {
            isTenant: false,
            channel: channel
          },
          "limit": 10000,
          "offset": 0
        }
  
      }
     
      this._httpService.getSuborgData(subOrgList).subscribe(res => {

        this.orgName = [];
        this.OrgLength = [];
        this.organizationData = [];
        if(subOrgLabel==null && this.rootOrgNameUser!=null)
        {
        if(res.result.response.content.length>0 || res.result.response.content.length==0)
        {
        this.subOrg = res.result.response.content;

        this.subOrg.push({"orgName":this.rootOrgNameUser});
        this.orgName = [];
        this.OrgLength = [];
        this.subOrg.forEach(element => {
          let orgNameVal:string; 
          orgNameVal = element.orgName
  
         if(this.groupedUserData[orgNameVal]!=undefined)
         {  
          this.organizationData.push({"orgNameVal" :orgNameVal,"length":this.groupedUserData[orgNameVal].length});
         }
        else if(this.groupedUserData[orgNameVal]==undefined)
         {
          this.organizationData.push({"orgNameVal" :orgNameVal,"length":0});
         }
          });
          this.orgName = [];
          this.OrgLength = [];
          this.organizationData.forEach(element => {
            this.orgName.push(element.orgNameVal);     
            this.OrgLength.push(element.length);
            this.colourList.push(this.getRandomColorHex())
            });    
          }

          if (this.Linechart3 ) {
            this.Linechart3.destroy();
          }
          
         // var ctx = document.getElementById('canvas3').getContext('2d');
                this.Linechart3 = new Chart('canvas3',
                {
                  type: 'bar', //'bar',//'doughnut',//'pie',//'polarArea'
                  data:
                      {
                        labels: this.orgName,
                      
                        datasets: [{label: "Count",data: this.OrgLength,borderColor: '#000',borderWidth : 0,backgroundColor: this.colourList,}]
                      },
                      
                  options:
                      {
                        title:  { display : true,text:"Root/Subroot Organization wise Users",fontSize : 18, fontColor : "#111"},
                      legend: {display: true},
                      scales: {
                        xAxes: [{ scaleLabel: { display: true, labelString: 'Organization' } }],
                        yAxes: [{ scaleLabel: { display: true, labelString: 'User Count' } }],
                                },
                    
                      }
                });
              //  this.Linechart3.destroy();          
          }
        },err=>{
          // this.popupMsg=err.params.errmsg;
  
          });
   });  
}

ChartTest()
{
      let tempArray:any;
      tempArray= {
        'request': {
          'query': '',
          'filters': {
          },
          limit: 10000
        }
      }
      this.showUserData = [];
      this._httpService.userSearch(tempArray).subscribe(res => {
      this.userData = res.result.response.content;
      res.result.response.content.forEach(element => {
      if(element.status==1)
        {
        this.status =   'Active';
        }
      else if(element.status==0)
        {
        this.status =   'Inactive';
        }
      this.userOrgLength =  element.organisations.length;
      this.getAllOrgChartData.forEach(element1 => {
      // debugger
      if( this.userOrgLength>1)
        {
        if((element1.identifier==element.organisations[0].organisationId) && (element.rootOrgId!=element.organisations[0].organisationId))
          {
          this.orgNameUser  = element1.orgName
          }
        }
      });
     
     if( this.userOrgLength==1)
        {
          this.orgNameUser  = element.organisations[0].orgName;
        }
      this.showUserData.push({"userId":element.id,"uStatus":element.status,"createdDate":element.createdDate,"firstName": element.firstName,"lastName":element.lastName,"email":element.email,"phone":element.phone,"orgLength":  element.organisations.length,"orgName":this.orgNameUser,"status":this.status,"userOrglengths":this.userOrgLength,"channel":element.channel,"rootOrgId":element.rootOrgId,"rootOrgName":element.rootOrgName})
 });
      this.results = this.showUserData.reduce(function (r, a) {
        r[a.channel] = r[a.channel] || [];
        r[a.channel].push(a);
        return r;
      }, Object.create(null));
        var arr = Object.entries( this.results)

      arr.forEach(x =>
        {
	    this.allReportChanelName.push(x[0]);
        this.rootName.push(x[1][0].rootOrgName);  
        this.aa=x[1]
        this.rootValue.push(this.aa.length);
        this.labelRootOrgId.push( x[1][0].rootOrgId);

        this.colourList.push(this.getRandomColorHex());
        });
      this.Linechart = new Chart('canvas',
      {
        type: 'bar', //'bar',//'doughnut',//'pie',//'polarArea'
        data:
            {
              labels: this.rootName,      
              datasets: [{label: "Count", minBarLength: 7.5,data: this.rootValue,borderColor:this.labelRootOrgId,borderWidth :this.allReportChanelName,backgroundColor: this.colourList,}]
            },
        options:
            {
              title:  { display : true,text:"Aggregated Organization wise Users",fontSize : 18, fontColor : "#111"},
            legend: {display: true},
            scales: {
              xAxes: [{ scaleLabel: { display: true, labelString: 'Organization' } }],
              yAxes: [{ scaleLabel: { display: true, labelString: 'User Count' } }],
                      }, 
            }
      });

this.mapChildrenIntoArray = []
  arr.forEach(y =>
  {
  this.TeamN1 = '';
  this.TeamA1 = [];
  this.TeamB1 = [];
  this.TeamN1=y[0] ? y[0] : '';
  this.TeamOrgRootNaN1=y[1][0].rootOrgName ? y[1][0].rootOrgName : '';    
  this.aa=y[1]
  for( var i = 0; i < this.aa.length; i++ ) {
  if(this.aa[i].uStatus ==0){
    this.TeamB1.push(this.aa[i]);
  }
  else if(this.aa[i].uStatus ==1){
    this.TeamA1.push(this.aa[i]);    
  }
  }
  this.mapChildrenIntoArray.push({0: this.TeamN1,1:this.TeamOrgRootNaN1, 2:this.TeamA1, 3:this.TeamB1})
  });

this.mapChildrenIntoArray.forEach(z =>
  {
    this.TeamN.push(z[1]);  
    this.teamaLength=z[2]
    this.TeamA.push(this.teamaLength.length);
    this.teambLength=z[3]
    this.TeamB.push(this.teambLength.length);
});
var Team_A={ label: "Active", data: this.TeamA,backgroundColor: "green", borderWidth : 1, minBarLength: 7.5 };
var Team_B={ label: "In Active", data: this.TeamB,backgroundColor: "red",  borderWidth : 1, minBarLength: 7.5 };
// var Team_C={ label: "TeamC score", data: this.TeamC,backgroundColor: "green",borderWidth : 1 };

var data = {
    labels  :this.TeamN,
    datasets:[Team_A,Team_B]
  };
  var options =
  {
    title:  { display : true,text:"Aggregated Organization wise Active and Inactive Users",fontSize : 18, fontColor : "#111"},
    legend: { display : true },    
    scales: { yAxes: [{ ticks : { min : 0},scaleLabel: { display: true, labelString: 'User Count' }}],
              xAxes: [{ ticks : { min : 0},scaleLabel: { display: true, labelString: 'Organization' }}],
              gridLines:  { color: 'blue' },
              angleLines: { color: 'blue' }
            }
  };
  this.Linechart1 = new Chart('canvas1', { type: 'bar', data: data, options:options });

   });
}
 
getRandomColorHex() 
  {
  //  var hex = "0123456789ABCDEF",
  //      color = "#";
  //  for (var i = 1; i <= 6; i++) 
  //  {
  //    color += hex[Math.floor(Math.random() * 16)];
  //  }
 var color= ["#0000FF"];
   return "blue";
 }
  Multi_Bar1()
  {

  }


  showData(evt:any)
  {
    var data = this.Linechart.getElementsAtEvent(evt)
   // alert(JSON.stringify(data[0]));
   //  alert(JSON.stringify(data[0]._model));
   // alert(JSON.stringify(data[0]._chart.id));
   // alert(JSON.stringify(data[0]._model.label));
   // alert(JSON.stringify(data[0]._options.borderColor));
  
    var activePoint = this.Linechart.getElementAtEvent(evt);
    if (activePoint.length > 0)
     {
      var clickedDatasetIndex = activePoint[0]._datasetIndex;
      var clickedElementindex = activePoint[0]._index;
      if(activePoint[0].$previousStyle)
      {
        var filter_data         = activePoint[0].$previousStyle.borderColor;
	     var filter_chanel           =activePoint[0].$previousStyle.borderWidth; 
      }
      else{
        var filter_data         = activePoint[0]._model.borderColor;
        var filter_chanel           =activePoint[0]._model.borderWidth;
      }
     
      var label = this.Linechart.data.labels[clickedElementindex];
      var value = this.Linechart.data.datasets[clickedDatasetIndex].data[clickedElementindex];
	  // alert("Clicked: label:-" + label + " value- " + value +  " - " + clickedElementindex +' filter-'+filter_data+'filter id--'+filter_chanel);
      this.getOrgData(label,filter_data,null,filter_chanel)
      this.showSubOrgActInActGraph = false;
    //alert("Clicked: label:-" + label + " value- " + value +  " - " + clickedElementindex +' filter-'+filter_data);
    }
    else
    {
      this.getOrgData(null,null,null,null)
      this.showSubOrgActInActGraph = false;
    }
  }
  userReportLink()
  {
    this.router.navigate(["dashBoard/reportsdatewise"]);
  }
  dateWiseLineChart()
  {
    this.router.navigate(["dashBoard/organization-report"]);
  }
  showData3(str:any)
  {

        var data = this.Linechart3.getElementsAtEvent(str)


        let subOrgLabel:string;
        if(JSON.stringify(data[0]._model.label))
        {
        subOrgLabel = String(JSON.stringify(data[0]._model.label))
        subOrgLabel = subOrgLabel.replace(/^"(.*)"$/, '$1');
        this.showSubOrgActInActGraph = true;
        }
        else
        {
          
          subOrgLabel = "";
          this.showSubOrgActInActGraph = true;
        }
        this.getOrgData(null,null,subOrgLabel,null)
       // sessionStorage.setItem("subOrgLabel", this.subOrgLabel);
  }
}

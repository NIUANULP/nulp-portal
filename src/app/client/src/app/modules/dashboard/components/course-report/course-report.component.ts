import { Component, OnInit } from '@angular/core';
// import { mapChildrenIntoArray } from '@angular/router/src/url_tree';
import { Chart } from 'chart.js';
//import 'chartjs-plugin-labels';
/////////////////////////////////////////
import { UserService, SearchService } from '@sunbird/core';
import { ReportService } from '../../services/report/report.service';
import { ToasterService, ResourceService, INoResultMessage, ConfigService } from '@sunbird/shared';
////////////////////////////////////////
import * as _ from 'lodash-es';
import { AddusserService } from '../../services/addusser/addusser.service';
// import { content } from 'html2canvas/dist/types/css/property-descriptors/content';


@Component({
  selector: 'app-course-report',
  templateUrl: './course-report.component.html',
  styleUrls: ['./course-report.component.scss']
})
export class CourseReportComponent implements OnInit {


  constructor
  (
    private _httpService: AddusserService,
    public reportService: ReportService,
    private searchService:SearchService,
    private toasterService: ToasterService,
    public resourceService: ResourceService,
    ) { }

////////////Tab///////////////////////
  organizationTab: boolean  = true;
  userTab: boolean = true;
//////////////////////////////////////
  cityList: any = [];
  userList: any = [];
  noResultMessage :any;
  noResult = true;
  ////////popup/////////////////
  popupTitle="Course wise Graphical Reports";
  selectedItems = [];
  addUserPopup: boolean = false;
  ////////////extra/////////////
  i=0;
  Graph_Data_List=[];
  Table_Data_List=[];
  //////////chart.js data//////
  G1_Piechart:any;
  G2_Piechart:any;
  G3_Piechart:any;
  G4_Piechart:any;
////////////graph data list////
  G1_Group_list=[];
  G2_Group_list=[];
  G3_Group_list=[];
  G4_Group_list=[];
  //////////////////////////////
  strList="";
  colsUser=[];
  //////////////////////////////

  ngOnInit() {
    this.getCourseList();
    this.colsUser = [
      { field: 'SNo',           header: 'SNo',          width: '50px' },
      { field: 'creator',       header: 'Creator',      width: '150px' },
      { field: 'subject',       header: 'Subject',      width: '150px' },
      { field: 'organisation',  header: 'Organisation', width: '150px' },
      { field: 'Category',      header: 'Category',     width: '150px' },
      { field: 'name',          header: 'Name',         width: '150px' },
      { field: 'contentType',   header: 'ContentType',  width: '150px' },
      { field: 'copyright',     header: 'Copyright',    width: '150px' },
    ]
  }


  /////Load content List////////////////////////////

  getCourseList()
  {

    const data = {
      "request":
      {
        "query"   : "",
        "filters" : { "status": ["Live"],
                      "framework": ["nulp"],
                      "contentType": ["Course"]},

        "limit"   : "1000",
        "sort_by" : { "lastUpdatedOn": "desc" },
        "fields"  :
        ["identifier", "creator", "organisation","copyright",
        "name", "contentType", "createdFor", "channel",
        "board", "medium", "gradeLevel", "subject",
        "lastUpdatedOn", "status", "createdBy",
        "framework", "createdOn", "lastPublishedOn"]
    }
    };

    this.reportService.getContentCreationStaticsReport(data).subscribe((response) =>
    {
      if (_.get(response, 'responseCode') === 'OK')
      {
        if (response.result.count > 0)
        {
          var tableData = [];
          let tempObj = _.cloneDeep(response.result.content);
          tableData = tempObj;
          var self = this;
          ///////////////LOOPING ROOT ORG/////////////////////////////////
          var ChnlIds=[];
          var UserIds=[];
           ChnlIds = _.uniq(_.map(tempObj, 'channel'));
           UserIds = _.uniq(_.map(tempObj, 'createdBy'));
          //console.log('1-ChannelIds:-'+ChnlIds);
          //console.log('2-UserIds:-'+UserIds);
          /////////////////GET USER LIST/////////////////////////////////
          const reqParam = {  filters: { id:UserIds}}
          this.searchService.getUserList(reqParam).subscribe(response =>
            {
            this.userList = [];
            let userObj = _.cloneDeep(response.result.response.content);
            this.userList = userObj;
            //console.log( '----UserList---------');
            //console.log( this.userList);
            //////////////////GET CITY/ORG LIST/////////////////////////////
            const reqPayload = { "request": { "filters": { "id":ChnlIds, "isTenant":true} } };
            //const reqPayload = { "request": { "filters": { "id":ChnlIds, "isRootOrg":true, "status":1 } } };
            //const reqPayload = { "request": { "filters": { "isRootOrg":true, "status":1 } } };
            //const reqPayload = { "request": { "filters": { "isRootOrg":true} } };
              this.reportService.getOrganizationName(reqPayload).subscribe((response) =>
              {
                    this.cityList = [];
                    let cityObj = _.cloneDeep(response.result.response.content);
                    this.cityList = cityObj;
                    this.cityList = _.reject(response.result.response.content,obj=>_.isEmpty(obj.orgName));
                    //////////////////////////////////////////////////////////////////
                    this.InitializeGraph(tableData);
              ////////////////////////////////////////////////////
              }); //City close
              /////////////////////////////////////////////////////////////////
           }); //User Close
        }
        else
        {
          this.noResultMessage = {'messageText': 'messages.stmsg.m0131' };
          this.noResult = true;
        }
      }
      else
      {
        this.toasterService.error(this.resourceService.messages.emsg.m0007);
      }
    }, (err) => {
      console.log(err);
      this.toasterService.error(this.resourceService.messages.emsg.m0007);
    }); //Content close
      ////////////////////////////////////////////////////////////
  }

  ///////////////////////////////////////////////////

  InitializeGraph(C_List:any)
  {
      //debugger;
      if (this.cityList.length > 0)
      {

      }
      ///////UPDATE USER LIST//////USER-ID-to-SUB-ORG-MAPING////////////////////
      this.userList.forEach(element =>
        {
          this.cityList.forEach(element1 =>
            {
             //if(element1.identifier==orgId)
             //{
             //  this.rootOrgNameUser_new  = element1.orgName
             //}

              if( element.organisations.length>1)
                  {
                    if((element1.identifier==element.organisations[1].organisationId) &&
                        (element.rootOrgId!=element.organisations[1].organisationId))
                        {
                          element.orgNameUser_new  =   element1.orgName
                          element.orgTypeUser_new  =   'Sub Organization';
                         }
                         else if(element.rootOrgId==element.organisations[1].organisationId)
                         {
                          element.orgNameUser_new  =  element.organisations[0].orgName;
                          element.orgTypeUser_new =   'Sub Organization';
                         }else
                         {
                          element.orgNameUser_new  =  element.organisations[1].orgName;
                          element.orgTypeUser_new =   'Sub Organization';
                         }
                  }
                  else if( element.organisations.length==1)
                  {
                        element.orgNameUser_new  = element.organisations[0].orgName;
                        element.orgTypeUser_new   =   'Root  Organization';
                  }
              });
        });
      //console.log("Updated userList:-"+JSON.stringify(this.userList));
      //console.log(this.userList);
      //////////////////////////////////////////////////////////////////////////
      var groupedUserData =   this.userList.reduce(function(rv, x) { // grouping of userdata
        (rv[x['orgNameUser_new']] = rv[x['orgNameUser_new']] || []).push(x);
        return rv;
        }, {});
      /////////////////Camposing comman content data list//////////////////////////
       this.Graph_Data_List=[];
      C_List.forEach(x =>
      {
        let CityTraced= this.cityList.find(el => el.id === x.channel);
        let UserTraced= this.userList.find(el => el.id === x.createdBy);
          //console.log("cha:-"+x.createdBy+"  Traced-"+JSON.stringify(UserTraced));
          this.Graph_Data_List.push({
          "identifier":x.identifier,
          "copyright":x.copyright,
          "createdFor":x.createdFor,
          "creator":x.creator,
          "subject":x.subject,
          "channel":x.channel,
          "organisation":x.organisation,
          //////////////Add Processed Column///////////////
          "RootOrgName_new_user":CityTraced["orgName"],
          "rootOrgName_new_city":UserTraced["rootOrgName"],
          "orgNameUser_new":UserTraced["orgNameUser_new"],
          "orgTypeUser_new":UserTraced["orgTypeUser_new"],
          "lastNameUser_new":UserTraced["lastName"],
          /////////////////////////////////////////////////
          "createdBy":x.createdBy,
          "medium":x.medium,
          "name":x.name,
          "createdOn":x.createdOn,
          "objectType":x.objectType,
          "gradeLevel":x.gradeLevel,
          "framework":x.framework,
          "contentType":x.contentType,
          "Category":x.board,
          "lastPublishedOn":x.lastPublishedOn,
          "lastUpdatedOn":x.lastUpdatedOn,
          "status":x.status
        });
      });
      //console.log('Updated Graph_Data_List for json-----'+JSON.stringify(this.Graph_Data_List));
      ///////SHORTING//////////////////////////////////////////////////
      this.Graph_Data_List.sort((a, b) =>
      {
        if (a.createdBy < b.createdBy)
        return -1;
        if (a.createdBy > b.createdBy)
        return 1;
        return 0;
    });
     this.GeneratingChannelList(this.Graph_Data_List);
  }
///////////////////////////////////////////

GeneratingChannelList(ResultCN:any)
{
      var G1_Name=[];
      var G1_Value=[];
      var G1_Filter=[]
      var G1_Colour=[]
      //////////////////////////////////////////////////////////
      this.G1_Group_list=this.groupBy1(ResultCN,"channel");
      Object.keys(this.G1_Group_list).forEach( x=>
        {
        var xx=this.G1_Group_list[x];
        G1_Name.push(   xx[0].RootOrgName_new_user);
        G1_Value.push(  this.G1_Group_list[x].length);
        G1_Filter.push( xx[0].channel);
        //G1_Filter.push(x);
        G1_Colour.push(this.getRandomColorHex());
        });
        //console.log("----this.G1_Group_list------")
        //console.log(this.G1_Group_list);
      this.G1_Chart(G1_Name,G1_Value,G1_Filter,G1_Colour);
}

G1_Chart(G1_Name:any,G1_Value:any,G1_Filter:any,G1_Colour:any)
{
  if ( this.G1_Piechart) // != undefined
  {
    this.G1_Piechart.destroy();
  }
    this.G1_Piechart = new Chart('G1_Canvas1',
    {
      type: 'bar',//'doughnut',//'pie',//'polarArea','horizontalBar',
      data:
          {
            labels  :             G1_Name,
            datasets: [{
                  data:           G1_Value,
                 // borderColor:    G1_Filter,
                  borderSkipped:  G1_Filter,
                  backgroundColor:G1_Colour,
                  //borderWidth: 1, // Specify bar border width
                  fill: true }
                ]
          },
      options:
          {
            //tooltips: { mode: 'index'},
            //hover: { mode: 'index', intersect: true  },
            title:{ display : true,text:"Aggregated Organization wise Courses ",fontSize : 18, fontColor : "#111",},
            legend: { display :false ,labels: { fontColor: "green", }},
            scales: {
            xAxes: [{ scaleLabel: { display: true, labelString: 'Organization' } }],
            yAxes: [{ scaleLabel: { display: true, labelString: 'Course Count' } }],
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

G1_Chart_showData(evt:any)
{
  this.resetGraph('G1');
  //var data = this.G1_Piechart.getElementsAtEvent(evt)
  var activePoint = this.G1_Piechart.getElementAtEvent(evt);
  if (activePoint.length > 0)
   {
    var filter_data         = activePoint[0]._model.borderSkipped; //bar
    this.G2_Group_list=this.groupBy1(this.G1_Group_list[filter_data],"Category");
    this.G3_Group_list=this.groupBy(this.G1_Group_list[filter_data], function(item)
    {
      return [item.orgTypeUser_new, item.orgNameUser_new];
    });

    this.GeneratingCategoryChart(this.G2_Group_list);
    this.GeneratingOrg_TypeChart(this.G3_Group_list);
  }
}

GeneratingCategoryChart(ResultTT:any)
{
    var G2_Name=[];
    var G2_Value=[];
    var G2_Filter=[]
    var G2_Colour=[]
    Object.keys(ResultTT).forEach( x=>
      {
      G2_Name.push(x);
      G2_Value.push(ResultTT[x].length);
      G2_Filter.push(x);
      G2_Colour.push(this.getRandomColorHex());
      });
    this.G2_Chart(G2_Name,G2_Value,G2_Filter,G2_Colour);
}

G2_Chart(G2_Name:any,G2_Value:any,G2_Filter:any,G2_Colour:any)
{
  if ( this.G2_Piechart) // != undefined
  {
    this.G2_Piechart.destroy();
  }
    this.G2_Piechart = new Chart('G2_Canvas1',
    {
      type: 'bar',//'doughnut',//'pie',//'polarArea','horizontalBar',
      data:
          {
            labels:                 G2_Name,
            datasets: [{
                  data:             G2_Value,
                  //borderColor:      G2_Filter,
                  borderSkipped:    G2_Filter,
                  backgroundColor:  G2_Colour,
                  //borderWidth: 1, // Specify bar border width // Set this data to a line chart
                  fill: true }
                ]
          },
      options:
          {
          legend: {display: false},
          //tooltips: { mode: 'index'},

          title:{ display : true,text:"Category wise Courses based on Aggregated Organization",fontSize : 18, fontColor : "#111",},
          scales: {
            xAxes: [{ scaleLabel: { display: true, labelString: 'Categories' } }],
            yAxes: [{ scaleLabel: { display: true, labelString: 'Course Count' } }],
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


G2_Chart_showData(evt:any)
{
  this.resetGraph('G2');
  var data = this.G2_Piechart.getElementsAtEvent(evt)
  var activePoint = this.G2_Piechart.getElementAtEvent(evt);
  if (activePoint.length > 0)
   {
    var clickedDatasetIndex = activePoint[0]._datasetIndex;
    var clickedElementindex = activePoint[0]._index;
     //var filter_data         = activePoint[0]._options.borderColor;  //pie
     var filter_data         = activePoint[0]._model.borderSkipped; //bar
    var label = this.G2_Piechart.data.labels[clickedElementindex];
    var value = this.G2_Piechart.data.datasets[clickedDatasetIndex].data[clickedElementindex];
    //alert("Clicked: label:-" + label + " value- " + value +  " - " + clickedElementindex +' filter-'+filter_data);
    this.loadGridView(this.G2_Group_list[filter_data]);
    this.popupTitle="List of Courses Created under '"+ filter_data +"' Category ";
  }
}

GeneratingOrg_TypeChart(ResultCC:any)
{
  var G3_Name=[];
  var G3_Value=[];
  var G3_Filter=[];
  var G3_Colour=[];
  Object.keys(ResultCC).forEach( x=>
    {
    var Obj=ResultCC[x];
    G3_Name.push(Obj[0].orgNameUser_new);

    //G3_Name.push(x);
    G3_Value.push(ResultCC[x].length);
    G3_Filter.push(x);
    G3_Colour.push(this.getRandomColorHex());
    });
    this.G3_Chart(G3_Name,G3_Value,G3_Filter,G3_Colour);
}


G3_Chart(G3_Name:any,G3_Value:any,G3_Filter:any,G3_Colour:any)
{
  if ( this.G3_Piechart) // != undefined
  {
    this.G3_Piechart.destroy();
  }
    this.G3_Piechart = new Chart('G3_Canvas1',
    {
      type: 'bar',//'doughnut',//'pie',//'polarArea','horizontalBar',
      data:
          {
            labels:                 G3_Name,
            datasets: [{
                  data:             G3_Value,
                 // borderColor:      G3_Filter,
                  borderSkipped:    G3_Filter,
                  backgroundColor:  G3_Colour,
                  //borderWidth: 1, // Specify bar border width // Set this data to a line chart
                  fill: true }
                ]
          },
      options:
          {
          legend: {display: false},
          //tooltips: { mode: 'index'},
          title:{ display : true,text:"Root/Subroot Organization wise Courses",fontSize : 18, fontColor : "#111",},
          scales: {
            xAxes: [{ scaleLabel: { display: true, labelString: 'Organization' } }],
            yAxes: [{ scaleLabel: { display: true, labelString: 'Course Count' } }],
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





G3_Chart_showData(evt:any)
{
  this.resetGraph('G3');
  var activePoint = this.G3_Piechart.getElementAtEvent(evt);
  if (activePoint.length > 0)
   {
    var clickedDatasetIndex = activePoint[0]._datasetIndex;
    var clickedElementindex = activePoint[0]._index;
     //var filter_data         = activePoint[0]._options.borderColor;  //pie
     var filter_data         = activePoint[0]._model.borderSkipped; //bar
    var label = this.G3_Piechart.data.labels[clickedElementindex];
    var value = this.G3_Piechart.data.datasets[clickedDatasetIndex].data[clickedElementindex];
    //alert("Clicked: label:-" + label + " value- " + value +  " - " + clickedElementindex +' filter-'+filter_data);
    this.G4_Group_list=this.groupBy1(this.G3_Group_list[filter_data],"Category");
    this.CourseChart(this.G4_Group_list);
  }
}

CourseChart(ResultTT:any)
{
  var G4_Name=[];
      var G4_Value=[];
      var G4_Filter=[];
      var G4_Colour=[];

      Object.keys(ResultTT).forEach( x=>
        {
          G4_Name.push(x);
          G4_Value.push(ResultTT[x].length);
          G4_Filter.push(x);
          G4_Colour.push(this.getRandomColorHex());
        });
      this.G4_Chart(G4_Name,G4_Value,G4_Filter,G4_Colour);
}

G4_Chart(G4_Name:any,G4_Value:any,G4_Filter:any,G4_Colour:any)
{
  if ( this.G4_Piechart) // != undefined
  {
    this.G4_Piechart.destroy();
  }
 this.G4_Piechart = new Chart('G4_Canvas1',
 {
   type: 'bar',//'doughnut',//'pie',//'polarArea','horizontalBar',
   data:
       {
         labels:                 G4_Name,
         datasets: [{
               data:             G4_Value,
              // borderColor:      G4_Filter,
               borderSkipped:    G4_Filter,
               backgroundColor:  G4_Colour,
               //borderWidth: 1,
               fill: true }
             ]
       },
   options:
       {
       legend: {display: false},
       //tooltips: { mode: 'index'},
       //hover: { mode: 'index', intersect: true  },
       title:{ display : true,text:"Category wise Courses based on Root/Subroot Organization",fontSize : 18, fontColor : "#111",},
       scales: {
        xAxes: [{ scaleLabel: { display: true, labelString: 'Sub Categories' } }],
        yAxes: [{ scaleLabel: { display: true, labelString: 'Course Content' } }],
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

G4_Chart_showData(evt:any)
{
    var activePoint = this.G4_Piechart.getElementAtEvent(evt);
    if (activePoint.length > 0)
     {
      var clickedDatasetIndex = activePoint[0]._datasetIndex;
      var clickedElementindex = activePoint[0]._index;
       //var filter_data         = activePoint[0]._options.borderColor;  //pie
    var filter_data         = activePoint[0]._model.borderSkipped; //bar

      var label = this.G4_Piechart.data.labels[clickedElementindex];
      var value = this.G4_Piechart.data.datasets[clickedDatasetIndex].data[clickedElementindex];
      //alert("Clicked: label:-" + label + " value- " + value +  " - " + clickedElementindex +' filter-'+filter_data);
      this.loadGridView(this.G4_Group_list[filter_data]);
      this.popupTitle="List of Courses Created under '"+ filter_data +"' Category ";
    }
}

////////////Global Function///////////////////////////////


resetGraph(ngClick:any)
{
  if(ngClick=="G1")
   {
    //this.G3_Piechart=null;
    //this.G3_Piechart=new Chart("G4_Canvas", { type: "pie", data: {} ,options: {} });
    this.Table_Data_List=[];
  }
  else  if(ngClick=="G2")
  {
    this.Table_Data_List=[];
  }
  else  if(ngClick=="G3")
  {
    this.Table_Data_List=[];
  }
}


loadGridView(tableData:any)
{
  var SNo=0;
  tableData.forEach(y =>
    {
      SNo++;
      y.SNo=SNo;
    });
    this.Table_Data_List=tableData;
}

 getRandomColorHex()
  {
  //  var hex = "0123456789ABCDEF",
  //      color = "#";
  //  for (var i = 1; i <= 6; i++)
  //  {
  //    color += hex[Math.floor(Math.random() * 16)];
  //  }
    var color= ["red", "green", "blue", "purple", "magenta","aqua", "salmon", "darkgray", "pink", "coral"];
    //var min=0;
    //var max=color.length-1;
    //var rand= Math.floor(Math.random() * (max - min + 1) + min);
    this.i++;
    //return color[this.i%color.length-1];
    return "blue";
 }

 groupBy( array , f )
 {
   var groups = {};
   array.forEach( function( o )
   {
     var group = JSON.stringify( f(o) );
     groups[group] = groups[group] || [];
     groups[group].push( o );
   });
   return Object.keys(groups).map( function( group )
   {
     return groups[group];
   })
 }


 groupBy1(list, key)
 {
  return list.reduce(function(rv, x)
  {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};
///////////////////////////////////////
////////////////////////////////////////////////

}


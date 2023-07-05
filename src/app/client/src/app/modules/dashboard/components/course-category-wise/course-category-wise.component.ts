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
  selector: 'app-course-category-wise',
  templateUrl: './course-category-wise.component.html',
  styleUrls: ['./course-category-wise.component.scss']
})
export class CourseCategoryWiseComponent implements OnInit {

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
  ////////popup//////////////////////
  popupTitle="Course wise Graphical Reports";
  selectedItems = [];
  addUserPopup: boolean = false;
  ////////////extra////////////////
  i=0;
  strList="";
  colsUser=[];
  ////////////////////////////
  Graph_Data_List=[];
  Table_Data_List=[];
  B1_Root_list=[];
  B2_Root_list=[];
  B1_Piechart:any;
  B2_Piechart:any;
  /////////////////////////////////
  ///////////////////////////////////
  strTxt='';
  tooltip='';
  /////////////////////////////////////
    ngOnInit()
    {
      this.getCourseList();
      this.colsUser = [
        { field: 'SNo',           header: 'SNo',          width: '50px' },
        { field: 'organisation',  header: 'Organisation', width: '150px' },
        { field: 'Category',      header: 'Category',     width: '150px' },
        { field: 'subject',       header: 'Sub Category',      width: '150px' },
        { field: 'name',          header: 'Topic',         width: '150px' },
        { field: 'creator',       header: 'Creator',      width: '150px' },
        //{ field: 'contentType',   header: 'ContentType',  width: '150px' },
        //{ field: 'copyright',     header: 'Copyright',    width: '150px' },
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
            /////////////////GET USER LIST/////////////////////////////////
            const reqParam = {  filters: { id:UserIds}}
            this.searchService.getUserList(reqParam).subscribe(response =>
              {
              this.userList = [];
              let userObj = _.cloneDeep(response.result.response.content);
              this.userList = userObj;
              //////////////////GET CITY/ORG LIST/////////////////////////////
              const reqPayload = { "request": { "filters": { "id":ChnlIds}, "limit": 1000,"offset": 0 } };
              //const reqPayload = { "request": { "filters": { "id":ChnlIds, "isRootOrg":true, "status":1 } } };
              //const reqPayload = { "request": { "filters": { "isRootOrg":true, "status":1 } } };
              //const reqPayload = { "request": { "filters": { "isRootOrg":true} } };
              //URLS.ADMIN.ORG_SEARCH,
                this.reportService.getOrganizationName(reqPayload).subscribe((response) =>
                {
                      //this.cityList = [];
                      //let cityObj = _.cloneDeep(response.result.response.content);
                      //this.cityList = cityObj;
                      //this.cityList = _.reject(response.result.response.content,obj=>_.isEmpty(obj.orgName));
                      //////////////////////////////////////////////////////////////////
                      response.result.response.content.forEach(c =>
                        {
                        this.cityList.push({"id":c.id,"orgName":c.orgName,"identifier":c.identifier});
                        });
                      //////////////////////////////////////////////////////////////
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

        this.toasterService.error(this.resourceService.messages.emsg.m0007);
      }); //Content close
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
                            element.orgNameUser_new  =  element.organisations[0].orgName;
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
        //this.strList=JSON.stringify(this.Graph_Data_List);

        ///////SHORTING//////////////////////////////////////////////////
        this.Graph_Data_List.sort((a, b) =>
        {
          if (a.createdBy < b.createdBy)
          return -1;
          if (a.createdBy > b.createdBy)
          return 1;
          return 0;
      });


      this.GeneratingCategorylChart(this.Graph_Data_List);
    }
  ///////////////////////////////////////////

  GeneratingCategorylChart(ResultCT:any)
  {
      var B1_Name=[];
      var B1_Value=[];
      var B1_Filter=[];
      var B1_Colour=[];
        /////////////////////////////////////////////////////////////////
        this.B1_Root_list = this.groupByKey(ResultCT,"Category");
        
        Object.keys(this.B1_Root_list).forEach( x=>
          {
            B1_Name.push(x);
            B1_Value.push(this.B1_Root_list[x].length);
            var xx=this.B1_Root_list[x];
            B1_Filter.push(xx[0].Category);
            B1_Colour.push(this.getRandomColorHex());
          });




        this.B1_Chart(B1_Name,B1_Value,B1_Filter,B1_Colour);
  }


  B1_Chart(B1_Name:any,B1_Value:any,B1_Filter:any,B1_Colour:any)
  {
    if (this.B1_Piechart) // != undefined
    {
      this.B1_Piechart.destroy();
    }
      this.B1_Piechart = new Chart('B1_Canvas2',
      {
        type: 'bar',
        data:
            {
              labels  :             B1_Name,
              datasets: [{
                    data:           B1_Value,
                    borderColor:    B1_Filter,
                    borderSkipped:  B1_Filter,
                    backgroundColor:B1_Colour,
                    borderWidth: 1,
                    fill: true }
                  ]
            },
        options:
            {
            tooltips: { mode: 'index'},
            //hover: { mode: 'index', intersect: true  },
            title:{ display : true,text:"Category wise Course Dashboard",fontSize : 18, fontColor : "#111",},
            legend: { display :false ,labels: { fontColor: "green", }},
            scales: {
            xAxes: [{ scaleLabel: { display: true, labelString: 'Course Category' } }],
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

  B1_Chart_showData(evt:any)
  {
    //alert('enter in b1');
    this.resetGraph('B1');
    var activePoint = this.B1_Piechart.getElementAtEvent(evt);
    if (activePoint.length > 0)
     {
      var clickedDatasetIndex = activePoint[0]._datasetIndex;
      var clickedElementindex = activePoint[0]._index;
      //var filter_data         = activePoint[0]._options.borderColor;  //pie
      var filter_data           = activePoint[0]._model.borderSkipped;  //bar
      this.strTxt=JSON.stringify(activePoint[0]._model);
      var label = this.B1_Piechart.data.labels[clickedElementindex];
      var value = this.B1_Piechart.data.datasets[clickedDatasetIndex].data[clickedElementindex];
      //alert("Clicked: label:-" + label + " value- " + value +  " - " + clickedElementindex +' filter-'+filter_data);
      //////////////////////////////////////////////
      //this.B2_Root_list=this.groupByKey(this.B1_Root_list[filter_data],"orgNameUser_new");
      this.B2_Root_list=this.groupBy(this.B1_Root_list[filter_data], function(item)
          {
            return [item.orgTypeUser_new, item.orgNameUser_new];
          });

      ///////////////////////////////////////////////
      this.popupTitle=this.B1_Root_list[filter_data].length+" Course(s) Created in '"+filter_data+"' Category.";
      this.tooltip=filter_data;
      ////////////////////////////////
      this.loadGridView(this.B1_Root_list[filter_data]);
      this.GeneratingOrg_TypeChart(this.B2_Root_list);
    }
  }


  GeneratingOrg_TypeChart(ResultCO:any)
  {
    var B2_Name=[];
    var B2_Value=[];
    var B2_Filter=[];
    var B2_Colour=[];
    Object.keys(ResultCO).forEach( x=>
      {
      var Obj=ResultCO[x];
      B2_Name.push(Obj[0].orgNameUser_new);
      B2_Value.push(ResultCO[x].length);
      B2_Filter.push(x);
      B2_Colour.push(this.getRandomColorHex());
      });
      this.B2_Chart(B2_Name,B2_Value,B2_Filter,B2_Colour);
  }

  B2_Chart(B2_Name:any,B2_Value:any,B2_Filter:any,B2_Colour:any)
  {
    if (this.B2_Piechart) // != undefined
    {
      this.B2_Piechart.destroy();
    }
     this.B2_Piechart = new Chart('B2_Canvas2',
      {
        type: 'bar',//'doughnut',//'pie',//'polarArea','horizontalBar',
        data:
            {
              labels  :             B2_Name,
              datasets: [{
                    data:           B2_Value,
                    borderColor:    B2_Filter,
                    borderSkipped:  B2_Filter,
                    backgroundColor:B2_Colour,
                    borderWidth: 1,
                    fill: true }
                  ]
            },
        options:
            {
            tooltips: { mode: 'index'},
            //hover: { mode: 'index', intersect: true  },
            title:{ display : true,text:"Orgnization wise Course Created",fontSize : 18, fontColor : "#111",},
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




  B2_Chart_showData(evt:any)
  {
    this.resetGraph('B2');
    var activePoint = this.B2_Piechart.getElementAtEvent(evt);
    if (activePoint.length > 0)
     {
      var clickedDatasetIndex = activePoint[0]._datasetIndex;
      var clickedElementindex = activePoint[0]._index;
      //var filter_data         = activePoint[0]._options.borderColor;  //pie
      var filter_data           = activePoint[0]._model.borderSkipped;  //bar
      //this.strTxt=JSON.stringify(activePoint[0]._model);
      var label = this.B2_Piechart.data.labels[clickedElementindex];
      var value = this.B2_Piechart.data.datasets[clickedDatasetIndex].data[clickedElementindex];
      //alert("Clicked: label:-" + label + " value- " + value +  " - " + clickedElementindex +' filter-'+filter_data);
      this.popupTitle=this.B2_Root_list[filter_data].length+" Course(s) of '"+this.tooltip+"' Category are Created.";
      // in '"+filter_data+"'";
      this.loadGridView(this.B2_Root_list[filter_data]);
    }
  }



  resetGraph(ngClick:any)
  {
    if(ngClick=="B1")
     {
    //  this.B2_Piechart=new Chart("B2_Canvas", { type: "bar", data: {} ,options: {} });
      this.Table_Data_List=[];
      this.B2_Root_list=[];
      //alert(88);
    }
    else  if(ngClick=="B2")
    {
      this.Table_Data_List=[];
      //this.B2_Root_list=[];
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

  //////////////////////////////////////
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

  ///MULTIPLE GROUP BY FUNCTION////////
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
 ///MULTIPLE GROUP BY FUNCTION////////
  groupByKey(list, key)
  {
   return list.reduce(function(rv, x)
   {
     (rv[x[key]] = rv[x[key]] || []).push(x);
     return rv;
   }, {});
  };



  //////////////////////////////////////////////////////////////////


}

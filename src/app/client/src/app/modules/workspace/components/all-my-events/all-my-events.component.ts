
import { UserService,SearchService,DataService } from '@sunbird/core';
import { combineLatest as observableCombineLatest, forkJoin ,Observable, throwError} from 'rxjs';
import { Component, Input, OnInit,ViewChild } from '@angular/core';
// import { Router } from '@angular/router';
import { Router } from '@angular/router';
import { EventListService } from 'ngtek-event-library';
import { EventFilterService, SbToastService } from 'ngtek-event-library';
import { from } from 'rxjs';
import { LayoutService, COLUMN_TYPE,ServerResponse, PaginationService, ConfigService, ToasterService, IPagination,
  ResourceService, ILoaderMessage, INoResultMessage, IContents, NavigationHelperService } from '@sunbird/shared';
import { takeUntil,tap, catchError  } from 'rxjs/operators';
import { createDirective } from '@angular/compiler/src/core';
import { WorkSpaceService } from '../../services';
import { SuiModalService, TemplateModalConfig, ModalTemplate } from 'ng2-semantic-ui-v9';
import { ContentIDParam } from '../../interfaces/delteparam';
import * as _ from 'lodash-es';
import { Subject } from 'rxjs';
// import { SbToastService } from "../../services/iziToast/izitoast.service";
import * as mappingConfig from '../../config/nameToCodeMapping.json';
import { WorkSpace } from '../../classes/workspace';
// import * as staticEventList from '../../../../../assets/api/eventlist.json'
const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3',
  },
  blue: {
    primary: '#ad2121',
    secondary: '#FAE3E3',
  },
  yellow: {
    primary: '#ad2121',
    secondary: '#FAE3E3',
  },
};

@Component({
  selector: 'app-all-my-events',
  templateUrl: './all-my-events.component.html',
  styleUrls: ['./all-my-events.component.scss']
})
export class AllMyEventsComponent extends WorkSpace implements OnInit {
  @ViewChild('modalTemplate')
  public modalTemplate: ModalTemplate<{ data: string }, string, string>;

  eventList: any;

  public unsubscribe$ = new Subject<void>();
  layoutConfiguration: any;
  FIRST_TO_PANEL_LAYOUT: string;
  SECOND_TO_PANEL_LAYOUT: string;
  filterConfig: any;
  isLoading: boolean = true;
  myEvents: any[];
  // p: number = 1;
  // collection: any[];
  Filterdata: any;
  libEventConfig:any;
  dates: any;
  EventListCount: any;
  query: any;
  today = new Date();
  sort_by: any;
  todayDate = this.today.getFullYear() + '-' + ('0' + (this.today.getMonth() + 1)).slice(-2) + '-' + ('0' + (this.today.getDate())).slice(-2);
  yesterdayDate = this.today.getFullYear() + '-' + ('0' + (this.today.getMonth() + 1)).slice(-2) + '-' + ('0' + (this.today.getDate() - 1)).slice(-2);
  tommorrowDate = this.today.getFullYear() + '-' + ('0' + (this.today.getMonth() + 1)).slice(-2) + '-' + ('0' + (this.today.getDate() + 1)).slice(-2);
  private currentContentId: ContentIDParam;
  private contentMimeType: string;
  private showCollectionLoader: boolean;
  private deleteModal: any;
  showLoader = true;
  loaderMessage: ILoaderMessage;
  public resourceService: ResourceService;  
  private headers: any;
  public collectionData: Array<any>;
  public collectionListModal = false;
  tempEventList: Array<IContents> = [];
  currentEvent: any;
     public config: ConfigService;
     paginatedEventList = [];
 itemsPerPage = 10;
  pager: any = {};
  page = 1;
  /**
   * To navigate to other pages
   */
  route: Router;

   @Input() paginateLimit: number = 12;
  pageNumber: number = 1;
  /**
    * Constructor to create injected service(s) object
    Default method of Draft Component class
    * @param {SearchService} SearchService Reference of SearchService
    * @param {UserService} UserService Reference of UserService
    * @param {Router} route Reference of Router
    * @param {PaginationService} paginationService Reference of PaginationService
    * @param {ActivatedRoute} activatedRoute Reference of ActivatedRoute
    * @param {ConfigService} config Reference of ConfigService
  */
  
  /**
  * To store deleting content id
  */
  // private currentContentId: ContentIDParam;

  constructor(
    public searchService: SearchService,
    private eventListService:EventListService,
    private router: Router,
    public userService: UserService,
    private eventFilterService: EventFilterService,
    private toasterService: ToasterService,resourceService: ResourceService,
    public layoutService: LayoutService,
    private sbToastService: SbToastService,
    public workSpaceService: WorkSpaceService,
    route: Router,
    config: ConfigService, public modalService: SuiModalService) {
        super(searchService, workSpaceService, userService);
          this.route = route;
        this.resourceService = resourceService;
            this.config = config;

      }
           

  ngOnInit() {
    this.initLayout();

    this.fecthAllEvents();

    this.showFilters();

    console.log('Static Event List - ', this.eventList);
  }

  onPageBoundsCorrection(number: number) {
    this.pageNumber = number;
}

  redoLayout() {
    if (this.layoutConfiguration != null) {
      this.FIRST_TO_PANEL_LAYOUT = this.layoutService.redoLayoutCSS(0, this.layoutConfiguration, COLUMN_TYPE.threeToNine);
      this.SECOND_TO_PANEL_LAYOUT = this.layoutService.redoLayoutCSS(1, this.layoutConfiguration, COLUMN_TYPE.threeToNine);
    } else {
      this.FIRST_TO_PANEL_LAYOUT = this.layoutService.redoLayoutCSS(0, null, COLUMN_TYPE.threeToNine);
      this.SECOND_TO_PANEL_LAYOUT = this.layoutService.redoLayoutCSS(1, null, COLUMN_TYPE.threeToNine);
    }
  }

  initLayout() {
    this.layoutConfiguration = this.layoutService.initlayoutConfig();
    this.redoLayout();
    this.layoutService.switchableLayout().
      pipe(takeUntil(this.unsubscribe$)).subscribe(layoutConfig => {
        if (layoutConfig != null) {
          this.layoutConfiguration = layoutConfig.layout;
          this.redoLayout();
        }
      });
  }

  /**
   * For get List of events
   */
  fecthAllEvents() {
    this.Filterdata = {
      "status": ["Live","Draft"],
      "objectType": "Event",
      "owner": this.userService.userid
    };

    this.eventListService.getEventList(this.Filterdata).subscribe((data: any) => {
      this.eventList = data.result?.Event;
      this.EventListCount = data.result?.count;
      this.setPage(1);
      this.eventList.forEach((item, index) => {
        var array = JSON.parse("[" + item.venue + "]");
        this.eventList[index].venue = array[0].name;
      });

      this.isLoading = false;
    }, err => { console.log("err", err); }
    )
  }


   removeAllMyContent(contentList, requestData) {
    return contentList.filter((content) => {
      return requestData.indexOf(content.identifier) === -1;
    });
  }

confirmDeleteEvent(event) {
  console.log(event,"Clicked event");
  
  this.currentEvent = event; 
  this.showCollectionLoader = false;

  const config = new TemplateModalConfig<{ data: string }, string, string>(this.modalTemplate);
  config.isClosable = false;
  config.size = 'small';
  config.transitionDuration = 0;
  config.mustScroll = true;

  this.modalService.open(config);

  setTimeout(() => {
    let element = document.getElementsByTagName('sui-modal');
    if (element && element.length > 0) {
      element[0].className = 'sb-modal';
    }
  }, 10);
}

deleteEvent(modal) {
  
  this.delete(this.currentEvent).subscribe(
    (response) => {
       this.toasterService.success('Event deleted successfully')
    },
    (error) => {
      this.toasterService.error(
            'Error deleting event'
          );
    }
  );
  modal.deny();
}

  delete(contentIds: any): Observable<ServerResponse> {
    const DeleteParam = this.currentEvent.identifier
    return this.workSpaceService.deleteEvent(DeleteParam);
  }


  /**
   * For subscibe click action on event card
   */
  navToEventDetail(event) {
    this.router.navigate(['workspace/add/event'], {
      queryParams: {
        identifier: event.identifier
      }
    });
  }

  showFilters() {
    this.eventListService.getMyEventsFilterFormConfig().subscribe((data: any) => {
      this.filterConfig = data.result['form'].data.fields;
      this.isLoading = false;

      console.log('eventfilters = ', data.result['form'].data.fields);
    },
      (err: any) => {
        console.log('err = ', err);
      });
  }

  setEventConfig() {
    this.libEventConfig = {
      context: {
        user: this.userService.userProfile,
        identifier: '',
        channel: this.userService.channel,
        authToken: '',
        sid: this.userService.sessionId,
        uid: this.userService.userid,
        additionalCategories: 'additionalCategories',
      },
      config: {
        mode: 'list'
      }
    };
  }

  getFilteredData(event) {
    if (event.search) {
      this.Filterdata = {
        "status": ["Live","Draft"],
        "objectType": "Event",
        "owner":this.userService.userid
      };
      this.query = event.target.value;
    }
    // else if ((event.filtersSelected.eventTime) && (event.filtersSelected.eventType) && (event.filtersSelected.eventStatus)) {
    //   switch (event.filtersSelected.eventTime) {
    //     case "Past":
    //       this.dates = {
    //         "max": this.todayDate
    //       }
    //       break;
    //     case "Upcoming":
    //       this.dates = {
    //         "min": this.todayDate
    //       }
    //       break;
    //     default:
    //       this.dates = {
    //         "max": this.todayDate
    //       }
    //       break;
    //   }
    //   this.Filterdata = {
    //     "status": event.filtersSelected.eventStatus,
    //     "eventType": event.filtersSelected.eventType,
    //     "startDate": this.dates,
    //     "objectType": "Event",
    //     "owner": this.userService.userid
    //   };
    // }
    // else if ((event.filtersSelected.eventTime) && (event.filtersSelected.eventType)) {
    //   switch (event.filtersSelected.eventTime) {
    //     case "Past":
    //       this.dates = {
    //         "max": this.todayDate
    //       }
    //       break;
    //     case "Upcoming":
    //       this.dates = {
    //         "min": this.todayDate
    //       }
    //       break;
    //     default:
    //       this.dates = {
    //         "max": this.todayDate
    //       }
    //       break;
    //   }
    //   this.Filterdata = {
    //     "status": [],
    //     "eventType": event.filtersSelected.eventType,
    //     "startDate": this.dates,
    //     "objectType": "Event",
    //     "owner": this.userService.userid
    //   };
    // }
    // else if ((event.filtersSelected.eventTime) && (event.filtersSelected.eventStatus)) {
    //   switch (event.filtersSelected.eventTime) {
    //     case "Past":
    //       this.dates = {
    //         "max": this.todayDate
    //       }
    //       break;
    //     case "Upcoming":
    //       this.dates = {
    //         "min": this.todayDate
    //       }
    //       break;
    //     default:
    //       this.dates = {
    //         "max": this.todayDate
    //       }
    //       break;
    //   }
    //   this.Filterdata = {
    //     "status": event.filtersSelected.eventStatus,
    //     "startDate": this.dates,
    //     "objectType": "Event",
    //     "owner": this.userService.userid
    //   };
    // }
    // else if ((event.filtersSelected.eventType) && (event.filtersSelected.eventStatus)) {
    //   this.Filterdata = {
    //     "status": event.filtersSelected.eventStatus,
    //     "eventType": event.filtersSelected.eventType,
    //     "objectType": "Event",
    //     "owner": this.userService.userid
    //   };
    // }
    // else if (event.filtersSelected.eventType) {
    //   this.Filterdata = {
    //     "status": [],
    //     "eventType": event.filtersSelected.eventType,
    //     "objectType": "Event",
    //     "owner": this.userService.userid
    //   };
    // }
    else if (event.filtersSelected.eventStatus) {
      this.Filterdata = {
        "status": event.filtersSelected.eventStatus,
        "objectType": "Event",
        "owner": this.userService.userid
      };
    }
    // else if (event.filtersSelected.eventTime) {
    //   switch (event.filtersSelected.eventTime) {
    //     case "Past":
    //       this.dates = {
    //         "max": this.todayDate
    //       }
    //       break;
    //     case "Upcoming":
    //       this.dates = {
    //         "min": this.todayDate
    //       }
    //       break;
    //     default:
    //       this.dates = {
    //         "max": this.todayDate
    //       }
    //       break;
    //   }
    //   this.Filterdata = {
    //     "status": [],
    //     "startDate": this.dates,
    //     "objectType": "Event",
    //     "owner": this.userService.userid
    //   };
    // }
    else {
      this.Filterdata = {
        "status": ["Live","Draft"],
        "objectType": "Event",
        "owner": this.userService.userid
      };
    }
    var tempEventListData: any = [];
    this.eventListService.getEventList(this.Filterdata, this.query).subscribe((data) => {
      if (data.responseCode == "OK") {
        this.isLoading = false;
        delete this.eventList;

        let tempEventList: any = data.result.Event;
        var temp1: any;
        var temp2: any;
        for (var k in tempEventList) {
          temp1 = tempEventList[k].endDate;
          temp2 = tempEventList[k].endTime;
          var tempFilterData = temp1 + " " + temp2;

          var dTime = new Date();
          var dateTime: any;
          dateTime = this.todayDate + " " + dTime.toLocaleTimeString() + "+05:30";

          if (event.filtersSelected == undefined) {
            tempEventListData = tempEventList;
          } else if (event.filtersSelected.eventTime) {
            switch (event.filtersSelected.eventTime) {
              case "Past":
                if (tempFilterData < dateTime) {
                  tempEventListData.push(tempEventList[k]);
                }
                break;

              case "Upcoming":
                var timeTemp: any = dTime.toLocaleTimeString() + "+05:30";
                if (tempEventList[k].startDate >= this.todayDate && tempEventList[k].startDate + "-" + tempEventList[k].startTime > this.todayDate + "-" + timeTemp) {
                  tempEventListData.push(tempEventList[k]);
                }
                break;

              default:
                var timeTemp: any = dTime.toLocaleTimeString() + "+05:30";
                //console.log("this.todayDate :: "+this.todayDate);
                if (tempEventList[k].endDate >= this.todayDate && tempEventList[k].startDate + "-" + tempEventList[k].startTime < this.todayDate + "-" + timeTemp
                  && tempEventList[k].endDate + "-" + tempEventList[k].endTime >= this.todayDate + "-" + timeTemp) {
                  tempEventListData.push(tempEventList[k]);
                }
                break;
            }
          } else {
            tempEventListData = tempEventList;
          }
        }

        this.EventListCount = data.result?.count;
        this.setPage(1); 
        this.eventList = tempEventListData;
        this.eventList.forEach((item, index) => {

          var array = JSON.parse("[" + item.venue + "]");
          this.eventList[index].venue = array[0].name;

        });

      }
    }, (err) => {
      this.isLoading = false;
      this.toasterService.error(err.error.result.messages[0]);

    });
  }

   setPage(page: number) {
  this.page = page;
  const startIndex = (page - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;
  this.paginatedEventList = this.eventList.slice(startIndex, endIndex);
  this.pager = this.getPager(this.EventListCount, this.page, this.itemsPerPage);
}


    getPager(totalItems: number, currentPage: number = 1, pageSize: number = 5) {
    const totalPages = Math.ceil(totalItems / pageSize);
    let startPage: number, endPage: number;

    if (totalPages <= 10) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (currentPage <= 6) {
        startPage = 1;
        endPage = 10;
      } else if (currentPage + 4 >= totalPages) {
        startPage = totalPages - 9;
        endPage = totalPages;
      } else {
        startPage = currentPage - 5;
        endPage = currentPage + 4;
      }
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

    const pages = Array.from(Array((endPage + 1) - startPage).keys()).map(i => startPage + i);

    return {
      totalItems,
      currentPage,
      pageSize,
      totalPages,
      startPage,
      endPage,
      startIndex,
      endIndex,
      pages
    };
  }

  navigateToPage(page: number) {
    if (page >= 1 && page <= this.pager.totalPages) {
      this.setPage(page);
    }
  }

  sortData(event) {
    this.sort_by = { [event.filterStatus[0].sort_by]: event.filterStatus[0].SortType ? 'desc' : 'asc' };

    this.eventListService.getEventList(this.Filterdata, '', this.sort_by).subscribe((data: any) => {
      this.eventList = data.result?.Event;
      this.EventListCount = data.result?.count;
      this.eventList.forEach((item, index) => {

        var array = JSON.parse("[" + item.venue + "]");
        this.eventList[index].venue = array[0].name;
      });

      this.isLoading = false;
    }, err => { console.log("err", err); }
    )
  }

}

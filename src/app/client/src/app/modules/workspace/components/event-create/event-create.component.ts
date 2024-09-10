import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {  UserService ,PublicDataService} from '@sunbird/core';
import * as _ from 'lodash-es';
import { EventCreateService } from 'ngtek-event-library';
import { Location } from '@angular/common';
import { NavigationHelperService, ConfigService, ToasterService, ResourceService, ServerResponse, Framework, FrameworkData,
  BrowserCacheTtlService } from '@sunbird/shared';

@Component({
  selector: 'app-event-create',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss']
})
export class EventCreateComponent implements OnInit {

  formFieldProperties: any;
  isLoading: boolean =  true;
  libEventConfig:any;
  eventId:any;
  channelFramework: any;

  constructor( 
    public location:Location,
    private eventCreateService: EventCreateService,
    private router: Router, 
    private userService:UserService,
    private activatedRoute: ActivatedRoute,
    public navigationhelperService: NavigationHelperService,
    private configService: ConfigService,
    private publicDataService: PublicDataService

 ) { }

  ngOnInit() {
    this.setEventConfig();
    
    this.showEventCreatePage();

    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.eventId = _.get(queryParams, 'identifier');
    });

  }

  showEventCreatePage() {
    this.eventCreateService.getEventFormConfig().subscribe((data: any) => {
      this.formFieldProperties = data.result['form'].data.properties;
      this.isLoading = false;
    },err=>{console.error("error", err);}
    )
  }

  routeToCreate(){
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['workspace/content/create']);
    }  
  }

  setEventConfig() {
    // this.readUserChannel();
    const channelOptions = {
      url: this.configService.urlConFig.URLS.CHANNEL.READ + '/' + this.userService.rootOrgId
    };
   this.publicDataService.get(channelOptions).subscribe((data) => {
    this.channelFramework = data.result.channel.defaultFramework

    this.libEventConfig = {
      context: {
        user:this.userService.userProfile,
        identifier: '',
        channel: this.userService.channel,
        authToken: '',
        sid: this.userService.sessionId,
        uid: this.userService.userid,
        additionalCategories: 'additionalCategories',
        framework:  this.channelFramework
      },
      config: {
        mode: 'list'
      }
    };    
  });
}
  

  cancel(event) {
    this.navigationhelperService.goBack();
  }

  navAfterSave(res) {
    this.router.navigate(['/workspace/content/create']);   
  }
}

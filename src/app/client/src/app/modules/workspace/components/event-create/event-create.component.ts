import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {  UserService } from '@sunbird/core';
import * as _ from 'lodash-es';
import { EventCreateService } from 'ngtek-event-library';
import { Location } from '@angular/common';
import { NavigationHelperService } from '@sunbird/shared';
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

  constructor( 
    public location:Location,
    private eventCreateService: EventCreateService,
    private router: Router, 
    private userService:UserService,
    private activatedRoute: ActivatedRoute,
    public navigationhelperService: NavigationHelperService
 ) { }

  ngOnInit() {
    this.setEventConfig();
    
    this.showEventCreatePage();
    console.log('libEventConfig - ', this.libEventConfig);

    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.eventId = _.get(queryParams, 'identifier');
    });

    console.log('identifier - ', this.eventId);
  }

  showEventCreatePage() {
    this.eventCreateService.getEventFormConfig().subscribe((data: any) => {
      console.log('getEventFormConfig - ', data);
      this.formFieldProperties = data.result['form'].data.properties;
      this.isLoading = false;
      console.log('formFieldProperties = ',data.result['form'].data.properties);
    },err=>{console.error("hi", err);}
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
    this.libEventConfig = {
      context: {
        user:this.userService.userProfile,
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

  cancel(event) {
    this.navigationhelperService.goBack();
  }

  navAfterSave(res) {
    this.router.navigate(['/workspace/content/create']);   
  }
}

import {Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy, AfterViewInit} from '@angular/core';
import {ResourceService, ToasterService, NavigationHelperService} from '@sunbird/shared';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {DeviceRegisterService, UserService} from '@sunbird/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash-es';
import {IImpressionEventInput, IInteractEventInput, TelemetryService} from '@sunbird/telemetry';
import {map} from 'rxjs/operators';
import {forkJoin, of} from 'rxjs';
import { PopupControlService } from '../../../../service/popup-control.service';
import { ProfileService } from './../../../../plugins/profile/services';
import userData from './../../../../users.json';

interface user {  
  id: string,  
  city: string,  
  category: string,  
  subCategory: string,
  institution: string 
}  
@Component({
  selector: 'app-learnathon-location',
  templateUrl: './learnathon-location.component.html',
  styleUrls: ['./learnathon-location.component.scss']
})
export class LearnathonLocationComponent implements OnInit, OnDestroy {

  users: user[] = userData;
  @Output() close = new EventEmitter<any>();
  // @Input() userLocationDetails: any;
  // @Input() deviceProfile: any;
  // @Input() isCustodianOrgUser: any;
  // @Input() userProfile: any;
  @ViewChild('userLocationModal') userLocationModal;
  @ViewChild('stateDiv') stateDiv;
  @ViewChild('districtDiv') districtDiv;
  @ViewChild('cityDiv') cityDiv;
  userDetailsForm: FormGroup;
  public processedDeviceLocation: any = {};
  selectedState;
  selectedDistrict;
  allStates: any;
  allDistricts: any;
  showDistrictDivLoader = false;
  sbLocationFormBuilder: FormBuilder;
  enableSubmitBtn = false;
  isDeviceProfileUpdateAllowed = false;
  isUserProfileUpdateAllowed = false;
  public suggestionType: any;
  private suggestedLocation;
  showCategoryLoader = false;
  showCityLoader = false;
  selectedCategory:any;
  allCategories:any= [
    {
      "value": "Individual",
      "label": this.resourceService.frmelmnts.lbl.learnCatIndividual
  },
  {
      "value": "Group",
      "label": this.resourceService.frmelmnts.lbl.learnCatGroup
  }
]
allSubCategories:any;
allInstitutions: any;
  constructor(public resourceService: ResourceService, public toasterService: ToasterService,
              formBuilder: FormBuilder, public profileService: ProfileService, private activatedRoute: ActivatedRoute,
              public router: Router, public userService: UserService, public deviceRegisterService: DeviceRegisterService,
              public navigationhelperService: NavigationHelperService, private telemetryService: TelemetryService,
              public popupControlService: PopupControlService) {
                console.log(this.allCategories)
    this.sbLocationFormBuilder = formBuilder;
  }

  ngOnInit() {    
    this.popupControlService.changePopupStatus(false);
    this.initializeFormFields();
   
  }
  categoryChange(event){
    this.selectedCategory = event

    if(event == 'Individual'){
      this.allSubCategories= [
      {
        "value": "Government Official",
        "label": this.resourceService.frmelmnts.lbl.learnGvtOfcl
      },
      {
        "value": "Urban Scholar",
        "label": this.resourceService.frmelmnts.lbl.learnUrbanSchlr
      }
    ]
    }else{
      this.allSubCategories= [
      {
        "value": "Cities",
        "label": this.resourceService.frmelmnts.lbl.learnCities
      },
      {
        "value": "Academia & CSOs",
        "label": this.resourceService.frmelmnts.lbl.learnAcademia
      },
      {
        "value": "Industries",
        "label": this.resourceService.frmelmnts.lbl.learnIndustries
      }
    ]
    }

  }

  initializeFormFields() {
    this.userDetailsForm = this.sbLocationFormBuilder.group({
      category: new FormControl(null),
      subcategory: new FormControl(null),
      city: new FormControl(null),
      institution: new FormControl(null)
    });
    this.enableSubmitBtn = (this.userDetailsForm.status === 'VALID');
    this.enableSubmitButton();
  }

  enableSubmitButton() {
    this.userDetailsForm.valueChanges.subscribe(val => {
      this.enableSubmitBtn = (this.userDetailsForm.status === 'VALID');
    });
  }

  closeModal() {
    this.popupControlService.changePopupStatus(true);
    this.userLocationModal.deny();
    this.close.emit();
  }

  updateUserLocation(event) {
    console.log("userDetailsForm--", this.userDetailsForm.value)
    // this.userDetailsForm.value["id"] = this.userProfile.userid
    localStorage.setItem('learnathonUserDetails', JSON.stringify(this.userDetailsForm.value));
    this.users.push(this.userDetailsForm.value)
    console.log("userData---", this.users)
    const request = {
      'category': this.userDetailsForm.value.category,
      'city': this.userDetailsForm.value.city,
      'institution': this.userDetailsForm.value.institution,
      'subcategory': this.userDetailsForm.value.subcategory, 
    };
  
  this.profileService.updateProfile(request).subscribe((data) => {
    console.log("res====",data)
    this.closeModal();

  }, (error) => {
   console.log("err====",error)
  });
   
  }



  ngOnDestroy(): void {
    this.popupControlService.changePopupStatus(true);
  }

}

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
  @Input() deviceProfile: any;
  @Input() isCustodianOrgUser: any;
  @Input() userProfile: any;
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
  sbFormBuilder: FormBuilder;
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
        "label": "Individual"
    },
    {
        "value": "Group",
        "label": "Group"
    }
]
allSubCategories:any;
allCities: any =[
  {
      "value": "Mumbai",
      "label": "Mumbai"
  },
  {
      "value": "Pune",
      "label": "Pune"
  },{
    "value": "Dilhi",
    "label": "Dilhi"
},{
  "value": "Banglore",
  "label": "Banglore"
}
]

allInstitutions: any;
  constructor(public resourceService: ResourceService, public toasterService: ToasterService,
              formBuilder: FormBuilder, public profileService: ProfileService, private activatedRoute: ActivatedRoute,
              public router: Router, public userService: UserService, public deviceRegisterService: DeviceRegisterService,
              public navigationhelperService: NavigationHelperService, private telemetryService: TelemetryService,
              public popupControlService: PopupControlService) {
    this.sbFormBuilder = formBuilder;
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
            "label": "Government Official"
        },
        {
            "value": "Urban Scholar",
            "label": "Urban Scholar"
        }
    ]
    }else{
      this.allSubCategories= [
        {
            "value": "Cities",
            "label": "Cities"
        },
        {
            "value": "Academia & CSOs",
            "label": "Academia & CSOs"
        },
        {
            "value": "Industries",
            "label": "Industries"
        }
    ]
    }

  }

  initializeFormFields() {
    this.userDetailsForm = this.sbFormBuilder.group({
      category: new FormControl(null),
      subcategory: new FormControl(null),
      city: new FormControl(null),
      institution: new FormControl(null)
    });
    this.enableSubmitBtn = (this.userDetailsForm.status === 'VALID');
    this.enableSubmitButton();
  }

  enableSubmitButton() {
    // console.log("this.userProfile",this.userProfile)
    // console.log("this.userService.userProfile",this.userService.userid)
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
    this.userDetailsForm.value["id"] = this.userProfile.userid
    localStorage.setItem('learnathonUserDetails', JSON.stringify(this.userDetailsForm.value));
    this.users.push(this.userDetailsForm.value)
    console.log("userData---", this.users)
    const request = {
    //   "framework": {
    //     "board": [
    //         "Environment and Climate"
    //     ],
    //     "medium": [
    //         "Affordable Housing"
    //     ],
    //     "gradeLevel": [
    //         "Solutions Hackathon"
    //     ],
    //     "id": "nulplearnathon"
    // },
      'category': this.userDetailsForm.value.category,
      'city': this.userDetailsForm.value.city,
      'institution': this.userDetailsForm.value.institution,
      'subcategory': this.userDetailsForm.value.subcategory,
      // 'userName': 
    };
  
  this.profileService.updateProfile(request).subscribe((data) => {
    console.log("res====",data)
    this.closeModal();

  }, (error) => {
   console.log("err====",error)
  });
    // const locationCodes = [];
    // const locationDetails: any = {};
    // if (this.userDetailsForm.value.state) {
    //   locationCodes.push(this.userDetailsForm.value.state);
    //   locationDetails.stateCode = this.userDetailsForm.value.state;
    // }
    // if (this.userDetailsForm.value.district) {
    //   locationCodes.push(this.userDetailsForm.value.district);
    //   locationDetails.districtCode = this.userDetailsForm.value.district;
    // }
    // const data = {profileLocation: locationCodes};
    // let districtData, stateData, changeType = '';
    // if (locationDetails.stateCode) {
    //   stateData = _.find(this.allStates, (states) => {
    //     return states.code === locationDetails.stateCode;
    //   });
    // }
    // if (locationDetails.districtCode) {
    //   districtData = _.find(this.allDistricts, (districts) => {
    //     return districts.code === locationDetails.districtCode;
    //   });
    // }
    // if (stateData.name !== _.get(this.suggestedLocation, 'state.name')) {
    //   changeType = changeType + 'state-changed';
    // }
    // if (districtData.name !== _.get(this.suggestedLocation, 'district.name')) {
    //   if (_.includes(changeType, 'state-changed')) {
    //     changeType = 'state-dist-changed';
    //   } else {
    //     changeType = changeType + 'dist-changed';
    //   }
    // }
    // const telemetryData = this.getTelemetryData(changeType);
    // this.generateInteractEvent(telemetryData);
    // this.updateLocation(data, {state: stateData, district: districtData});
  }

  getTelemetryData(changeType) {
    return {
      locationIntractEdata: {
        id: 'submit-clicked',
        type: changeType ? 'location-changed' : 'location-unchanged',
        subtype: changeType
      },
      telemetryCdata: [
        {id: 'user:state:districtConfimation', type: 'Feature'},
        {id: 'SC-1373', type: 'Task'}
      ]
    };
  }

  private generateInteractEvent(telemetryData) {
    const intractEdata = telemetryData.locationIntractEdata;
    const telemetryInteractCdata = telemetryData.telemetryCdata;
    if (intractEdata) {
      const appTelemetryInteractData: IInteractEventInput = {
        context: {
          env: 'user-location',
          cdata: [
            {id: 'user:state:districtConfimation', type: 'Feature'},
            {id: 'SC-1373', type: 'Task'}
          ],
        },
        edata: intractEdata
      };
      if (telemetryInteractCdata) {
        appTelemetryInteractData.object = telemetryInteractCdata;
      }
      this.telemetryService.interact(appTelemetryInteractData);
    }
  }

  updateLocation(data, locationDetails) {
    this.enableSubmitBtn = false;
    let response1: any;
    response1 = this.updateDeviceProfileData(data, locationDetails);
    const response2 = this.updateUserProfileData(data);
    forkJoin([response1, response2]).subscribe((res) => {
      if (!_.isEmpty(res[0])) {
        this.telemetryLogEvents('Device Profile', true);
      }
      if (!_.isEmpty(res[1])) {
        this.telemetryLogEvents('User Profile', true);
      }
      this.closeModal();
    }, (err) => {
      if (!_.isEmpty(err[0])) {
        this.telemetryLogEvents('Device Profile', false);
      }
      if (!_.isEmpty(err[1])) {
        this.telemetryLogEvents('User Profile', false);
      }
      this.closeModal();
    });
  }

  updateDeviceProfileData(data, locationDetails) {
    if (!this.isDeviceProfileUpdateAllowed) {
      return of({});
    }
    return this.deviceRegisterService.updateDeviceProfile({
      state: _.get(locationDetails, 'state.name'),
      district: _.get(locationDetails, 'district.name')
    });
  }

  updateUserProfileData(data) {
    if (!this.isUserProfileUpdateAllowed || !this.isCustodianOrgUser) {
      return of({});
    }
    return this.profileService.updateProfile(data);
  }

  telemetryLogEvents(locationType: any, status: boolean) {
    let level = 'ERROR';
    let msg = 'Updation of ' + locationType + ' failed';
    if (status) {
      level = 'SUCCESS';
      msg = 'Updation of ' + locationType + ' success';
    }
    const event = {
      context: {
        env: 'portal'
      },
      edata: {
        type: 'update-location',
        level: level,
        message: msg
      }
    };
    this.telemetryService.log(event);
  }

  ngOnDestroy(): void {
    this.popupControlService.changePopupStatus(true);
  }

}

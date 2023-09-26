import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ResourceService } from './../../../shared/services/resource/resource.service';
import { AddusserService } from '../../services/addusser/addusser.service';
import { ValidationserviceService } from './../../../shared/regex/validationservice.service';
import { ToasterService } from './../../../shared/services/toaster/toaster.service';
import {LayoutService } from '@sunbird/shared';

import { ServerResponse } from './../../../shared/interfaces/serverResponse';
import { UserSearchService } from '../../../search/services';
import { UserService } from '../../../core/services/user/user.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-addusers',
  templateUrl: './addusers.component.html',
  styleUrls: ['./addusers.component.scss']
})
export class AddusersComponent implements OnInit {

  private unsubscribe$ = new Subject<void>();
  constructor(
    private activatedRoute: ActivatedRoute,
    private _validation:ValidationserviceService,
    private _httpService: AddusserService,
    public userService: UserService ,
    userSearchService: UserSearchService,
    toasterService: ToasterService,
    resourceService: ResourceService,
    private layoutService: LayoutService
  ) {

    this.resourceService = resourceService;
    this.userId = this.userService.userid;
    this.userSearchService = userSearchService;
    this.toasterService = toasterService;


    this.orgStatus = [{
      "status": "Active",
      "value": 1
    }, {
      "status": "Inactive",
      "value": 0
    }];
  }
  orgStat: number;
  orgDataId: string;
  countOrgRecord: any;
  systemVar: string;
  cols: any[];
  showOrgData: any[] = new Array();
  getAllOrgData:any[] = new Array();
  orgListArr: any = new Array()
  addRootOrgrPopup: boolean = false;
  addOrgrPopup: boolean = false;
  editOrgrPopup: boolean = false;
  editOrgrStatusPopup: boolean= false;
  sucesErrorPopup: boolean = false;
  userLoginDataChannel: any = null;
  userLoginData: any;
  rootOrgId: any;
  organisationId: any;
  randomNumber: number;
  colsUser: any[];
  userTab: boolean = false;
  getData: { getOrgName: any; };
  orgStatusVal: any;
  subOrgSucesErrorPopup: boolean = false;
  username: string

  createRootOrgForm: FormGroup;
  createOrgForm: FormGroup;
  editOrgForm: FormGroup;
  editStatusForm: FormGroup;
  createUserForm: FormGroup;
  editUserForm: FormGroup;
  addRoleForm: FormGroup;
  addOrgForm: FormGroup;
  confirmUserForm: FormGroup;
  genericForm: FormGroup

  rootOrgIdOrg: any;
  selectedRootOrgOption:any="";
  orgStatusValOrg:any='';
  getOrgName: any;
  getdescription: any;
  orgStatus: any = [];
  checkOrgExistsPopup: boolean;
  popupMsg: any;
  showLoader = true;
  checkRootOrg: boolean;
  userId: string;
  orgDataRole: any;
  subOrgName: any;
  rootOrgIdOrgName: any;
  showError = false;
  orgData: any;
  orgDatalength: any;
  orgSearchData: any;
  orgTypelListOrg: any[];
  orgTypeOrgArry: any;
  orgTypeListOrgArryData: any[] = new Array();
  orgTypeUser: any;
  orgTypelListUser: any[];
  orgTypelListUserArry: any;
  orgTypeListUserArryData: any[] = new Array();
  channelListOrg: any[];
  channelListOrgArry: any;
  channelListOrgArryData: any[] = new Array();
  statusListOrg: any[];
  statuslistArryOrg: any;
  statuslistArryDataOrg: any[] = new Array();
  orgListOrg: any[];
  orgListDataOrg: any[] = new Array();
  orgListArryOrg: any;
  status: string;
  orgType: string;
  result: number = 0;
  rootOrgName: any= null;
  rootOrgIdCreate: any;
  onchangeorgName: any;
  onchangeorgId: any;
  channel: any;
  organizationTab: boolean  = false;
  UploadTemplate:boolean  = false;
  isrootOrganization: string;
  orgList: any[];
  orgListData: any[] = new Array();
  orgListArry: any;
  countUserRecord: any;
  userData: any = new Array()
  showUserData: any[] = new Array();
  statuslistArryData: any[] = new Array();
  orgNameUser: any;
  userOrgLength: any;
  statusList: any[];
  statuslistArry: any;
  getOrgData: any= null;
  selectedItems = [];
  dropdownList = [];
  dropdownSettings = {};
  filteredValuesLength: any;
  roleEditData: any = new Array()
  addRoleorgId='';
  roleEditeUserData: any;
  gridUserId: any;
  addRolePopup: boolean = false;
  gridOrgUserId: any;
  orgEditeUserData: any;
  addorgSelectName: string;
  addOrgPopup: boolean = false;
  public getOrgMentorList: Array<any> = [];
  isRootSubCondition: any;
  removeOrgFormId: any;
  removeOrgUserId: any;
  emoveOrgUserdataAll: any;
  removeOrgUserdataAll: any;
  genericPopup: boolean = false;
  blockUserid: any;
  blockId: any;
  confirmPopup: boolean = false;
  confirmPopupMsg: string;
  addUserPopup: boolean = false;
  subOrgofRoot: boolean = false;
  public subMentorList: Array<any> = [];
  strOrgname: any;
  editeUserPopup: boolean = false;
  findePublic: boolean = false;
  roleDataArr: any = new Array()
  orgId: any;
  onchangeChanelName: any;
  createUserId: any;
  orgRootStatus: void;
  onchangeaddOrgId: any;
  onchangeaddOrgName: any;
  addOrgId: any;
  recordIndex: number
  usersUpload:boolean = false
  layoutConfiguration: any;


  public mentorList: Array<any> = [];

  /**
   * To call resource service which helps to use language constant
   */
   public resourceService: ResourceService;


  /**
   * To show toaster(error, success etc) after any API calls
   */
  private toasterService: ToasterService;

  /**
 * To get user profile of logged-in user
 */

  private userSearchService: UserSearchService;

  ngOnInit(): void {
    this.createUserForm = new FormGroup({
      firstname:  new FormControl("",  [Validators.required,Validators.pattern(this._validation.alphanumericspaceRegex)]),
      lastname: new FormControl("",  [Validators.pattern(this._validation.alphanumericspaceRegex)]),
      emailid: new FormControl("",  [Validators.required,Validators.pattern(this._validation.emailRegex)]),
      phone: new FormControl("",  [Validators.required,Validators.pattern(this._validation.mobileno)]),
      isrootSub:new FormControl(null),
      subRootorgname:new FormControl(null),
      orgname: new FormControl(null,Validators.required),
      role:new FormControl(null),
     })

    this.createOrgForm = new FormGroup({
      rootOrgName: new FormControl(null,Validators.required),
      orgName: new FormControl(null, [Validators.required,Validators.pattern(this._validation.alphanumericspaceRegex)]),
      description: new FormControl(null,  [Validators.required,Validators.pattern(this._validation.alphanumericspaceRegex)]),
    })


    this.createRootOrgForm = new FormGroup({
      orgName: new FormControl(null, [Validators.required,Validators.pattern(this._validation.alphanumericspaceRegex)]),
      description: new FormControl(null, [Validators.required,Validators.pattern(this._validation.alphanumericspaceRegex)]),
    })

    this.editOrgForm = new FormGroup({
      orgName: new FormControl(this.getOrgName,[Validators.required,Validators.pattern(this._validation.alphanumericspaceRegex)]),
      description: new FormControl(this.getdescription,[Validators.required,Validators.pattern(this._validation.alphanumericspaceRegex)]),
    })

    this.editStatusForm = new FormGroup({
      orgStatus: new FormControl('',Validators.required)
    })

    this.genericForm = new FormGroup({
      genericId: new FormControl(null),
      genericUserId: new FormControl(null),
    })

    this.editUserForm = new FormGroup({
      editfirstname: new FormControl(null,Validators.required),
      editlastname: new FormControl(null,Validators.required),
      editemailid: new FormControl(null,Validators.required),
      edituserid: new FormControl(null),
      editphone: new FormControl(null),
      // editorgname: new FormControl(null),
      // editrole: new FormControl(null),
     })

    this.addRoleForm = new FormGroup({
      addrole: new FormControl(null),
      editroleorgid: new FormControl(null),
      gridUserId: new FormControl(null),
    })

    this.addOrgForm = new FormGroup({
      addOrgname: new FormControl(null, Validators.required),
      addOrgrole: new FormControl(null, Validators.required),
      gridOrgUserId: new FormControl(null),
    })

    this.confirmUserForm = new FormGroup({
      blockUserid: new FormControl(null),
      blockid: new FormControl(null),
    })

    this.selectedItems = [
      { "id": 1, "itemName": "PUBLIC" }
    ];
    this.dropdownList = [
      { "id": 1, "itemName": "PUBLIC" },
    ];
    this.dropdownSettings = {
      text: "Select Role",
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      classes: "myclass custom-class",
      primaryKey: "id",
      enableSearchFilter: false,
      labelKey: 'itemName',
      badgeShowLimit: 5
    };

    this.selectedItems = [
      { "id": 1, "itemName": "PUBLIC" }
    ];

    this.populateUserProfile()
    this.initializeColumns();
    this.initializeColumnsOrg();
    this.getUserProfileOrg()
    this.getOrgDataUser()
    this.initLayout()
  }

  initLayout() {
    this.layoutConfiguration = this.layoutService.initlayoutConfig();
    this.layoutService.switchableLayout().pipe(takeUntil(this.unsubscribe$)).subscribe(layoutConfig => {
      if (layoutConfig != null) {
        this.layoutConfiguration = layoutConfig.layout;
      }
    });
  }

  initializeColumns() {
    this.colsUser = [
      { field: 'orgName', header: 'Organization', width: '168px' },
      // { field: 'orgType', header: 'Organization Type', width: '150px' },
      { field: 'firstName', header: ' First Name', width: '150px' },
      { field: 'lastName', header: 'Last Name', width: '128px' },
      { field: 'email', header: 'Email', width: '233px' },
      { field: 'phone', header: 'Mobile', width: '101px' },
      { field: 'status', header: 'Status', width: '95px' },
    ]
  }

  onFilter(event) {
    this.countUserRecord = event.filteredValue.length;
  }

  onItemSelect(item: any) {
  }
  OnItemDeSelect(item: any) {
  }
  onSelectAll(items: any) {
  }
  onDeSelectAll(items: any) {
  }

  getOrgDataUser() {
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
        this.getAllOrgData.push({ "orgName": element.orgName, "identifier": element.identifier })

      });
    }, err => {
      // this.popupMsg=err.params.errmsg;
    });
  }

  /**
   * This method fetches the user data
   */
  populateUserProfile() {
    this.showLoader = true;
    const option = { userId: this.userId };
    this.userSearchService.getUserById(option).subscribe(
      (apiResponse: ServerResponse) => {
        this.userLoginData = apiResponse.result.response;
        this.userLoginDataChannel = apiResponse.result.response.channel;
        this.orgData = apiResponse.result.response.organisations;
        sessionStorage.setItem("orgDatalength", this.orgData.length);
        sessionStorage.setItem("userLoginDataChannel", this.userLoginDataChannel);
        //Organization tab is visible for system admin and Root Admin
          this.orgDataRole = this.userLoginData.roles.map(obj => obj.role)
          if (this.orgDataRole.includes("ORG_ADMIN") || this.orgDataRole.includes("SYSTEM_ADMINISTRATION")) {
            this.userTab = true;
            this.UploadTemplate = true;
            this.usersUpload = true
            if (this.orgData.length == 1) {
              this.organizationTab = true;
            }
          }
          else {
            if (this.orgDataRole.includes("ORG_MANAGEMENT")) {
              this.organizationTab = true;
              this.UploadTemplate = true;
            }
            if (this.orgDataRole.includes("ORG_MODERATOR")) {
              this.userTab = true;
              this.UploadTemplate = true;
            }
          }


          if (this.orgData.length == 1) {
            this.checkRootOrg = true;
            for (var k = 0; k < this.orgDataRole.length; k++) {
              if (this.orgDataRole[k] == "SYSTEM_ADMINISTRATION") {
                this.systemVar = 'present';
                this.isrootOrganization = 'yes'
              }
              else {
                this.systemVar = 'notpresent';
              }
            }
            this.getOrgList(this.systemVar)
          }
          else if (this.orgData.length == 2) {
            this.systemVar = 'notpresent';
            // this.subOrgName = this.orgData[1].orgName;
            //  sessionStorage.setItem("subOrgName", this.subOrgName);
            this.organisationId = this.orgData[1].organisationId;
            if (this.mentorList.length == 0) {
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
                res.result.response.content.forEach(element2 => {
                  if (element2.identifier == this.orgData[1].organisationId) {
                    this.subOrgName = element2.orgName


                  }

                });


                if (this.mentorList.length == 0) {
                  sessionStorage.setItem("subOrgName", this.subOrgName);
                  sessionStorage.setItem("subOrgName", this.subOrgName);
                  this.mentorList.push({ 'id': this.organisationId, 'orgName': this.subOrgName, channel: this.userLoginDataChannel, 'isRootOrg': false })
                }
              }, err => {
                // this.popupMsg=err.params.errmsg;
              });
            }
            this.checkRootOrg = false;
          }

        this.populateUserSearch(this.userLoginDataChannel, this.organisationId, this.systemVar);
      },
      err => {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
        this.showLoader = false;
        this.showError = true;
      }
    );
  }

  populateUserSearch(userLoginDataChannel, organisationId, systemVar) {
    //sessionStorage.setItem("orgDatalength", this.orgData.length);
    this.orgDatalength = sessionStorage.getItem("orgDatalength")
    this.subOrgName = sessionStorage.getItem("subOrgName")
    let tempArray: any
    if (this.orgDatalength == 1) {
      if (systemVar == 'present') {
        tempArray = {
          'request': {
            'query': '',
            'filters': {

            },
            'limit': 3000
          }
        }
      }
      if (systemVar == 'notpresent') {

        tempArray = {
          'request': {
            'query': '',
            'filters': {
              "channel": userLoginDataChannel
            },
            'limit': 1000
          }
        }
      }

    }
    else if (this.orgDatalength == 2) {

      tempArray = {
        'request': {
          'query': organisationId,
          'filters': {
          },
          'limit': 1000
        }
      }

    }
    // this.showUserData = [];
    // this.orgName ="";
    // this.orgNameUser ="";
    this._httpService.userSearch(tempArray).subscribe(res => {
      this.countUserRecord = res.result.response.count;
      // this.userData = res.result.response['content'];
      this.userData = res.result.response.content;

      this.showUserData = [];
      this.statuslistArryData = [];
      this.orgListData = [];
      // this.orgNameUser ="";
      res.result.response.content.forEach(element => {
        // if(element.eNqFlage){
        //this.userOrgLength=element.organisations.length;



        if (element.status == 1) {
          this.status = 'Active';
        }
        else if (element.status == 0) {
          this.status = 'Inactive';
        }


        /// this.orgIdUser = element.organisations[1].organisationId

        if (this.orgDatalength == 1) {
          this.userOrgLength = element.organisations.length;
          this.getAllOrgData.forEach(element1 => {

            // debugger
            if (element.organisations.length > 1) {
              if ((element1.identifier == element.organisations[1].organisationId) && (element.rootOrgId != element.organisations[1].organisationId)) {
                this.orgNameUser = element1.orgName
                this.orgTypeUser = 'Sub Organization';
              }
              else if (element.rootOrgId == element.organisations[1].organisationId) {
                this.orgNameUser = element.organisations[0].orgName;
                this.orgTypeUser = 'Sub Organization';
              }

            }
          });

          if (element.organisations.length == 1) {
            this.orgNameUser = element.organisations[0].orgName;
            this.orgTypeUser = 'Root  Organization';
          }
        }
        else if (element.organisations.length > 1) {
          this.orgNameUser = this.subOrgName;
          this.orgTypeUser = 'Sub Organization';
        }


        if (element.firstName == 'Medical') {
        }
        this.showUserData.push({ "orgType": this.orgTypeUser, "userId": element.id, "uStatus": element.status, "createdDate": element.createdDate, "firstName": element.firstName, "lastName": element.lastName, "email": element.email, "phone": element.phone, "orgLength": element.organisations.length, "orgName": this.orgNameUser, "status": this.status, "userOrglengths": this.userOrgLength, "userName": element.userName })
        // this.showUserData.push({"userId":element.id,"uStatus":element.status,"firstName": element.firstName,"lastName":element.lastName,"email":element.email,"phone":element.phone,"orgLength":  element.organisations.length,"orgName":this.orgName})


      });


      this.showUserData = this.showUserData.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())



      this.orgTypelListUser = this.showUserData
        .map(item => item.orgType)
        .filter((value, index, self) => self.indexOf(value) === index)
      this.orgTypelListUserArry = this.orgTypelListUser.filter(f => f !== undefined && f !== null) as any;
      this.orgTypelListUserArry.forEach(element => {
        this.orgTypeListUserArryData.push({ "label": element, "value": element })
      });

      this.statusList = this.showUserData
        .map(item => item.status)
        .filter((value, index, self) => self.indexOf(value) === index)
      this.statuslistArry = this.statusList.filter(f => f !== undefined && f !== null) as any;
      this.statuslistArry.forEach(element => {
        this.statuslistArryData.push({ "label": element, "value": element })
      });


      this.orgList = this.showUserData
        .map(item => item.orgName)
        .filter((value, index, self) => self.indexOf(value) === index)
      this.orgListArry = this.orgList.filter(f => f !== undefined && f !== null) as any;
      this.orgListArry.forEach(element => {
        this.orgListData.push({ "label": element, "value": element })
      });




    });
  }

  showRootOrg(){
    this.addRootOrgrPopup=true
    this.addOrgrPopup=false
    this.editOrgrPopup=false
    this.editOrgrStatusPopup=false
  }

  showOrg(){
    this.addOrgrPopup=true
    this.editOrgrPopup=false
    this.editOrgrStatusPopup=false
    this.addRootOrgrPopup=false
  }

  onFilterOrg(event) {
    this.countOrgRecord = event.filteredValue.length;
  }

  initializeColumnsOrg()
  {
    this.cols = [
      { field: 'orgName', header: 'Organization', width: '170px' },
      { field: 'orgType', header: 'Organization Type', width: '183px' },
      { field: 'description', header: 'Description', width: '170px' },
      { field: 'channel', header: 'Channel', width: '170px' },
      { field: 'status', header: 'Status', width: '170px' },
    ]
  }

  editOrg(orgDataId){
    this.editOrgrPopup=true
    this.addRootOrgrPopup=false
    this.addOrgrPopup=false
    this.editOrgrStatusPopup=false
    sessionStorage.setItem("orgDataId", orgDataId);
    this.readOrgData(orgDataId)
  }

  readOrgData(OrgId) {
    let tempArray: any;
    tempArray = {
      "request": {
        "organisationId": OrgId
      }
    }

    this._httpService.getorgData(tempArray).subscribe(res => {
      this.getOrgData = res.result.response;
      this.getOrgName = this.getOrgData.orgName;
      this.getdescription = this.getOrgData.description;
      this.orgStatusVal = this.getOrgData.status;
      this.orgStatusValOrg = this.getOrgData.status;
      this.getData = { 'getOrgName': this.getOrgName }
    });
  }

  editStatusOrg(orgDataId){
    this.editOrgrStatusPopup=true
    sessionStorage.setItem("orgDataId", orgDataId);
    this.readOrgData(orgDataId)
  }

  createOrgFormSubmit(){
    {
      let tempArray1: any;
      tempArray1 = {
        'request': {
          'query': '',
          'filters': {
            "orgName": this.createOrgForm.value['orgName']
          }
        }
      }
      this._httpService.orgSearch(tempArray1).subscribe(res => {
        this.countOrgRecord = res.result.response.count;
        if (this.countOrgRecord > 0) {
          this.checkOrgExistsPopup = true;

        }

        else if (this.countOrgRecord == 0) {
          this.checkOrgExistsPopup = false;

          this.userLoginDataChannel = sessionStorage.getItem("userLoginDataChannel")
          this.rootOrgId = sessionStorage.getItem("rootOrgId")
          if (this.systemVar == 'present') {
            //alert('first');
            this.onchangeorgName = this.createOrgForm.value['rootOrgName'].split("/");
            this.onchangeorgId = this.onchangeorgName[1]
            this.onchangeorgId = this.onchangeorgId
            this.channel = this.onchangeorgName[3]
          }
          else {
            //alert('second');
            this.onchangeorgId = this.rootOrgId
            this.channel = this.userLoginDataChannel
          }

          let tempArray: any
          tempArray =
          {
            "request": {
              "orgName": this.createOrgForm.value['orgName'],
              "description": this.createOrgForm.value['description'],
              "isRootOrg": false,
              "rootOrgId": this.onchangeorgId,
              "channel": this.channel,
              "organisationType": "school",
              "isTenant": false,
            }

          }
          this._httpService.createOrgDetailSave(tempArray).subscribe(res => {
            this.editOrgrPopup = false
            this.addRootOrgrPopup = false
            this.addOrgrPopup = false
            this.editOrgrStatusPopup = false
            this.sucesErrorPopup = true
            this.popupMsg = "Sub Organization created successfully!";

            this.getUserProfileOrg()

          }, err => {
            this.popupMsg = err.error.params.errmsg;
          })

        }
      }, err => {
      })
    }
  }

  createRootOrgFormSubmit(){
    let tempArray1: any
    tempArray1 = {
      'request': {
        'query': '',
        'filters': {
          "orgName": this.createRootOrgForm.value['orgName']
        }
      }
    }
    this._httpService.orgSearch(tempArray1).subscribe(res => {
      this.countOrgRecord = res.result.response.count;
      if (this.countOrgRecord > 0) {
        this.checkOrgExistsPopup = true;

      }
      else if (this.countOrgRecord == 0) {
        this.checkOrgExistsPopup = false;


        this.userLoginDataChannel = sessionStorage.getItem("userLoginDataChannel")
        this.rootOrgId = sessionStorage.getItem("rootOrgId")
        this.randomNumber = Math.floor(Math.random() * 90000) + 10000
        //this.checkOrgExists(this.createRootOrgForm.value['orgName']);

        let tempArray: any
        tempArray =
        {
          "request": {
            "orgName": this.createRootOrgForm.value['orgName'],
            "description": this.createRootOrgForm.value['description'],
            "isRootOrg": true,
            "channel": 'channel_' + this.randomNumber,
            "organisationType": "school",
            "isTenant": true
          }

        }
        this._httpService.createRootOrgDetailSave(tempArray).subscribe(res => {
          this.updatePatch(res.result['organisationId'])
          this.contentPublishFormData(res.result['organisationId'])
          this.contentPublishFormData(res.result['organisationId'])
          this.contentRejectFormData(res.result['organisationId'])
          this.collectionPublishFormData(res.result['organisationId'])
          this.requestChangeFormCollectionData(res.result['organisationId'])
          this.collectionReviewFormData(res.result['organisationId'])
          this.collectionResourceFilterFormData(res.result['organisationId'])
          this.collectionCreateFormData(res.result['organisationId'])
          this.collectionSaveFormData(res.result['organisationId'])
          this.lessonPublishFormData(res.result['organisationId'])
          this.requestChangeFormLessonPlamData(res.result['organisationId'])
          this.lessonPlanSaveData(res.result['organisationId'])
          this.lessonPlanResourceFilterFormData(res.result['organisationId'])
          this.lessonPlanReviewFormData(res.result['organisationId'])
          this.lessonPlanCreateFormData(res.result['organisationId'])
          this.publishFormResourceData(res.result['organisationId'])
          this.userPrefrenceFormData(res.result['organisationId'])
          this.requestChangeFormResourceData(res.result['organisationId'])
          this.resourceCreateFormData(res.result['organisationId'])
          this.resourceSaveFormData(res.result['organisationId'])
          this.resourceReviewFormData(res.result['organisationId'])
          this.courseRejectCopyFormData(res.result['organisationId'])
          this.publishFormCourseData(res.result['organisationId'])
          this.courseCreateFormData(res.result['organisationId'])
          this.courseSaveFormData(res.result['organisationId'])
          this.courseUnitSaveFormData(res.result['organisationId'])
          this.courseReviewFormData(res.result['organisationId'])
          this.courseResourceFilterFormData(res.result['organisationId'])
          this.courseFilterFormData(res.result['organisationId'])
          this.questionMetaSearchFormData(res.result['organisationId'])
          this.questionFilterFormData(res.result['organisationId'])
          this.almyContentSearchFormData(res.result['organisationId'])
          this.exploreSearchFormData(res.result['organisationId'])
          this.exploreCourseFilterFormData(res.result['organisationId'])
          this.exploreCourseSearchFormData(res.result['organisationId'])
          this.librarySearchFormData(res.result['organisationId'])
          this.createPreference(res.result['organisationId'])

          this.editOrgrPopup = false
          this.addRootOrgrPopup = false
          this.addOrgrPopup = false
          this.editOrgrStatusPopup = false
          this.sucesErrorPopup = true
          this.popupMsg = 'Root Organization created successfully!';
          this.getUserProfileOrg()
          // location.reload()
        }, err => {
          this.popupMsg = err.error.params.errmsg;
          this.toasterService.error(this.resourceService.messages.emsg.m0005);
        })

      }
    }, err => {
    })
  }


  getUserProfileOrg() {
    this.showLoader = true;
    const option = { userId: this.userId };
    this.userSearchService.getUserById(option).subscribe(
      (apiResponse: ServerResponse) => {
        this.userLoginData = apiResponse.result.response;
        this.userLoginDataChannel = apiResponse.result.response.channel;
        this.rootOrgId = apiResponse.result.response.rootOrgId;
        this.orgData = apiResponse.result.response.organisations;
        this.orgDatalength = this.orgData.length;
        this.mentorList = [];
        for (var i = 0; i < this.orgData.length; i++) {
          this.orgDataRole = this.userLoginData.roles.map(obj => obj.role)
          if (this.orgData.length == 1) {
            this.checkRootOrg = true;
            // new code start heree
            for (var k = 0; k < this.orgDataRole.length; k++) {
              if (this.orgDataRole[k] == "SYSTEM_ADMINISTRATION") {
                this.systemVar = 'present';
              }
              else {
                this.systemVar = 'notpresent';
              }
            }
            if (this.systemVar == 'present') {

              this.getOrgList(this.systemVar)
            }
            if (this.systemVar == 'notpresent') {
              this.rootOrgIdOrg = this.orgData[0].organisationId
              this.rootOrgIdOrgName = this.orgData[0].orgName
              //this.mentorList.push( {'id' :this.orgData[0].organisationId,'orgName': this.orgData[0].orgName})
            }
          }
          else if (this.orgData.length == 2) {
            this.subOrgName = this.orgData[1].orgName;
            sessionStorage.setItem("subOrgName", this.subOrgName);
            this.organisationId = this.orgData[1].organisationId;
            this.checkRootOrg = false;
          }
        }

        sessionStorage.setItem("userLoginDataChannel", this.userLoginDataChannel);
        sessionStorage.setItem("rootOrgId", this.rootOrgId);
        this.getUserOrganization(this.systemVar)
      },
      err => {
        this.toasterService.error(this.resourceService.messages.emsg.m0005);
        this.showLoader = false;
        this.showError = true;
      }
    );
  }

  getUserOrganization(checkSystemAdmin: any) {
    this.userLoginDataChannel = sessionStorage.getItem("userLoginDataChannel")
    let tempArray: any;
    if (checkSystemAdmin == 'present') {
      tempArray = {
        'request': {
          'query': '',
          'filters': {
          },
          'sort_by': { 'createdDate': 'desc' }
        }
      }
    }
    if (checkSystemAdmin == 'notpresent') {
      tempArray = {
        'request': {
          'query': '',
          'filters': {
            "channel": this.userLoginDataChannel
          },
          'sort_by': { 'createdDate': 'desc' }
        }
      }
    }
    this._httpService.orgSearch(tempArray).subscribe(res => {
      this.orgSearchData = res.result.response.content;
      this.countOrgRecord = res.result.response.count;

      this.showOrgData = [];

      this.channelListOrgArryData = [];
      this.statuslistArryDataOrg = [];
      this.orgListDataOrg = [];
      this.orgTypeListOrgArryData = [];

      this.result = 0;
      res.result.response.content.forEach(element => {

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
          // this.showOrgData1.push({"orgType":this.orgType,"id": element.id,"orgName": element.orgName,"description":element.description,"channel":element.channel,"status":this.status})
        }
        else if (!element.isRootOrg) {
          // this.showOrgData2.push({"orgType":this.orgType,"id": element.id,"orgName": element.orgName,"description":element.description,"channel":element.channel,"status":this.status})
        }
        this.showOrgData.push({ "orgType": this.orgType, "id": element.id, "orgName": element.orgName, "description": element.description, "channel": element.channel, "status": this.status })
      });

      this.orgTypelListOrg = this.showOrgData
        .map(item => item.orgType)
        .filter((value, index, self) => self.indexOf(value) === index)
      this.orgTypeOrgArry = this.orgTypelListOrg.filter(f => f !== undefined && f !== null) as any;
      this.orgTypeOrgArry.forEach(element => {
        this.orgTypeListOrgArryData.push({ "label": element, "value": element })
      });


      this.channelListOrg = this.showOrgData
        .map(item => item.channel)
        .filter((value, index, self) => self.indexOf(value) === index)
      this.channelListOrgArry = this.channelListOrg.filter(f => f !== undefined && f !== null) as any;
      this.channelListOrgArry.forEach(element => {
        this.channelListOrgArryData.push({ "label": element, "value": element })
      });


      this.statusListOrg = this.showOrgData
        .map(item => item.status)
        .filter((value, index, self) => self.indexOf(value) === index)
      this.statuslistArryOrg = this.statusListOrg.filter(f => f !== undefined && f !== null) as any;
      this.statuslistArryOrg.forEach(element => {
        this.statuslistArryDataOrg.push({ "label": element, "value": element })
      });


      this.orgListOrg = this.showOrgData
        .map(item => item.orgName)
        .filter((value, index, self) => self.indexOf(value) === index)
      this.orgListArryOrg = this.orgListOrg.filter(f => f !== undefined && f !== null) as any;
      this.orgListArryOrg.forEach(element => {
        this.orgListDataOrg.push({ "label": element, "value": element })
      });

    });
  }

  /**
   * This method for fetches the org list
   */
  getOrgList(systemVar: any) {
    this.userLoginDataChannel = sessionStorage.getItem("userLoginDataChannel")
    let tempArray: any
    if (systemVar == 'present') {
      tempArray = {
        'request': {
          'query': '',
          'filters': {
            isRootOrg: true
          },
          'limit': 100
        }
      }
    }
    else {
      tempArray = {
        'request': {
          'query': '',
          'filters': {
            "channel": this.userLoginDataChannel

          },
          'limit': 100
        }
      }
    }
    this._httpService.getOrgDetail(tempArray).subscribe(res => {
      this.orgListArr = res.result.response.content;
      if (systemVar == 'present') {
        this.mentorList = this.orgListArr.sort((a, b) => {
          var a1 = a.orgName?.toLowerCase();
          var b1 = b.orgName?.toLowerCase();
          return a1 < b1 ? -1 : a1 > b1 ? 1 : 0;
        })
      }
      else if (systemVar != 'present') {
        this.mentorList = this.orgListArr.sort(function (a, b) {
          return b.isRootOrg - a.isRootOrg
        })
      }

    }, err => {
    })

  }

  updatePatch(OrgId: any) {
    let tempArray: any
    tempArray =
      { 'request': { 'channel': { 'defaultFramework': 'nulp' } } }
    this._httpService.updatePatch(tempArray, OrgId).subscribe(res => {
      this.addOrgrPopup = false
    }, err => {
      this.toasterService.error(this.resourceService.messages.emsg.m0005);
    })
  }

  contentPublishFormData(rootOrgIdCreate:any)
  {


    let tempArray1 : any
    tempArray1 =
    {
      "request": {
        "framework": "*",
        "rootOrgId": rootOrgIdCreate,
            "type": "content",
            "subType": "resource",
            "action": "publish",
          "data": {
            "templateName": "defaultTemplate",
            "action": "publish",
            "fields": [
              {
                "title": "Please confirm that ALL the following items are verified (by ticking the check-boxes) before you can publish:",
                "contents": [
                  {
                    "name": "Appropriateness",
                    "checkList": [
                      "No Hate speech, Abuse, Violence, Profanity",
                      "No Sexual content, Nudity or Vulgarity",
                      "No Discrimination or Defamation",
                      "Is suitable for stakeholders"
                    ]
                  },
                  {
                    "name": "Content details",
                    "checkList": [
                      "Appropriate Title, Description",
                      "Correct Category, Sub-Category, Topic, Language",
                      "Appropriate tags such as Resource Type, Concepts",
                      "Relevant Keywords"
                    ]
                  },
                  {
                    "name": "Usability",
                    "checkList": [
                      "Content plays correctly",
                      "Can see the content clearly on Desktop and App",
                      "Audio (if any) is clear and easy to understand",
                      "No Spelling mistakes in the text",
                      "Language is simple to understand"
                    ]
                  }
                ]
              }
            ]
          }
        }
    }

    this._httpService.createForm(tempArray1).subscribe(res=>{

      this.addOrgrPopup=false

    },err=>{
      this.toasterService.error(this.resourceService.messages.emsg.m0005);
    })
  }

  contentRejectFormData(rootOrgIdCreate:any)
  {


    let tempArray1 : any
    tempArray1 =
    {
      "request": {
        "framework": "nulp",
        "rootOrgId": rootOrgIdCreate,
            "type": "content",
            "subType": "collection",
            "action": "publish",
          "data": {
            "templateName": "defaultTemplate",
            "action": "publish",
            "fields": [
              {
                "title": "Please confirm that ALL the following items are verified (by ticking the check-boxes) before you can publish:",
                "contents": [
                  {
                    "name": "Appropriateness",
                    "checkList": [
                      "No Hate speech, Abuse, Violence, Profanity",
                      "No Sexual content, Nudity or Vulgarity",
                      "No Discrimination or Defamation",
                      "Is suitable for stakeholders"
                    ]
                  },
                  {
                    "name": "Content details",
                    "checkList": [
                      "Appropriate Title, Description",
                      "Correct Category, Sub-Category, Topic, Language",
                      "Appropriate tags such as Resource Type, Concepts",
                      "Relevant Keywords"
                    ]
                  },
                  {
                    "name": "Usability",
                    "checkList": [
                      "Content plays correctly",
                      "Can see the content clearly on Desktop and App",
                      "Audio (if any) is clear and easy to understand",
                      "No Spelling mistakes in the text",
                      "Language is simple to understand"
                    ]
                  }
                ]
              }
            ]
          }
        }
    }
    this._httpService.createForm(tempArray1).subscribe(res=>{

      this.addOrgrPopup=false

    },err=>{
      this.toasterService.error(this.resourceService.messages.emsg.m0005);
    })
  }

  collectionPublishFormData(rootOrgIdCreate:any)
  {


    let tempArray1 : any
    tempArray1 =
    {
      "request": {
        "framework": "nulp",
        "rootOrgId": rootOrgIdCreate,
            "type": "content",
            "subType": "collection",
            "action": "publish",
          "data": {
            "templateName": "defaultTemplate",
            "action": "publish",
            "fields": [
              {
                "title": "Please confirm that ALL the following items are verified (by ticking the check-boxes) before you can publish:",
                "contents": [
                  {
                    "name": "Appropriateness",
                    "checkList": [
                      "No Hate speech, Abuse, Violence, Profanity",
                      "No Sexual content, Nudity or Vulgarity",
                      "No Discrimination or Defamation",
                      "Is suitable for stakeholders"
                    ]
                  },
                  {
                    "name": "Content details",
                    "checkList": [
                      "Appropriate Title, Description",
                      "Correct Category, Sub-Category, Topic, Language",
                      "Appropriate tags such as Resource Type, Concepts",
                      "Relevant Keywords"
                    ]
                  },
                  {
                    "name": "Usability",
                    "checkList": [
                      "Content plays correctly",
                      "Can see the content clearly on Desktop and App",
                      "Audio (if any) is clear and easy to understand",
                      "No Spelling mistakes in the text",
                      "Language is simple to understand"
                    ]
                  }
                ]
              }
            ]
          }
        }
    }
    this._httpService.createForm(tempArray1).subscribe(res=>{

      this.addOrgrPopup=false

    },err=>{
      this.toasterService.error(this.resourceService.messages.emsg.m0005);
    })
  }


  requestChangeFormCollectionData(rootOrgIdCreate:any)
  {


    let tempArray1 : any
    tempArray1 =
    {
      "request": {
        "type": "content",
                "subType": "collection",
                "action": "requestforchanges",

                "framework": "nulp",
                "rootOrgId": rootOrgIdCreate,
          "data": {
            "templateName": "defaultTemplate",
            "action": "requestforchanges",
          "fields": [
              {
                "title": "Please tick the reasons for requesting changes and provide detailed comments:",
                "otherReason": "Other Issue(s) (if there are any other issues, tick this and provide details in the comments box)",
                "contents": [
                  {
                    "name": "Appropriateness",
                    "checkList": [
                      "No Hate speech, Abuse, Violence, Profanity",
                      "No Sexual content, Nudity or Vulgarity",
                      "No Discrimination or Defamation",
                      "Is suitable for stakeholders"
                    ]
                  },
                  {
                    "name": "Content details",
                    "checkList": [
                      "Appropriate Title, Description",
                      "Correct Category, Sub-Category, Topic, Language",
                      "Appropriate tags such as Resource Type, Concepts",
                      "Relevant Keywords"
                    ]
                  },
                  {
                    "name": "Usability",
                    "checkList": [
                      "Content plays correctly",
                      "Can see the content clearly on Desktop and App",
                      "Audio (if any) is clear and easy to understand",
                      "No Spelling mistakes in the text",
                      "Language is simple to understand"
                    ]
                  }
                ]
              }
            ]
          }
        }
    }
    this._httpService.createForm(tempArray1).subscribe(res=>{

      this.addOrgrPopup=false

    },err=>{
    })
  }

  collectionReviewFormData(rootOrgIdCreate:any)
  {


    let tempArray1 : any
    tempArray1 =
    {
      "request": {

              "type": "content",
              "subType": "collection",
              "action": "review",
              "rootOrgId": rootOrgIdCreate,
              "framework": "nulp",
              "data": {
                  "templateName": "defaultTemplate",
                  "action": "review",
                  "fields": [

                            {
                              "code": "appicon",
                              "dataType": "url",
                              "description": "App Icon",
                              "editable": true,
                              "index": 1,
                              "inputType": "file",
                              "label": "App Icon",
                              "name": "App Icon",
                              "placeholder": "App Icon",
                              "renderingHints": {},
                              "required": false,
                              "visible": true
                          },
                          {
                              "code": "name",
                              "dataType": "text",
                              "description": "Title of the content",
                              "editable": true,
                              "index": 2,
                              "inputType": "text",
                              "label": "Title",
                              "name": "Title",
                              "placeholder": "Enter Title For Book",
                              "renderingHints": {},
                              "required": true,
                              "visible": true
                          },
                          {
                              "code": "description",
                              "dataType": "text",
                              "description": "Brief description",
                              "editable": true,
                              "index": 3,
                              "inputType": "textarea",
                              "label": "Description",
                              "name": "Description",
                              "placeholder": "Brief description about the Book",
                              "renderingHints": {},
                              "required": false,
                              "visible": true
                          },
                          {
                              "code": "keywords",
                              "dataType": "list",
                              "description": "Keywords for the content",
                              "editable": true,
                              "index": 4,
                              "inputType": "keywordsuggestion",
                              "label": "keywords",
                              "name": "Keywords",
                              "placeholder": "Enter Keywords",
                              "required": false,
                              "visible": true
                          },
                        {
                              "code": "board",
                              "dataType": "text",
                              "description": "Category",
                              "editable": true,
                              "index": 5,
                              "inputType": "select",
                              "label": "Category",
                              "name": "Category",
                              "placeholder": "Select Category",
                              "renderingHints": {},
                              "required": true,
                              "visible": true,
                              "depends": [
                                  "gradeLevel"
                              ]
                          },

                          {
                              "code": "gradeLevel",
                              "dataType": "list",
                              "description": "Sub-Category",
                              "editable": true,
                              "index": 6,
                              "inputType": "select",
                              "label": "Sub-Category",
                              "name": "Sub-Category",
                              "placeholder": "Select Sub-Category",
                              "renderingHints": {},
                              "required": true,
                              "visible": true
                          },

                          {
                              "code": "subject",
                              "dataType": "text",
                              "description": "Topic",
                              "editable": true,
                              "index": 7,
                              "inputType": "select",
                              "label": "Topic",
                              "name": "Topic",
                              "placeholder": "Select Topic",
                              "renderingHints": {},
                              "required": true,
                              "visible": true
                          },

                          {
                              "code": "medium",
                              "dataType": "text",
                              "description": "Language",
                              "editable": true,
                              "index": 8,
                              "inputType": "select",
                              "label": "Language",
                              "name": "Language",
                              "placeholder": "Select Language",
                              "renderingHints": {},
                              "required": false,
                              "visible": true
                          },



                          {
                              "code": "attributions",
                              "dataType": "list",
                              "description": "Attributions",
                              "editable": true,
                              "index": 8,
                              "inputType": "text",
                              "label": "Attributions",
                              "name": "attribution",
                              "placeholder": "",
                              "renderingHints": {},
                              "required": false,
                              "visible": true
                          }
                  ]
              }
          }
      }

      this._httpService.createForm(tempArray1).subscribe(res=>{

      this.addOrgrPopup=false

    },err=>{
    })
  }

  collectionResourceFilterFormData(rootOrgIdCreate:any)
  {


    let tempArray1 : any
    tempArray1 =
    {
      "request": {

              "type": "content",
              "subType": "collection",
              "action": "resource-filters",
              "rootOrgId": rootOrgIdCreate,
              "framework": "nulp",
              "data": {
                  "templateName": "defaultTemplate",
                      "action": "resource-filters",
                      "fields": [
                          {
                              "code": "name",
                              "dataType": "text",
                              "name": "Name",
                              "lable": "Name",
                              "label": "Name",
                              "description": "Name",
                              "editable": true,
                              "placeholder": "Name",
                              "inputType": "text",
                              "required": false,
                              "displayProperty": "Editable",
                              "visible": true,
                              "renderingHints": {
                                  "semanticColumnWidth": "twelve"
                              },
                              "index": 1
                          },
                          {
                              "code": "description",
                              "dataType": "text",
                              "description": "Brief description",
                              "editable": true,
                              "index": 2,
                              "inputType": "textarea",
                              "label": "Description",
                              "name": "Description",
                              "placeholder": "Brief description about the Book",
                              "renderingHints": {},
                              "required": false,
                              "visible": true
                          }
                      ]
              }
          }
      }


      this._httpService.createForm(tempArray1).subscribe(res=>{

      this.addOrgrPopup=false

    },err=>{
    })
  }

  collectionCreateFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "collection",
        "action": "create",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",
        "data": {
          "templateName": "defaultTemplate",
          "action": "create",
          "fields": [
            {
              "code": "name",
              "dataType": "text",
              "name": "Name",
              "lable": "Name",
              "label": "Name",
              "description": "Name",
              "editable": true,
              "placeholder": "Name",
              "inputType": "text",
              "required": false,
              "displayProperty": "Editable",
              "visible": true,
              "renderingHints": {
                "semanticColumnWidth": "twelve"
              },
              "index": 1
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 2,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Brief description about the Book",
              "renderingHints": {},
              "required": false,
              "visible": true
            }


          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  collectionSaveFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "collection",
        "action": "save",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",
        "data": {
          "templateName": "defaultTemplate",
          "action": "save",
          "fields": [
            {
              "code": "appicon",
              "dataType": "url",
              "description": "App Icon",
              "editable": true,
              "index": 1,
              "inputType": "file",
              "label": "App Icon",
              "name": "App Icon",
              "placeholder": "App Icon",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "name",
              "dataType": "text",
              "description": "Title of the content",
              "editable": true,
              "index": 2,
              "inputType": "text",
              "label": "Title",
              "name": "name",
              "placeholder": "Enter Title For Collection",
              "renderingHints": {},
              "required": true,
              "visible": true
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 3,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Brief description about the Collection",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "keywords",
              "dataType": "list",
              "description": "Keywords for the content",
              "editable": true,
              "index": 4,
              "inputType": "keywordsuggestion",
              "label": "keywords",
              "name": "Keywords",
              "placeholder": "Enter Keywords",
              "required": false,
              "visible": true
            },
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 5,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },
            {
              "code": "gradeLevel",
              "dataType": "list",
              "description": "Sub-Category",
              "editable": true,
              "index": 6,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "subject",
              "dataType": "list",
              "description": "Topic",
              "editable": true,
              "index": 7,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },


            {
              "code": "medium",
              "dataType": "list",
              "description": "Language",
              "editable": true,
              "index": 8,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            }
            ,

            {
              "code": "attributions",
              "dataType": "list",
              "description": "Attributions",
              "editable": true,
              "index": 9,
              "inputType": "text",
              "label": "Attributions",
              "name": "attribution",
              "placeholder": "",
              "renderingHints": {},
              "required": false,
              "visible": true
            }

          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  lessonPublishFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {
        "framework": "nulp",
        "rootOrgId": rootOrgIdCreate,
        "type": "content",
        "subType": "LessonPlan",
        "action": "publish",
        "data": {
          "templateName": "defaultTemplate",
          "action": "publish",
          "fields": [
            {
              "title": "Please confirm that ALL the following items are verified (by ticking the check-boxes) before you can publish:",
              "contents": [
                {
                  "name": "Appropriateness",
                  "checkList": [
                    "No Hate speech, Abuse, Violence, Profanity",
                    "No Sexual content, Nudity or Vulgarity",
                    "No Discrimination or Defamation",
                    "Is suitable for stakeholders"
                  ]
                },
                {
                  "name": "Content details",
                  "checkList": [
                    "Appropriate Title, Description",
                    "Correct Category, Sub-Category, Topic, Language",
                    "Appropriate tags such as Resource Type, Concepts",
                    "Relevant Keywords"
                  ]
                },
                {
                  "name": "Usability",
                  "checkList": [
                    "Content plays correctly",
                    "Can see the content clearly on Desktop and App",
                    "Audio (if any) is clear and easy to understand",
                    "No Spelling mistakes in the text",
                    "Language is simple to understand"
                  ]
                }
              ]
            }
          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  requestChangeFormLessonPlamData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {
        "type": "content",
        "subType": "LessonPlan",
        "action": "requestforchanges",

        "framework": "nulp",
        "rootOrgId": rootOrgIdCreate,
        "data": {
          "templateName": "defaultTemplate",
          "action": "requestforchanges",
          "fields": [
            {
              "title": "Please tick the reasons for requesting changes and provide detailed comments:",
              "otherReason": "Other Issue(s) (if there are any other issues, tick this and provide details in the comments box)",
              "contents": [
                {
                  "name": "Appropriateness",
                  "checkList": [
                    "No Hate speech, Abuse, Violence, Profanity",
                    "No Sexual content, Nudity or Vulgarity",
                    "No Discrimination or Defamation",
                    "Is suitable for stakeholders"
                  ]
                },
                {
                  "name": "Content details",
                  "checkList": [
                    "Appropriate Title, Description",
                    "Correct Category, Sub-Category, Topic, Language",
                    "Appropriate tags such as Resource Type, Concepts",
                    "Relevant Keywords"
                  ]
                },
                {
                  "name": "Usability",
                  "checkList": [
                    "Content plays correctly",
                    "Can see the content clearly on Desktop and App",
                    "Audio (if any) is clear and easy to understand",
                    "No Spelling mistakes in the text",
                    "Language is simple to understand"
                  ]
                }
              ]
            }
          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  lessonPlanSaveData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "lessonplan",
        "action": "save",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",
        "data": {
          "templateName": "defaultTemplate",
          "action": "save",
          "fields": [
            {
              "code": "appicon",
              "dataType": "url",
              "description": "App Icon",
              "editable": true,
              "index": 1,
              "inputType": "file",
              "label": "App Icon",
              "name": "App Icon",
              "placeholder": "App Icon",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "name",
              "dataType": "text",
              "description": "Title of the content",
              "editable": true,
              "index": 2,
              "inputType": "text",
              "label": "Title",
              "name": "Title",
              "placeholder": "Enter Title For Book",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 3,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Brief description about the Book",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "keywords",
              "dataType": "list",
              "description": "Keywords for the content",
              "editable": true,
              "index": 4,
              "inputType": "keywordsuggestion",
              "label": "keywords",
              "name": "Keywords",
              "placeholder": "Enter Keywords",
              "required": false,
              "visible": true
            },
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 5,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },

            {
              "code": "gradeLevel",
              "dataType": "list",
              "description": "Sub-Category",
              "editable": true,
              "index": 6,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },

            {
              "code": "subject",
              "dataType": "list",
              "description": "Topic",
              "editable": true,
              "index": 7,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },

            {
              "code": "medium",
              "dataType": "list",
              "description": "Language",
              "editable": true,
              "index": 8,
              "inputType": "select",
              "label": "Language",
              "name": "Langauge",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            },


            {
              "code": "attributions",
              "dataType": "list",
              "description": "Attributions",
              "editable": true,
              "index": 8,
              "inputType": "text",
              "label": "Attributions",
              "name": "attribution",
              "placeholder": "",
              "renderingHints": {},
              "required": false,
              "visible": true
            }
          ]
        }
      }
    }



    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  lessonPlanResourceFilterFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "lessonplan",
        "action": "resource-filters",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",
        "data": {
          "templateName": "defaultTemplate",
          "action": "resource-filters",
          "fields": [
            {
              "code": "name",
              "dataType": "text",
              "name": "Name",
              "lable": "Name",
              "label": "Name",
              "description": "Name",
              "editable": true,
              "placeholder": "Name",
              "inputType": "text",
              "required": false,
              "displayProperty": "Editable",
              "visible": true,
              "renderingHints": {
                "semanticColumnWidth": "twelve"
              },
              "index": 1
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 2,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Brief description about the Book",
              "renderingHints": {},
              "required": false,
              "visible": true
            }
          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  lessonPlanReviewFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "lessonplan",
        "action": "review",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",
        "data": {
          "templateName": "defaultTemplate",
          "action": "review",
          "fields": [

            {
              "code": "appicon",
              "dataType": "url",
              "description": "App Icon",
              "editable": true,
              "index": 1,
              "inputType": "file",
              "label": "App Icon",
              "name": "App Icon",
              "placeholder": "App Icon",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "name",
              "dataType": "text",
              "description": "Title of the content",
              "editable": true,
              "index": 2,
              "inputType": "text",
              "label": "Title",
              "name": "Title",
              "placeholder": "Enter Title For Book",
              "renderingHints": {},
              "required": true,
              "visible": true
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 3,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Brief description about the Book",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "keywords",
              "dataType": "list",
              "description": "Keywords for the content",
              "editable": true,
              "index": 4,
              "inputType": "keywordsuggestion",
              "label": "keywords",
              "name": "Keywords",
              "placeholder": "Enter Keywords",
              "required": false,
              "visible": true
            },
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 5,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": true,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },

            {
              "code": "gradeLevel",
              "dataType": "list",
              "description": "Sub-Category",
              "editable": true,
              "index": 6,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": true,
              "visible": true
            },

            {
              "code": "subject",
              "dataType": "text",
              "description": "Topic",
              "editable": true,
              "index": 7,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": true,
              "visible": true
            },

            {
              "code": "medium",
              "dataType": "text",
              "description": "Language",
              "editable": true,
              "index": 8,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            },



            {
              "code": "attributions",
              "dataType": "list",
              "description": "Attributions",
              "editable": true,
              "index": 8,
              "inputType": "text",
              "label": "Attributions",
              "name": "attribution",
              "placeholder": "",
              "renderingHints": {},
              "required": false,
              "visible": true
            }
          ]
        }
      }
    }



    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  lessonPlanCreateFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "lessonplan",
        "action": "create",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",
        "data": {
          "templateName": "defaultTemplate",
          "action": "create",
          "fields": [
            {
              "code": "name",
              "dataType": "text",
              "name": "Name",
              "lable": "Name",
              "label": "Name",
              "description": "Name",
              "editable": true,
              "placeholder": "Name",
              "inputType": "text",
              "required": false,
              "displayProperty": "Editable",
              "visible": true,
              "renderingHints": {
                "semanticColumnWidth": "twelve"
              },
              "index": 1
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 2,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Brief description about the Book",
              "renderingHints": {},
              "required": false,
              "visible": true
            }

          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  publishFormResourceData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {
        "type": "content",
        "subType": "resource",
        "action": "publish",

        "framework": "nulp",
        "rootOrgId": rootOrgIdCreate,
        "data": {
          "templateName": "defaultTemplate",
          "action": "publish",
          "fields": [
            {
              "title": "Please confirm that ALL the following items are verified (by ticking the check-boxes) before you can publish:",
              "contents": [
                {
                  "name": "Appropriateness",
                  "checkList": [
                    "No Hate speech, Abuse, Violence, Profanity",
                    "No Sexual content, Nudity or Vulgarity",
                    "No Discrimination or Defamation",
                    "Is suitable for stakeholders"
                  ]
                },
                {
                  "name": "Content details",
                  "checkList": [
                    "Appropriate Title, Description",
                    "Correct Category, Sub-Category, Topic, Language",
                    "Appropriate tags such as Resource Type, Concepts",
                    "Relevant Keywords"
                  ]
                },
                {
                  "name": "Usability",
                  "checkList": [
                    "Content plays correctly",
                    "Can see the content clearly on Desktop and App",
                    "Audio (if any) is clear and easy to understand",
                    "No Spelling mistakes in the text",
                    "Language is simple to understand"
                  ]
                }
              ]
            }
          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  userPrefrenceFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {

      "request": {
        "type": "user",
        "subType": "framework",
        "action": "update",
        "framework": "nulp",
        "rootOrgId": "*",
        "data": {
          "templateName": "defaultTemplate",
          "action": "update",
          "fields": [
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 1,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true
          },
          {
              "code": "gradeLevel",
              "dataType": "list",
              "description": "Sub-Category",
              "editable": true,
              "index": 2,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
          },
          {
              "code": "medium",
              "dataType": "text",
              "description": "Language",
              "editable": true,
              "index": 4,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
          }
          ]
        }


      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  requestChangeFormResourceData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {
        "type": "content",
        "subType": "resource",
        "action": "requestforchanges",

        "framework": "*",
        "rootOrgId": rootOrgIdCreate,
        "data": {
          "templateName": "defaultTemplate",
          "action": "requestforchanges",
          "fields": [
            {
              "title": "Please tick the reasons for requesting changes and provide detailed comments:",
              "otherReason": "Other Issue(s) (if there are any other issues, tick this and provide details in the comments box)",
              "contents": [
                {
                  "name": "Appropriateness",
                  "checkList": [
                    "No Hate speech, Abuse, Violence, Profanity",
                    "No Sexual content, Nudity or Vulgarity",
                    "No Discrimination or Defamation",
                    "Is suitable for stakeholders"
                  ]
                },
                {
                  "name": "Content details",
                  "checkList": [
                    "Appropriate Title, Description",
                    "Correct Category, Sub-Category, Topic, Language",
                    "Appropriate tags such as Resource Type, Concepts",
                    "Relevant Keywords"
                  ]
                },
                {
                  "name": "Usability",
                  "checkList": [
                    "Content plays correctly",
                    "Can see the content clearly on Desktop and App",
                    "Audio (if any) is clear and easy to understand",
                    "No Spelling mistakes in the text",
                    "Language is simple to understand"
                  ]
                }
              ]
            }
          ]
        }
      }
    }

    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  resourceCreateFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "resource",
        "action": "create",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",
        "data": {
          "templateName": "defaultTemplate",
          "action": "create",
          "fields": [
            {
              "code": "name",
              "dataType": "text",
              "name": "Name",
              "lable": "Name",
              "label": "Name",
              "description": "Name",
              "editable": true,
              "placeholder": "Name",
              "inputType": "text",
              "required": false,
              "displayProperty": "Editable",
              "visible": true,
              "renderingHints": {
                "semanticColumnWidth": "twelve"
              },
              "index": 1
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 2,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Brief description about the Book",
              "renderingHints": {},
              "required": false,
              "visible": true
            }

          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  resourceSaveFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "resource",
        "action": "save",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",
        "data": {
          "templateName": "defaultTemplate",
          "action": "save",
          "fields": [
            {
              "code": "appicon",
              "dataType": "url",
              "description": "App Icon",
              "editable": true,
              "index": 1,
              "inputType": "file",
              "label": "App Icon",
              "name": "App Icon",
              "placeholder": "App Icon",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "name",
              "dataType": "text",
              "description": "Title of the content",
              "editable": true,
              "index": 2,
              "inputType": "text",
              "label": "Title",
              "name": "Title",
              "placeholder": "Enter Title For Book",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 3,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Brief description about the Book",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "keywords",
              "dataType": "list",
              "description": "Keywords for the content",
              "editable": true,
              "index": 4,
              "inputType": "keywordsuggestion",
              "label": "keywords",
              "name": "Keywords",
              "placeholder": "Enter Keywords",
              "required": false,
              "visible": true
            },
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 5,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },
            {
              "code": "gradeLevel",
              "dataType": "list",
              "description": "Sub-Category",
              "editable": true,
              "index": 6,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "subject",
              "dataType": "list",
              "description": "Topic",
              "editable": true,
              "index": 7,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },


            {
              "code": "medium",
              "dataType": "list",
              "description": "Language",
              "editable": true,
              "index": 8,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            },

            {
              "code": "attributions",
              "dataType": "list",
              "description": "Attributions",
              "editable": true,
              "index": 9,
              "inputType": "text",
              "label": "Attributions",
              "name": "attribution",
              "placeholder": "",
              "renderingHints": {},
              "required": false,
              "visible": true
            }
          ]
        }
      }
    }



    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  resourceReviewFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "resource",
        "action": "review",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",
        "data": {
          "templateName": "defaultTemplate",
          "action": "review",
          "fields": [
            {
              "code": "appicon",
              "dataType": "url",
              "description": "App Icon",
              "editable": true,
              "index": 1,
              "inputType": "file",
              "label": "App Icon",
              "name": "App Icon",
              "placeholder": "App Icon",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "name",
              "dataType": "text",
              "description": "Title of the content",
              "editable": true,
              "index": 2,
              "inputType": "text",
              "label": "Title",
              "name": "Title",
              "placeholder": "Enter Title For Book",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 3,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Brief description about the Book",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "keywords",
              "dataType": "list",
              "description": "Keywords for the content",
              "editable": true,
              "index": 4,
              "inputType": "keywordsuggestion",
              "label": "keywords",
              "name": "Keywords",
              "placeholder": "Enter Keywords",
              "required": false,
              "visible": true
            },
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 5,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },
            {
              "code": "gradeLevel",
              "dataType": "list",
              "description": "Sub-Category",
              "editable": true,
              "index": 6,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "subject",
              "dataType": "list",
              "description": "Topic",
              "editable": true,
              "index": 7,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },


            {
              "code": "medium",
              "dataType": "list",
              "description": "Language",
              "editable": true,
              "index": 8,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            },

            {
              "code": "attributions",
              "dataType": "list",
              "description": "Attributions",
              "editable": true,
              "index": 9,
              "inputType": "text",
              "label": "Attributions",
              "name": "attribution",
              "placeholder": "",
              "renderingHints": {},
              "required": false,
              "visible": true
            }
          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }


  courseRejectCopyFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {
        "framework": "nulp",
        "rootOrgId": rootOrgIdCreate,
        "type": "content",
        "subType": "Course",
        "action": "requestforchanges",
        "data": {
          "templateName": "defaultTemplate",
          "action": "requestforchanges",
          "fields": [
            {

              "title": "Please tick the reasons for requesting changes and provide detailed comments:",
              "otherReason": "Other Issue(s) (if there are any other issues, tick this and provide details in the comments box)",
              "contents": [
                {
                  "name": "Appropriateness",
                  "checkList": [
                    "No Hate speech, Abuse, Violence, Profanity",
                    "No Sexual content, Nudity or Vulgarity",
                    "No Discrimination or Defamation",
                    "Is suitable for stakeholders"
                  ]
                },
                {
                  "name": "Content details",
                  "checkList": [
                    "Appropriate Title, Description",
                    "Correct Category, Sub-Category, Topic, Language",
                    "Appropriate tags such as Resource Type, Concepts",
                    "Relevant Keywords"
                  ]
                },
                {
                  "name": "Usability",
                  "checkList": [
                    "Content plays correctly",
                    "Can see the content clearly on Desktop and App",
                    "Audio (if any) is clear and easy to understand",
                    "No Spelling mistakes in the text",
                    "Language is simple to understand"
                  ]
                }
              ]
            }
          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }


  publishFormCourseData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {
        "framework": "nulp",
        "rootOrgId": rootOrgIdCreate,
        "type": "content",
        "subType": "Course",
        "action": "publish",
        "data": {
          "templateName": "defaultTemplate",
          "action": "publish",
          "fields": [
            {
              "title": "Please confirm that ALL the following items are verified (by ticking the check-boxes) before you can publish:",
              "contents": [
                {
                  "name": "Appropriateness",
                  "checkList": [
                    "No Hate speech, Abuse, Violence, Profanity",
                    "No Sexual content, Nudity or Vulgarity",
                    "No Discrimination or Defamation",
                    "Is suitable for stakeholders"
                  ]
                },
                {
                  "name": "Content details",
                  "checkList": [
                    "Appropriate Title, Description",
                    "Correct Category, Sub-Category, Topic, Language",
                    "Appropriate tags such as Resource Type, Concepts",
                    "Relevant Keywords"
                  ]
                },
                {
                  "name": "Usability",
                  "checkList": [
                    "Content plays correctly",
                    "Can see the content clearly on Desktop and App",
                    "Audio (if any) is clear and easy to understand",
                    "No Spelling mistakes in the text",
                    "Language is simple to understand"
                  ]
                }
              ]
            }
          ]
        }
      }
    }

    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  courseCreateFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "course",
        "action": "create",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",
        "data": {
          "templateName": "defaultTemplate",
          "action": "create",
          "fields": [
            {
              "code": "name",
              "dataType": "text",
              "name": "Name",
              "lable": "Name",
              "label": "Name",
              "description": "Name",
              "editable": true,
              "placeholder": "Name",
              "inputType": "text",
              "required": false,
              "displayProperty": "Editable",
              "visible": true,
              "renderingHints": {
                "semanticColumnWidth": "twelve"
              },
              "index": 1
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 2,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Brief description about the Book",
              "renderingHints": {},
              "required": false,
              "visible": true
            }

          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  courseSaveFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "course",
        "action": "save",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",

        "data": {
          "templateName": "defaultTemplate",
          "action": "save",
          "fields": [
            {
              "code": "appicon",
              "dataType": "url",
              "description": "App Icon",
              "editable": true,
              "index": 1,
              "inputType": "file",
              "label": "App Icon",
              "name": "App Icon",
              "placeholder": "App Icon",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "name",
              "dataType": "text",
              "description": "Title of the content",
              "editable": true,
              "index": 2,
              "inputType": "text",
              "label": "Title",
              "name": "name",
              "placeholder": "Enter Title For Collection",
              "renderingHints": {},
              "required": true,
              "visible": true
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 3,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Brief description about the Collection",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "keywords",
              "dataType": "list",
              "description": "Keywords for the content",
              "editable": true,
              "index": 4,
              "inputType": "keywordsuggestion",
              "label": "keywords",
              "name": "Keywords",
              "placeholder": "Enter Keywords",
              "required": false,
              "visible": true
            },
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 5,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },
            {
              "code": "gradeLevel",
              "dataType": "list",
              "description": "Sub-Category",
              "editable": true,
              "index": 6,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "subject",
              "dataType": "list",
              "description": "Topic",
              "editable": true,
              "index": 7,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },


            {
              "code": "medium",
              "dataType": "list",
              "description": "Language",
              "editable": true,
              "index": 8,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            }
            ,

            {
              "code": "attributions",
              "dataType": "list",
              "description": "Attributions",
              "editable": true,
              "index": 9,
              "inputType": "text",
              "label": "Attributions",
              "name": "attribution",
              "placeholder": "",
              "renderingHints": {},
              "required": false,
              "visible": true
            }

          ]
        }
      }
    }



    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }


  courseUnitSaveFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "courseunit",
        "action": "unitsave",
        "framework": "nulp",
        "rootOrgId": rootOrgIdCreate,
        "data": {
          "templateName": "unitMetaTemplate",
          "action": "unitsave",
          "fields": [
            {
              "code": "name",
              "dataType": "text",
              "description": "Title of the content",
              "editable": true,
              "index": 1,
              "inputType": "text",
              "label": "Title",
              "name": "Title",
              "placeholder": "Enter the Title ",
              "renderingHints": {},
              "required": true,
              "visible": true
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 2,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Description",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "keywords",
              "dataType": "list",
              "description": "Keywords for the content",
              "editable": true,
              "index": 3,
              "inputType": "keywordsuggestion",
              "label": "keywords",
              "name": "Keywords",
              "placeholder": "Enter Keywords",
              "required": false,
              "visible": true
            },
            {

              "code": "topic",

              "dataType": "list",

              "description": "Choose a topic",

              "editable": true,

              "index": 4,

              "inputType": "topicselector",

              "label": "Topics",

              "name": "Topics",

              "placeholder": "Choose Topics",

              "renderingHints": {},

              "required": false,

              "visible": true

            }
          ]
        }

      }
    }



    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  courseReviewFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "course",
        "action": "review",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",
        "data": {
          "templateName": "defaultTemplate",
          "action": "review",
          "fields": [
            {
              "code": "appicon",
              "dataType": "url",
              "description": "App Icon",
              "editable": true,
              "index": 1,
              "inputType": "file",
              "label": "App Icon",
              "name": "App Icon",
              "placeholder": "App Icon",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "name",
              "dataType": "text",
              "description": "Title of the content",
              "editable": true,
              "index": 2,
              "inputType": "text",
              "label": "Title",
              "name": "name",
              "placeholder": "Enter Title For Collection",
              "renderingHints": {},
              "required": true,
              "visible": true
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "index": 3,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Brief description about the Collection",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "keywords",
              "dataType": "list",
              "description": "Keywords for the content",
              "editable": true,
              "index": 4,
              "inputType": "keywordsuggestion",
              "label": "keywords",
              "name": "Keywords",
              "placeholder": "Enter Keywords",
              "required": false,
              "visible": true
            },
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 5,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },
            {
              "code": "gradeLevel",
              "dataType": "list",
              "description": "Sub-Category",
              "editable": true,
              "index": 6,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "subject",
              "dataType": "list",
              "description": "Topic",
              "editable": true,
              "index": 7,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },


            {
              "code": "medium",
              "dataType": "list",
              "description": "Language",
              "editable": true,
              "index": 8,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            }
            ,

            {
              "code": "attributions",
              "dataType": "list",
              "description": "Attributions",
              "editable": true,
              "index": 9,
              "inputType": "text",
              "label": "Attributions",
              "name": "attribution",
              "placeholder": "",
              "renderingHints": {},
              "required": false,
              "visible": true
            }


          ]
        }
      }
    }



    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  courseResourceFilterFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "course",
        "action": "resource-filters",
        "rootOrgId": rootOrgIdCreate,
        "framework": "nulp",
        "data": {
          "templateName": "defaultTemplate",
          "action": "resource-filters",
          "fields": [
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 1,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },
            {
              "code": "gradeLevel",
              "dataType": "list",
              "description": "Sub-Category",
              "editable": true,
              "index": 2,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "subject",
              "dataType": "text",
              "description": "Topic",
              "editable": true,
              "index": 3,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "medium",
              "dataType": "text",
              "description": "Language",
              "editable": true,
              "index": 4,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            }
          ]
        }
      }
    }



    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  courseFilterFormData(rootOrgIdCreate: any) {
    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "courses",
        "action": "filter",
        "rootOrgId": rootOrgIdCreate,

        "data": {
          "templateName": "defaultTemplate",
          "action": "filter",
          "fields": [
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 1,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },
            {
              "code": "gradeLevel",
              "dataType": "text",
              "description": "Sub-Category",
              "editable": true,
              "index": 2,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "subject",
              "dataType": "text",
              "description": "Topic",
              "editable": true,
              "index": 3,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },


            {
              "code": "medium",
              "dataType": "text",
              "description": "Language",
              "editable": true,
              "index": 4,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            }

          ]
        }
      }
    }

    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  questionMetaSearchFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {
        "action": "question-meta-save",
        "subType": "questions",
        "framework": "nulp",
        "rootOrgId": rootOrgIdCreate,
        "type": "content",
        "data": {
          "action": "question-meta-save",
          "templateName": "questionMetaDataTemplate",
          "fields": [
            {
              "code": "name",
              "dataType": "text",
              "description": "Title of the question",
              "editable": true,
              "inputType": "text",
              "label": "Title",
              "name": "Title",
              "index": 0,
              "placeholder": "Enter the Title",
              "renderingHints": {},
              "required": true,
              "visible": true
            },
            {
              "code": "description",
              "dataType": "text",
              "description": "Brief description",
              "editable": true,
              "inputType": "textarea",
              "label": "Description",
              "name": "Description",
              "placeholder": "Enter the Description",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "index": 1
            },

            {
              "code": "qlevel",
              "dataType": "text",
              "description": "Add Notes",
              "editable": true,
              "index": 3,
              "inputType": "select",
              "label": "Level",
              "name": "qlevel",
              "placeholder": "Select Level",
              "range": [
                "EASY",
                "MEDIUM",
                "DIFFICULT"
              ],
              "renderingHints": {},
              "required": true,
              "visible": true
            },
            {
              "code": "max_score",
              "dataType": "text",
              "description": "",
              "editable": true,
              "index": 4,
              "inputType": "number",
              "label": "Max Score",
              "name": "max_score",
              "placeholder": "Enter the Max Score",
              "renderingHints": {},
              "required": true,
              "visible": true,
              "validation": [
                {
                  "type": "min",
                  "value": "1",
                  "message": ""
                }
              ]
            }
          ]
        }
      }
    }

    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  questionFilterFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {
        "framework": "nulp",
        "rootOrgId": rootOrgIdCreate,
        "type": "content",
        "subType": "questions",
        "action": "question-filter-view",
        "popup": false,
        "metadata": {},
        "data": {}
      }
    }



    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }


  almyContentSearchFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "allmycontent",
        "action": "search",
        "rootOrgId": rootOrgIdCreate,

        "data": {
          "templateName": "defaultTemplate",
          "action": "search",
          "fields": [

            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 1,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },

            {
              "code": "gradeLevel",
              "dataType": "list",
              "description": "Sub-Category",
              "editable": true,
              "index": 2,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },

            {
              "code": "subject",
              "dataType": "text",
              "description": "Topic",
              "editable": true,
              "index": 3,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },

            {
              "code": "medium",
              "dataType": "text",
              "description": "Language",
              "editable": true,
              "index": 4,
              "inputType": "select",
              "label": "Language",
              "name": "Langauge",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            }
          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  exploreSearchFormData(rootOrgIdCreate: any) {
    let tempArray1: any
    tempArray1 =
    {
      "request": {
        "type": "content",
        "subType": "explore",
        "action": "search",
        "rootOrgId": rootOrgIdCreate,
        "data": {
          "templateName": "defaultTemplate",
          "action": "search",
          "fields": [
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 1,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },

            {
              "code": "gradeLevel",
              "dataType": "text",
              "description": "Sub-Category",
              "editable": true,
              "index": 2,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "subject",
              "dataType": "text",
              "description": "Topic",
              "editable": true,
              "index": 3,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },


            {
              "code": "medium",
              "dataType": "text",
              "description": "Language",
              "editable": true,
              "index": 4,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            }

          ]
        }
      }
    }

    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  exploreCourseFilterFormData(rootOrgIdCreate: any) {


    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "explore-course",
        "action": "filter",
        "rootOrgId": rootOrgIdCreate,

        "data": {
          "templateName": "defaultTemplate",
          "action": "filter",
          "fields": [
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 1,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },

            {
              "code": "gradeLevel",
              "dataType": "text",
              "description": "Sub-Category",
              "editable": true,
              "index": 2,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "subject",
              "dataType": "text",
              "description": "Topic",
              "editable": true,
              "index": 3,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },


            {
              "code": "medium",
              "dataType": "text",
              "description": "Language",
              "editable": true,
              "index": 4,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            }

          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  exploreCourseSearchFormData(rootOrgIdCreate: any) {
    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "explore",
        "action": "search",
        "rootOrgId": rootOrgIdCreate,

        "data": {
          "templateName": "defaultTemplate",
          "action": "search",
          "fields": [
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 1,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },

            {
              "code": "gradeLevel",
              "dataType": "text",
              "description": "Sub-Category",
              "editable": true,
              "index": 2,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "subject",
              "dataType": "text",
              "description": "Topic",
              "editable": true,
              "index": 3,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },


            {
              "code": "medium",
              "dataType": "text",
              "description": "Language",
              "editable": true,
              "index": 4,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            }

          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }

  librarySearchFormData(rootOrgIdCreate: any) {
    let tempArray1: any
    tempArray1 =
    {
      "request": {

        "type": "content",
        "subType": "library",
        "action": "search",
        "rootOrgId": rootOrgIdCreate,
        "data": {
          "templateName": "defaultTemplate",
          "action": "search",
          "fields": [
            {
              "code": "board",
              "dataType": "text",
              "description": "Category",
              "editable": true,
              "index": 1,
              "inputType": "select",
              "label": "Category",
              "name": "Category",
              "placeholder": "Select Category",
              "renderingHints": {},
              "required": false,
              "visible": true,
              "depends": [
                "gradeLevel"
              ]
            },
            {
              "code": "gradeLevel",
              "dataType": "text",
              "description": "Sub-Category",
              "editable": true,
              "index": 2,
              "inputType": "select",
              "label": "Sub-Category",
              "name": "Sub-Category",
              "placeholder": "Select Sub-Category",
              "renderingHints": {},
              "required": false,
              "visible": true
            },
            {
              "code": "subject",
              "dataType": "text",
              "description": "Topic",
              "editable": true,
              "index": 3,
              "inputType": "select",
              "label": "Topic",
              "name": "Topic",
              "placeholder": "Select Topic",
              "renderingHints": {},
              "required": false,
              "visible": true
            },


            {
              "code": "medium",
              "dataType": "text",
              "description": "Language",
              "editable": true,
              "index": 4,
              "inputType": "select",
              "label": "Language",
              "name": "Language",
              "placeholder": "Select Language",
              "renderingHints": {},
              "required": false,
              "visible": true
            }

          ]
        }
      }
    }


    this._httpService.createForm(tempArray1).subscribe(res => {

      this.addOrgrPopup = false

    }, err => {
    })
  }


  createPreference(rootOrgIdCreate: string) {
    let pref_obj: any
    pref_obj =
    {
      "request": {
        "orgId": rootOrgIdCreate,
        "key": "certRules",
        "data": {
          "templateName": "certRules",
          "action": "save",
          "fields": [
            {
              "code": "certTypes",
              "dataType": "text",
              "name": "certTypes",
              "label": "Certificate type",
              "description": "Select certificate",
              "editable": true,
              "inputType": "select",
              "required": true,
              "displayProperty": "Editable",
              "visible": true,
              "renderingHints": {
                "fieldColumnWidth": "twelve"
              },
              "range": [
                {
                  "name": "Completion certificate",
                  "value": {
                    "enrollment": {
                      "status": 2
                    }
                  }
                },
                {
                  "name": "Merit certificate",
                  "value": {
                    "score": ">= 98"
                  }
                }
              ],
              "index": 1
            },
            {
              "code": "issueTo",
              "dataType": "text",
              "name": "issueTo",
              "label": "Issue certificate to",
              "description": "Select",
              "editable": true,
              "inputType": "select",
              "required": true,
              "displayProperty": "Editable",
              "visible": true,
              "renderingHints": {
                "fieldColumnWidth": "twelve"
              },
              "range": [
                {
                  "name": "All",
                  "value": {
                    "user": {
                      "rootOrgId": ""
                    }
                  }
                },
                {
                  "name": "My Org User",
                  "rootOrgId": rootOrgIdCreate
                }
              ],
              "index": 2
            }
          ]
        }
      }
    }

    this._httpService.createPreference(pref_obj).subscribe(res => {
      this.addOrgrPopup = false
    }, err => {
      console.error("create preference failed", err)
    })

  }

  closepopupOrg(){
    this.addOrgrPopup=false
    this.editOrgrPopup=false
    this.editOrgrStatusPopup=false
    this.addRootOrgrPopup=false
    this.sucesErrorPopup=false
  }

  editOrgFormSubmit(){
    this.orgDataId = sessionStorage.getItem("orgDataId")
    this.userLoginDataChannel = sessionStorage.getItem("userLoginDataChannel")

    let tempArray: any
    tempArray =
    {
      "request": {
        "orgName": this.editOrgForm.value['orgName'],
        "description": this.editOrgForm.value['description'],
        "organisationId": this.orgDataId
      }

    }

    this._httpService.updateOrgDetail(tempArray).subscribe(res => {
      this.editOrgrPopup = false
      this.addRootOrgrPopup = false
      this.addOrgrPopup = false
      this.editOrgrStatusPopup = false
      this.sucesErrorPopup = true
      this.popupMsg = res.result.response;
      this.getUserProfileOrg();

    }, err => {
      this.popupMsg = err.error.params.errmsg;
    })
  }

  rootAdminOrgList() {
    this.dropdownList = [
      { "id": 1, "itemName": "PUBLIC" },
      { "id": 2, "itemName": "CONTENT_CREATOR" },
      { "id": 3, "itemName": "CONTENT_REVIEWER" },
      { "id": 4, "itemName": "COURSE_MENTOR" },
      { "id": 5, "itemName": "ORG_ADMIN" },
      { "id": 6, "itemName": "ORG_MANAGEMENT" },
      { "id": 7, "itemName": "ORG_MODERATOR" },

    ];
    return this.dropdownList;
  }

  subRootAdminOrgList() {
    this.dropdownList = [
      { "id": 1, "itemName": "PUBLIC" },
      { "id": 2, "itemName": "CONTENT_CREATOR" },
      { "id": 3, "itemName": "CONTENT_REVIEWER" },
      { "id": 4, "itemName": "COURSE_MENTOR" },
      { "id": 5, "itemName": "ORG_ADMIN" },
      { "id": 6, "itemName": "ORG_MODERATOR" },

    ];
  }

  /**
   * This method used for fetch role detail
   */
  addRole(gridUserId: any) {
    this.roleEditData = [];
    this.addRoleorgId = '';
    this.gridUserId = gridUserId;
    this.selectedItems = [];
    this.selectedItems = [
      { "id": 1, "itemName": "PUBLIC" }
    ];
    this._httpService.getEditUserById(gridUserId).subscribe(response => {
      this.roleEditeUserData = response.result.response;
      if (this.roleEditeUserData.organisations.length == 1) {
        this.addRolePopup = true
        this.rootAdminOrgList();
        this.roleEditData = this.roleEditeUserData.organisations[0].roles;
        this.addRoleorgId = this.roleEditeUserData.organisations[0].organisationId;
      }
      else if ((this.roleEditeUserData.organisations.length > 1) && (this.roleEditeUserData.rootOrgId != this.roleEditeUserData.organisations[1].organisationId)) {
        this.addRolePopup = true
        this.subRootAdminOrgList();
        this.roleEditData = this.roleEditeUserData.organisations[1].roles;
        this.addRoleorgId = this.roleEditeUserData.organisations[1].organisationId;
      }
      else if ((this.roleEditeUserData.organisations.length > 1) && (this.roleEditeUserData.rootOrgId == this.roleEditeUserData.organisations[1].organisationId)) {
        this.addRolePopup = true
        this.rootAdminOrgList();
        this.roleEditData = this.roleEditeUserData.organisations[0].roles;
        this.addRoleorgId = this.roleEditeUserData.organisations[0].organisationId;
      }
      this.populateEditRoles()
    }, (err) => {

    });
  }

  /**
   * This method used for fetch particular user organization data
   */

  getUserOrgList(userChannel: any) {

    let tempArray: any
    tempArray = {
      'request': {
        'query': '',
        'filters': {
          "channel": userChannel
        },
        'limit': 100
      }
    }
    this._httpService.getOrgDetail(tempArray).subscribe(res => {
      this.orgListArr = res.result.response.content;
      this.getOrgMentorList = this.orgListArr.sort(function (a, b) {
        return b.isRootOrg - a.isRootOrg
      })
      this.addorgSelectName = this.orgEditeUserData.rootOrg.orgName + '/' + this.orgEditeUserData.organisations[0].organisationId + '/' + true;
    }, err => {
    })

  }

  closepopup()
  {

    this.editeUserPopup= false
    this.confirmPopup=false;
    this.addUserPopup=false
    this.genericPopup=false
    this.addRolePopup = false
    this.addOrgPopup = false
    this.addRoleForm.reset()
   // this.populateUserProfile();
  }

  populateEditRoles(){
    if( this.roleEditData?.length > 0 ) {
      for( var i = 0; i < this.dropdownList.length; i++ ) {
       for( var j = 0; j < this.roleEditData.length; j++ ) {
         if(this.roleEditData[j] !="PUBLIC"){
         if( this.roleEditData[j] == this.dropdownList[i].itemName ) {
                 this.selectedItems.push({"id" :this.dropdownList[i].id,"itemName":this.dropdownList[i].itemName});
            }
          }
        }
      }
    }
  }

  /**
   * This method used for fetch org detail
   */
  addOrg(gridOrgUserId: any, username) {
    this.username = username
    this.gridOrgUserId = gridOrgUserId;
    this.selectedItems = [];
    this.selectedItems = [
      { "id": 1, "itemName": "PUBLIC" }
    ];
    this._httpService.getEditUserById(gridOrgUserId).subscribe(res => {
      this.orgEditeUserData = res.result.response;
      if (this.orgEditeUserData.organisations.length == 1) {
        this.addOrgPopup = true
        this.rootAdminOrgList();
        this.roleEditData = this.orgEditeUserData.organisations[0].roles;
        this.addRoleorgId = this.orgEditeUserData.organisations[0].organisationId;
        this.getUserOrgList(this.orgEditeUserData.channel)
        // this.populateEditRoles()
      }
      else if (this.orgEditeUserData.organisations.length > 1) {
        this.addOrgPopup = true
        this.subRootAdminOrgList();
        this.roleEditData = this.orgEditeUserData.organisations[1].roles;
        this.addRoleorgId = this.orgEditeUserData.organisations[1].organisationId;
        //this.addorgSelectName=this.orgEditeUserData.organisations[1].orgName+'/'+this.orgEditeUserData.organisations[1].organisationId+'/'+false;
      }
    }, (err) => {
    });

  }

  ///organization component code
  removeOrg(orgUserId: any) {
    this.removeOrgUserId = orgUserId;
    this._httpService.getEditUserById(this.removeOrgUserId).subscribe(res => {
      this.genericPopup = true
      if (res.result.response.organisations.length > 0) {
        if (res.result.response.rootOrgId != res.result.response.organisations[1].organisationId) {
          this.removeOrgUserdataAll = res.result.response.organisations[1].organisationId;
        }
        else {
          this.removeOrgUserdataAll = res.result.response.organisations[0].organisationId;
        }
      }
    }, (err) => {
    });


  }


  removeOrgSubmit() {
    this.removeOrgFormId = this.genericForm.value['genericId']
    let removeTempArray: any
    removeTempArray = {
      "request": {
        "organisationId": this.removeOrgFormId,
        "userId": this.genericForm.value['genericUserId']
      }
    }
    this._httpService.removeOrg(removeTempArray).subscribe(res => {
      this.genericPopup = false
      location.reload();
    }, (err) => {
    });

}


  blockState(userIds: any, blockId: any, index) {
    this.recordIndex = index
    this.blockUserid = userIds;
    this.blockId = blockId;
    this.confirmPopup = true;
    if (blockId == 1) {
      this.confirmPopupMsg = "Are you sure you want to block the user?";
    }
    if (blockId == 0) {
      this.confirmPopupMsg = "Are you sure you want to Unblock the user?";
    }
  }

  blockConfirmState() {
    this.confirmPopup = false;
    this.blockUserid = this.confirmUserForm.value['blockUserid']
    this.blockId = this.confirmUserForm.value['blockid']
    if (this.blockId == 1) {
      this.userBlock(this.blockUserid);
    }
    if (this.blockId == 0) {
      this.userUnBlock(this.blockUserid);
    }
  }

  findUserId(user_id, valueToUpdate){
    this.showUserData.forEach((user) => {
      if(user.userId == user_id){
        return user.uStatus = valueToUpdate;
      }
    })
  }

  /**
   * This method used for user block
   */
  userBlock(userIds: any) {
    // this.confirmPopup=false;
    let tempArray: any
    tempArray = {
      "request": {
        "userId": userIds
      }
    }
    this._httpService.userBlock(tempArray).subscribe(res => {
      if (res.result.response == 'SUCCESS') {
        this.findUserId(userIds, 0)
      }
    }, err => {
      this.sucesErrorPopup = true
      this.popupMsg = "User registration is incomplete and is already inactive..";
    })

  }
  /**
   * This method used for user unblock
   */
  userUnBlock(userIds: any) {
    // this.confirmPopup=false;
    let tempArray: any
    tempArray = {
      "request": {
        "userId": userIds
      }
    }
    this._httpService.userUnBlock(tempArray).subscribe(res => {

      if (res.result.response == 'SUCCESS') {
        this.findUserId(userIds, 1)
      }
    }, err => {
      this.populateUserProfile();
    })
  }

  show() {
    this.selectedItems = [];
    this.selectedItems = [
      { "id": 1, "itemName": "PUBLIC" }
    ];
    this.addUserPopup = false
    this.addUserPopup = true
    this.addRolePopup = false
    this.addOrgPopup = false
  }

  editOrgStatusFormSubmit(){
    this.orgDataId = sessionStorage.getItem("orgDataId")
    this.userLoginDataChannel = sessionStorage.getItem("userLoginDataChannel")
    this.orgStat = this.editStatusForm.value['orgStatus']
    let tempArray: any
    tempArray =
    {
      "request": {
        "status": Number(this.orgStat),
        "organisationId": this.orgDataId
      }
    }

    this._httpService.updateOrgStatusDetail(tempArray).subscribe(res => {
      // this.getUserOrganization()
      this.editOrgrPopup = false
      this.addRootOrgrPopup = false
      this.addOrgrPopup = false
      this.editOrgrStatusPopup = false
      this.sucesErrorPopup = true
      this.popupMsg = res.result.response;
      this.editStatusForm.reset()
      this.getUserProfileOrg();

    }, err => {
      this.sucesErrorPopup = true
      this.popupMsg = err.error.params.errmsg;
    })
  }

  closeOrgPopup() {
    this.checkOrgExistsPopup = false
  }

  closesubOrgSucesErrorPopup(){
    this.subOrgSucesErrorPopup = false;
  }

  closeSucesErrorPopup(){
    this.sucesErrorPopup = false
    window.location.reload();
  }

  superAdminOrgList() {
    this.dropdownList = [
      { "id": 1, "itemName": "PUBLIC" },
      { "id": 2, "itemName": "CONTENT_CREATOR" },
      { "id": 3, "itemName": "CONTENT_REVIEWER" },
      { "id": 4, "itemName": "COURSE_MENTOR" },
      { "id": 5, "itemName": "ORG_ADMIN" },
      { "id": 6, "itemName": "ORG_MODERATOR" },
      { "id": 7, "itemName": "ORG_MANAGEMENT" },
      { "id": 8, "itemName": "SYSTEM_ADMINISTRATION" },

    ];
    return this.dropdownList;
  }

  getSubRootOrganization(strOrg: any) {
    if (strOrg.target.value == 'yes') {
      this.subOrgofRoot = false;
      this.createUserForm.patchValue({
        subRootorgname: null
      })
    }
    else if (strOrg.target.value == 'no') {
      this.subOrgofRoot = true;
      if(this.createUserForm.value['orgname']){
        this.getRoleName(this.createUserForm.value['orgname'])
      }
    }
    if (this.systemVar == 'present') {
      if (this.createUserForm.value['isrootSub'] == 'yes') {
        this.superAdminOrgList();
      }
      else {
        this.subRootAdminOrgList();
      }
    }


  }

  getRoleName(str: any) {
    this.subMentorList = []
    this.createUserForm.value['isrootSub']
    this.strOrgname = str;
    this.onchangeorgName = this.strOrgname.split("/");
    if (this.systemVar == 'notpresent') {
      if (this.onchangeorgName[2] == "true") {
        this.rootAdminOrgList();
      }
      else {
        this.subRootAdminOrgList();
      }
    }
    else if (this.systemVar == 'present') {
      if (this.createUserForm.value['isrootSub'] == 'yes') {
        this.superAdminOrgList();
      }
      else {
        this.subRootAdminOrgList();
      }
    }
    if (this.createUserForm.value['isrootSub'] == 'no') {
      let rootOrgVal = this.createUserForm.value['orgname'];
      let channel = ''
      if(rootOrgVal){
        channel = rootOrgVal.split("/")[2];
      }

      this.onchangeorgId = this.onchangeorgName[1]
      let subOrgList: any;
      subOrgList = {
        "request": {
          "filters": {
             "isTenant": false,
             "channel": channel
          },
          "limit": 100,
          "offset": 0
        }

      }
      this._httpService.getSuborgData(subOrgList).subscribe(res => {
        this.subMentorList = res.result.response.content;
      }, err => {
      })
    }
  }

  /**
   * This method use for add user
   */
  createUserFormSubmit() {
    this.findePublic = false;
    this.roleDataArr = [];

    // return;

    this.userLoginDataChannel = sessionStorage.getItem("userLoginDataChannel")
    this.isRootSubCondition = this.createUserForm.value['isrootSub']
    this.orgId = this.createUserForm.value['orgname']
    this.onchangeorgName = this.orgId.split("/");
    this.onchangeorgId = this.onchangeorgName[1]
    this.onchangeChanelName = this.onchangeorgName[2]
    this.orgRootStatus = this.onchangeorgName[3]
    const currentDate = new Date();
    const timestamp = currentDate.getTime();
    let subOrg = this.createUserForm.value['subRootorgname']
    if(subOrg){
      this.onchangeorgId = subOrg
    }

    if (this.isRootSubCondition == 'no' && (this.createUserForm.value['subRootorgname'] == '' || this.createUserForm.value['subRootorgname'] == null)) {
      this.popupMsg = "Please select  the sub organization....";
      this.subOrgSucesErrorPopup = true

    }
    else {
      let tempArray: any
      tempArray =
      {
        "request": {
          "email": this.createUserForm.value['emailid'],
          "firstName": this.createUserForm.value['firstname'],
          "lastName": this.createUserForm.value['lastname'],
          "phone": this.createUserForm.value['phone'],
          "channel": this.onchangeChanelName,
          "userName": "username_" + timestamp,
          "phoneVerified": true,
          "emailVerified": true,
          "organisationId": this.onchangeorgId
        }
      }
      // return
      this._httpService.createUserDetailSave(tempArray).subscribe(res => {
        this.addUserPopup = false
        if (res.result.response == 'SUCCESS') {
          this.createUserId = res.result.userId
          this.addroleOrganization(this.createUserId, this.onchangeorgId, this.orgRootStatus, this.isRootSubCondition);
          // location.reload()
        }
      }, err => {

        this.popupMsg = err.error.params.errmsg;
        this.subOrgSucesErrorPopup = true;


      })
    }
  }

  /**
 * This method used for add role in user
 */
  addroleOrganization(creatUserId: any, orgId: any, orgRootStatus: any, isRootSubCondition: any) {
    this.popupMsg = '';
    let tempOrgArray: any
    this.selectedItems.forEach(element => {
      this.roleDataArr.push(element.itemName)
    });
    if (this.roleDataArr.length > 0) {
      for (var i = 0; i < this.dropdownList.length; i++) {
        if (this.roleDataArr[i] == "PUBLIC") {
          this.findePublic = true;
        }
      }
    }
    if (this.findePublic == false) {
      this.roleDataArr.push("PUBLIC");
    }
    tempOrgArray =
    {
      "request": {
        "organisationId": orgId,
        "roles": this.roleDataArr,
        "userId": creatUserId
      }
    }
    // return
    if (isRootSubCondition == 'yes' || isRootSubCondition == null) {
      if (orgRootStatus == "false") {
        this._httpService.addroleRootOrganization(tempOrgArray).subscribe(res => {
          this.sucesErrorPopup = true
          this.popupMsg = res.result.response;
          //this.populateUserProfile();
        }, err => {
          this.popupMsg = err.params.errmsg;
        })
      }
      if (orgRootStatus == "true") {
        this._httpService.addroleRootOrganization(tempOrgArray).subscribe(res => {
          this.sucesErrorPopup = true
          this.popupMsg = res.result.response;
          // this.populateUserProfile();
        }, err => {
          this.popupMsg = err.params.errmsg;
        })
      }
    }
    else if (isRootSubCondition == 'no') {
      tempOrgArray =
      {
        "request": {
          "organisationId": this.createUserForm.value['subRootorgname'],
          "roles": this.roleDataArr,
          "userId": creatUserId
        }
      }
      this._httpService.addroleRootOrganization(tempOrgArray).subscribe(res => {
        this.sucesErrorPopup = true
        this.popupMsg = res.result.response;
        // this.populateUserProfile();
      }, err => {
        this.popupMsg = err.params.errmsg;
      })
    }
  }

  /**
   * This method used for add role button form submit
   */
  addRoleFormSubmit() {
    this.findePublic = false;
    this.roleDataArr = [];
    this.orgId = this.addRoleForm.value['editroleorgid']
    this.gridUserId = this.addRoleForm.value['gridUserId']
    this.selectedItems.forEach(element => {
      this.roleDataArr.push(element.itemName)
    });
    if (this.roleDataArr.length > 0) {
      for (var i = 0; i < this.dropdownList.length; i++) {
        if (this.roleDataArr[i] == "PUBLIC") {
          this.findePublic = true;
        }
      }
    }
    if (this.findePublic == false) {
      this.roleDataArr.push("PUBLIC");
    }
    let addRoletempArray: any
    addRoletempArray =
    {
      "request": {
        "organisationId": this.orgId,
        "roles": this.roleDataArr,
        "userId": this.gridUserId
      }
    }
    //return;
    this._httpService.addroleRootOrganization(addRoletempArray).subscribe(res => {
      this.addRolePopup = false
      this.sucesErrorPopup = true
      this.popupMsg = res.result.response;
      //  this.populateUserProfile();
    }, err => {
      this.popupMsg = err.params.errmsg;
    })
  }

  /**
   * This method used for add org button form submit
   */
  addOrgFormSubmit() {
    this.findePublic = false;
    this.roleDataArr = [];
    this.gridOrgUserId = this.addOrgForm.value['gridOrgUserId']
    this.addOrgId = this.addOrgForm.value['addOrgname']
    this.onchangeaddOrgName = this.addOrgId.split("/");
    this.onchangeaddOrgId = this.onchangeaddOrgName[1]
    this.selectedItems.forEach(element => {
      this.roleDataArr.push(element.itemName)
    });
    if (this.roleDataArr.length > 0) {
      for (var i = 0; i < this.dropdownList.length; i++) {
        if (this.roleDataArr[i] == "PUBLIC") {
          this.findePublic = true;
        }
      }
    }
    if (this.findePublic == false) {
      this.roleDataArr.push("PUBLIC");
    }

    let addOrgtempArray: any
    addOrgtempArray =
    {
      "request": {
        "organisationId": this.onchangeaddOrgId,
        "userId": this.gridOrgUserId,
        "username": this.username
      }
    }
    //return;
    this._httpService.addroleSubRootOrganization(addOrgtempArray).subscribe(res => {
      this.addOrgPopup = false
      this.sucesErrorPopup = true
      this.popupMsg = res.result.response;
      if(res.result.response=='SUCCESS'){
        addOrgtempArray.request['roles'] = this.roleDataArr
        this._httpService.addroleRootOrganization(addOrgtempArray).subscribe();
      }
      //this.populateUserProfile();
    }, err => {
      this.popupMsg = err.params.errmsg;
    })
  }

}

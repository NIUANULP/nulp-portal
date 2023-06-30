import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { ResourceService, ToasterService, ServerResponse, ConfigService } from '@sunbird/shared';
import { AddusserService } from '../../services/addusser/addusser.service';
import { takeUntil } from 'rxjs/operators';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as _ from 'lodash-es';
import { Router } from '@angular/router';
import { UserService } from '@sunbird/core';
import { Angular2Csv } from 'angular2-csv';

@Component({
  selector: 'app-user-upload',
  templateUrl: './user-upload.component.html',
  styleUrls: ['./user-upload.component.scss']
})
export class UserUploadComponent implements OnInit {

  selectedMenu: string;
  @ViewChild('inputbtn') inputbtn: ElementRef;
  /**
  *Element Ref  for copyLinkButton;
  */
  @ViewChild('copyErrorData') copyErrorButton: ElementRef;
  /**
  * reference of config service.
  */
  public config: ConfigService;
  /**
   * To show / hide modal
   */
  public modalName = 'upload';
  /**
   * To call resource service which helps to use language constant
   */
  public resourceService: ResourceService;
  public file: any;
  public activateUpload = false;
  /**
  * Contains process id
  */
  public processId: string;
  /**
  * Used to display filename in html
  */
  public fileName: string;
  /**
  * contains upload instructions in an array
  */
  public userUploadInstructions: Array<any>;
  /**
  * To show/hide loader
  */
  public showLoader: boolean;
  public unsubscribe$ = new Subject<void>();
  private uploadUserRefLink: string;
  userProfile: any;
  organizationsList: any = [];
  showOrgError: boolean = false;
 

  /** 
   *  loader messages
   * 
  */
  header = { loaderMessage: 'Upload is in progress!'}

  /**
  * error object
  */
  public errors: [];
  /**
  * error object
  */
  public error: '';
  /**
  * Used to show/hide error message
  */
  public bulkUploadError: boolean;
  /**
  * Contains error message to show in html
  */
  public bulkUploadErrorMessage: string;
  /**
   * Upload org form name
   */
  public uploadUserForm: FormGroup;
  /**
  * Contains reference of FormBuilder
  */
  public sbFormBuilder: FormBuilder;
  /**
  * To show toaster(error, success etc) after any API calls
  */
  private toasterService: ToasterService;
  /**
  * Constructor to create injected service(s) object
  *
  * Default method of DetailsComponent class
  *
  * @param {ResourceService} resourceService To call resource service which helps to use language constant
  */
  public csvOptions = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalseparator: '.',
    showLabels: true,
    headers: []
  };

  constructor(resourceService: ResourceService, config: ConfigService, toasterService: ToasterService,
    formBuilder: FormBuilder, private _httpService: AddusserService, public router: Router, public userService: UserService) {
    this.resourceService = resourceService;
    this.sbFormBuilder = formBuilder;
    this.toasterService = toasterService;
    this.config = config;
    try {
      this.uploadUserRefLink = (<HTMLInputElement>document.getElementById('userUploadRefLink')).value;
    } catch (error) {
      console.log('Error in reading environment variable for user upload reference link');
    }
  }

  ngOnInit() {
    this.userService.userData$.subscribe(userdata => {
      if (userdata && !userdata.err) {
        this.userProfile = userdata.userProfile;
      }
    });

    this.uploadUserForm = this.sbFormBuilder.group({
      organisationId: [this.userProfile.rootOrgId],
      orgId: ['', null]
    });
    
    this.userUploadInstructions = [
      { instructions: this.resourceService.frmelmnts.instn.t0070 },
      {
        instructions: this.resourceService.frmelmnts.instn.t0071,
        subinstructions: [
          { instructions: this.resourceService.frmelmnts.instn.t0072 },
          { instructions: this.resourceService.frmelmnts.instn.t0073 },
          { instructions: this.resourceService.frmelmnts.instn.t0074 }
        ]
    }];
    this.showLoader = false;
    this.getOrgList();
  }

  public fileChanged(event) {
    this.file = event.target.files[0];
    this.activateUpload = true;
  }

  /**
  * This method helps to upload a csv file and return process id
  */
  public uploadUsersCSV() {
    const file = this.file;
    const data = this.uploadUserForm.value;
    if (file && file.name.match(/.(csv)$/i)) {
      this.showLoader = true;
      const formData = new FormData();
      formData.append('user', file);
      const fd = formData;
      this.fileName = file.name;
      this._httpService.bulkUserUpload(fd).pipe(
        takeUntil(this.unsubscribe$))
        .subscribe(
          (apiResponse: ServerResponse) => {
            this.showLoader = false;
            this.processId = apiResponse.result.processId;
            this.activateUpload = false
            this.toasterService.success(this.resourceService.messages.smsg.m0030);
          },
          err => {
            this.showLoader = false;
            const errorMsg = _.get(err, 'error.params.errmsg') ? _.get(err, 'error.params.errmsg').split(/\../).join('.<br/>') :
              this.resourceService.messages.fmsg.m0051;
            this.error = errorMsg.replace('[', '').replace(']', '').replace(/\,/g, ',\n');
            this.errors = errorMsg.replace('[', '').replace(']', '').split(',');
            this.modalName = 'error';
          });
    } else if (file && !(file.name.match(/.(csv)$/i))) {
      this.showLoader = false;
      this.toasterService.error(this.resourceService.messages.stmsg.m0080);
    }
  }

  /**
  * This method helps to call uploadOrg method to upload a csv file
  */
  public openImageBrowser(inputbtn: any) {
    this.bulkUploadError = false;
    this.bulkUploadErrorMessage = '';
    inputbtn.click();
  }

  public redirect() {
    this.fileName = '';
    this.processId = '';
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
  * This method is used to show error message
  */
  public closeBulkUploadError() {
    this.modalName = 'upload';
  }

  validateOrg() {
    if (!_.isEmpty(this.uploadUserForm.value.orgId)) {
      this.showOrgError = false;
    }
  }

  public copyToClipboard() {
    const element = (<HTMLInputElement>document.getElementById('errorTextArea'));
    element.value = '';
    element.value = this.error;
    element.select();
    document.execCommand('copy');
  }

  /**
 * This method helps to download a sample csv file
 */
   public downloadSampleCSV() {
    const options = {
      fieldSeparator: ',',
      // quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      useBom: false,
      headers: ['firstName', 'phone', 'email', 'orgId', 'userType', 'roles'],
    };
    const csvData = [{
      'firstName': '',
      'phone': '',
      'email': '',
      'orgId': this.uploadUserForm.value.orgId,
      'userType': '',
      'roles': ''
    }];
    if (!_.isEmpty(this.uploadUserForm.value.orgId)) {
      const csv = new Angular2Csv(csvData, 'Sample_Users', options);
    } else {
      this.showOrgError = true;
    }
  }

  getOrgList() {
    this.organizationsList = this.userProfile.organisations;
  }

  chooseMenu(selectedMenu, url) {
    this.selectedMenu = selectedMenu;
    this.router.navigate([url]);
  }
}

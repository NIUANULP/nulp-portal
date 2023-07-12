import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UploadCertificateService } from '../../../certificate/services/upload-certificate/upload-certificate.service';
import { catchError, tap } from 'rxjs/operators';
import _ from 'lodash';
import { combineLatest, of, Subject } from 'rxjs';
import { ResourceService, NavigationHelperService, ToasterService, LayoutService, COLUMN_TYPE } from '@sunbird/shared';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '@sunbird/core';
// import {FileuploadService } from '../../services/fileupload/fileupload.service';
export interface IConfigLabels {
  label: string;
  name: string;
  show: boolean;
}

// import { CoursesService } from 'src/app/modules/core';
@Component({
  selector: 'app-certificate-template-upload',
  templateUrl: './certificate-template-upload.component.html',
  styleUrls: ['./certificate-template-upload.component.scss']
})
export class CertificateTemplateUploadComponent implements OnInit {

  addTemplatePopup: boolean = false;
  templateGuidePopup: boolean = false;
  removeTemplatePopup: boolean = false;
  fileUploadForm: FormGroup
  showLoader = false
  certTemplateList: Array<{}> = [];
  // previewTemplate: any;
  // showPreviewModal;
  queryParams: any;
  // configurationMode: string;
  // config: { select: IConfigLabels, preview: IConfigLabels, remove: IConfigLabels };
  // fileToUpload: File | null = null;
  // public fileName: any;
  // public file: any;
  // public isUploadCsvEnable = false;


  constructor(private formBuilder: FormBuilder,
    public uploadCertificateService: UploadCertificateService,
    private toasterService: ToasterService,
    private resourceService: ResourceService,
    private activatedRoute: ActivatedRoute,
    public userService: UserService,
    // private fileuploadService: FileuploadService
    ) { }

  ngOnInit(): void {
    this.fileUploadForm = this.formBuilder.group({
      fileuploadName: ['', [Validators.required]],
      file: ['', [Validators.required]],
    });

    this.getTemplateList();

    this.activatedRoute.queryParams.subscribe((params) => {
      this.queryParams = params;
      // this.configurationMode = _.get(this.queryParams, 'type');
    });
  }


  closeSucesErrorPopup(){
    this.addTemplatePopup = false;
    // this.UploadTemplate = true;
    window.location.reload();
  }

  // handleFileInput(files: FileList) {

  //   this.fileToUpload = files.item(0);
  // }

  // uploadFileToActivity() {
  //   this.fileuploadService.postFile(this.fileToUpload).subscribe(data => {
  //     // do something, if upload success
  //     }, error => {

  //     });
  // }

  /**
   * @description - It will prepare the config data for the hover activity of the cert-list cards.
   */
  //  initializeLabels() {
  //   this.config = {
  //     select: {
  //       label: _.get(this.resourceService, 'frmelmnts.lbl.Select'),
  //       name: 'Select',
  //       show: true
  //     },
  //     preview: {
  //       label: _.get(this.resourceService, 'frmelmnts.cert.lbl.preview'),
  //       name: 'Preview',
  //       show: true
  //     },
  //     remove: {
  //       label: _.get(this.resourceService, 'frmelmnts.cert.lbl.unselect'),
  //       name: 'Remove',
  //       show: false
  //     }
  //   };
  // }

  // getConfig(config: { show: boolean, label: string, name: string }, template) {
  //   // const show = _.get(this.selectedTemplate, 'name') === _.get(template, 'name');
  //   if (_.lowerCase(_.get(config, 'label')) === 'select') {
  //     //return ({ show: !show, label: config.label, name: config.name });
  //   } else {
  //     return ({ show: 1, label: config.label, name: config.name });
  //   }
  // }

  /**
   * @description - It will fetch list of certificate templates from preference api.
   */
   getTemplateList() {
    const request = {
      'request': {
          'filters': {
              'certType': 'cert template',
              'channel': this.userService.channel,
              'mediaType': 'image'
          },
          'sort_by': {
            'lastUpdatedOn': 'desc'
          },
          'fields': ['indentifier', 'name', 'code', 'certType', 'data', 'issuer', 'signatoryList', 'artifactUrl', 'primaryCategory', 'channel'],
          'limit': 100
      }
    };

    this.uploadCertificateService.getCertificates(request).subscribe((certTemplateData:any)=>{
      const templatList = _.get(certTemplateData, 'result.content');

      this.certTemplateList = templatList;

    });
  }

  // handleCertificateEvent(event, template: {}) {
  //   switch (_.lowerCase(_.get(event, 'name'))) {
  //     case 'preview':
  //       this.previewTemplate = template;
  //       this.showPreviewModal = true;
  //       this.sendInteractData({ id: 'preview-template' });
  //       break;
  //   }
  // }

  // sendInteractData(interactData) {
  //   const data = {
  //     context: {
  //       env: this.activatedRoute.snapshot.data.telemetry.env,
  //       cdata: [{
  //         type: 'Batch',
  //         id: _.get(this.queryParams, 'batchId')
  //       },
  //       {
  //         type: 'Course',
  //         id: _.get(this.queryParams, 'courseId')
  //       }]
  //     },
  //     edata: {
  //       id: _.get(interactData, 'id'),
  //       type: 'CLICK',
  //       pageid: this.activatedRoute.snapshot.data.telemetry.pageid
  //     }
  //   };

  //   // this.telemetryService.interact(data);
  // }


  handleFileInput(event) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.fileUploadForm.patchValue({
        file: file
      });
    }
  }

  // handleFileInput_old(event) {

  //   if (event && event.target && event.target.files) {
  //     this.file = event.target.files[0];
  //     this.fileName = this.file.name;
  //     this.isUploadCsvEnable = true;
  //   } else {
  //     this.isUploadCsvEnable = false;
  //   }


  // }

  submit(){
    // if (this.fileUploadForm.valid) {
      this.showLoader = true;
      const formData = new FormData();
      const file = this.fileUploadForm.get('file').value;
      // file.name = this.fileUploadForm.get('fileuploadName').value;
      // this.file.name = this.fileName;
      formData.append('uploads', file);

    // }

  }

  deleteTemplate(){

  }

}

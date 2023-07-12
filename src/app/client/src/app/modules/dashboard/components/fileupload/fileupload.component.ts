import { Component, OnInit } from '@angular/core';
import { UploadCertificateService } from '../../../certificate/services/upload-certificate/upload-certificate.service';
import { UserService, CertRegService } from '@sunbird/core';
import _ from 'lodash';
import { ToasterService, ResourceService, NavigationHelperService, LayoutService, COLUMN_TYPE } from '@sunbird/shared';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, Validators} from '@angular/forms';

@Component({
  selector: 'app-fileupload',
  templateUrl: './fileupload.component.html',
  styleUrls: ['./fileupload.component.scss']
})
export class FileuploadComponent implements OnInit {

  loading: boolean = false; // Flag variable
  file: File = null; // Variable to store file
  localUrl: any[];
  myForm = new FormGroup({
    fileName: new FormControl('', [Validators.required, Validators.minLength(3)]),
    file: new FormControl('', [Validators.required]),
    fileSource: new FormControl('', [Validators.required])
  });
  templateGuidePopup: boolean = false;
  removeTemplatePopup: boolean = false;
  sucesErrorPopup: boolean = false;
  popupMsg: any;

  // Inject service
  constructor(
    public uploadCertificateService: UploadCertificateService,
    public userService: UserService,
    public toasterService: ToasterService,
    public resourceService: ResourceService,
    private http: HttpClient
     ) { }

  ngOnInit(): void {
  }

  get f(){
    return this.myForm.controls;
  }

  /**
   * File upload on change
   * @param event
   */
  onFileChange(event) {

    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.myForm.patchValue({
        fileSource: file
      });
    }

  }

  /**
   * Create randum number
   * @param min
   * @param max
   * @returns
   */
  randomNumber(min, max) {
    return  Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Create Cerificate Assest
   */
  createCertTemplate() {
     const randomValue = this.randomNumber(0, 9999);
     const channel = this.userService.channel;
     const fileName = this.myForm.get('fileName').value;
     const issuer = {
        "name": "NULP",
        "url": "https://org_site.org"
     };
     const signatoryList = {
        "image": "https://cdn.pixabay.com/photo/2014/11/09/08/06/signature-523237__340.jpg",
        "name": "NULP",
        "id": "nulp",
        "designation": "CEO"
     };
     const requestBody = {
            'request': {
                'asset': {
                    'name': fileName,
                    'code': 'certificateTitle_' + randomValue,
                    'mimeType': 'image/svg+xml',
                    'license': 'CC BY 4.0',
                    'primaryCategory': 'Certificate Template',
                    // 'contentType': 'Asset',
                    'mediaType': 'image',
                    'certType': 'cert template',
                    'channel': channel,
                    'issuer': issuer,
                    'signatoryList': [signatoryList]
                }
            }
        };


        this.uploadCertificateService.createCertTemplate(requestBody).subscribe(response => {
            const assetId = _.get(response, 'result.identifier');
            this.uploadTemplate(this.myForm.get('fileSource').value, assetId);
        }, error => {
            this.toasterService.error('Something went wrong, please try again later');
        });
  }

  /**
   * Upload svg file
   * @param fileUrl
   * @param identifier
   */
  uploadTemplate(fileUrl, identifier) {
    this.uploadCertificateService.uploadTemplate(fileUrl, identifier).subscribe(response=>{
      this.toasterService.success(_.get(this.resourceService, 'frmelmnts.cert.lbl.certAddSuccess'));
      const templateIdentifier = {'identifier': _.get(response , 'result.identifier')};
      const cerificateNext = this.uploadCertificateService.certificate.next(templateIdentifier);

      // this.sucesErrorPopup = true
      // this.popupMsg = 'frmelmnts.cert.lbl.certAddSuccess';
      this.myForm.reset();
    }, error => {
      // this.popupMsg = 'Something went wrong, please try again later';
      this.toasterService.error('Something went wrong, please try again later');
    });
  }

  submit(){}

  closeSucesErrorPopup(){
    // this.sucesErrorPopup = false
    // window.location.reload();
  }
}
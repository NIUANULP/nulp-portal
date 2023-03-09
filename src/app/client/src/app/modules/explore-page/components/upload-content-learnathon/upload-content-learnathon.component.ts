import { Component, OnInit } from "@angular/core";

import { LearnerService, ActionService, UserService, OrgDetailsService, FrameworkService, FormService } from "@sunbird/core";import { ContentService } from "./../../../../modules/core/services/content/content.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Observable } from "rxjs/internal/Observable";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { UploadContentService } from "./upload-content.service";
import { forkJoin } from "rxjs";
import { NavigationHelperService } from '@sunbird/shared';

// Added by Komal
import { first, mergeMap, map, filter } from 'rxjs/operators';
import { of, throwError, Subscription } from 'rxjs';
import * as _ from 'lodash-es';
import { ResourceService, ToasterService } from '@sunbird/shared';
import {FormControl} from '@angular/forms';

@Component({
  selector: "app-upload-content-learnathon",
  templateUrl: "./upload-content-learnathon.component.html",
  styleUrls: ["./upload-content-learnathon.component.scss"],
})
export class UploadContentLearnathonComponent implements OnInit {
  public formFieldProperties: any;
  public formData: any;
  public solutionTitle: string;
  public userEmail: string;
  public userPhone: string;
  public otherSubCategory: string;
  public file!: File;
  userProfile: any;
  categories : any = [];
  subCategories: any = [];
  state: string;
  fileUpload: boolean = true;
  isOtherCategory: boolean = false;
  linkToUpload : string;  

// Added by komal
  private userFramework: Subscription;
  private custodianOrg = false;
  private custodianOrgBoard: any = {};
  isGuestUser = false;
  public selectedOption: any = {};
  private frameWorkId: string;
  private custOrgFrameworks: any;
  public allowedFields = ['board', 'medium', 'gradeLevel', 'subject'];
  private _formFieldProperties: any;
  guestUserHashTagId;
  private categoryMasterList: any = {};
  public formFieldOptions = [];
  public showButton = false;
  formInput: any = {};
  uploadContentForm: FormGroup;
  uploadContentSbForm: FormBuilder;
  selectedSubThemes: any;
  formFieldTheme: any;
  formFieldSubTheme:any;

  constructor(
    private learnerService: LearnerService,
    private contentService: ContentService,
    private http: HttpClient,
    public actionService: ActionService,
    public userService: UserService,
    public navigationHelperService: NavigationHelperService,
    private orgDetailsService: OrgDetailsService,
    private frameworkService: FrameworkService,
    private formService: FormService,
    private toasterService: ToasterService,
    public resourceService: ResourceService,
    formBuilder: FormBuilder,
    private uploadContentService: UploadContentService
  ) {
    this.state = 'upForReview';
    this.formFieldProperties = {
      fields: [
        {
          code: "name",
          description: "Name of the content",
          validations: [
            {
              message: "Input is Exceeded",
              type: "max",
              value: "120",
            },
            {
              message: "Title is required",
              type: "required",
            },
          ],
          dataType: "text",
          placeholder: "Title",
          required: true,
          editable: true,
          label: "Title",
          visible: true,
          renderingHints: {
            class: "sb-g-col-lg-1 required",
          },
          inputType: "text",
          name: "Name",
        },
      ],
    };
  //  console.log(this.formFieldProperties.fields);
  //  console.log(this.formFieldProperties.fields);
  }

  ngOnInit(): void {
    this.categories = this.uploadContentService.getTheme();

    // Added by komal
    this.selectedOption = _.pickBy(_.cloneDeep(this.formInput), 'length') || { "board": [], "gradeLevel": [],"medium": [],"id": [ "nulp-learnathon" ] }; // clone selected field inputs from parent
      
    this.userFramework = this.isCustodianOrgUser().pipe(
      mergeMap((custodianOrgUser: boolean) => {
        this.custodianOrg = custodianOrgUser;
        if (this.isGuestUser) {
          //return this.getFormOptionsForCustodianOrgForGuestUser();
        } else if (custodianOrgUser) {
          return this.getFormOptionsForCustodianOrg();
        } else {
          return this.getFormOptionsForOnboardedUser();
        }
      }), first()).subscribe(data => {
        this.formFieldOptions = data;
        // console.log('formFieldOptions - ', data);
      }, err => {
        this.toasterService.warning(this.resourceService.messages.emsg.m0012);
        // this.navigateToLibrary();
      });

  }

  // Added by komal

  selectedTheme(theme, themeCode) {
    this.formFieldTheme = theme;
    const isSelectedTheme = this.formFieldOptions[0].range.filter((item) => item.name === theme);
    // console.log(isSelectedTheme[0]);
    
    this.selectedSubThemes = isSelectedTheme[0].associations;
    // console.log(this.selectedSubThemes);
    
    this.selectedOption['medium'] = "";
    this.isOtherCategory = false;
  }

  selectedSubTheme(subTheme, themeCode){
    this.formFieldSubTheme = subTheme;
    if(this.formFieldSubTheme === "Other Sub-Domain")
      this.isOtherCategory = true;
    else
      this.isOtherCategory = false;
    
  }

  private isCustodianOrgUser() {
    return this.orgDetailsService.getCustodianOrgDetails().pipe(map((custodianOrg) => {
      if (_.get(this.userService, 'userProfile.rootOrg.rootOrgId') === _.get(custodianOrg, 'result.response.value')) {
        return true;
      }
      return false;
    }));
  }

  private getFormOptionsForCustodianOrg() {
    this.selectedOption.board = _.get(this.selectedOption, 'board[0]');
    this.frameWorkId = _.get(_.find(this.custOrgFrameworks, { 'name': this.selectedOption.board }), 'identifier');
    return this.getFormatedFilterDetails().pipe(map((formFieldProperties) => {
      this._formFieldProperties = formFieldProperties;
      return this._formFieldProperties;
    }));
  }

  private getFormOptionsForOnboardedUser() {
    return this.getFormatedFilterDetails().pipe(map((formFieldProperties) => {
      this._formFieldProperties = formFieldProperties;
      if (_.get(this.selectedOption, 'board[0]')) {
        this.selectedOption.board = _.get(this.selectedOption, 'board[0]');
      }
      return this._formFieldProperties;
    }));
  }

  private getFormatedFilterDetails() {
    if (this.isGuestUser) {
      this.frameworkService.initialize(this.frameWorkId, this.guestUserHashTagId);
    } else {
      this.frameworkService.initialize(this.frameWorkId);
    }
    return this.frameworkService.frameworkData$.pipe(
      filter((frameworkDetails) => { // wait to get the framework name if passed as input
        if (!frameworkDetails.err) {
          const framework = this.frameWorkId ? this.frameWorkId : 'defaultFramework';
          if (!_.get(frameworkDetails.frameworkdata, framework)) {
            return false;
          }
        }
        return true;
      }),
      mergeMap((frameworkDetails) => {
        if (!frameworkDetails.err) {
          const framework = this.frameWorkId ? this.frameWorkId : 'defaultFramework';
          const frameworkData = _.get(frameworkDetails.frameworkdata, framework);
          this.frameWorkId = frameworkData.identifier;
          this.categoryMasterList = frameworkData.categories;
          return this.getFormDetails();
        } else {
          return throwError(frameworkDetails.err);
        }
      }), map((formData: any) => {
        const formFieldProperties = _.filter(formData, (formFieldCategory) => {
          formFieldCategory.range = _.get(_.find(this.categoryMasterList, { code: formFieldCategory.code }), 'terms') || [];
          return true;
        });
        return _.sortBy(_.uniqBy(formFieldProperties, 'code'), 'index');
      }), first());
  }


  private getFormDetails() {
    const formServiceInputParams = {
      formType: 'user',
      formAction: 'update',
      contentType: 'framework',
      framework: this.frameWorkId
    };
    const hashTagId = this.isGuestUser ? this.guestUserHashTagId : _.get(this.userService, 'hashTagId');
    return this.formService.getFormConfig(formServiceInputParams, hashTagId);
  }

  private getUpdatedFilters(field, editMode = false) {
    const targetIndex = field.index + 1; // only update next field if not editMode
    const formFields = _.reduce(this.formFieldProperties, (accumulator, current) => {
      if (current.index === targetIndex || editMode) {
        const parentField: any = _.find(this.formFieldProperties, { index: current.index - 1 }) || {};
        const parentAssociations = _.reduce(parentField.range, (collector, term) => {
          const selectedFields = this.selectedOption[parentField.code] || [];
          if ((selectedFields.includes(term.name) || selectedFields.includes(term.code))) {
            const selectedAssociations = _.filter(term.associations, { category: current.code }) || [];
            collector = _.concat(collector, selectedAssociations);
          }
          return collector;
        }, []);
        const updatedRange = _.filter(current.range, range => _.find(parentAssociations, { code: range.code }));
        current.range = updatedRange.length ? updatedRange : current.range;
        current.range = _.unionBy(current.range, 'identifier');
        if (!editMode) {
          this.selectedOption[current.code] = [];
        }
        accumulator.push(current);
      } else {
        if (current.index <= field.index) { // retain options for already selected fields
          const updateField = current.code === 'board' ? current : _.find(this.formFieldOptions, { index: current.index });
          accumulator.push(updateField);
        } else { // empty filters and selection
          current.range = [];
          this.selectedOption[current.code] = [];
          accumulator.push(current);
        }
      }
      return accumulator;
    }, []);
    return formFields;
  }

  public handleFieldChange(event, field) {

    if ((!this.isGuestUser || field.index !== 1) && (!this.custodianOrg || field.index !== 1)) { // no need to fetch data, just rearrange fields
      this.formFieldOptions = this.getUpdatedFilters(field);
      this.enableSubmitButton();
      return;
    }
    if (_.get(this.selectedOption, field.code) === 'CBSE/NCERT') {
      this.frameWorkId = _.get(_.find(field.range, { name: 'CBSE' }), 'identifier');
    } else {
      this.frameWorkId = _.get(_.find(field.range, { name: _.get(this.selectedOption, field.code) }), 'identifier');
    }
    if (this.userFramework) { // cancel if any previous api call in progress
      this.userFramework.unsubscribe();
    }
    this.userFramework = this.getFormatedFilterDetails().pipe().subscribe(
      (formFieldProperties) => {
        if (!formFieldProperties.length) {
        } else {
          this._formFieldProperties = formFieldProperties;
          this.mergeBoard();
          this.formFieldOptions = this.getUpdatedFilters(field);
          this.enableSubmitButton();
        }
      }, (error) => {
        this.toasterService.warning(this.resourceService.messages.emsg.m0012);
        // this.navigateToLibrary();
      });
  }

  private mergeBoard() {
    _.forEach(this._formFieldProperties, (field) => {
      if (field.code === 'board') {
        field.range = _.unionBy(_.concat(field.range, this.custodianOrgBoard.range), 'name');
      }
    });
  }

  private enableSubmitButton() {
    // const optionalFields = _.map(_.filter(this._formFieldProperties, formField => !_.get(formField, 'required')), 'code');
    // const enableSubmitButton = _.every(this.selectedOption, (value, index) => {
    //   return _.includes(optionalFields, index) ? true : value.length;
    // });
    // if (enableSubmitButton) {
    //   this.showButton = true;
    // } else {
    //   this.showButton = false;
    // }
  }

  // End Added by komal

  onCategorySelect(category){
    let subCategoriessss = [];
    subCategoriessss = this.uploadContentService.getSubTheme().filter(
      e => {
        if (e.id == category.target.value){
          return e.categories;
        }
      }
    );

    this.subCategories = subCategoriessss[0].categories;
  }
  

  onTypeSelect(event:any) {
    if(event.target.value === "youtube"){
      this.fileUpload = false;
    } else {
      this.fileUpload = true;
    }
  }

  outputData(eventData: any) {}

  onStatusChanges(event) {
  }

  valueChanges(value: any) {
    this.formData = value;

    // console.log(this.formData);
  }

  onUpload(event) {
    this.file = event.target.files[0];
  //  console.log(this.file);
  }

  onTitleChange(title) {
  //  console.log(title);
    this.solutionTitle = title; 
  }

  onEmailChange(email) {
  //  console.log(email);
    this.userEmail = email;    
  }

  onMobileChange(phone) {
  //  console.log(phone);
    this.userPhone = phone;    
  }

  onSubCategoryChange(otherSubCategory) {
    this.otherSubCategory = otherSubCategory;
  }
  // onLinkChange(link) {
  //   console.log(link);
  //   this.linkToUpload = link; 
  // }

  onSubmit() {
    // call all methods with respective api in sequence

    if (this.isUserLoggedIn()) {
      this.userProfile = this.userService.userProfile;
    } else {
      alert("Please login before filling form!");
      return;
    }


    if(!this?.solutionTitle?.trim()){
      alert("Please Enter a name");
      return;
    }

    if(!this?.userEmail?.trim()) {
      alert("Please enter email");
      return;
    }

    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(this.userEmail)){
    } else {
      alert("Please enter a valid email!")
      return;
    }

    if(!this?.userPhone?.trim()) {
      alert("Please enter phone number");
      return;
    }

    if(!(/^\(?([1-9]{1})\)?([0-9]{9})$/.test(this.userPhone))) {
      alert("Please enter a valid phone number");
      return;
    } else {
    }

    if(!this.formFieldTheme){
      alert("Please select a Theme");
      return;
    }

    if(!this.formFieldSubTheme){
      alert("Please select a Sub - Theme")
      return;
    }

    if(this.isOtherCategory && !this?.otherSubCategory?.trim()) {
      alert("Please specify other sub category");
      return;
    }

    if (this.fileUpload && !this?.file?.name) {
      alert("Please select a file to upload");
      return;
    }

    if (!this.fileUpload && !this.linkToUpload.trim()){
      alert("Please select a valid Youtube Link to upload");
      return;
    }

    if(!this.hasExtension(this.file.name))
      return;

    let confirmation = `Are you sure you want to submit your proposal? You will not be able to edit your proposal once you submit`;

    if (confirm(confirmation) !== true) {
      return;
      // change UI
    } 

    this.sendToServer()    
  }

  sendToServer() {
    this.actionService.post(this.getCreateDataOptions()) // first API call to create
      .pipe(
        map((res: any) => {
          let idOfContentCreated = res.result.identifier;
          forkJoin({
            addUrl : this.actionService.post(this.getUploadURLOptions(idOfContentCreated)), // call for url update
            addFile: this.actionService.post(this.getUploadContentOptions(idOfContentCreated)) // call for upload content
          }).pipe(map((result) => {
            this.actionService.post(this.getReviewOptions(idOfContentCreated)).subscribe((res2) => { // call for review
              alert("Your Application was submitted successfully!");
              // redirection

              this.navigationHelperService.navigateToWorkSpace('/resources');

            },
            (error) => {
              console.log(error,"ERROR4")
              alert("Error4");
            })
          })).subscribe((r) => {},(error) => {
            console.log(error,"ERROR23")
            alert("Error23");
         })
        })
      )
      .subscribe((r) => { console.log("SUCCESSSS")},
      (error) => {
         console.log(error,"ERROR1")
         alert("Error1");
         this.navigationHelperService.navigateToWorkSpace('/resources');
        // this.workSpaceService.navigateToContent(content, this.state);
      })
  }

  getCreateDataOptions() {

    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    const lengthOfCode = 10;
    
    const createData = {
      request: {
        content: {
          name: this.solutionTitle,
//          description: this.userEmail,
          userEmail: this.userEmail,
          userPhone : this.userPhone,
          specifiedSubCategory : this.otherSubCategory,
          code: this.solutionTitle.split(" ").join("") + this.makeRandom(lengthOfCode, possible), //uuid
          mimeType: this.getContentType(this.file),
          contentType: "Resource",
          resourceType: "Learn",
          creator:
            this.userProfile?.firstName + " " + this.userProfile?.lastName, // name of creator
          framework: "nulplearnathon",
          organisation: ["nulp-learnathon"],
          primaryCategory: "Learning Resource",
          board:this.formFieldTheme,
          medium:[this.formFieldSubTheme],
          // gradeLevel:["Good Practices Competition"],
          createdBy: this.userProfile.identifier, // get current userId
          createdFor: ["0137299712231669762"], //
        },
      },
    };

    // console.log(createData.request);

    const options = {
      url: "content/v3/create",
      data: createData,
    };

    return options;
  }

  // createContent() {
  //   this.actionService.post(this.getCreateDataOptions()).subscribe(
  //     (res) => {
  //       if (res.result.response == "SUCCESS") {
  //         return res;
  //       }
  //     },
  //     (err) => {
  //       console.log(err);
  //     }
  //   );
  // }

  getUploadURLOptions(identifier) {
    const options = {
      url: "content/v3/upload/url/" + identifier,
      data: {
        request: {
          content: {
            fileName: this.file.name,
          },
        },
      },
    };

    return options;
  }

  getUploadContentOptions(identifier) {
    const formData = new FormData();
    formData.append("file", this.file);
    const options = {
      url: "content/v3/upload/" + identifier,
      data: formData
    }

    return options;
  }

  getReviewOptions(identifier){
    const options = {
      url: "content/v3/review/" + identifier,
      data: {},
    };

    return options;
  }

  sendForReview() {
    throw new Error("Method not implemented.");
  }

  makeRandom(lengthOfCode: number, possible: string) {
    let text = "";
    for (let i = 0; i < lengthOfCode; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  getContentType(file: File) {
    console.log(file.name);

    const extension = this.hasExtension(file.name);
    if (!extension) return;

    console.log(extension);

    switch (extension) {
      case "pdf":
        return "application/pdf";
        break;
      case "mp4":
        return "video/mp4";
        break;
      // case "html5" || "html":
      //   break;
      case "zip":
        return "application/vnd.ekstep.html-archive";
        break;
      case "h5p":
        return "application/vnd.ekstep.h5p-archive";
        break;
      // default:
      // code block
    }
  }

  hasExtension(fileName) {
    console.log(fileName);

    const allowedExtensions = ["pdf", "mp4", "zip", "h5p"]//, "html5",];
    const extension = fileName
      .substr(fileName.lastIndexOf(".") + 1)
      .toLowerCase();
    console.log(extension, "extension");

    if (fileName.length > 0) {
      if (allowedExtensions.indexOf(extension) === -1) {
        alert(
          "Invalid file Format. Only " +
            allowedExtensions.join(", ") +
            " are allowed."
        );
        return "";
      }
      return extension;
    }
  }

  public isUserLoggedIn(): boolean {
    return this.userService && (this.userService.loggedIn || false);
  }

}

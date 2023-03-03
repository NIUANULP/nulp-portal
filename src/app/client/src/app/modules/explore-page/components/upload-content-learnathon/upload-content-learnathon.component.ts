import { Component, OnInit } from "@angular/core";

import { LearnerService, ActionService, UserService } from "@sunbird/core";
import { ContentService } from "./../../../../modules/core/services/content/content.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Observable } from "rxjs/internal/Observable";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { UploadContentService } from "./upload-content.service";
import { forkJoin } from "rxjs";
import { map } from 'rxjs/operators';
import { NavigationHelperService } from '@sunbird/shared';

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
  public file!: File;
  userProfile: any;
  categories : any = [];
  subCategories: any = [];
  state: string;
  fileUpload: boolean = true;
  linkToUpload : string;  
  constructor(
    private learnerService: LearnerService,
    private contentService: ContentService,
    private http: HttpClient,
    public actionService: ActionService,
    public userService: UserService,
    public navigationHelperService: NavigationHelperService,
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
    console.log(this.formFieldProperties.fields);
  }

  ngOnInit(): void {
    this.categories = this.uploadContentService.getTheme();

  }

  onCategorySelect(category){
    console.log(category);
    let subCategoriessss = [];
    subCategoriessss = this.uploadContentService.getSubTheme().filter(
      e => {
        if (e.id == category.target.value){
          console.log(e.categories);
          
          return e.categories;
        }
      }
    );

    this.subCategories = subCategoriessss[0].categories;
    console.log(this.subCategories);
    console.log("subcategories");
  }
  

  onTypeSelect(event:any) {
    console.log(event.target.value, "EVT");
    if(event.target.value === "youtube"){
      this.fileUpload = false;
    } else {
      this.fileUpload = true;
    }
  }

  outputData(eventData: any) {}

  onStatusChanges(event) {
    // console.log(event);
  }

  valueChanges(value: any) {
    this.formData = value;

    // console.log(this.formData);
  }

  onUpload(event) {
    this.file = event.target.files[0];
    console.log(this.file);
  }

  onTitleChange(title) {
    console.log(title);
    this.solutionTitle = title; 
  }

  // onEmailChange(email) {
  //   console.log(email);
  //   this.userEmail = email;    
  // }

  onLinkChange(link) {
    console.log(link);
    this.linkToUpload = link; 
  }

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

    // if(!this?.userEmail?.trim()) {
    //   alert("Please enter a valid email");
    // regx
    //   return;
    // }

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
          console.log("res", res);
          console.log(res.result.identifier);
          let idOfContentCreated = res.result.identifier;
          forkJoin({
            addUrl : this.actionService.post(this.getUploadURLOptions(idOfContentCreated)), // call for url update
            addFile: this.actionService.post(this.getUploadContentOptions(idOfContentCreated)) // call for upload content
          }).pipe(map((result) => {
            console.log(result);
            this.actionService.post(this.getReviewOptions(idOfContentCreated)).subscribe((res2) => { // call for review
              console.log(res2,"Final success");
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
          code: this.solutionTitle + this.makeRandom(lengthOfCode, possible), //uuid
          mimeType: this.getContentType(this.file),
          contentType: "Resource",
          resourceType: "Learn",
          creator:
            this.userProfile?.firstName + " " + this.userProfile?.lastName, // name of creator
          framework: "nulplearnathon",
          organisation: ["nulp-learnathon"],
          primaryCategory: "Learning Resource",
          board:"Town Planning and Housing",
          medium:["Planning Schemes"],
          gradeLevel:["Good Practices Competition"],
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
  //       console.log("onSubmitLearnathonSignUp RES", res);
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
      // case "htmlzip":
      //   break;
      // default:
      // code block
    }
  }

  hasExtension(fileName) {
    console.log(fileName);

    const allowedExtensions = ["pdf", "mp4"]//, "html5", "htmlzip"];
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

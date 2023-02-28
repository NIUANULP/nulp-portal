import { Component, OnInit } from "@angular/core";

import { LearnerService, ActionService, UserService } from "@sunbird/core";
import { ContentService } from "./../../../../modules/core/services/content/content.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Observable } from "rxjs/internal/Observable";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { UploadContentService } from "./upload-content.service";

@Component({
  selector: "app-upload-content-learnathon",
  templateUrl: "./upload-content-learnathon.component.html",
  styleUrls: ["./upload-content-learnathon.component.scss"],
})
export class UploadContentLearnathonComponent implements OnInit {
  public formFieldProperties: any;
  public formData: any;

  public file!: File;
  userProfile: any;
  categories : any = [];
  subCategories: any = [];

  constructor(
    private learnerService: LearnerService,
    private contentService: ContentService,
    private http: HttpClient,
    public actionService: ActionService,
    public userService: UserService,
    private uploadContentService: UploadContentService
  ) {
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
  

  outputData(eventData: any) {}

  onStatusChanges(event) {
    // console.log(event);
  }

  valueChanges(value: any) {
    this.formData = value;

    // console.log(this.formData);
  }

  fileSelected(eventData) {
    console.log(eventData);
  }

  onUpload(event) {
    this.file = event.target.files[0];
    console.log(this.file);
  }

  onSubmit() {
    // call all methods with respective api in sequence

    if (this.isUserLoggedIn()) {
      this.userProfile = this.userService.userProfile;
    } else {
      alert("Please login before filling form!");
      return;
    }

    if (!this.file?.name) {
      alert("Please select a file to upload");
      return;
    }

    if(!this.hasExtension(this.file.name))
      return;

    let confirmation = `Are you sure you want to submit your proposal?
    You will not be able to edit your proposal once you submit`;

    if (confirm(confirmation) !== true) {
      return;
    } 

    /*
    firstPOSTCallToAPI('url', data).pipe(
    concatMap(result1 => secondPOSTCallToAPI('url', result1))
      concatMap( result2 => thirdPOSTCallToAPI('url', result2))
       concatMap(result3 => fourthPOSTCallToAPI('url', result3))
    ....
    ).subscribe(
    success => { /* display success msg  },
    errorData => { /* display error msg  }
    )
    */


  //   this.actionService.post(options).pipe(
  //     concatMap(result1 => this.actionService.post(options))
  //       concatMap( result2 => this.actionService.post({url: "content/v3/upload/url/" + identifier,optionsUploadURL.data}))
  //        concatMap(result3 => fourthPOSTCallToAPI('url', result3))
  //     ....
  // ).subscribe(
  //     success => { /* display success msg */ },
  //     errorData => { /* display error msg */ }
  // )

    const uploadUrlData = {};

    const uploadContentData = {};

    // Create content

    const resultOfCreate : any = this.createContent(this.getCreateDataOptions());
    console.log(resultOfCreate);

    // Upload URL
    if (resultOfCreate) {
      const resultOfURLCreate = this.getUploadURLOptions(
        resultOfCreate.result.identifier
      );

      // Upload Content
      const resultOfUploadContent = this.getUploadURLOptions(
        resultOfCreate.result.identifier
      );
    }

    // Submit for Review
    //const resultOfReview = this.sendForReview();
  }

  getCreateDataOptions() {

    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    const lengthOfCode = 10;
    
    const createData = {
      request: {
        content: {
          name: this.formData?.name,
          description: this.formData?.description,
          code: this.formData?.name + this.makeRandom(lengthOfCode, possible), //uuid
          mimeType: this.getContentType(this.file),
          contentType: "Resource",
          resourceType: "Learn",
          creator:
            this.userProfile?.firstName + " " + this.userProfile?.lastName, // name of creator
          framework: "nulplearnathon",
          organisation: ["nulp-learnathon"],
          primaryCategory: "Learning Resource",
          createdBy: this.userProfile.identifier, // get current userId
          createdFor: ["0137299712231669762"], //
        },
      },
    };

    console.log(createData.request);

    const options = {
      url: "content/v3/create",
      data: createData,
    };

    return options;
  }

  createContent(createData) {
    this.actionService.post(this.getCreateDataOptions()).subscribe(
      (res) => {
        console.log("onSubmitLearnathonSignUp RES", res);
        if (res.result.response == "SUCCESS") {
          return res;
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }

  getUploadURLOptions(identifier) {
    if(!identifier){
      console.log("ERROR no id");
      return;
    }
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

    this.actionService.post(options).subscribe(
      (res) => {
        console.log("onSubmitLearnathonSignUp RES", res);
        if (res.result.response == "SUCCESS") {
          return res;
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }

  getUploadContentOptions(identifier) {
    if(!identifier){
      console.log("ERROR no id");
      return;
    }

    const options = {
      url: "/content/v3/upload" + identifier,
      data: {
        request: {
          content: {
            file: this.file,
          },
        },
      },
    };

    return options;
    
    this.actionService.post(options).subscribe(
      (res) => {
        console.log("onSubmitLearnathonSignUp RES", res);
        if (res.result.response == "SUCCESS") {
          // this.redirectToSignPage();
        }
      },
      (err) => {
        console.log(err);
      }
    );
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

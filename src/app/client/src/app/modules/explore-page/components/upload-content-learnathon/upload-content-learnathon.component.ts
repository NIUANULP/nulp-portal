import { Component, OnInit } from "@angular/core";
import { LearnerService, ActionService, UserService } from "@sunbird/core";
import { ContentService } from "./../../../../modules/core/services/content/content.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Observable } from "rxjs/internal/Observable";
import { HttpClient, HttpResponse } from "@angular/common/http";

@Component({
  selector: "app-upload-content-learnathon",
  templateUrl: "./upload-content-learnathon.component.html",
  styleUrls: ["./upload-content-learnathon.component.scss"],
})
export class UploadContentLearnathonComponent implements OnInit {
  public formFieldProperties: any;
  public formData: any;
  public file!: File;
  afuConfig = {
    uploadAPI: {
      url: "content/v3/upload",
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        //  "Authorization" : `Bearer ${token}`
      },
      params: {
        page: "1",
      },
      responseType: "blob",
      withCredentials: false,
    },
  };
  userProfile: any;

  constructor(
    private learnerService: LearnerService,
    private contentService: ContentService,
    private http: HttpClient,
    public actionService: ActionService,
    public userService: UserService
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
        {
          code: "description",
          description: "Description of the content",
          validations: [
            {
              message: "Input is Exceeded",
              type: "max",
              value: "256",
            },
          ],
          dataType: "text",
          placeholder: "Description",
          required: true,
          editable: true,
          label: "Description",
          visible: true,
          renderingHints: {
            class: "sb-g-col-lg-1",
          },
          inputType: "textarea",
          name: "Description",
        },
      ],
    };
    console.log(this.formFieldProperties.fields);
  }

  ngOnInit(): void {}

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

    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    const lengthOfCode = 10;
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

    const uploadUrlData = {};

    const uploadContentData = {};

    // Create content

    const resultOfCreate : any = this.createContent(createData);
    console.log(resultOfCreate);

    // Upload URL
    if (resultOfCreate) {
      const resultOfURLCreate = this.uploadURL(
        resultOfCreate.result.identifier
      );

      // Upload Content
      const resultOfUploadContent = this.uploadContent(
        resultOfCreate.result.identifier
      );
    }

    // Submit for Review
    //const resultOfReview = this.sendForReview();
  }

  createContent(createData) {
    // const httpOptions = {
    //   headers: {
    //     'Authorization' : 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkTEJ3cG5MdE1SVWRCOTVBdWFCWjhMd0hSR2lTUTBpVCJ9.Q7-3SuUgnZXJuu-j2_kw9r8J82ckSxRR6zxylpgVG5o',
    //     'X-Authenticated-User-Token': 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI5bC1PTmFodUVWbFN3c1RKbFJlQjg3QmxxN21OQjFJSHd0M1pvcl9QRWpVIn0.eyJqdGkiOiJmZGU2ZDRkOC05ZjRjLTQ0MmQtOTg5NS0xMjMxZDFmZjRmZDEiLCJleHAiOjE2NzcyNDY2MzEsIm5iZiI6MCwiaWF0IjoxNjc3MTYwMjMxLCJpc3MiOiJodHRwczovL2Rldm51bHAubml1YS5vcmcvYXV0aC9yZWFsbXMvc3VuYmlyZCIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiI3M2VkZjFiNi00Y2QyLTQ1N2MtYTEyMS0xZGRhN2E2MzgyNDgiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJsbXMiLCJhdXRoX3RpbWUiOjAsInNlc3Npb25fc3RhdGUiOiI4MThjYzUzNS00ZjAxLTQxYjktYmI5My05MTk1Y2IwOGRhYTciLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vZGV2bnVscC5uaXVhLm9yZyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJhZG1pbiIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJtYW5hZ2UtdXNlcnMiXX0sImxtcyI6eyJyb2xlcyI6WyJ1bWFfcHJvdGVjdGlvbiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiIiLCJjbGllbnRJZCI6ImxtcyIsImNsaWVudEhvc3QiOiI0OS4zNi41OS43NSIsInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC1sbXMiLCJjbGllbnRBZGRyZXNzIjoiNDkuMzYuNTkuNzUiLCJlbWFpbCI6InNlcnZpY2UtYWNjb3VudC1sbXNAcGxhY2Vob2xkZXIub3JnIn0.iyAnFdvFbjp686-lICr89yxXgYMV7CDMb_5m_V3d1aD2OOyzpVWMWcj6BPSL3BawWTd7Hh86OEeHOkR77qg-Oe4R5boO89vGIy1cun4BHLwHtwL24xuZcMS1g702Rfo3fj_2dHZ6mXZDf_WCofsJaiILmnFBrb-3Kp_H2uJ46_tuaa3RzrzCLa5bR9K_SvoDQghFlR7-TUK_Mj4aVr-D_iQfuLrMf4s9PbjI0E8GImnC-ICqkjws9YvlFOTEMCn6dny0k1q3UamkDQdiHquAl6a0HoGSE8LdEgIRd60yaWX2Nh9t5hP3PI9Ej7ktfnCk-fjVKjYmsgKpssJoDK4feg',
    //     'x-channel-id': '0137299712231669762'
    // }
    // };

    const options = {
      url: "content/v3/create",
      data: createData,
    };

    this.actionService.post(options).subscribe(
      (res) => {
        console.log("onSubmitLearnathonSignUp RES", res);
        if (res.result.response == "SUCCESS") {
          return res;
        }
      },
      (err) => {
        console.log(err);
        const resultOfCreate = {
          id: "api.content.create",
          ver: "3.0",
          ts: "2023-02-26T08:25:22ZZ",
          params: {
            resmsgid: "86545c95-1549-4baa-baad-34f1a510c0de",
            msgid: null,
            err: null,
            status: "successful",
            errmsg: null,
          },
          responseCode: "OK",
          result: {
            identifier: "do_1137412601611223041129",
            node_id: "do_1137412601611223041129",
            versionKey: "1677399922014",
          },
        };

        return resultOfCreate;
      }
    );
  }

  uploadURL(identifier) {
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

  uploadContent(identifier) {
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

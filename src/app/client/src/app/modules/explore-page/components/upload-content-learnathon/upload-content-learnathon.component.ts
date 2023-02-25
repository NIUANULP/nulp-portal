import { Component, OnInit } from "@angular/core";
import { LearnerService, ActionService } from "@sunbird/core";
import { ContentService } from "./../../../../modules/core/services/content/content.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: "app-upload-content-learnathon",
  templateUrl: "./upload-content-learnathon.component.html",
  styleUrls: ["./upload-content-learnathon.component.scss"],
})
export class UploadContentLearnathonComponent implements OnInit {
  public formFieldProperties: any;
  public formData: any;

  constructor(
    private learnerService: LearnerService,
    private contentService: ContentService,
    public actionService: ActionService
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
        {},
      ],
    };
    console.log(this.formFieldProperties.fields);
  }

  ngOnInit(): void {}

  outputData(eventData: any) {}

  onStatusChanges(event) {
    // console.log(event);
    // console.log("OK");
  }

  valueChanges(value: any) {
    this.formData = value;
    console.log(value);
  }

  submit() {
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    const lengthOfCode = 10;

    const submitData = {
      request: {
        content: {
          name: this.formData?.name,
          description: this.formData?.description,
          code: this.formData?.name + this.makeRandom(lengthOfCode, possible),
          mimeType: "application/pdf",
          contentType: "Resource",
        },
      },
    };

    console.log("OK here!");
    console.log(this.formData);
    const options = {
      url: "content/v3/create",
      data: submitData,
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
  makeRandom(lengthOfCode: number, possible: string) {
    let text = "";
    for (let i = 0; i < lengthOfCode; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  // post(requestParam: RequestParam): Observable<ServerResponse> {
  //   const httpOptions: HttpOptions = {
  //     headers: requestParam.header ? this.getHeader(requestParam.header) : this.getHeader(),
  //     params: requestParam.param
  //   };
  //   return this.http.post(this.baseUrl + requestParam.url, requestParam.data, httpOptions).pipe(
  //     mergeMap((data: ServerResponse) => {
  //       if (data.responseCode !== 'OK') {
  //         return observableThrowError(data);
  //       }
  //       return observableOf(data);
  //     }));
  // }
}

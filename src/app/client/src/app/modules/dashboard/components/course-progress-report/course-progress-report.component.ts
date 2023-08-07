import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ViewChild,
  HostListener,
} from "@angular/core";
import { apiResponse } from "./data";
@Component({
  selector: "course-progress-report",
  templateUrl: "./course-progress-report.component.html",
  styleUrls: ["./course-progress-report.component.scss"],
})
export class CourseProgressReportComponent implements OnInit, OnDestroy {
  userProgressList = [];

  ngOnInit() {
    this.userProgressList = apiResponse.result.content;
  }

  ngOnDestroy() {
    // this.unsubscribe$.next();
    // this.unsubscribe$.complete();
  }
}

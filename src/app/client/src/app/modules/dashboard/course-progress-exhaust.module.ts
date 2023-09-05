import { NgModule } from "@angular/core";
import { CourseProgressExhaustComponent } from "./components/course-progress-exhaust/course-progress-exhaust.component";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SuiModule } from "ng2-semantic-ui-v9";
import { TelemetryModule } from '@sunbird/telemetry';
import { DiscussionModule } from '../discussion/discussion.module';
import { SharedModule } from '@sunbird/shared';

@NgModule({
  imports: [    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    SuiModule,
    TelemetryModule,
    DiscussionModule,
    SharedModule
 ],
  declarations: [CourseProgressExhaustComponent],
  exports: [CourseProgressExhaustComponent],
  providers: [],
  
})
export class CourseProgressExhaustModule { } 

// Angular modules
import { NgModule } from '@angular/core';
import { CommonConsumptionModule } from '@project-sunbird/common-consumption-v9';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
// Modules
import { ChartsModule } from 'ng2-charts';
import { SuiModule } from 'ng2-semantic-ui-v9';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { TelemetryModule } from '@sunbird/telemetry';
// Custome component(s) and services
import {
  CourseConsumptionService, DashboardUtilsService, OrganisationService,
  RendererService, LineChartService, DownloadService, CourseProgressService,
  UsageService, ReportService
} from './services';
import {
  OrganisationComponent, CourseConsumptionComponent, CourseProgressComponent, UsageReportsComponent,
  DataTableComponent, DataChartComponent, ReportComponent, ReportSummaryComponent, ListAllReportsComponent,
  AddSummaryModalComponent, CourseDashboardComponent, ReIssueCertificateComponent, DashboardSidebarComponent, DatasetComponent, MapComponent, FilterComponent,AllReportsComponent, ReportsComponent,OrganizationReportComponent, UserReportComponent,ContentReportComponent, ContentLeaderboardComponent,ContentCategoryWiseComponent, CourseReportComponent,CourseCategoryWiseComponent,
  ContentCreationStaticsComponent,CityWiseReportComponent, DeptCityWiseReportComponent, ContentDeptWiseReportComponent
} from './components';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
// import { ChartsModule } from 'ng2-charts';
import { ChartModule } from 'primeng/chart';
// SB core and shared services
import { SearchService } from '@sunbird/core';
import { SharedModule } from '@sunbird/shared';
import { OrderModule } from 'ngx-order-pipe';
import { AceEditorModule } from 'ng2-ace-editor';
import { DiscussionModule } from '../discussion/discussion.module';
import { SbTableComponent } from './components/sb-table/sb-table.component';
import { DashletModule } from '@project-sunbird/sb-dashlet-v9';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { SharedFeatureModule } from '@sunbird/shared-feature';
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { AddusersComponent } from './components/addusers/addusers.component';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { UserSearchService } from '../search/services';
import { UserUploadComponent } from './components/user-upload/user-upload.component';
import { CalendarModule } from 'primeng/calendar';
import { CoreModule } from '../core';
import { CourseContentLeaderboardComponent } from './components/course-content-leaderboard/course-content-leaderboard.component';
import { CertificateTemplateUploadComponent } from './components/certificate-template-upload/certificate-template-upload.component';
import { FileuploadComponent } from './components/fileupload/fileupload.component';
import { OrgManagementModule } from '@sunbird/org-management';
import { CertificateDirectivesModule } from 'sb-svg2pdf';
import { CsModule } from '@project-sunbird/client-services';
import { CsLibInitializerService } from 'CsLibInitializer';

export const csCourseServiceFactory = (csLibInitializerService: CsLibInitializerService) => {
  if (!CsModule.instance.isInitialised) {
    csLibInitializerService.initializeCs();
  }
  return CsModule.instance.courseService;
};
@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ChartsModule,
    SuiModule,
    SharedModule,
    OrderModule,
    CommonConsumptionModule,
    TelemetryModule,
    NgxDaterangepickerMd.forRoot(),
    AceEditorModule,
    DiscussionModule,
    DashletModule.forRoot(),
    MatCheckboxModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatExpansionModule,
    SharedFeatureModule,
    MatAutocompleteModule,
    TableModule,
    DropdownModule,
    MultiSelectModule,
    AngularMultiSelectModule,
    CalendarModule,
    CoreModule,
    ChartModule,
    CertificateDirectivesModule,
    OrgManagementModule
  ],
  declarations: [CourseConsumptionComponent, OrganisationComponent, CourseProgressComponent, UsageReportsComponent,
    DataTableComponent, DataChartComponent, ListAllReportsComponent, ReportSummaryComponent, ReportComponent, AddSummaryModalComponent,
    CourseDashboardComponent, ReIssueCertificateComponent, DashboardSidebarComponent, DatasetComponent, MapComponent, FilterComponent,
    SbTableComponent, AddusersComponent, AllReportsComponent, UserReportComponent, ContentLeaderboardComponent,UserUploadComponent,
    CourseContentLeaderboardComponent, FileuploadComponent, CertificateTemplateUploadComponent, ReportsComponent,OrganizationReportComponent,ContentReportComponent, ContentCategoryWiseComponent,
    CourseReportComponent,CourseCategoryWiseComponent, ContentCreationStaticsComponent,CityWiseReportComponent, DeptCityWiseReportComponent, ContentDeptWiseReportComponent],
  exports: [CourseProgressComponent, DataTableComponent],
  providers: [
    RendererService,
    UserSearchService,
    DashboardUtilsService,
    SearchService,
    LineChartService,
    CourseConsumptionService,
    OrganisationService, DownloadService, CourseProgressService, UsageService, ReportService,
    [{provide: 'CS_COURSE_SERVICE', useFactory: csCourseServiceFactory, deps: [CsLibInitializerService]}]
  ],
  
})
export class DashboardModule { }

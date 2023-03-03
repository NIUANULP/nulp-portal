import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TelemetryModule } from '@sunbird/telemetry';
import { CoreModule } from '@sunbird/core';
import { SharedModule } from '@sunbird/shared';
import { NgInviewModule } from 'angular-inport';
import { ExplorePageRoutingModule } from './explore-page-routing.module';
import { SharedFeatureModule } from '@sunbird/shared-feature';
import {
  SuiSelectModule, SuiModalModule, SuiAccordionModule, SuiPopupModule, SuiDropdownModule, SuiProgressModule,
  SuiRatingModule, SuiCollapseModule, SuiDimmerModule
} from 'ng2-semantic-ui-v9';
import { WebExtensionModule } from '@project-sunbird/web-extensions';
import { CommonConsumptionModule } from '@project-sunbird/common-consumption-v9';
import { ContentSearchModule } from '@sunbird/content-search';
import { SlickModule } from 'ngx-slick';
import { ExplorePageComponent } from './components';
import { ContentSectionModule } from 'content-section';
import {ObservationModule} from '../observation/observation.module';

// @Hack isLearnathon
import { UploadContentLearnathonComponent } from './components/upload-content-learnathon/upload-content-learnathon.component';
import { ListUploadcontentLearnathonComponent } from './components/list-uploadcontent-learnathon/list-uploadcontent-learnathon.component';
import { WorkSpaceService, EditorService , BatchService, ReviewCommentsService} from '../workspace';
import { CommonFormElementsModule } from 'common-form-elements-web-v9';
import { LearnathonLandingPageComponent } from './components/learnathon-landing-page/learnathon-landing-page.component'; 

@NgModule({
  // @Hack isLearnathon
  declarations: [ExplorePageComponent, UploadContentLearnathonComponent, ListUploadcontentLearnathonComponent, LearnathonLandingPageComponent],
  imports: [
    ExplorePageRoutingModule,
    CommonModule,
    TelemetryModule,
    CoreModule,
    SharedModule,
    NgInviewModule,
    SharedFeatureModule,
    SuiSelectModule, SuiModalModule, SuiAccordionModule, SuiPopupModule, SuiDropdownModule, SuiProgressModule,
    SuiRatingModule, SuiCollapseModule, SuiDimmerModule, WebExtensionModule,
    CommonConsumptionModule, ContentSearchModule, SlickModule, ContentSectionModule,ObservationModule, CommonConsumptionModule, 
    ContentSearchModule, 
    SlickModule, 
    ContentSectionModule,
    ObservationModule,
    CommonFormElementsModule
  ],
  
  // @Hack isLearnathon
  providers: [WorkSpaceService]
})
export class ExplorePageModule { }

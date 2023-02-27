import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExplorePageComponent } from './components';
import { UploadContentLearnathonComponent } from './components/upload-content-learnathon/upload-content-learnathon.component';
const routes: Routes = [
  {
    path: '', component: ExplorePageComponent, data: {
      telemetry: {
        env: 'explore', pageid: 'explore', type: 'view', subtype: 'paginate'
      },
      softConstraints: { badgeAssertions: 98, board: 99, channel: 100 }
    }
  },
  {
    path: 'learnathon', component: UploadContentLearnathonComponent, data: {
      telemetry: {
        env: 'explore', pageid: 'explore', type: 'view', subtype: 'paginate'
      },
      softConstraints: { badgeAssertions: 98, board: 99, channel: 100 }
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExplorePageRoutingModule { }

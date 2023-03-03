import { Component, OnInit } from '@angular/core';
import {
  ServerResponse, PaginationService, ConfigService, ToasterService, IPagination,
  ResourceService, ILoaderMessage, INoResultMessage, IContents, IUserData, NavigationHelperService
} from '@sunbird/shared';
import { SearchService, UserService, ISort, FrameworkService } from '@sunbird/core';
import * as _ from 'lodash-es';
import { WorkSpace } from '../../../workspace/classes/workspace';
import { WorkSpaceService } from '../../../workspace/services'



@Component({
  selector: 'app-list-uploadcontent-learnathon',
  templateUrl: './list-uploadcontent-learnathon.component.html',
  styleUrls: ['./list-uploadcontent-learnathon.component.scss']
})
export class ListUploadcontentLearnathonComponent  extends WorkSpace implements OnInit {

  /**
   * loader message
  */
  loaderMessage: ILoaderMessage;

  /**
   * To show / hide no result message when no result found
  */
  noResult = false;

  /**
   * no result  message
  */
  noResultMessage: INoResultMessage;

  /**
   * To show / hide loader
  */
  showLoader = true;

  /**
     * Contains list of published course(s) of logged-in user
    */
  allContent: Array<IContents> = [];

  /**
  * totalCount of the list
  */
  totalCount: Number;

  /**
   * To show / hide error
  */
  showError = false;
  state: string;
  lernathonChannel: string = "nulp-learnathon";
  isLearnathon: boolean = false;
  isContentCreator: boolean = false;
  /**
   * userRoles
  */
  userRoles = [];

  /**
    * Constructor to create injected service(s) object
    Default method of Draft Component class
    * @param {SearchService} SearchService Reference of SearchService
    * @param {UserService} UserService Reference of UserService
  */

  constructor(
    public frameworkService: FrameworkService,
    public userService: UserService,
    public workSpaceService: WorkSpaceService,
    public searchService: SearchService,
  ) {
    super(searchService, workSpaceService, userService);
    this.state = 'upForReview';
  }

  ngOnInit(): void {
    this.userService.userData$.subscribe(
      (user: IUserData) => {
        this.userRoles = user.userProfile.userRoles;
      });
    
    if (_.indexOf(this.userRoles, 'CONTENT_CREATOR') !== -1) {
      this.isContentCreator = true;
    }

    this.fecthAllContent();
  }

  fecthAllContent(){
    this.showLoader = true;
    const preStatus = ['Draft', 'FlagDraft', 'Review', 'Processing', 'Live', 'Unlisted', 'FlagReview'];
    const primaryCategories = ["Learning Resource"];
    // const primaryCategories = ["Course","Digital Textbook","Content Playlist","Explanation Content","Learning Resource","Practice Question Set","eTextbook","Teacher Resource","Course Assessment"];
    const searchParams = {
        filters: {
          status: preStatus,
          createdBy: this.userService.userid,
          primaryCategory: primaryCategories
        },
        limit: 50,
        offset: (1 - 1) * (10)
      };

    this.search(searchParams).subscribe(
      (data: ServerResponse) => {

        if (data.result.count && (!_.isEmpty(data.result.content) ||
        (!_.isEmpty(data.result.QuestionSet)))) {
          this.allContent = data.result.content;
          this.totalCount = data.result.count;
          this.showLoader = false;
          this.noResult = false;
        } else {
          this.showError = false;
          this.noResult = true;
          this.showLoader = false;
          this.noResultMessage = {
            'messageText': 'messages.stmsg.m0006'
          };
        }
      },
      (err: ServerResponse) => {
        this.showLoader = false;
        this.noResult = false;
        this.showError = true;
      }
    );
  }

  contentClick(content) {
    this.workSpaceService.navigateToContent(content, this.state);
  }
}

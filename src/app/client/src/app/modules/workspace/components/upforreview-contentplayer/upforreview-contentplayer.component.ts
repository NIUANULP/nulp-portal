import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  ResourceService,
  ILoaderMessage,
  PlayerConfig,
  ContentData,
  WindowScrollService,
  ToasterService,
  NavigationHelperService,
  LayoutService,
} from "@sunbird/shared";
import { PlayerService, PermissionService, UserService } from "@sunbird/core";
import * as _ from "lodash-es";
import { IInteractEventObject, IInteractEventEdata } from "@sunbird/telemetry";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

import {
  of as observableOf,
  throwError as observableThrowError,
  Observable,
} from "rxjs";
import { mergeMap } from "rxjs/operators";
import { ServerResponse, RequestParam, HttpOptions } from "@sunbird/shared";
import { HttpClient, HttpResponse,HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { UUID } from "angular2-uuid";
// import * as _ from 'lodash-es';
import dayjs from "dayjs";
// import { DataService } from 'src/app/modules/core';
import { ConfigService } from "@sunbird/shared";
import { Location } from '@angular/common';


@Component({
  selector: "app-upforreview-contentplayer",
  templateUrl: "./upforreview-contentplayer.component.html",
  styleUrls: ["./upforreview-contentplayer.component.scss"],
})
export class UpforreviewContentplayerComponent implements OnInit, OnDestroy {
  // public config: ConfigService;
  // public DataService: DataService
  public requestForChangesInteractEdata: IInteractEventEdata;
  public publishInteractEdata: IInteractEventEdata;
  public reviewCommentsWarningYesInteractEdata: IInteractEventEdata;
  public reviewCommentsWarningNoInteractEdata: IInteractEventEdata;
  public telemetryInteractObject: IInteractEventObject;
  public closeInteractEdata: IInteractEventEdata;

  public unsubscribe$ = new Subject<void>();
  /**
   * To navigate to other pages
   */
  router: Router;
  /**
   * loader message
   */
  loaderMessage: ILoaderMessage;
  /**
   * To close url
   */
  closeUrl: any;
  /**
   * To show / hide loader
   */
  showLoader = true;
  /**
   * Flag to show error
   */
  showError = false;
  /**
   * content id
   */
  contentId: string;
  /**
   * user id
   */
  userId: string;
  /**
   * contain error message
   */
  errorMessage: string;
  /**
   * This variable is used to increase/decrease the player width
   * according to content mime type
   */
  showCommentBoxClass = "twelve wide column";
  /**
   * To call resource service which helps to use language constant
   */
  public resourceService: ResourceService;
  /**
   * To call user service
   */
  public userService: UserService;

  /**
   * To call PlayerService service
   */
  public playerService: PlayerService;
  /**
   * To call Permission service
   */
  public permissionService: PermissionService;
  /**
   * To call PlayerService service
   */
  public windowScrollService: WindowScrollService;
  /**
   * contains player configuration
   */
  playerConfig: PlayerConfig;
  /**
   * contain contentData
   */
  contentData: ContentData;
  /**
   * To show toaster(error, success etc) after any API calls
   */
  private toasterService: ToasterService;

  public stageId: string;

  public commentList: any;

  public playerLoaded = false;

  // @Hack isLearnathon
  // lernathonChannel: string = "nulp-learn";
  lernathonChannel: string = localStorage.getItem("learnathonChannel");

  isLearnathon: boolean = false;
  // @Hack isLearnathon

  /**
   * Contains base Url for api end points
   */
  baseUrl: string;

  @ViewChild("publishWarningModal") publishWarningModal;

  showPublishWarningModal = false;
  layoutConfiguration: any;
  name: any;
  mobile: any;
  email: any;
  city: any;
  reason: any;
  showNormalModal: boolean = false;
  formInvalidMessage: any;
  showCenterAlignedModal: boolean;
  modalHeader: any;
  votelist: any;
  canVote: boolean = true;
  learnathonContent: boolean = false;
  now:any;
  /**
  * Constructor to create injected service(s) object
  Default method of Draft Component class
  * @param {ResourceService} resourceService Reference of resourceService
  * @param {ToasterService} toasterService Reference of ToasterService
  */
  constructor(
    resourceService: ResourceService,
    public activatedRoute: ActivatedRoute,
    userService: UserService,
    playerService: PlayerService,
    windowScrollService: WindowScrollService,
    permissionService: PermissionService,
    toasterService: ToasterService,
    public layoutService: LayoutService,
    public https: HttpClient,
    public config: ConfigService,
    public navigationHelperService: NavigationHelperService,
    router: Router,
    private location: Location
  ) {
    this.resourceService = resourceService;
    this.playerService = playerService;
    this.userService = userService;
    this.windowScrollService = windowScrollService;
    this.permissionService = permissionService;
    this.toasterService = toasterService;
    this.router = router;
    this.loaderMessage = {
      loaderMessage: this.resourceService.messages.stmsg.m0025,
    };

    // @Hack isLearnathon
    if (
      this.userService.rootOrgName == this.lernathonChannel ||
      this.userService.rootOrgName == "Haryana" ||
      this.userService.rootOrgName == "channel_67285" 
    ) {
     const loggedInUserRoles = _.get(this.userService, 'userProfile.userRoles');
     if (_.includes(loggedInUserRoles, 'CONTENT_REVIEWER'))
     {
      this.isLearnathon = false;
     }
     else{
      this.isLearnathon = true;
     }
    }
    // @Hack isLearnathon
  }
  goToPublish() {
    this.router.navigate(["publish"], { relativeTo: this.activatedRoute });
  }
  checkComments() {
    if (!_.isEmpty(this.commentList)) {
      this.showPublishWarningModal = true;
    } else {
      this.goToPublish();
    }
  }
  ngOnInit() {
    this.baseUrl = "https://nulp.niua.org/";

    this.initLayout();
    this.userService.userData$.subscribe((userdata) => {
      if (userdata && !userdata.err) {
        this.userId = userdata.userProfile.userId;
        this.activatedRoute.params.subscribe((params) => {
          this.contentId = params.contentId;
          this.getContent();
        });
      }
      this.closeUrl = this.navigationHelperService.getPreviousUrl();
    });

    let queryParams = new HttpParams();
              queryParams = queryParams.append("contentId",this.contentId);
              queryParams = queryParams.append("userId",this.userId);
              this.https
              .get(this.config.urlConFig.URLS.FILE_READ,{params:queryParams} )
              .subscribe((data) => {
               if(data["result"].count == 0){
                this.canVote= true;
               }else{
                this.canVote= false;
               }
               
              },(err) => {
                console.log(err);
               
                // this.toasterService.error(this.resourceService.messages.emsg.m0007);
              });
  }
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if (this.publishWarningModal) {
      this.publishWarningModal.deny();
    }
  }
  initLayout() {
    this.layoutConfiguration = this.layoutService.initlayoutConfig();
    this.layoutService
      .switchableLayout()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((layoutConfig) => {
        if (layoutConfig != null) {
          this.layoutConfiguration = layoutConfig.layout;
        }
      });
  }
  public handleSceneChangeEvent(data) {
    if (this.stageId !== data.stageId) {
      this.stageId = data.stageId;
    }
    if (!this.playerLoaded) {
      this.playerLoaded = true;
    }
  }
  public contentProgressEvent(event) {
    if (_.get(event, "detail.telemetryData.eid") === "END") {
      this.stageId = undefined;
    }
  }
  public handleReviewCommentEvent(event) {
    this.commentList = event;
  }
  /**
   * used to fetch content details and player config. On success launches player.
   */
  getContent() {
    this.showLoader = true;
    const option = {
      params: { mode: "edit" },
    };
    this.playerService.getContent(this.contentId, option).subscribe(
      (response) => {
        if (response.result.content) {
          if (response.result.content.framework == "nulp-learn") {
            this.learnathonContent = true;
          }
          const contentDetails = {
            contentId: this.contentId,
            contentData: response.result.content,
          };
          this.playerConfig = this.playerService.getConfig(contentDetails);
          this.playerConfig.data =
            this.playerService.updateContentBodyForReviewer(
              this.playerConfig.data
            );
          this.contentData = response.result.content;
          this.setInteractEventData();
          this.showCommentBoxClass =
            this.contentData.mimeType === "application/vnd.ekstep.ecml-archive"
              ? "eight wide column"
              : "twelve wide column";
          this.showLoader = false;
        } else {
          this.toasterService.warning(this.resourceService.messages.imsg.m0027);
          this.close();
        }
      },
      (err) => {
        this.showError = true;
        this.errorMessage = this.resourceService.messages.stmsg.m0009;
      }
    );
  }
  /**
   * retry launching player with same content details
   * @memberof ContentPlayerComponent
   */
  tryAgain() {
    this.showError = false;
    this.getContent();
  }
  /**
   * closes conent player and revert to previous url
   * @memberof ContentPlayerComponent
   */
  close() {
    if(this.contentData.framework == "nulp-learn"){
      this.location.back();
    }else{
      this.navigationHelperService.navigateToWorkSpace(
      "/workspace/content/upForReview/1");
    }  
  }

  setInteractEventData() {
    this.requestForChangesInteractEdata = {
      id: "request-for-changes",
      type: "click",
      pageid: "upForReview-content-player",
    };
    this.publishInteractEdata = {
      id: "publish",
      type: "click",
      pageid: "upForReview-content-player",
    };
    this.reviewCommentsWarningYesInteractEdata = {
      id: "review-comments-warning-yes",
      type: "click",
      pageid: "upForReview-content-player",
    };
    this.reviewCommentsWarningNoInteractEdata = {
      id: "review-comments-warning-no",
      type: "click",
      pageid: "upForReview-content-player",
    };
    this.closeInteractEdata = {
      id: "close-button",
      type: "click",
      pageid: "upForReview-content-player",
    };
    this.telemetryInteractObject = {
      id: this.contentId,
      type: this.contentData.contentType,
      ver: this.contentData.pkgVersion
        ? this.contentData.pkgVersion.toString()
        : "1.0",
    };
  }

  learnVote() {
    this.modalHeader = this.resourceService.frmelmnts.label.invaliddatamsg;
    if (!this?.name?.trim()) {

      //alert("Please Enter a name");
      this.formInvalidMessage =
        this.resourceService.frmelmnts.lbl.enterValidName;
      this.toasterService.error(
        this.resourceService.frmelmnts.lbl.enterValidName
      );

      this.showCenterAlignedModal = true;
    }

    if (!this?.email?.trim()) {
      //alert("Please enter email");
      this.formInvalidMessage = this.resourceService.frmelmnts.lbl.validEmail;
      this.toasterService.error(this.resourceService.frmelmnts.lbl.validEmail);

      this.showCenterAlignedModal = true;
    } else if (
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(this.email)
    ) {
    } else {
      //alert("Please enter a valid email!")
      this.formInvalidMessage = this.resourceService.frmelmnts.lbl.validEmail;
      this.toasterService.error(this.resourceService.frmelmnts.lbl.validEmail);
      this.showCenterAlignedModal = true;
    }

    if (!this?.mobile?.trim()) {
      // alert("Please enter phone number");
      this.formInvalidMessage = this.resourceService.frmelmnts.lbl.validPhone;
      this.toasterService.error(this.resourceService.frmelmnts.lbl.validPhone);
      this.showCenterAlignedModal = true;
    } else if (!/^\(?([1-9]{1})\)?([0-9]{9})$/.test(this.mobile)) {
      this.formInvalidMessage = this.resourceService.frmelmnts.lbl.validPhone;
      this.toasterService.error(this.resourceService.frmelmnts.lbl.validPhone);
      this.showCenterAlignedModal = true;
    }

    if (!this?.city?.trim()) {
      // alert("Please enter phone number");
      this.formInvalidMessage = this.resourceService.frmelmnts.lbl.validCity;
      this.toasterService.error(this.resourceService.frmelmnts.lbl.validCity);
      this.showCenterAlignedModal = true;
    }
    if (!this?.reason?.trim()) {
      // alert("Please enter phone number");
      this.formInvalidMessage =
        this.resourceService.frmelmnts.lbl.validReasonOfVote;
      this.toasterService.error(
        this.resourceService.frmelmnts.lbl.validReasonOfVote
      );
      this.showCenterAlignedModal = true;
    }
    if (this.showCenterAlignedModal == true) {
      return;
    } else {
      var today = new Date();
      var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      this.now = date+' '+time;
      const httpOptions: HttpOptions = {       
        body: [
          {
            userId: this.userId,
            contentId: this.contentId,
            vote: "1",
            userName: this.name,
            UserMobile: this.mobile,
            userEmail: this.email,
            userCity: this.city,
            reasonOfVote: this.reason.replace(/['"]+/g, ''),
            votedDate:date,
            votedTime:time
          },
        ],
      };

      this.https
        .post(this.config.urlConFig.URLS.FILE_WRITE, httpOptions)
        .subscribe(
          (data) => {
            this.showNormalModal = !this.showNormalModal;
            this.canVote = false;
            // window.location.reload();
            this.toasterService.success(
              this.resourceService.messages.smsg.voteSuccess
            );
            let queryParams = new HttpParams();
              queryParams = queryParams.append("contentId",this.contentId);
              queryParams = queryParams.append("userId",this.userId);
              this.https
              .get(this.config.urlConFig.URLS.FILE_READ,{params:queryParams} )
              .subscribe((data) => {
               if(data["result"].count == 0){
                this.canVote= true;
               }else{
                this.canVote= false;
               }
               
              },(err) => {
                console.log(err);
               
                // this.toasterService.error(this.resourceService.messages.emsg.m0007);
              });
          },
          (err) => {
            this.toasterService.error(this.resourceService.messages.emsg.m0005);
          }
        );
    }
  }

  onNameChange(name) {
    this.name = name;
  }
  onMobileChange(mobile) {
    this.mobile = mobile;
  }
  onEmailChange(email) {
    this.email = email;
  }
  onCityChange(city) {
    this.city = city;
  }
  onReasonOfVoteChange(reason) {
    this.reason = reason;
  }
}

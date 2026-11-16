import { of as observableOf, Observable, EMPTY } from 'rxjs';
import { map, expand, scan, last, catchError } from 'rxjs/operators';
import { Injectable, EventEmitter } from '@angular/core';
import { ConfigService, ServerResponse } from '@sunbird/shared';
import { SearchParam, LearnerService, UserService, ContentService, SearchService } from '@sunbird/core';
import * as _ from 'lodash-es';

@Injectable({
  providedIn: 'root'
})
export class CourseBatchService {
  private _enrollToBatchDetails: any;
  private _updateBatchDetails: any;
  public updateEvent = new EventEmitter();
  private _enrolledBatchDetails: any;
  private defaultUserList: any;
  constructor(public searchService: SearchService, public userService: UserService, public content: ContentService,
    public configService: ConfigService,
    public learnerService: LearnerService) { }
  getAllBatchDetails(searchParams) {
    return this.batchSearch(searchParams);
  }
  batchSearch(requestParam: SearchParam): Observable<ServerResponse> {
    const option = {
      url: this.configService.urlConFig.URLS.BATCH.GET_BATCHS,
      param : {...requestParam.params},
      data: {
        request: {
          filters: requestParam.filters,
          limit: requestParam.limit,
          sort_by: requestParam.sort_by
        }
      }
    };
    return this.learnerService.post(option);
  }
  /**
   * @param includeOtherOrgs only for type 'participant': true searches users of every org,
   * false (default) limits the search to the current user's org like mentor searches
   */
  getUserList(requestParam: SearchParam = {}, type = '', includeOtherOrgs = false): Observable<ServerResponse> {
    if (_.isEmpty(requestParam) && this.defaultUserList) {
      return observableOf(this.defaultUserList);
    } else {
      const request = _.cloneDeep(requestParam);
      const option = {
        url: this.configService.urlConFig.URLS.ADMIN.USER_SEARCH,
        data: {
          request: {
            filters: requestParam.filters || {},
            query: requestParam.query || ''
          }
        }
      };
      if (requestParam.limit) {
        option.data.request['limit'] = requestParam.limit;
      }
      if (requestParam.offset) {
        option.data.request['offset'] = requestParam.offset;
      }
      if (type === 'participant' && includeOtherOrgs) {
        delete option.data.request.filters['rootOrgId'];
      } else {
        this.applyOwnOrgFilter(option.data.request.filters, type === 'participant');
      }
      // option.data.request.filters['organisations.roles'] = ['COURSE_MENTOR'];
      return this.learnerService.post(option).pipe(map((data) => {
        if (_.isEmpty(requestParam)) {
          this.defaultUserList = data;
        }
        return data;
      }));
    }
  }
  /**
   * limits a user search to the current user's org: their root org when they create content
   * in it, otherwise the orgs where they hold the CONTENT_CREATOR role. When neither applies,
   * participant searches fall back to the root org so they never widen to every org.
   */
  private applyOwnOrgFilter(filters, isParticipantSearch: boolean) {
    const rootOrgId = this.userService.rootOrgId;
    const creatorOrgs = _.get(this.userService, 'userProfile.roleOrgMap.CONTENT_CREATOR');
    if (creatorOrgs && creatorOrgs.includes(rootOrgId)) {
      filters['rootOrgId'] = rootOrgId;
    } else if (creatorOrgs) {
      filters['organisations.organisationId'] = creatorOrgs;
    } else if (isParticipantSearch && rootOrgId) {
      filters['rootOrgId'] = rootOrgId;
    }
  }
  /**
   * user/v3/search returns a single page in `content` while `count` reports the
   * total number of matches. This walks every page until the full result set is
   * collected, so callers get all users instead of just the first page.
   * Emits once, with every page merged.
   */
  getAllUserList(requestParam: SearchParam = {}, type = '', includeOtherOrgs = false): Observable<ServerResponse> {
    return this.streamAllUserList(requestParam, type, includeOtherOrgs).pipe(last());
  }
  /**
   * Same paging as getAllUserList, but emits the users collected so far after every page,
   * so a large search (e.g. every org) fills the list progressively instead of showing
   * nothing until the last page arrives. If a later page fails, the stream completes with
   * the users already loaded; only a failure of the first page is reported as an error.
   */
  streamAllUserList(requestParam: SearchParam = {}, type = '', includeOtherOrgs = false): Observable<ServerResponse> {
    const pageSize = requestParam.limit || 200;
    const pageRequest = { ...requestParam, limit: pageSize };
    let offset = 0;
    return this.getUserList({ ...pageRequest, offset }, type, includeOtherOrgs).pipe(
      expand((response) => {
        const content = _.get(response, 'result.response.content', []) || [];
        const count = _.get(response, 'result.response.count', 0);
        offset += content.length;
        if (content.length && offset < count) {
          return this.getUserList({ ...pageRequest, offset }, type, includeOtherOrgs).pipe(
            catchError(() => EMPTY)
          );
        }
        return EMPTY;
      }),
      scan((merged: ServerResponse, response: ServerResponse) => {
        const content = _.get(response, 'result.response.content', []) || [];
        const existing = _.get(merged, 'result.response.content', []) || [];
        const result = _.get(response, 'result', {});
        return {
          ...response,
          result: { ...result, response: { ..._.get(result, 'response', {}), content: [...existing, ...content] } }
        };
      }, {} as ServerResponse)
    );
  }
  getBatchDetails(bathId) {
    const option = {
      url: `${this.configService.urlConFig.URLS.BATCH.GET_DETAILS}/${bathId}`
    };
    return this.learnerService.get(option);
  }
  setEnrollToBatchDetails(enrollBatchDetails: any) {
    this._enrollToBatchDetails = enrollBatchDetails;
  }
  setUpdateBatchDetails(enrollBatchDetails: any) {
    this._updateBatchDetails = enrollBatchDetails;
  }
  getEnrollToBatchDetails(bathId) {
    if (this._enrollToBatchDetails && bathId === this._enrollToBatchDetails.identifier) {
      return observableOf(this._enrollToBatchDetails);
    } else {
      return this.getBatchDetails(bathId).pipe(map((data) => {
        return data.result.response;
      }));
    }
  }
  getUpdateBatchDetails(bathId) {
    if (this._updateBatchDetails && bathId === this._updateBatchDetails.identifier) {
      return observableOf(this._updateBatchDetails);
    } else {
      return this.getBatchDetails(bathId).pipe(map((date) => {
        return date.result.response;
      }));
    }
  }

  getParticipantList(data) {
    const options = {
      url: this.configService.urlConFig.URLS.BATCH.GET_PARTICIPANT_LIST,
      data: data
    };
    return this.learnerService.post(options).pipe(map((response: any) => {
      return _.get(response, 'result.batch.participants') || [];
    }));
  }

  enrollToCourse(data) {
    const options = {
      url: this.configService.urlConFig.URLS.COURSE.ENROLL_USER_COURSE,
      data: data
    };
    return this.learnerService.post(options);
  }
  unenrollFromCourse(data) {
    const options = {
      url: this.configService.urlConFig.URLS.COURSE.UNENROLL_USER_COURSE,
      data: data
    };
    return this.learnerService.post(options);
  }
  createBatch(request) {
    const option = {
      url: this.configService.urlConFig.URLS.BATCH.CREATE,
      data: {
        request: request
      }
    };
    return this.learnerService.post(option);
  }
  updateBatch(request) {
    const option = {
      url: this.configService.urlConFig.URLS.BATCH.UPDATE,
      data: {
        request: request
      }
    };
    return this.learnerService.patch(option);
  }
  addUsersToBatch(userId, batchId, courseId) {
    const option = {
      url: this.configService.urlConFig.URLS.BATCH.ADD_USERS,
      data: {
        request: {
          courseId: courseId,
          batchId: batchId,
          userId: userId
        }
      }
    };
    return this.learnerService.post(option);
  }

  removeUsersFromBatch(userId, batchId, courseId) {
    const option = {
      url: this.configService.urlConFig.URLS.BATCH.REMOVE_USERS,
      data: {
        request: {
          courseId: courseId,
          batchId: batchId,
          userId: userId
        }
      }
    };
    return this.learnerService.post(option);
  }
  getEnrolledBatchDetails(batchId) {
    if (this._enrolledBatchDetails && this._enrolledBatchDetails.identifier === batchId) {
      return observableOf(this._enrolledBatchDetails);
    } else {
      return this.getBatchDetails(batchId).pipe(map((data) => {
        this._enrolledBatchDetails = data.result.response;
        return data.result.response;
      }));
    }
  }
  getcertificateDescription(enrolledBatchInfo) {
    let certificateDescription = {isCertificate: false, description: ''};
    const certificateTemplate = _.get(enrolledBatchInfo, 'cert_templates');
    if (certificateTemplate && Object.keys(certificateTemplate).length !== 0) {
      const templateKey = Object.keys(certificateTemplate);
      const description = certificateTemplate[templateKey[0]].description;
      if (description) {
        certificateDescription = {
          isCertificate: true,
          description: description
        };
      } else {
        certificateDescription = {
          isCertificate: true,
          description: ''
        };
      }
    }
    return certificateDescription;
  }
}

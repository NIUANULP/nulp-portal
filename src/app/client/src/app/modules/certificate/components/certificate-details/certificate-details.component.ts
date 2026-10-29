import { PublicPlayerService } from '@sunbird/public';
import {CertificateService, UserService, TenantService} from '@sunbird/core';
import { ServerResponse, ResourceService, ConfigService, PlayerConfig, ToasterService } from '@sunbird/shared';
import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import * as _ from 'lodash-es';
import * as dayjs from 'dayjs';
import { IImpressionEventInput } from '@sunbird/telemetry';
import { Subscription} from 'rxjs';
import { CsCertificateService } from '@project-sunbird/client-services/services/certificate/interface';

/** English text for the public verification page; translations live in resource bundles under cert.imsg.verify */
const CERT_VERIFY_TEXT = {
  logoAlt: 'NIUA and National Urban Learning Platform (NULP) home',
  checkingTitle: 'Verifying certificate',
  checkingText: 'Checking this certificate against NULP\'s records.',
  verifiedTitle: 'Genuine NULP certificate',
  verifiedText: 'This certificate is in NULP\'s records and is valid.',
  checkedAt: 'Checked on {time}',
  awardedTo: 'Awarded to',
  forCompleting: 'for completing',
  issuedOn: 'Issued on',
  issuedBy: 'Issued by',
  certificateId: 'Certificate ID',
  matchTitle: 'Compare these details with the certificate you have.',
  matchText: 'If anything differs, the certificate has been altered.',
  invalidTitle: 'Not a NULP certificate',
  invalidText: 'No certificate with this ID is in NULP\'s records. Do not accept it as a NULP certificate.',
  revokedTitle: 'Certificate revoked',
  revokedText: 'NULP issued this certificate but has since revoked it. It is no longer valid.',
  errorTitle: 'Certificate not checked',
  errorText: 'NULP\'s records could not be reached. Try again in a moment.',
  tooManyText: 'Too many checks from your network. Wait a minute, then try again.',
  tryAgain: 'Try again',
  copyLink: 'Copy verification link',
  linkCopied: 'Link copied',
  officialNotice: 'Official certificate check by NULP'
};

@Component({
  selector: 'app-certificate-details',
  templateUrl: './certificate-details.component.html',
  styleUrls: ['./certificate-details.component.scss']
})
export class CertificateDetailsComponent implements OnInit , OnDestroy {
  loader: boolean;
  viewCertificate: boolean;
  error = false;
  enableVerifyButton = false;
  certificateCode: string;
  wrongCertificateCode = false;
  instance: string;
  telemetryImpressionData: IImpressionEventInput;
  telemetryCdata: Array<{}> = [];
  pageId: string;
  playerConfig: PlayerConfig;
  contentId: string;
  showVideoThumbnail = true;
  logo: string;
  tenantName: string;
  tenantDataSubscription: Subscription;

  /** To store the certificate details data */
  recipient: string;
  courseName: string;
  issuedOn: string;
  watchVideoLink: string;
  validateRCCertificate: boolean = false;
  @ViewChild('codeInputField') codeInputField: ElementRef;
  isInvalidCertificate: boolean = false;
  /** Public (QR) verification: extra details and a retryable state for failures on our side */
  issuerName: string;
  certificateId: string;
  verificationError = false;
  isRevokedCertificate = false;
  tooManyRequests = false;
  /** When the record was checked, shown so a screenshot of the result carries its date */
  checkedAt: string;
  linkCopied = false;
  private linkCopiedTimer: any;

  constructor(
    public activatedRoute: ActivatedRoute,
    public certificateService: CertificateService,
    public resourceService: ResourceService,
    public configService: ConfigService,
    public userService: UserService,
    public playerService: PublicPlayerService,
    public router: Router,
    public tenantService: TenantService,
    @Inject('CS_CERTIFICATE_SERVICE') private CsCertificateService: CsCertificateService,
    private toasterService: ToasterService,
    private meta: Meta,
  ) { }

  ngOnInit() {
    // Certificate pages show personal names; keep them out of search engines
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    this.instance = _.upperCase(this.resourceService.instance);
    this.pageId = this.activatedRoute.snapshot.data.telemetry.pageid;
    if (_.get(this.activatedRoute, 'snapshot.queryParams.data')) {
      this.validateRCCertificate = true;
      this.validateCertificate();
    } else if (_.get(this.activatedRoute, 'snapshot.queryParams.t')) {
      this.validateRCCertificate = true;
      this.validateTCertificate();
    }
    this.setTelemetryData();
    this.tenantDataSubscription = this.tenantService.tenantData$.subscribe(data => {
      if (data && !data.err && data.tenantData) {
        this.logo = data.tenantData.logo;
        this.tenantName = data.tenantData.titleName;
      }
    });
  }

  /** It will call the validate cert. api and course_details api (after taking courseId) */
  certificateVerify() {
    this.loader = true;
    const request = {
      request: {
        'certId': this.activatedRoute.snapshot.params.uuid,
        'accessCode': _.trim(this.certificateCode),
        'verifySignature': true,
      }
    };
    this.certificateService.validateCertificate(request).subscribe(
      (data: ServerResponse) => {
        if (_.get(data, 'result.response.related.certVideoUrl')) {
          this.watchVideoLink = _.get(data, 'result.response.related.certVideoUrl');
          this.processVideoUrl(this.watchVideoLink);
        } else {
          this.getCourseVideoUrl(_.get(data, 'result.response.related.courseId'));
        }
        const certData = _.get(data, 'result.response.json');
        this.loader = false;
        this.viewCertificate = true;
        this.recipient = _.get(certData, 'recipient.name');
        this.courseName = _.get(certData, 'badge.name');
        this.issuedOn = dayjs(new Date(_.get(certData, 'issuedOn'))).format('DD MMM YYYY');
      },
      (err) => {
        this.wrongCertificateCode = true;
        this.loader = false;
        this.codeInputField.nativeElement.value = '';
        this.codeInputField.nativeElement.focus();
        this.enableVerifyButton = false;
      }
    );
  }
  /** To handle verify button enable/disable fucntionality */
  getCodeLength(event: any) {
    this.wrongCertificateCode = false;
    if (event.target.value.length === 6) {
      this.enableVerifyButton = true;
    } else {
      this.enableVerifyButton = false;
    }
  }
  /** To redirect to courses tab (for mobile device, they will handle 'href' change) */
  navigateToCoursesPage() {
    if (this.activatedRoute.snapshot.queryParams.clientId === 'android') {
      window.location.href = '/explore-course';
    } else {
      this.router.navigate(['/explore-course']);
    }
  }
  /** To set the telemetry*/
  setTelemetryData() {
    const context = { env: this.activatedRoute.snapshot.data.telemetry.env };
    if (_.get(this.activatedRoute, 'snapshot.queryParams.clientId') === 'android' &&
    _.get(this.activatedRoute, 'snapshot.queryParams.context')) {
      const telemetryData = JSON.parse(decodeURIComponent(_.get(this.activatedRoute, 'snapshot.queryParams.context')));
      context['env'] = telemetryData.env;
    }
    this.telemetryImpressionData = {
      context: context,
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.pageId,
        uri: this.router.url
      }
    };
    this.telemetryCdata = [
      {
        id: 'course:qrcode:scan:cert',
        type: 'Feature'
      },
      {
        id: 'SB-13854',
        type: 'Task'
      }
    ];
  }

  /** to get the certtificate video url and courseId from that url */
  getCourseVideoUrl(courseId: string) {
    this.playerService.getCollectionHierarchy(courseId).subscribe(
      (response: ServerResponse) => {
        this.watchVideoLink = _.get(response, 'result.content.certVideoUrl');
        this.processVideoUrl(this.watchVideoLink);
      }, (error) => {
      });
  }

  processVideoUrl(url: string) {
    if (url) {
      const splitedData = url.split('/');
      splitedData.forEach((value) => {
        if (value.includes('do_')) {
          this.contentId = value;
        }
      });
    }
  }

  /** to play content on the certificate details page */
  playContent(contentId: string) {
    this.showVideoThumbnail = false;
    const option = { params: this.configService.appConfig.ContentPlayer.contentApiQueryParams };
    this.playerService.getContent(contentId, option).subscribe(
      (response) => {
        const contentDetails = {
          contentId: contentId,
          contentData: response.result.content
        };
        this.playerConfig = this.playerService.getConfig(contentDetails);
      },
      (err) => {
      });
  }

  ngOnDestroy() {
    if (this.tenantDataSubscription) {
      this.tenantDataSubscription.unsubscribe();
    }
    clearTimeout(this.linkCopiedTimer);
    this.meta.removeTag(`name='robots'`);
  }

  /**
   * @description
   * Function to validate certificate if URL has `data` params
   */
  validateCertificate() {
    this.verifyRCCertificate();
  }
  /**
   * @description
   * Function to validate certificate if URL has `t` params
   */
  validateTCertificate() {
    this.verifyRCCertificate();
  }
  /**
   * @description
   * Verifies the certificate in the URL through the public portal API, so the QR code works without login
   */
  verifyRCCertificate() {
    this.loader = true;
    this.verificationError = false;
    this.tooManyRequests = false;
    this.isInvalidCertificate = false;
    this.isRevokedCertificate = false;
    this.certificateId = _.get(this.activatedRoute, 'snapshot.params.uuid');
    this.certificateService.verifyPublicCertificate(this.certificateId).subscribe(
      (data: ServerResponse) => {
        const certData = _.get(data, 'result.certificate');
        this.loader = false;
        if (_.get(data, 'result.verified')) {
          this.viewCertificate = true;
          this.recipient = _.get(certData, 'recipientName');
          this.courseName = _.get(certData, 'trainingName');
          this.issuerName = _.get(certData, 'issuerName');
          this.issuedOn = dayjs(new Date(_.get(certData, 'issuedOn'))).format('DD MMM YYYY');
          this.checkedAt = dayjs().format('DD MMM YYYY, h:mm A');
        } else {
          this.viewCertificate = false;
          // The record exists but is no longer active (e.g. REVOKED)
          if (_.get(data, 'result.status')) {
            this.isRevokedCertificate = true;
          } else {
            this.isInvalidCertificate = true;
          }
        }
      },
      (err) => {
        this.viewCertificate = false;
        // 404 (unknown id) and 400 (malformed id, e.g. a tampered QR) mean it is not in the RC registry;
        // anything else is a failure on our side, so offer a retry
        if (_.includes([400, 404], _.get(err, 'status'))) {
          // Older certreg certificates are not in the RC registry; their QR carries signed `data` instead
          if (_.get(this.activatedRoute, 'snapshot.queryParams.data')) {
            this.verifyLegacyCertificate();
            return;
          }
          this.isInvalidCertificate = true;
        } else {
          this.verificationError = true;
          this.tooManyRequests = _.get(err, 'status') === 429;
        }
        this.loader = false;
      }
    );
  }

  /** Verifies an older (certreg) certificate from the signed `data` in its QR, as the page did before RC */
  private verifyLegacyCertificate() {
    const encodedData = _.replace(String(_.get(this.activatedRoute, 'snapshot.queryParams.data')), / /g, '+');
    this.CsCertificateService.getEncodedData(encodedData)
      .then((certificateData) => this.CsCertificateService.verifyCertificate({
        certificateData,
        schemaName: 'certificate',
        certificateId: this.certificateId,
      }, {
        apiPath: '/learner/certreg/v2',
        apiPathLegacy: '/certreg/v1',
        rcApiPath: '/learner/rc/${schemaName}/v1',
      }).toPromise())
      .then((data) => {
        const certData = _.get(data, 'certificateData');
        if (_.get(data, 'verified')) {
          this.viewCertificate = true;
          this.recipient = _.get(certData, 'issuedTo');
          this.courseName = _.get(certData, 'trainingName');
          this.issuedOn = dayjs(new Date(_.get(certData, 'issuanceDate'))).format('DD MMM YYYY');
          this.checkedAt = dayjs().format('DD MMM YYYY, h:mm A');
        } else {
          this.isInvalidCertificate = true;
        }
      })
      .catch(() => {
        this.isInvalidCertificate = true;
      })
      .then(() => {
        this.loader = false;
      });
  }

  /** Text for the public verification page: translated from resource bundles, English otherwise */
  verifyLabel(key: string, params: { [name: string]: string } = {}): string {
    const text: string = _.get(this.resourceService, `frmelmnts.cert.imsg.verify.${key}`) || _.get(CERT_VERIFY_TEXT, key) || '';
    return _.reduce(params, (result, value, name) => _.replace(result, `{${name}}`, value), text);
  }

  /** The one state the public page is in; drives the seal, the copy and which sections show */
  get verifyState(): 'loading' | 'verified' | 'invalid' | 'revoked' | 'error' {
    if (this.loader) { return 'loading'; }
    if (this.viewCertificate) { return 'verified'; }
    if (this.isRevokedCertificate) { return 'revoked'; }
    if (this.isInvalidCertificate) { return 'invalid'; }
    return this.verificationError ? 'error' : 'loading';
  }

  /** Clean link to this verification page, without the long data/t query from the QR */
  get verificationLink(): string {
    return `${window.location.origin}/certs/${encodeURIComponent(this.certificateId)}?t=1`;
  }

  copyVerificationLink() {
    const showCopied = () => {
      this.linkCopied = true;
      clearTimeout(this.linkCopiedTimer);
      this.linkCopiedTimer = setTimeout(() => this.linkCopied = false, 2500);
    };
    const clipboard = _.get(navigator, 'clipboard');
    if (clipboard && clipboard.writeText) {
      clipboard.writeText(this.verificationLink).then(showCopied, () => this.copyWithTextarea() && showCopied());
    } else if (this.copyWithTextarea()) {
      showCopied();
    }
  }

  /** Fallback for browsers/contexts without the async clipboard API */
  private copyWithTextarea(): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = this.verificationLink;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-10000px';
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (e) {
      copied = false;
    }
    document.body.removeChild(textarea);
    return copied;
  }
}

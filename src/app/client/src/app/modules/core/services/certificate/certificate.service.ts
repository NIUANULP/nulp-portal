import { LearnerService } from './../learner/learner.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService, ServerResponse } from '@sunbird/shared';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  constructor(public learnerService: LearnerService, public configService: ConfigService, private http: HttpClient) {  }

  validateCertificate(data): Observable<ServerResponse> {
    const option = {
      url: this.configService.urlConFig.URLS.USER.VALIDATE_CERTIFICATE,
      data: data
    };
    return this.learnerService.post(option);

  }

  fetchCertificatePreferences(data): Observable<ServerResponse> {
    const option = {
      url: this.configService.urlConFig.URLS.TENANT_PREFERENCE.READ,
      data: data
    };
    return this.learnerService.post(option);
  }

  /** Public (no login) verification of an RC certificate, used by the certificate QR code page */
  verifyPublicCertificate(certificateId: string): Observable<ServerResponse> {
    return this.http.get<ServerResponse>(`/certificate/public/v1/verify/${encodeURIComponent(certificateId)}`);
  }

  getBatchDetails(bathId) {
    const option = {
      url: `${this.configService.urlConFig.URLS.BATCH.GET_DETAILS}/${bathId}`
    };
    return this.learnerService.get(option);
  }
}

import { ActivatedRoute, Router } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { UserService, CertificateService, TenantService } from'@sunbird/core';
import { ResourceService, ConfigService } from '@sunbird/shared';
import { PublicPlayerService } from '@sunbird/public';
import { CertificateDetailsComponent } from './certificate-details.component';
import { validateCertMockResponse } from './certificate-details.component.spec.data'
import { of, throwError } from 'rxjs';
  
describe("CertificateDetailsComponent", () => {
    let component: CertificateDetailsComponent;

    const mockCertificateService: Partial<CertificateService> = {};
    const mockActivatedRoute: Partial<ActivatedRoute> = {
        snapshot: {
            data: {
              telemetry: { env: 'course', pageid: 'validate-certificate', type: 'view' }
            },
            params: { uuid: '9545879' },
            queryParams: { clientId: 'android', context: '{"env":"course","pageid":"validate-certificate","type":"view"}' }
        } as any
    };
    const mockConfigService: Partial<ConfigService> = {
        appConfig: {ContentPlayer:{contentApiQueryParams: {}}}
    };
    const mockPublicPlayerService: Partial<PublicPlayerService> = {
        getConfig: jest.fn()
    };
    const mockRouter: Partial<Router> = {
        navigate: jest.fn()
    };
    const mockTenantService: Partial<TenantService> = {
        tenantData$: of({tenantData: {titleName: 'sample-favicon', logo: "logo-path"}}) as any
    };
    const mockResourceService: Partial<ResourceService> = {
        instance: "SUNBIRD",
        messages: {emsg: {m0005: ""}}
    };
    const mockUserService: Partial<UserService> = {};
    const mockMeta: Partial<Meta> = {
        updateTag: jest.fn(),
        removeTag: jest.fn()
    };
    
    beforeAll(() => {
        component = new CertificateDetailsComponent(
            mockActivatedRoute as ActivatedRoute, 
            mockCertificateService as CertificateService, 
            mockResourceService as  ResourceService,
            mockConfigService as ConfigService, 
            mockUserService as UserService,
            mockPublicPlayerService as PublicPlayerService, 
            mockRouter as Router, 
            mockTenantService as TenantService, 
            mockMeta as Meta,
        );
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be create a instance of CertificateDetailsComponent', () => {
        expect(component).toBeTruthy();
    });

    it("should process video url and set content id", () => {
        component.processVideoUrl("http://www.xyz.com/do_1126972203209768961327");
        expect(component.contentId).toEqual("do_1126972203209768961327")
    })

    it("should set Telemetry Data", () => {
        component.setTelemetryData();
        expect(component.telemetryImpressionData).toBeDefined();
        expect(component.telemetryCdata).toBeDefined();
    })


    describe('verifyRCCertificate', () => {
        const verifiedResponse = {
            result: {
                verified: true,
                status: 'ACTIVE',
                certificate: {
                    recipientName: 'state',
                    trainingName: 'Course Name',
                    issuedOn: '2022-04-12T11:54:46.473Z'
                }
            }
        };

        it('should verify certificate through public API when URL has `data` params', () => {
            component.viewCertificate = false;
            component.isInvalidCertificate = false;
            mockCertificateService.verifyPublicCertificate = jest.fn().mockImplementation(() => of(verifiedResponse));
            component.validateCertificate();
            expect(mockCertificateService.verifyPublicCertificate).toHaveBeenCalledWith('9545879');
            expect(component.loader).toBe(false);
            expect(component.viewCertificate).toBeTruthy();
            expect(component.recipient).toEqual('state');
            expect(component.courseName).toEqual('Course Name');
            expect(component.issuedOn).toEqual('12 Apr 2022');
            expect(component.certificateId).toEqual('9545879');
            expect(component.checkedAt).toBeTruthy();
            expect(component.verifyState).toEqual('verified');
        });

        it('should verify certificate through public API when URL has `t` params', () => {
            component.viewCertificate = false;
            component.isInvalidCertificate = false;
            mockCertificateService.verifyPublicCertificate = jest.fn().mockImplementation(() => of(verifiedResponse));
            component.validateTCertificate();
            expect(mockCertificateService.verifyPublicCertificate).toHaveBeenCalledWith('9545879');
            expect(component.viewCertificate).toBeTruthy();
            expect(component.recipient).toEqual('state');
        });

        it('should report revoked, invalid and error page states', () => {
            mockCertificateService.verifyPublicCertificate = jest.fn().mockImplementation(() =>
                of({ result: { verified: false, status: 'REVOKED' } }));
            component.verifyRCCertificate();
            expect(component.verifyState).toEqual('revoked');
            mockCertificateService.verifyPublicCertificate = jest.fn().mockImplementation(() => of({ result: { verified: false } }));
            component.verifyRCCertificate();
            expect(component.verifyState).toEqual('invalid');
            mockCertificateService.verifyPublicCertificate = jest.fn(() => throwError({ status: 500 }));
            component.verifyRCCertificate();
            expect(component.verifyState).toEqual('error');
        });

        it('should show revoked state if the certificate exists but is not active', () => {
            component.viewCertificate = true;
            mockCertificateService.verifyPublicCertificate = jest.fn().mockImplementation(() =>
                of({ result: { verified: false, status: 'REVOKED' } }));
            component.validateTCertificate();
            expect(component.viewCertificate).toBeFalsy();
            expect(component.isRevokedCertificate).toBeTruthy();
            expect(component.isInvalidCertificate).toBeFalsy();
        });

        it('should mark certificate invalid if it is not verified and has no status', () => {
            component.viewCertificate = true;
            mockCertificateService.verifyPublicCertificate = jest.fn().mockImplementation(() =>
                of({ result: { verified: false } }));
            component.validateTCertificate();
            expect(component.isInvalidCertificate).toBeTruthy();
            expect(component.isRevokedCertificate).toBeFalsy();
        });

        it('should show the too-many-checks message when rate limited', () => {
            mockCertificateService.verifyPublicCertificate = jest.fn(() => throwError({ status: 429 }));
            component.validateTCertificate();
            expect(component.verificationError).toBeTruthy();
            expect(component.tooManyRequests).toBeTruthy();
            expect(component.isInvalidCertificate).toBeFalsy();
        });

        it('should mark certificate invalid if certificate is not found', () => {
            component.viewCertificate = true;
            component.isInvalidCertificate = false;
            mockCertificateService.verifyPublicCertificate = jest.fn(() => throwError({ status: 404 }));
            component.validateTCertificate();
            expect(component.loader).toBe(false);
            expect(component.viewCertificate).toBeFalsy();
            expect(component.isInvalidCertificate).toBeTruthy();
            expect(component.verificationError).toBeFalsy();
        });

        it('should mark certificate invalid if the certificate id is malformed', () => {
            component.viewCertificate = true;
            component.isInvalidCertificate = false;
            mockCertificateService.verifyPublicCertificate = jest.fn(() => throwError({ status: 400 }));
            component.validateTCertificate();
            expect(component.verifyState).toEqual('invalid');
            expect(component.verificationError).toBeFalsy();
        });

        it('should report not a NULP certificate for a `data` QR that the RC registry does not have', () => {
            (mockActivatedRoute.snapshot.queryParams as any).data = 'signed data';
            mockCertificateService.verifyPublicCertificate = jest.fn(() => throwError({ status: 404 }));
            component.validateCertificate();
            expect(component.verifyState).toEqual('invalid');
            expect(component.loader).toBe(false);
            delete (mockActivatedRoute.snapshot.queryParams as any).data;
        });

        it('should show retryable error, not invalid certificate, if verification fails on our side', () => {
            component.viewCertificate = true;
            component.isInvalidCertificate = false;
            mockCertificateService.verifyPublicCertificate = jest.fn(() => throwError({ status: 500 }));
            component.validateTCertificate();
            expect(component.loader).toBe(false);
            expect(component.viewCertificate).toBeFalsy();
            expect(component.isInvalidCertificate).toBeFalsy();
            expect(component.verificationError).toBeTruthy();
            expect(component.tooManyRequests).toBeFalsy();
        });

        it('should clear previous error and verify again on retry', () => {
            component.verificationError = true;
            mockCertificateService.verifyPublicCertificate = jest.fn().mockImplementation(() => of(verifiedResponse));
            component.verifyRCCertificate();
            expect(component.verificationError).toBeFalsy();
            expect(component.viewCertificate).toBeTruthy();
            expect(component.loader).toBe(false);
        });
    })


    describe('verifyLabel', () => {
        afterEach(() => {
            delete (mockResourceService as any).frmelmnts;
        });

        it('should use the translated text when the resource bundle has it', () => {
            (mockResourceService as any).frmelmnts = { cert: { imsg: { verify: { verifiedTitle: 'प्रमाण-पत्र सत्यापित' } } } };
            expect(component.verifyLabel('verifiedTitle')).toEqual('प्रमाण-पत्र सत्यापित');
        });

        it('should fall back to English and fill placeholders', () => {
            expect(component.verifyLabel('verifiedTitle')).toEqual('Genuine NULP certificate');
            expect(component.verifyLabel('checkedAt', { time: '27 Oct 2026, 11:42 AM' }))
                .toEqual('Checked on 27 Oct 2026, 11:42 AM');
        });
    });

    describe('copyVerificationLink', () => {
        it('should copy a clean verification link and show copied state', async () => {
            component.certificateId = '9763d1a9';
            const writeText = jest.fn(() => Promise.resolve());
            Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
            component.copyVerificationLink();
            await Promise.resolve();
            expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/certs/9763d1a9?t=1`);
            expect(component.linkCopied).toBe(true);
            component.ngOnDestroy();
        });
    });

    describe("ngOnInit", () => {
        it("should keep the certificate page out of search engines", () => {
            mockActivatedRoute.snapshot.queryParams = {};
            component.ngOnInit();
            expect(mockMeta.updateTag).toHaveBeenCalledWith({ name: 'robots', content: 'noindex, nofollow' });
        });

        it("should validate certificate for data queryparams", () => {
            mockActivatedRoute.snapshot.queryParams = { data: {}};
            jest.spyOn(component, 'validateCertificate').mockImplementation();
            jest.spyOn(component, 'setTelemetryData').mockImplementation();
            component.ngOnInit();
            expect(component.validateCertificate).toHaveBeenLastCalledWith();
            expect(component.setTelemetryData).toHaveBeenLastCalledWith();
            expect(component.tenantName).toBeDefined();
        });

        it("should validate certificate for 't' queryparams", () => {
            mockActivatedRoute.snapshot.queryParams = { t: {}};
            jest.spyOn(component, 'validateTCertificate').mockImplementation();
            jest.spyOn(component, 'setTelemetryData').mockImplementation();
            component.ngOnInit();
            expect(component.validateTCertificate).toHaveBeenLastCalledWith();
            expect(component.setTelemetryData).toHaveBeenLastCalledWith();
            expect(component.tenantName).toBeDefined();
        })
    })


    describe('getCourseVideoUrl', () => { 
        it('should get content id', () => {
            mockPublicPlayerService.getCollectionHierarchy = jest.fn().mockImplementation(() => of(validateCertMockResponse.getCourseIdResponse));
            jest.spyOn(component, 'processVideoUrl').mockImplementation();
            component.getCourseVideoUrl('do_1126972203209768961327');
            expect(component.watchVideoLink).toEqual(validateCertMockResponse.getCourseIdResponse.result.content.certVideoUrl);
            expect(component.processVideoUrl).toHaveBeenCalledWith(validateCertMockResponse.getCourseIdResponse.result.content.certVideoUrl)
        });
    })


    describe('certificateVerify', () => { 
        it('should verify the certificate', () => {
            component.loader = true;
            mockCertificateService.validateCertificate = jest.fn(() => of(validateCertMockResponse.successResponse));
            const certData = validateCertMockResponse.successResponse;
            component.certificateVerify();
            expect(component.loader).toBe(false);
            expect(component.viewCertificate).toBe(true);
            expect(component.recipient).toBe(certData.result.response.json.recipient.name);
            expect(component.courseName).toBe(certData.result.response.json.badge.name);
        });
        
        it('should process the video url if it is present inside response, no need to call hierarchy api', () => {
            component.loader = true;
            mockCertificateService.validateCertificate = jest.fn(() => of(validateCertMockResponse.successResponse));
            jest.spyOn(component, 'processVideoUrl').mockImplementation();
            const certData = validateCertMockResponse.successResponse;
            component.certificateVerify();
            expect(component.processVideoUrl).toHaveBeenCalledWith(certData.result.response.related.certVideoUrl);
        });


        it('should process the video url if it is not present inside response, call hierarchy api', () => {
            component.loader = true;
            let res = validateCertMockResponse.successResponse;
            delete res.result.response.related.certVideoUrl;
            mockCertificateService.validateCertificate = jest.fn(() => of(res));
            jest.spyOn(component, 'getCourseVideoUrl').mockImplementation();
            component.certificateVerify();
            expect(component.getCourseVideoUrl).toHaveBeenCalledWith(res.result.response.related.courseId);
        });
    
        it('should not verify the certificate', () => {
            component.loader = true;
            mockCertificateService.validateCertificate = jest.fn(() => throwError(validateCertMockResponse.errorRespone));
            component.certificateVerify();
            expect(component.loader).toBe(false);
            expect(component.wrongCertificateCode).toBe(true);
            expect(component.enableVerifyButton).toBe(false);
        });
    });

    describe('getCodeLength', () => { 
        it('should enable verification button if key up', () => {
            const event = {target: {value: 'key-up'}};
            component.getCodeLength(event);
            expect(component.enableVerifyButton).toBeTruthy();
        });    
        it('should disable verification button if key down', () => {
            const event = {target: {value: 'key-down'}};
            component.getCodeLength(event);
            expect(component.enableVerifyButton).toBeFalsy();
        });  
    })

    describe('navigateToCoursesPage', () => { 
        it('should back to course page', () => {
            component.navigateToCoursesPage();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/explore-course']);
        }); 

        it('should back to course page for android client', () => {
            Object.defineProperty(window, "location", {
                value: {
                    href: jest.fn()
                }
            });
            mockActivatedRoute.snapshot.queryParams = { clientId: "android"};
            component.navigateToCoursesPage();
            expect(window.location.href).toEqual('/explore-course');
        });
    })

    describe('playContent', () => { 
        it('should play the content', () => {
            mockPublicPlayerService.getContent = jest.fn().mockImplementation(() => of(validateCertMockResponse.getContentResponse));
            component.playContent('do_112831862871203840114');
            expect(mockPublicPlayerService.getConfig).toHaveBeenCalled();
        });
    })

    describe('ngOnDestroy', () => { 
        it('should unsubscribe tenantDataSubscription', () => {
            component.tenantDataSubscription = {
              unsubscribe: jest.fn()
            } as any;
            component.ngOnDestroy();
            expect(component.tenantDataSubscription.unsubscribe).toHaveBeenCalled();
            expect(mockMeta.removeTag).toHaveBeenCalledWith(`name='robots'`);
        });
    })

    
    

})
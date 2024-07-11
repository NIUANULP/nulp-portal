import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ResourceService, UtilService, ConfigService } from '@sunbird/shared';
import { TelemetryService } from '@sunbird/telemetry';
import * as _ from 'lodash-es';

@Component({
  selector: 'app-signup-basic-info',
  templateUrl: './signup-basic-info.component.html',
  styleUrls: ['./signup-basic-info.component.scss', '../signup/signup_form.component.scss']
})
export class SignupBasicInfoComponent implements OnInit {

  @Output() subformInitialized: EventEmitter<{}> = new EventEmitter<{}>();
  @Output() triggerIsMinor: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() triggerNext: EventEmitter<boolean> = new EventEmitter<boolean>();
  public personalInfoForm: FormGroup;
  @Input() isIOSDevice;
  @Input() telemetryImpression;
  @Input() submitInteractEdata;
  @Input() telemetryCdata;
  @Input() startingForm: object;
  instance: '';
  userTypes: string[] = ['Student', 'Teacher', 'Parent', 'Admin'];
  designations: string[] = [ "Accountant", "Accountant & Cashier", "Accounts Clerk & Computer Operator", "Accounts Officer", "Additional City Engineer", "Additional Commissioner", "Additional Municipal Commissioner/ Additional Administrator", "Administrative Officer", "Advocate", "Analyst", "Architect", "Architect and Urban Designer", "Architect and Urban Planner", "Assessor", "Assistant Accounts Officer", "Assistant Architect", "Assistant Assessment", "Assistant Commissioner", "Assistant Engineer (Civil)", "Assistant Engineer (Electrical)", "Assistant Engineer (Mechanical)", "Assistant Engineer (Transport)", "Assistant Executive Engineer", "Assistant Law Officer", "Assistant Manager", "Assistant Municipal Commissioner", "Assistant Planner", "Assistant Professor", "Assistant Programmer", "Assistant Public Health Officer", "Assistant Public Information Officer", "Assistant Revenue Inspector", "Assistant Sanitary Inspector", "Assistant Tax Superintendent", "Assistant Town Planner", "Associate Manager", "Associate Town Planner", "Associate Vice President", "Auditor", "Billing Assistant", "Brand Ambassador", "Building Inspector", "C&D/ GIS operator", "Capacity Building Expert", "Chairperson", "Chief Accountant", "Chief Accounts Officer", "Chief Archives Officer", "Chief Auditor", "Chief Engineer/ Engineer-in-Chief", "Chief Enquiry Officer", "Chief Ethnographer", "Chief Executive Officer", "Chief Facilitator", "Chief Finance Officer", "Chief Fire Officer", "Chief Information Technology (IT) Officer", "Chief Labour Officer", "Chief Municipal Officer", "Chief Operating Officer", "Chief Personnel Officer", "Chief Sanitary Inspector", "Chief Security Officer", "Chief Town Planner", "City Coordinator", "City Data Officer", "City Engineer", "City Health Officer", "City Manager", "City Project Officer", "Civil Engineer", "Clerk", "Collector", "Commissioner", "Company Secretary", "Computer Operator", "Computer Programmer", "Consultant", "Councillor", "Customer Support Leader", "Data Analyst", "Data Entry Operator", "Deputy Administrator", "Deputy Director", "Deputy General Manager", "Deputy Municipal Commissioner", "Development Fellow", "Director", "Director Town Planning", "District Coordinator", "Divisional Coordinator", "Draughtsman", "Education Officer", "Engineer", "Environment officer - climate change", "Executive Engineer", "Executive Engineer (Civil)", "Executive Health Officer", "Executive Officer", "Executive Town Planner", "Fellow", "Finance Officer", "Garden Superintendent", "General Manager", "Geologist", "GIS Expert", "Head Clerk", "Head of Department", "Health Assistant", "Health Officer", "Heavy Vehicle Driver", "Horticulture Officer", "Human Resource Officer", "IEC Expert", "Information Technology (IT) Officer", "Joint City Engineer", "Joint Commissioner", "Junior Architect", "Junior Assistant", "Junior Engineer (Civil)", "Junior Engineer (Electrical)", "Junior Engineer (Mechanical)", "Junior Planner", "Law Assistant", "Law Officer", "Lead Architect", "Legal assistant", "Legal Officer", "Light Vehicle Driver", "Lower Divisional Clerk", "Manager", "Medical Officer", "Member Secretary", "Monitoring Evaluation Expert", "Municipal Architect", "Municipal Commissioner/ Administrator", "Municipal Secretary", "Office Assistant cum Accountant", "Office Assistant cum Comp Operator", "Others", "Peon", "Personal Assistant", "PG Student", "PHD Scholar", "Planning Assistant", "Professor", "Program Associate", "Program Fellow", "Programmer", "Project Coordinator", "Project Lead", "Public Health Officer", "Public Information Officer", "Public Relations Officer", "Publicity Assistant", "Revenue Inspector", "Sanitary & Food Inspector", "Sanitary Supervisor", "Sanitation Inspector", "Sanitation Worker/ Sweeper", "Secretary", "Section Officer/ Land Revenue Officer", "Security Officer", "Senior Assistant Urban Planner", "Senior Associate", "Senior Clerk", "Senior Consultant", "Senior Research Associate", "Software Developer", "Special Officer", "Stenographer", "Street Light Inspector", "Student", "Sub Engineer", "Superintendent Engineer", "Supervisor", "Surveyor/ Tracer", "Sweeper", "SWM Expert", "System Analyst", "Tax collector", "Tax Recovery Officer", "Team Lead", "Technical Advisor to Chief Engineer", "Technical Assistant", "Town Planner", "Transport Planner", "Undergraduate", "Upper Division Clerk", "Urban Designer", "Urban Development Expert", "Urban Planner", "Valuation Officer", "Veterinary Assistant", "Veterinary Officer", "Vice Chairman", "Vice President", "Vigilance Officer", "Ward Officer",
"Zonal and Taxation Officer"];

  constructor(
    public resourceService: ResourceService, public telemetryService: TelemetryService,
    public utilService: UtilService, public configService: ConfigService, private _fb: FormBuilder) { }

  ngOnInit(): void {
    this.instance = _.upperCase(this.resourceService.instance || 'SUNBIRD');
    this.personalInfoForm = this._fb.group({
      name: ['', Validators.required],
      organisation: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]],
      userType: ['', Validators.required],
      designation: ['', Validators.required]
    });
    console.log('Global Object data => ', this.startingForm); // TODO: log!
  }

  next() {
    if (this.personalInfoForm.valid) {
      let userDetails;
      if (localStorage.getItem('guestUserDetails')) {
        userDetails = JSON.parse(localStorage.getItem('guestUserDetails'));
      } else {
        userDetails = { name: this.personalInfoForm.controls.name.value };
      }
      userDetails.name = this.personalInfoForm.controls.name.value;
      localStorage.setItem('guestUserDetails', JSON.stringify(userDetails));
      const signupStage1Details = {
        name: userDetails.name,
      };
      this.subformInitialized.emit(signupStage1Details);
      this.triggerNext.emit();
    } else {
      console.log("Invalid form");
    }
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProfileService } from '@sunbird/profile';
import { ConfigService, ResourceService } from '@sunbird/shared';
import * as _ from 'lodash-es';

@Component({
    selector: 'app-year-of-birth',
    templateUrl: './year-of-birth.component.html',
    styleUrls: ['./year-of-birth.component.scss']
})
export class YearOfBirthComponent implements OnInit {
    selectedYearOfBirth: number;
    birthYearOptions: Array<number> = [];
    showYearOfBirthPopup = false;
    @Input() dialogProps;

    constructor(
        private profileService: ProfileService,
        private configService: ConfigService,
        public resourceService: ResourceService,
        private matDialog: MatDialog
    ) { }
    ngOnInit() {
        this.initiateYearSelector();
    }

    submitYearOfBirth() {
        if (this.selectedYearOfBirth) {
            const req = { dob: this.selectedYearOfBirth.toString() };
            this.profileService.updateProfile(req).subscribe();
            const dialogRef = this.dialogProps && this.dialogProps.id && this.matDialog.getDialogById(this.dialogProps.id);
            dialogRef && dialogRef.close();
        }
    }

    initiateYearSelector() {
        const endYear = new Date().getFullYear();
        const startYear = endYear - this.configService.constants.SIGN_UP.MAX_YEARS;
        for (let year = endYear; year > startYear; year--) {
            this.birthYearOptions.push(year);
        }
    }

    changeBirthYear(year) {
        this.selectedYearOfBirth = _.get(year, 'value');
    }
}

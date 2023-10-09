import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash-es';

@Pipe({
    name: 'participants',
    pure: true
})
export class ParticipantsPipe implements PipeTransform {
    transform(participant: any[], selectedMentors: []): any[] {
        var result = participant.filter(res => {
            return !selectedMentors.some(res1 => {
                return res.id === res1;
            });
        })
        return result
    }
}

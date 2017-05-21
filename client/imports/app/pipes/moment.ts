import {Pipe, PipeTransform} from "@angular/core";
import * as moment from 'moment';

@Pipe({
    name: 'moment',
    pure: false
})
export class MomentPipe implements PipeTransform {
    constructor() {

    }

    transform(value: string, args: string): string {
        let m = moment(value);
        if (m.isValid()) {
            return moment(value).format(args);
        }
        return "";
    }
}
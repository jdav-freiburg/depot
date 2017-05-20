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
        return moment(value).format(args);
    }
}
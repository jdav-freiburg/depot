import { Pipe, PipeTransform } from '@angular/core';
import * as _ from "lodash";

@Pipe({name: 'join'})
export class JoinPipe implements PipeTransform {
    transform(value: string[], glue: string): string {
        return _.join(value, glue);
    }
}
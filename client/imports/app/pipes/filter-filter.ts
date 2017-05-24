import { Pipe, PipeTransform } from '@angular/core';
import {Item} from "../../../../both/models/item.model";

import * as _ from 'lodash';

export interface Filterable {
    readonly filter: string;
}

@Pipe({
    name: 'filterfilter',
    pure: false
})
export class FilterFilterPipe implements PipeTransform {
    transform(items: Filterable[], filter: string): any {
        if (!items) {
            return [];
        }
        if (!filter || filter.length < 3) {
            return items;
        }
        let lowercaseFilter = filter.toLowerCase();
        return items.filter(item => item.filter.indexOf(lowercaseFilter) !== -1);
    }
}
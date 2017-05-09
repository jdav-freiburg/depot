import { Pipe, PipeTransform } from '@angular/core';
import {Item} from "../../../../../both/models/item.model";

import * as _ from 'lodash';

@Pipe({
    name: 'itemsfilter',
    pure: false
})
export class ItemsFilterPipe implements PipeTransform {
    transform(items: Item[], filter: string): any {
        if (!items || !filter) {
            return items;
        }
        let lowercaseFilter = filter.toLowerCase();
        return items.filter(item => item.name.toLowerCase().indexOf(lowercaseFilter) !== -1 ||
            _.some(item.tags, (tag) => tag.toLowerCase().indexOf(lowercaseFilter) !== -1) ||
            item.description.toLowerCase().indexOf(lowercaseFilter) !== -1 ||
            item.externalId.toLowerCase() === lowercaseFilter);
    }
}
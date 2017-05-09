import { Pipe, PipeTransform } from '@angular/core';
import {Item} from "../../../../../both/models/item.model";

import * as _ from 'lodash';
import {Reservation} from "../../../../../both/models/reservation.model";

@Pipe({
    name: 'reservationsfilter',
    pure: false
})
export class ReservationsFilterPipe implements PipeTransform {
    transform(reservation: Reservation[], filter: string): any {
        if (!reservation || !filter) {
            return reservation;
        }
        let lowercaseFilter = filter.toLowerCase();
        return reservation.filter(reservation => reservation.name.toLowerCase().indexOf(lowercaseFilter) !== -1 ||
            reservation.contact.toLowerCase().indexOf(lowercaseFilter) !== -1);
    }
}
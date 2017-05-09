
import {Item} from "./item.model";
import {Group} from "./group.model";
export interface Reservation {
    _id?: string;

    type: string;
    name: string;
    start: Date;
    end: Date;

    userId: string;

    groupId: string;

    contact: string;

    itemIds: string[];
}
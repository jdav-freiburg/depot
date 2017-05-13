import SimpleSchema from 'simpl-schema';

import * as Color from 'color';
import * as _ from 'lodash';

export const ItemSchema = new SimpleSchema({
    externalId: { type: String, optional: true },
    name: { type: String, optional: true },

    description: { type: String, optional: true },

    condition: { type: String, optional: true },
    conditionComment: { type: String, optional: true },

    lastService: { type: Date, optional: true },

    picture: { type: String, optional: true },

    tags: { type: Array, optional: true },
    'tags.$': { type: String },

    status: { type: String, optional: true }
});

export function itemColor(factor: number|string): string {
    if (!_.isNumber(factor)) {
        factor = Number.parseFloat(factor);
    }
    return Color('#cc0000').rotate(1.2 * Math.min(Math.max(factor, 0.0), 100.0)).hex();
}

export interface Item {
    _id?: string;
    externalId: string;
    name: string;

    description: string;

    condition: string,
    conditionComment: string,

    lastService: Date;

    picture: string;

    tags: string[];

    status: string;
}

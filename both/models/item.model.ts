import SimpleSchema from 'simpl-schema';

import * as _ from 'lodash';

export const ItemSchema = new SimpleSchema({
    externalId: { type: String, optional: true },
    name: { type: String, optional: true },

    description: { type: String, optional: true },

    condition: { type: String, optional: true },
    conditionComment: { type: String, optional: true },

    purchaseDate: { type: Date, optional: true},
    lastService: { type: Date, optional: true },

    picture: { type: String, optional: true },

    tags: { type: Array, optional: true },
    'tags.$': { type: String },

    itemGroup: { type: String, optional: true },

    status: { type: String, optional: true }
});

export interface Item {
    _id?: string;
    externalId?: string;
    name?: string;

    description?: string;

    condition?: string,
    conditionComment?: string,

    purchaseDate?: Date;
    lastService?: Date;

    picture?: string;

    tags?: string[];

    itemGroup?: string;

    status?: string;
}

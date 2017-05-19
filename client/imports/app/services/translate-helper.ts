import {Injectable, NgZone} from "@angular/core";
import {itemColor} from "../../../../both/models/item.model";

import * as _ from 'lodash';
import {TranslateService} from "@ngx-translate/core";

@Injectable()
export class TranslateHelperService {
    private _reservationTypeOptionsKeys = [{
        value: "private",
        translate: "RESERVATION.TYPE.PRIVATE"
    }, {
        value: "group",
        translate: "RESERVATION.TYPE.GROUP"
    }];
    private _reservationTypeOptions = [];

    private _itemStatusOptionsKeys = [{
        value: "public",
        translate: "ITEM.STATUS.PUBLIC",
        color: "good"
    }, {
        value: "hidden",
        translate: "ITEM.STATUS.HIDDEN",
        color: "danger"
    }];
    private _itemStatusOptions = [];

    private _itemConditionOptionsKeys = [
        {
            value: "100",
            translate: "ITEM.CONDITION.100",
            color: itemColor(100)
        },
        {
            value: "50",
            translate: "ITEM.CONDITION.50",
            color: itemColor(50)
        },
        {
            value: "0",
            translate: "ITEM.CONDITION.0",
            color: itemColor(0)
        }
    ];
    private _itemConditionOptions = [];

    constructor(private ngZone: NgZone, private translate: TranslateService) {
        this.translate.get(_.map(this._reservationTypeOptionsKeys, (key) => key.translate)).subscribe((texts) => {
            ngZone.run(() => {
                this._reservationTypeOptions = _.map(this._reservationTypeOptionsKeys, (key) => {
                    return {
                        text: texts[key.translate],
                        value: key.value
                    }
                });
            });
        });

        this.translate.get(_.map(this._itemStatusOptionsKeys, (key) => key.translate)).subscribe((texts) => {
            ngZone.run(() => {
                this._itemStatusOptions = _.map(this._itemStatusOptionsKeys, (key) => {
                    return {
                        text: texts[key.translate],
                        value: key.value,
                        color: key.color
                    }
                });
            });
        });

        this.translate.get(_.map(this._itemConditionOptionsKeys, (key) => key.translate)).subscribe((texts) => {
            ngZone.run(() => {
                this._itemConditionOptions = _.map(this._itemConditionOptionsKeys, (key) => {
                    return {
                        text: texts[key.translate],
                        value: key.value,
                        color: key.color
                    }
                });
            });
        });
    }

    public get reservationTypeOptions(): any[] {
        return this._reservationTypeOptions;
    }

    public get itemStatusOptions(): any[] {
        return this._itemStatusOptions;
    }

    public get itemConditionOptions(): any[] {
        return this._itemConditionOptions;
    }
}

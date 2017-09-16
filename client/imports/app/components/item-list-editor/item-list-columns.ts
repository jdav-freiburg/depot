import {Component} from "@angular/core";
import template from "./item-list-columns.html";
import {NavParams} from "ionic-angular";

@Component({
    selector: "item-list-columns",
    template,
})
export class ItemListColumnsPage {
    private columnDefs = [
        {key: 'name', translateKey: 'ITEM.NAME'},
        {key: 'description', translateKey: 'ITEM.DESCRIPTION'},
        {key: 'externalId', translateKey: 'ITEM.EXTERNAL_ID'},
        {key: 'purchaseDate', translateKey: 'ITEM.PURCHASE_DATE'},
        {key: 'lastService', translateKey: 'ITEM.LAST_SERVICE'},
        {key: 'condition', translateKey: 'ITEM.CONDITION'},
        {key: 'conditionComment', translateKey: 'ITEM.CONDITION_COMMENT'},
        {key: 'itemGroup', translateKey: 'ITEM.ITEM_GROUP'},
        {key: 'state', translateKey: 'ITEM.STATE'},
        {key: 'tags', translateKey: 'ITEM.TAGS'},
        {key: 'picture', translateKey: 'ITEM.PICTURE'},
    ];

    private columns = {
        editor: {visible: true},
        name: {visible: true, lock: false},
        description: {visible: true, lock: false},
        externalId: {visible: true, lock: false},
        purchaseDate: {visible: false, lock: false},
        lastService: {visible: true, lock: false},
        condition: {visible: true, lock: false},
        conditionComment: {visible: true, lock: false},
        itemGroup: {visible: false, lock: false},
        state: {visible: true, lock: false},
        tags: {visible: true, lock: false},
        picture: {visible: true, lock: false},
    };

    constructor(private navParams: NavParams) {
        this.columns = navParams.data.columns;
    }
}

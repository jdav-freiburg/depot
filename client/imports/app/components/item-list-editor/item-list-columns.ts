import {Component} from "@angular/core";
import template from "./item-list-columns.html";
import {NavParams} from "ionic-angular";

@Component({
    selector: "item-list-columns",
    template,
})
export class ItemListColumnsPage {
    private columnDefs = [
        {key: 'name', translateKey: 'ITEM_CARD.NAME'},
        {key: 'description', translateKey: 'ITEM_CARD.DESCRIPTION'},
        {key: 'externalId', translateKey: 'ITEM_CARD.EXTERNAL_ID'},
        {key: 'purchaseDate', translateKey: 'ITEM_CARD.PURCHASE_DATE'},
        {key: 'lastService', translateKey: 'ITEM_CARD.LAST_SERVICE'},
        {key: 'condition', translateKey: 'ITEM_CARD.CONDITION'},
        {key: 'conditionComment', translateKey: 'ITEM_CARD.CONDITION_COMMENT'},
        {key: 'itemGroup', translateKey: 'ITEM_CARD.ITEM_GROUP'},
        {key: 'state', translateKey: 'ITEM_CARD.STATE'},
        {key: 'tags', translateKey: 'ITEM_CARD.TAGS'},
        {key: 'picture', translateKey: 'ITEM_CARD.PICTURE'},
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

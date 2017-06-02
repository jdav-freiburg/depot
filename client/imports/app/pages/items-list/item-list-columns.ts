import {Component} from "@angular/core";
import template from "./item-list-columns.html";
import {NavParams} from "ionic-angular";

@Component({
    selector: "item-list-columns",
    template,
})
export class ItemListColumnsPage {
    private columns = {
        name: {visible: true},
        description: {visible: true},
        externalId: {visible: true},
        purchaseDate: {visible: false},
        lastService: {visible: true},
        condition: {visible: true},
        conditionComment: {visible: true},
        itemGroup: {visible: false},
        status: {visible: true},
        tags: {visible: true},
        picture: {visible: true},
    };

    constructor(private navParams: NavParams) {
        this.columns = navParams.data.columns;
    }
}

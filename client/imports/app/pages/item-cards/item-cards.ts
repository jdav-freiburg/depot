import {Component, NgZone, OnDestroy, OnInit, ViewChild, ViewChildren} from "@angular/core";
import {ItemsDataService} from "../../services/items-data";
import {Item} from "../../../../../both/models/item.model";
import template from "./item-cards.html";
import style from "./item-cards.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import * as moment from 'moment';
import {NavController} from "ionic-angular";
import {TranslateService} from "../../services/translate";
import {QueryObserverTransform} from "../../util/query-observer";
import {ItemListPage} from "../items-list/item-list";
import {ExtendedItem, FilterItem} from "../../util/item";
import {Subscription} from "rxjs/Subscription";

@Component({
    selector: "item-cards-page",
    template,
    styles: [ style ]
})
export class ItemCardsPage implements OnInit, OnDestroy {
    private _filter: string = "";
    private itemsChangedSubscription: Subscription;

    private get filter(): string {
        return this._filter;
    }

    private set filter(value: string) {
        this._filter = value;
        this.updateFilter();
    }

    private updateFilter() {
        if (!this.items || !this.items.data) {
            this.filteredItems = [];
        } else if (!this._filter || this._filter.length < 3) {
            this.filteredItems = this.items.data;
            _.forEach(this.items.data, (item) => {
                item.visible = true;
            });
        } else {
            let filterQuery = this._filter.toLowerCase().split(/\s+/);
            _.forEach(this.items.data, (item) => {
                item.visible = item.checkFilters(filterQuery);
            });
            this.filteredItems = _.filter(this.items.data, item => item.visible);
        }
        console.log("Update filter " + this._filter + " --> " + this.filteredItems.length + " items");
    }

    private items: QueryObserverTransform<Item, FilterItem>;
    private filteredItems: FilterItem[];

    headerFn(rec, idx) {
        return idx === 0 ? true : null;
    }

    constructor(private itemsService: ItemsDataService, private userService: UserService,
                private navCtrl: NavController, private translate: TranslateService, private ngZone: NgZone) {
    }

    ngOnInit() {
        this.items = new QueryObserverTransform<Item, FilterItem>({
            query: this.itemsService.getItems(),
            zone: this.ngZone,
            transformer: (item, transformed: FilterItem) => {
                if (!item) {
                    item = {
                        _id: null,
                        externalId: "",
                        name: "",

                        description: "",

                        condition: "good",
                        conditionComment: "",

                        purchaseDate: new Date(),
                        lastService: new Date(),

                        picture: null,

                        tags: [],

                        itemGroup: null,

                        state: "public"
                    };
                }
                if (transformed) {
                    transformed.updateFrom(item, this.translate);
                } else {
                    transformed = new ExtendedItem(item, this.translate);
                }
                return transformed;
            },
            addFirstEmpty: true
        });
        this.itemsChangedSubscription = this.items.dataChanged.subscribe(() => {
            this.updateFilter();
        });
    }

    ngOnDestroy() {
        if (this.items) {
            this.items.unsubscribe();
            this.items = null;
        }
        if (this.itemsChangedSubscription) {
            this.itemsChangedSubscription.unsubscribe();
            this.itemsChangedSubscription = null;
        }
    }

    showList() {
        this.navCtrl.pop();
        this.navCtrl.push(ItemListPage);
    }

    get isManager(): boolean {
        return this.userService.isManager;
    }
}

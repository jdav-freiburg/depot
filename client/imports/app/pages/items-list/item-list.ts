import {Component, NgZone, OnDestroy, ViewChild, AfterViewInit} from "@angular/core";
import {ItemsDataService} from "../../services/items-data";
import {Item} from "../../../../../both/models/item.model";
import template from "./item-list.html";
import style from "./item-list.scss";
import * as _ from "lodash";
import * as moment from 'moment';
import {AlertController, NavController, ToastController} from "ionic-angular";
import {TranslateService} from "../../services/translate";
import {QueryObserverTransform} from "../../util/query-observer";
import {ItemCardsPage} from "../item-cards/item-cards";
import {Subscription} from "rxjs/Subscription";
import {FormBuilder} from "@angular/forms";
import {TranslateHelperService} from "../../services/translate-helper";
import {ExtendedFormItem} from "../../util/item-form";
import {ItemListComponent} from "../../components/item-list-editor/item-list";

@Component({
    selector: "item-list-page",
    template,
    styles: [ style ]
})
export class ItemListPage implements AfterViewInit, OnDestroy {
    private itemsChangedSubscription: Subscription;
    private isSaving: boolean = false;

    private items: QueryObserverTransform<Item, ExtendedFormItem>;

    @ViewChild(ItemListComponent)
    private itemList: ItemListComponent;

    private filter: string = "";

    constructor(private itemsService: ItemsDataService, private navCtrl: NavController,
                private translate: TranslateService, private ngZone: NgZone,
                private formBuilder: FormBuilder, private alertCtrl: AlertController) {
    }

    ngAfterViewInit() {
        this.items = new QueryObserverTransform<Item, ExtendedFormItem>({
            query: this.itemsService.getItems(),
            zone: this.ngZone,
            transformer: (item, transformed) => {
                if (!item) {
                    return null;
                }
                if (transformed) {
                    transformed.updateFrom(item, this.translate);
                    console.log("Got item update for:", this.isSaving, transformed.form.dirty, transformed);
                    if (transformed.form.dirty && !this.isSaving) {
                        this.alertCtrl.create({
                            title: this.translate.get('ITEM_CARD.CHANGE.TITLE'),
                            message: this.translate.get('ITEM_CARD.CHANGE.MESSAGE'),
                            buttons: [
                                {
                                    text: this.translate.get('ITEM_CARD.CHANGE.CANCEL'),
                                    role: 'cancel'
                                },
                                {
                                    text: this.translate.get('ITEM_CARD.CHANGE.ACCEPT'),
                                    handler: () => {
                                        transformed.setFormValues();
                                    }
                                },
                            ]
                        }).present();
                    }
                } else {
                    transformed = new ExtendedFormItem(item, this.translate, this.formBuilder);
                }
                return transformed;
            }
        });
        this.itemsChangedSubscription = this.items.dataChanged.subscribe(() => {
            this.itemList.updateFilter();
        });

        this.itemList.onDelete = (item: Item, callback?: Function) => {
            this.itemsService.remove(item._id, (err) => {
                if (callback) {
                    callback(err);
                }
            });
        };
        this.itemList.onSaveAll = (updateComment: string, updateItems: Item[], callback?: Function) => {
            this.isSaving = true;
            console.log("Updating", updateItems);
            this.itemsService.addAll(updateItems, updateComment, (err) => {
                this.isSaving = false;
                if (callback) {
                    callback(err);
                }
            });
        };
    }

    ngOnDestroy() {
        if (this.itemsChangedSubscription) {
            this.itemsChangedSubscription.unsubscribe();
            this.itemsChangedSubscription = null;
        }
        if (this.items) {
            this.items.unsubscribe();
            this.items = null;
        }
    }

    showCards() {
        this.navCtrl.pop();
        this.navCtrl.push(ItemCardsPage);
    }
}

import {Component, OnDestroy, OnInit} from "@angular/core";
import { Observable } from "rxjs";
import {ItemsDataService} from "../../services/items-data";
import {Item} from "../../../../../both/models/item.model";
import template from "./items.html";
import style from "./items.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import * as moment from 'moment';
import {ItemStateModal} from "../item-state-modal/item-state-modal";
import {NavController} from "ionic-angular";
import {TranslateService} from "../../services/translate";
import {Subscription} from "rxjs/Subscription";

@Component({
    selector: "items-page",
    template,
    styles: [ style ]
})
export class ItemsPage implements OnInit, OnDestroy {
    items: Item[];

    filter: string = "";

    editItemId: string = null;

    newItemForm: FormGroup;
    editItemForm: FormGroup;
    private itemsSubscription: Subscription;

    constructor(private itemsDataService: ItemsDataService, private fb: FormBuilder, private userService: UserService,
                private navCtrl: NavController, private translate: TranslateService) {
        this.newItemForm = fb.group({
            name: ["", Validators.required],
            description: ["", Validators.required],
            externalId: ["", Validators.required],
            purchaseDate: [new Date()],
            lastService: [new Date(), Validators.required],
            condition: ["100"],
            conditionComment: [""],
            status: ["public", Validators.required],
            tags: [""]
        });

        this.editItemForm = fb.group({
            name: ["", Validators.required],
            description: ["", Validators.required],
            externalId: ["", Validators.required],
            purchaseDate: [null],
            lastService: [null, Validators.required],
            condition: ["100"],
            conditionComment: [""],
            status: ["public", Validators.required],
            tags: [""]
        });
    }

    ngOnInit() {
        this.itemsSubscription = this.itemsDataService.getItems().zone().subscribe((items) => {
            this.items = items;
            console.log("Items:", items);
        });
    }

    ngOnDestroy() {
        if (this.itemsSubscription) {
            this.itemsSubscription.unsubscribe();
            this.itemsSubscription = null;
        }
    }

    remove(id: string) {
        this.itemsDataService.remove(id);
    }

    cancelEdit(item: Item) {
        this.editItemId = null;
    }

    getTags(tags: string): string[] {
        if (_.trim(tags) === "") {
            return [];
        }
        return _.map(_.split(tags, ','), (tag) => _.trim(tag));
    }

    edit(item: Item) {
        this.editItemId = item._id;
        this.editItemForm.controls['name'].setValue(item.name);
        this.editItemForm.controls['description'].setValue(item.description);
        this.editItemForm.controls['externalId'].setValue(item.externalId);
        this.editItemForm.controls['condition'].setValue(item.condition);
        this.editItemForm.controls['conditionComment'].setValue(item.conditionComment);
        this.editItemForm.controls['purchaseDate'].setValue(moment(item.purchaseDate).toDate());
        this.editItemForm.controls['lastService'].setValue(moment(item.lastService).toDate());
        this.editItemForm.controls['status'].setValue(item.status);
        this.editItemForm.controls['tags'].setValue(_.join(item.tags, ','));
    }

    save(item: Item) {
        item.name = this.editItemForm.controls['name'].value;
        item.description = this.editItemForm.controls['description'].value;
        item.externalId = this.editItemForm.controls['externalId'].value;
        item.condition = this.editItemForm.controls['condition'].value;
        item.conditionComment = this.editItemForm.controls['conditionComment'].value;
        item.purchaseDate = moment(this.editItemForm.controls['purchaseDate'].value).toDate();
        item.lastService = moment(this.editItemForm.controls['lastService'].value).toDate();
        item.status = this.editItemForm.controls['status'].value;
        item.tags = this.getTags(this.editItemForm.controls['tags'].value);
        this.itemsDataService.update(item);
        this.editItemId = null;
    }

    ignoreReturn($event) {
        if($event.keyCode == 13) {
            $event.preventDefault();
            $event.stopPropagation();
        }
    }

    add() {
        let newItem : Item = {
            name: this.newItemForm.controls['name'].value,
            description: this.newItemForm.controls['description'].value,
            purchaseDate: moment(this.newItemForm.controls['purchaseDate'].value).toDate(),
            lastService: moment(this.newItemForm.controls['lastService'].value).toDate(),
            condition: this.newItemForm.controls['condition'].value,
            conditionComment: this.newItemForm.controls['conditionComment'].value,
            status: this.newItemForm.controls['status'].value,
            externalId: this.newItemForm.controls['externalId'].value,
            tags: this.getTags(this.newItemForm.controls['tags'].value),
            picture: null
        };
        this.itemsDataService.add(newItem);
        this.newItemForm.controls['externalId'].setValue('');
    }

    get isManager(): boolean {
        return this.userService.isManager;
    }

    viewItem(item: Item) {
        this.navCtrl.push(ItemStateModal, {
            showReservations: true,
            itemId: item._id,
        });
    }
}

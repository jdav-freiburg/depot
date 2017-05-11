import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import {ItemsDataService} from "../../services/items-data";
import {Item} from "../../../../../both/models/item.model";
import template from "./items.html";
import style from "./items.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import * as _ from "lodash";
import {UserService} from "../../services/user";

@Component({
    selector: "items-page",
    template,
    styles: [ style ]
})
export class ItemsPage implements OnInit {
    data: Observable<Item[]>;

    filter: string = "";

    editItemId: string = null;

    newItemForm: FormGroup;
    editItemForm: FormGroup;

    constructor(private itemsDataService: ItemsDataService, private fb: FormBuilder, private users: UserService) {
        this.newItemForm = fb.group({
            name: ["", Validators.required],
            description: ["", Validators.required],
            externalId: ["", Validators.required],
            lastService: ["", Validators.required],
            condition: [""],
            conditionComment: [""],
            status: ["", Validators.required],
            tags: [[]]
        });

        this.editItemForm = fb.group({
            name: ["", Validators.required],
            description: ["", Validators.required],
            externalId: ["", Validators.required],
            lastService: ["", Validators.required],
            condition: [""],
            conditionComment: [""],
            status: ["", Validators.required],
            tags: [[]]
        });
    }

    ngOnInit() {
        this.data = this.itemsDataService.getItems().zone();
    }

    remove(id: string) {
        this.itemsDataService.remove(id);
    }

    cancelEdit(item: Item) {
        this.editItemId = null;
    }

    edit(item: Item) {
        this.editItemId = item._id;
        this.editItemForm.controls['name'].setValue(item.name);
        this.editItemForm.controls['description'].setValue(item.description);
        this.editItemForm.controls['externalId'].setValue(item.externalId);
        this.editItemForm.controls['condition'].setValue(item.condition);
        this.editItemForm.controls['conditionComment'].setValue(item.conditionComment);
        this.editItemForm.controls['lastService'].setValue(item.lastService.toISOString());
        this.editItemForm.controls['status'].setValue(item.status);
        this.editItemForm.controls['tags'].setValue(_.clone(item.tags || []));
    }

    save(item: Item) {
        item.name = this.editItemForm.controls['name'].value;
        item.description = this.editItemForm.controls['description'].value;
        item.externalId = this.editItemForm.controls['externalId'].value;
        item.condition = this.editItemForm.controls['condition'].value;
        item.conditionComment = this.editItemForm.controls['conditionComment'].value;
        item.lastService = new Date(this.editItemForm.controls['lastService'].value);
        item.status = this.editItemForm.controls['status'].value;
        item.tags = _.clone(this.editItemForm.controls['tags'].value || []);
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
            lastService: new Date(this.newItemForm.controls['lastService'].value),
            condition: this.newItemForm.controls['condition'].value,
            conditionComment: this.newItemForm.controls['conditionComment'].value,
            status: this.newItemForm.controls['status'].value,
            externalId: this.newItemForm.controls['externalId'].value,
            tags: _.clone(this.newItemForm.controls['tags'].value || []),
            picture: null
        };
        this.itemsDataService.add(newItem);
        this.newItemForm.controls['externalId'].setValue('');
        this.newItemForm.controls['name'].setValue('');
        /*this.newItemForm.controls['description'].setValue('');
        this.newItemForm.controls['lastService'].setValue('');
        this.newItemForm.controls['externalId'].setValue('');
        this.newItemForm.controls['tags'].setValue([]);*/
    }

    get isManager(): boolean {
        return Roles.userIsInRole(Meteor.user(), ['manager'])
    }
}

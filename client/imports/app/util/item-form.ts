
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {Item} from "../../../../both/models/item.model";
import * as moment from 'moment';
import * as _ from 'lodash';
import {ExtendedItem} from "./item";
import {TranslateService} from "../services/translate";

export class ExtendedFormItem extends ExtendedItem {
    readonly form: FormGroup;

    public constructor(item: Item, translate: TranslateService, fb: FormBuilder) {
        super(item, translate);

        this.form = fb.group({
            name: [this.name, Validators.required],
            description: [this.description, Validators.required],
            externalId: [this.externalId],
            purchaseDate: [this.purchaseDate],
            lastService: [this.lastService],
            condition: [this.condition || "good"],
            conditionComment: [this.conditionComment],
            itemGroup: [this.itemGroup],
            status: [this.status || "public", Validators.required],
            tags: [_.join(this.tags, ',')],
            picture: [this.picture],
        });
    }

    private static getTags(tags: string): string[] {
        if (_.trim(tags) === "") {
            return [];
        }
        return _.map(_.split(tags, ','), (tag) => _.trim(tag));
    }

    private static getDate(input: any): Date {
        let date = moment(input);
        if (date.isValid()) {
            return date.toDate();
        }
        return null;
    }

    setFormValues() {
        this.form.setValue({
            name: this.name || "",
            description: this.description || "",
            externalId: this.externalId || "",
            purchaseDate: this.purchaseDate || null,
            lastService: this.lastService || null,
            condition: this.condition || "good",
            conditionComment: this.conditionComment || "",
            itemGroup: this.itemGroup || "",
            status: this.status || "public",
            tags: _.join(this.tags, ','),
            picture: this.picture
        });
        this.markClean();
    }

    reset() {
        this.form.reset();
        this.markClean();
    }

    getItemValues(): Item {
        return {
            name: this.form.controls['name'].value || "",
            description: this.form.controls['description'].value || "",
            externalId: this.form.controls['externalId'].value || "",
            condition: this.form.controls['condition'].value || "good",
            conditionComment: this.form.controls['conditionComment'].value || "",
            purchaseDate: ExtendedFormItem.getDate(this.form.controls['purchaseDate'].value),
            lastService: ExtendedFormItem.getDate(this.form.controls['lastService'].value),
            itemGroup: this.form.controls['itemGroup'].value || null,
            status: this.form.controls['status'].value || "public",
            tags: ExtendedFormItem.getTags(this.form.controls['tags'].value),
            picture: this.form.controls['picture'].value
        };
    }

    markClean() {
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.form.updateValueAndValidity();
    }
}
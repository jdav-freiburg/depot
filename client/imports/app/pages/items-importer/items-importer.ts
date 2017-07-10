import {Component} from "@angular/core";
import template from "./items-importer.html";
import style from "./items-importer.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import {AlertController, ModalController, NavController, PopoverController, ToastController} from "ionic-angular";
import * as moment from 'moment';
import {TranslateService} from "../../services/translate";
import {TranslateHelperService} from "../../services/translate-helper";
import {Item} from "../../../../../both/models/item.model";
import {ItemsDataService} from "../../services/items-data";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";

import * as Baby from 'babyparse';
import {UploadFS} from "meteor/jalik:ufs";
import 'fileapi';
import {ExtendedItem} from "../../util/item";
import {ExtendedFormItem} from "../../util/item-form";
import {ItemListColumnsPage} from "../items-list/item-list-columns";
import {ImageGalleryModal} from "../image-gallery-modal/image-gallery-modal";
declare const FileAPI: any;


@Component({
    selector: "items-importer-page",
    template,
    styles: [ style ]
})
export class ItemsImporterPage {
    items: ExtendedFormItem[] = null;

    private filteredItems: ExtendedFormItem[] = [];

    _filter: string = "";

    uploadForm: FormGroup;

    isWorking: boolean = false;
    fileIsOver: boolean = false;

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

    private get filter(): string {
        return this._filter;
    }

    private set filter(value: string) {
        this._filter = value;
        this.updateFilter();
    }

    private updateFilter() {
        if (!this.items) {
            this.filteredItems = [];
        } else if (!this._filter || this._filter.length < 3) {
            this.filteredItems = this.items;
        } else {
            let filterQuery = this._filter.toLowerCase().split(/\s+/);
            this.filteredItems = _.filter(this.items, item => item.checkFilters(filterQuery));
        }
        console.log("Update filter " + this._filter + " --> " + this.filteredItems.length + " items");
    }

    constructor(private formBuilder: FormBuilder,
                private itemsService: ItemsDataService, private userService: UserService,
                private navCtrl: NavController, private translate: TranslateService, private toast: ToastController,
                private translateHelper: TranslateHelperService, private alert: AlertController,
                private popoverCtrl: PopoverController, private modalCtrl: ModalController) {
        this.uploadForm = formBuilder.group({
            file: ["", Validators.required],
        });
    }


    onFileOver(isOver: boolean) {
        this.fileIsOver = isOver;
    }

    onFileDrop(data: any) {
        this.openFile(data);
    }

    openFile(file: File) {
        FileAPI.readAsText(file, (event) => {
            if (event.type === 'load') {
                this.fileDrop(event.result);
            } else if (event.type === 'error') {
                throw new Error(`Couldn't read file '${file.name}'`);
            }
        });
    }

    public upload(): void {
        UploadFS.selectFiles((file) => {
            this.openFile(file);
        });
    }



    momentFormat(date: Date) {
        let m = moment(date);
        if (m.isValid()) {
            return m.format('L');
        }
        return "";
    }

    headerFn(rec, idx) {
        return idx === 0 ? true : null;
    }

    exportItems() {
        let itemsData = this.itemsService.getItems().fetch();
        let header = ['_id', 'externalId', 'name', 'description', 'condition', 'conditionComment', 'purchaseDate',
            'lastService', 'tags', 'status', 'itemGroup', 'picture'];
        let data = _.map(itemsData, (item) => [item._id, item.externalId, item.name, item.description, item.condition,
            item.conditionComment, this.momentFormat(item.purchaseDate), this.momentFormat(item.lastService),
            _.join(item.tags, ','), item.status, item.itemGroup, item.picture]);
        let exportData = Baby.unparse({fields: header, data: data}, {delimiter: ';'});
        let blob = new Blob([exportData], { type: 'text/csv' });
        let url= URL.createObjectURL(blob);
        let temporaryDownloadLink = document.createElement("a");
        if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) {
            temporaryDownloadLink.setAttribute("target", "_blank");
        }
        temporaryDownloadLink.setAttribute("href", url);
        temporaryDownloadLink.setAttribute("download", "items.csv");
        temporaryDownloadLink.style.visibility = "hidden";
        document.body.appendChild(temporaryDownloadLink);
        temporaryDownloadLink.click();
        document.body.removeChild(temporaryDownloadLink);
    }

    fileDrop(data: string) {
        console.log("Drop:", data);
        let result = Baby.parse(data, {
            delimiter: ";"
        }).data;
        let isFirst = true;
        let first = result.splice(0, 1)[0];
        while (_.every(result[result.length - 1], (field) => !field)) {
            let removed = result.pop();
            console.log("Remove last entry: ", removed);
        }
        console.log("First entry:", first);
        console.log("Second entry:", result[1]);
        console.log("Last entry:", result[result.length - 1]);
        this.items = _.map(result, entry => {
            let purchaseDate;
            if (entry[6] && (<string>entry[6]).length == 4) {
                purchaseDate = moment(entry[6], "YYYY")
            } else {
                purchaseDate = moment(entry[6], "DD.MM.YYYY");
            }
            let lastService = moment(entry[7], "DD.MM.YYYY");
            return new ExtendedFormItem({
                _id: <string>entry[0],
                externalId: <string>entry[1],
                name: <string>entry[2],

                description: <string>entry[3],

                condition: <string>entry[4],
                conditionComment: <string>entry[5],

                purchaseDate: purchaseDate.isValid()?purchaseDate.toDate():null,
                lastService: lastService.isValid()?lastService.toDate():null,

                picture: <string>entry[11] || null,

                tags: (!(<string>entry[8]).trim()?[]:_.map(_.split(<string>entry[8], ","), str => str.trim())),

                status: <string>entry[9],

                itemGroup: <string>entry[10] || null
            }, this.translate, this.formBuilder);
        });
        this.updateFilter();
        console.log("Imported entries", this.items);
    }

    getTags(tags: string): string[] {
        if (_.trim(tags) === "") {
            return [];
        }
        return _.map(_.split(tags, ','), (tag) => _.trim(tag));
    }

    get isManager(): boolean {
        return this.userService.isManager;
    }

    deleteItem(item: ExtendedFormItem) {
        _.remove(this.items, (checkItem) => checkItem == item);
        this.updateFilter();
    }

    saveActually(updateComment: string) {
        let updateItems: Item[] = _.map(this.items, (item) => {
            return _.extend(item.getItemValues(), { _id: item._id });
        });

        this.isWorking = true;
        this.itemsService.addAll(updateItems, updateComment, (err, res) => {
            this.isWorking = false;
            if (err) {
                console.log("Error:", err);
                this.toast.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500
                }).present();
            }
        });
    }

    save() {
        this.alert.create({
            title: this.translate.get('ITEM_CARD.SAVE.TITLE'),
            subTitle: this.translate.get('ITEM_CARD.SAVE.SUBTITLE'),
            inputs: [
                {
                    placeholder: this.translate.get('ITEM_CARD.SAVE.COMMENT_LABEL'),
                    type: 'text',
                    name: 'updateComment'
                }
            ],
            buttons: [
                {
                    text: this.translate.get('ITEM_CARD.SAVE.CANCEL'),
                    role: 'cancel'
                },
                {
                    text: this.translate.get('ITEM_CARD.SAVE.SAVE'),
                    handler: (data) => {
                        this.saveActually(data.updateComment);
                    }
                },
            ]
        }).present();
    }

    selectPicture(item) {
        let modalView = this.modalCtrl.create(ImageGalleryModal, {
            picture: item.form.controls['picture'].value,
            store: 'pictures-items',
            title: item.form.controls['name'].value
        });
        modalView.onDidDismiss((data) => {
            if (data) {
                console.log("New Picture:", data);
                if (data.image !== item.form.controls['picture'].value) {
                    item.form.controls['picture'].setValue(data.image);
                    item.form.controls['picture'].markAsTouched();
                    item.form.controls['picture'].markAsDirty();
                    item.form.controls['picture'].updateValueAndValidity();
                }
            }
        });
        modalView.present();
    }

    showColumnOptions(ev) {
        let popover = this.popoverCtrl.create(ItemListColumnsPage, {
            columns: this.columns
        });
        popover.present({
            ev: ev
        });
    }
}

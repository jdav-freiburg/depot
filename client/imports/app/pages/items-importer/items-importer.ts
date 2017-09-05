import {AfterViewInit, Component, ViewChild} from "@angular/core";
import template from "./items-importer.html";
import style from "./items-importer.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import {ToastController} from "ionic-angular";
import * as moment from 'moment';
import {TranslateService} from "../../services/translate";
import {TranslateHelperService} from "../../services/translate-helper";
import {Item} from "../../../../../both/models/item.model";
import {ItemsDataService} from "../../services/items-data";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";

import * as Baby from 'babyparse';
import {UploadFS} from "meteor/jalik:ufs";
import 'fileapi';
import {ExtendedFormItem} from "../../util/item-form";
import {ItemListComponent} from "../../components/item-list-editor/item-list";
declare const FileAPI: any;


@Component({
    selector: "items-importer-page",
    template,
    styles: [ style ]
})
export class ItemsImporterPage implements AfterViewInit {
    items: ExtendedFormItem[] = null;

    uploadForm: FormGroup;

    isWorking: boolean = false;
    fileIsOver: boolean = false;

    @ViewChild(ItemListComponent)
    private itemList: ItemListComponent;

    private filter: string = "";

    ngAfterViewInit() {
        this.itemList.onDelete = (item: ExtendedFormItem, callback?: Function) => {
            _.remove(this.items, (checkItem) => checkItem == item);
            this.itemList.updateFilter();
            if (callback) {
                callback();
            }
        };
        this.itemList.onSaveAll = (updateComment: string, updateItems: Item[], callback?: Function) => {
            this.isWorking = true;
            this.itemsService.addAll(updateItems, updateComment, (err, res) => {
                this.isWorking = false;
                if (callback) {
                    callback(err);
                }
            });
        };
    }

    constructor(private formBuilder: FormBuilder,
                private itemsService: ItemsDataService, private userService: UserService,
                private translate: TranslateService, private toast: ToastController,
                private translateHelper: TranslateHelperService) {
        this.uploadForm = formBuilder.group({
            file: ["", Validators.required],
        });
    }

    private onFileOver(isOver: boolean) {
        this.fileIsOver = isOver;
    }

    private onFileDrop(data: any) {
        this.openFile(data);
    }

    private openFile(file: File) {
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

    private momentFormat(date: Date) {
        let m = moment(date);
        if (m.isValid()) {
            return m.format('L');
        }
        return "";
    }

    private exportItems() {
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

    private fileDrop(data: string) {
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
        console.log("Imported entries", this.items);
    }
}

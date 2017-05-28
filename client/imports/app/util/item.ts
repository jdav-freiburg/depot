import {Item} from "../../../../both/models/item.model";
import {TranslateService} from "../services/translate";
import * as _ from 'lodash';

export interface FilterItem extends Item {
    readonly filter: string;
    updateText(translate: TranslateService): void;
    updateFrom(item: Item, translate: TranslateService): void;
}

export class ExtendedItem implements FilterItem {
    public _id: string;
    public externalId: string;
    public name: string;
    public description: string;
    public condition: string;
    public conditionComment: string;
    public purchaseDate: Date;
    public lastService: Date;
    public picture: string;
    public tags: string[];
    public itemGroup: string;
    public status: string;

    protected _filter: string;

    public get filter(): string {
        return this._filter;
    }

    public updateText(translate: TranslateService) {
        this._filter = (translate.get('ITEM.FILTER_TAG.NAME') + ":" + this.name + "\0" +
        translate.get('ITEM.FILTER_TAG.DESCRIPTION') + ":" + this.description + "\0" +
        translate.get('ITEM.FILTER_TAG.TAG') + ":" + _.join(this.tags, "\0" + translate.get('ITEM.FILTER_TAG.TAG') + ":") + "\0" +
        translate.get('ITEM.FILTER_TAG.EXTERNAL_ID') + ":" + this.externalId).toLowerCase();
    }

    public updateFrom(item: Item, translate: TranslateService) {
        this._id = item._id;
        this.externalId = item.externalId;
        this.name = item.name;
        this.description = item.description;
        this.condition = item.condition;
        this.conditionComment = item.conditionComment;
        this.purchaseDate = item.purchaseDate;
        this.lastService = item.lastService;
        this.picture = item.picture;
        this.tags = item.tags;
        this.itemGroup = item.itemGroup;
        this.status = item.status;
        this.updateText(translate);
    }

    public constructor(item: Item, translate: TranslateService) {
        this.updateFrom(item, translate);
    }
}

export interface SelectedProvider {
    isAvailable(itemId: string): boolean;
    isSelected(itemId: string): boolean;
    select(itemId: string): void;
    deselect(itemId: string): void;
}

export interface SelectableItem extends FilterItem {
    selected: boolean;
    deselected: boolean;
    update(): boolean;
    readonly available: boolean;
    itemGroupRef: SelectableItem;

    readonly isSingle: boolean;
    readonly count: number;
    selectedCount: number;
    readonly subItems: SelectableItem[];
    readonly deselectedCount: number;
    readonly availableCount: number;
}

export class SelectableItemSingle extends ExtendedItem implements SelectableItem {
    itemGroupRef: SelectableItem = null;

    private _selectedProvider: SelectedProvider;

    private _selected: boolean;
    private _available: boolean;
    private _deselected: boolean;

    private _filterSelected: string;

    get filter(): string {
        if (this.selected) {
            return this._filter + "\0" + this._filterSelected;
        }
        return this._filter;
    }

    public update(): boolean {
        let newAvailable = this._selectedProvider.isAvailable(this._id);
        this._selected = this._selectedProvider.isSelected(this._id);
        this._available = this._selectedProvider.isAvailable(this._id);
        if (!newAvailable && this._selected) {
            this.selected = false;
            this._deselected = true;
            return false;
        }
        return true;
    }

    get deselected(): boolean {
        return this._deselected;
    }

    get selected(): boolean {
        return this._selected;
    }

    set selected(value: boolean) {
        if (this._selected !== value) {
            console.log(this._id, "->", value);
            if (value) {
                this._selectedProvider.select(this._id);
            } else {
                this._selectedProvider.deselect(this._id);
            }
            this._selected = this._selectedProvider.isSelected(this._id);
        }
        this._deselected = false;
    }

    get available(): boolean {
        return this._available;
    }
    get isSingle(): boolean {
        return this.count === 1;
    }
    get count(): number {
        return 1;
    }
    get subItems(): SelectableItem[] {
        return [this];
    }
    get selectedCount(): number {
        return this.selected?1:0;
    }
    set selectedCount(value: number) {
        this.selected = value > 0;
    }
    get deselectedCount(): number {
        return this.deselected?1:0;
    }
    get availableCount(): number {
        return this.available?1:0;
    }

    public updateText(translate: TranslateService) {
        super.updateText(translate);
        this._filterSelected = translate.get('RESERVATION_PAGE.FILTER_TAG.SELECTED');
    }

    public constructor(item: Item, translate: TranslateService, selectedProvider: SelectedProvider) {
        super(item, translate);
        this._selectedProvider = selectedProvider;
    }
}

export class SelectableItemGroup implements SelectableItem {
    get externalId(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].externalId;
    }
    get name(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].description;
    }
    get description(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].description;
    }
    get condition(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].condition;
    }
    get conditionComment(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].conditionComment;
    }
    get purchaseDate(): Date {
        return this.subItems[Math.max(this._selected - 1, 0)].purchaseDate;
    }
    get lastService(): Date {
        return this.subItems[Math.max(this._selected - 1, 0)].lastService;
    }
    get picture(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].picture;
    }
    get tags(): string[] {
        return this.subItems[Math.max(this._selected - 1, 0)].tags;
    }

    get itemGroup(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].itemGroup;
    }
    get status(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].status;
    }
    get filter(): string {
        return this.subItems[Math.max(this._selected - 1, 0)].filter;
    }

    subItems: SelectableItemSingle[] = [];
    _selected: number;
    _deselected: number;
    _available: number;

    update(): boolean {
        let result = true;
        _.forEach(this.subItems, subItem => result = subItem.update() && result);
        this.subItems = _.sortBy(this.subItems, (subItem) => (subItem.available?0:100) + (subItem.selected?0:1) + (subItem.condition==='good'?10:(subItem.condition==='bad'?20:30)));
        this._selected = _.reduce(this.subItems, (sum: number, subItem: SelectableItem) => (subItem.selected?sum+1:sum), 0);
        this._deselected = _.reduce(this.subItems, (sum: number, subItem: SelectableItem) => (subItem.deselected?sum+1:sum), 0);
        this._available = _.reduce(this.subItems, (sum: number, subItem: SelectableItem) => (subItem.available?sum+1:sum), 0);
        return result;
    }

    public updateText(translate: TranslateService): void {
        _.forEach(this.subItems, subItem => subItem.updateText(translate));
    }

    public updateFrom(item: Item, translate: TranslateService): void {
        throw new Error("Can't update item");
    }

    get isSingle(): boolean {
        return this.count === 1;
    }

    get count(): number {
        return this.subItems.length;
    }

    get selected(): boolean {
        return this.selectedCount > 0;
    }

    set selected(value: boolean) {
        this.selectedCount = (value?1:0);
    }

    get deselected(): boolean {
        return this.deselectedCount > 0;
    }

    get available(): boolean {
        return this.availableCount > 0;
    }

    get selectedCount(): number {
        return this._selected;
    }

    get itemGroupRef(): SelectableItem {
        return this;
    }

    set selectedCount(value: number) {
        if (value > this._selected) {
            while (this._selected < value) {
                this.subItems[this._selected].selected = true;
                this._selected++;
            }
        } else {
            while (this._selected > value) {
                this._selected--;
                this.subItems[this._selected].selected = false;
            }
        }
    }

    get deselectedCount(): number {
        return this._deselected
    }

    get availableCount(): number {
        return this._available
    }

    public constructor() {
    }
}
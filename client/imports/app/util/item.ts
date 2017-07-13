import {Item} from "../../../../both/models/item.model";
import {TranslateService} from "../services/translate";
import * as _ from 'lodash';

export interface FilterItem extends Item {
    visible: boolean;
    checkFilters(query: string[]): boolean;
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

    public visible: boolean = true;

    protected _filters: string[];

    public checkFilters(query: string[]): boolean {
        for (let i = 0; i < query.length; i++) {
            let any = false;
            for (let j = 0; j < this._filters.length; j++) {
                if (this._filters[j].indexOf(query[i]) !== -1) {
                    any = true;
                    break;
                }
            }
            if (!any) {
                return false;
            }
        }
        return true;
    }

    public updateText(translate: TranslateService) {
        this._filters = [this.name.toLowerCase(), this.description.toLowerCase(), this.externalId.toLowerCase()]
            .concat(_.map(this.tags, (tag) => tag.toLowerCase()));
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

    private _selected: boolean = false;
    private _available: boolean;
    private _deselected: boolean;

    private _filterSelected: string;
    private _filtersSelected: string[];

    public update(): boolean {
        let newSelected = this._selectedProvider.isSelected(this._id);
        if (newSelected !== this._selected) {
            this._selected = newSelected;
            if (this._selected) {
                Array.prototype.push.apply(this._filters, this._filtersSelected);
            } else {
                this._filters.splice(this._filters.length - this._filtersSelected.length, this._filtersSelected.length);
            }
        }
        this._available = this._selectedProvider.isAvailable(this._id);
        if (!this._available && this._selected) {
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

            if (this._selected) {
                Array.prototype.push.apply(this._filters, this._filtersSelected);
            } else {
                this._filters.splice(this._filters.length - this._filtersSelected.length, this._filtersSelected.length);
            }
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
        if (this._selected) {
            this._filters.splice(this._filters.length - this._filterSelected.length, this._filterSelected.length);
        }
        this._filterSelected = translate.get('ITEM.FILTER_TAG.SELECTED');
        this._filtersSelected = translate.get('ITEM.FILTER_TAG.SELECTED').split('\0');
        if (this._selected) {
            Array.prototype.push.apply(this._filters, this._filtersSelected);
        }
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

    checkFilters(query: string[]): boolean {
        return this.subItems[Math.max(this._selected - 1, 0)].checkFilters(query);
    }

    subItems: SelectableItemSingle[] = [];
    _selected: number;
    _deselected: number;
    _available: number;

    public visible: boolean = true;

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

export class ItemGroup<InnerType extends FilterItem> implements FilterItem {
    get externalId(): string {
        return this.subItems[this.activeIndex].externalId;
    }
    get name(): string {
        return this.subItems[this.activeIndex].description;
    }
    get description(): string {
        return this.subItems[this.activeIndex].description;
    }
    get condition(): string {
        return this.subItems[this.activeIndex].condition;
    }
    get conditionComment(): string {
        return this.subItems[this.activeIndex].conditionComment;
    }
    get purchaseDate(): Date {
        return this.subItems[this.activeIndex].purchaseDate;
    }
    get lastService(): Date {
        return this.subItems[this.activeIndex].lastService;
    }
    get picture(): string {
        return this.subItems[this.activeIndex].picture;
    }
    get tags(): string[] {
        return this.subItems[this.activeIndex].tags;
    }

    get itemGroup(): string {
        return this.subItems[this.activeIndex].itemGroup;
    }
    get status(): string {
        return this.subItems[this.activeIndex].status;
    }

    checkFilters(query: string[]): boolean {
        return this.subItems[this.activeIndex].checkFilters(query);
    }

    subItems: InnerType[] = [];
    public activeIndex: number = 0;

    public visible: boolean = true;

    update(): void {
        this.subItems = _.sortBy(this.subItems, (subItem) => (subItem.condition==='good'?10:(subItem.condition==='bad'?20:30)));
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

    get itemGroupRef(): FilterItem {
        return this;
    }

    public constructor() {
    }
}

import {ObservableCursor} from "meteor-rxjs";
import {NgZone} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import * as _ from 'lodash';

export interface ChangeableData<T> {
    _id?: string;
    _changed?: Subject<T>;
}

export class QueryObserver<T extends ChangeableData<T>> {
    private _data: T[] = [];
    private _index: {[id: string]: T} = {};
    public readonly dataChanged: Subject<T[]> = new BehaviorSubject<T[]>([]);
    private handle: Meteor.LiveQueryHandle;

    public constructor(private query: ObservableCursor<T>, private zone: NgZone, keepObjectOnChange?: boolean) {
        let initialObservation = true;
        this.handle = query.observeChanges({
            addedBefore: (id: string, fields: T, before: string) => {
                fields._id = id;
                if (keepObjectOnChange) {
                    fields._changed = new BehaviorSubject<T>(fields);
                }
                if (initialObservation) {
                    this._index[id] = fields;
                    if (!before) {
                        this._data.push(fields);
                    } else {
                        for (let i = 0; i < this._data.length; i++) {
                            if (this._data[i]._id === before) {
                                this._data.splice(i, 0, fields);
                                break;
                            }
                        }
                    }
                } else {
                    zone.run(() => {
                        this._index[id] = fields;
                        if (!before) {
                            this._data.push(fields);
                        } else {
                            for (let i = 0; i < this._data.length; i++) {
                                if (this._data[i]._id === before) {
                                    this._data.splice(i, 0, fields);
                                    break;
                                }
                            }
                        }
                        this.dataChanged.next(this._data);
                    });
                }
            },
            changed: (id: string, fields: any) => {
                zone.run(() => {
                    let doc = this._index[id];
                    if (!doc) {
                        throw new Error('Invalid id:' + id);
                    }
                    if (keepObjectOnChange) {
                        _.assign(doc, fields);
                        doc._changed.next(doc);
                    } else {
                        doc = _.assign({}, doc, fields);
                        for (let i = 0; i < this._data.length; i++) {
                            if (this._data[i]._id === id) {
                                this._data[i] = doc;
                            }
                        }
                    }
                    this.dataChanged.next(this._data);
                });
            },
            movedBefore: (id: string, before: string) => {
                zone.run(() => {
                    let pickedItem: T = null;
                    let destinationIndex = (before?null:this._data.length);
                    for (let i = 0; i < this._data.length; i++) {
                        let refId = this._data[i]._id;
                        if (refId === id) {
                            pickedItem = this._data.splice(i, 1)[0];
                            if (destinationIndex === null) {
                                i--;
                            } else {
                                this._data.splice(destinationIndex, 0, pickedItem);
                                break;
                            }
                        }
                        if (refId === before) {
                            destinationIndex = i;
                            if (pickedItem !== null) {
                                this._data.splice(destinationIndex, 0, pickedItem);
                                break;
                            }
                        }
                    }
                    this.dataChanged.next(this._data);
                });
            },
            removed: (id: string) => {
                zone.run(() => {
                    delete this._index[id];
                    for (let i = 0; i < this._data.length; i++) {
                        if (this._data[i]._id === id) {
                            this._data.splice(i, 1);
                        }
                    }
                    this.dataChanged.next(this._data);
                });
            }
        });
        initialObservation = false;
        this.dataChanged.next(this._data);
    }

    public newList() {
        this._data = _.map(this._data, (entry) => _.clone(entry));
        this.dataChanged.next(this._data);
    }

    public get data(): T[] {
        return this._data;
    }

    public unsubscribe(): void {
        this.handle.stop();
    }
}

export interface ObservableData {
    _id?: string;
}

export interface QueryObserverTransformOptions<T extends ObservableData, U> {
    query: ObservableCursor<T>;
    zone: NgZone;
    transformer: (item: T, transformed: U) => U;
    addFirstEmpty?: boolean;
    removed?: (item: T, transformed: U, index: number) => void;
    suppressNull?: boolean;
}

export class QueryObserverTransform<T extends ObservableData, U> {
    private _transformedData: U[] = [];
    private _data: T[] = [];
    private _index: {[id: string]: T} = {};
    public readonly dataChanged: Subject<U[]> = new BehaviorSubject<U[]>([]);
    private handle: Meteor.LiveQueryHandle;

    public constructor(private options: QueryObserverTransformOptions<T, U>) {
        let initialObservation = true;
        if (options.addFirstEmpty) {
            let transformed = options.transformer(null, null);
            if (!options.suppressNull || transformed !== null) {
                this._transformedData.push(transformed);
            }
        }
        this.handle = options.query.observeChanges({
            addedBefore: (id: string, fields: T, before: string) => {
                fields._id = id;
                if (initialObservation) {
                    this._index[id] = fields;
                    let transformed = options.transformer(fields, null);
                    if (!options.suppressNull || transformed !== null) {
                        if (!before) {
                            this._data.push(fields);
                            this._transformedData.push(transformed);
                        } else {
                            for (let i = 0; i < this._data.length; i++) {
                                if (this._data[i]._id === before) {
                                    this._data.splice(i, 0, fields);
                                    this._transformedData.splice((options.addFirstEmpty?i+1:i), 0, transformed);
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    options.zone.run(() => {
                        this._index[id] = fields;
                        let transformed = options.transformer(fields, null);
                        if (!options.suppressNull || transformed !== null) {
                            if (!before) {
                                this._data.push(fields);
                                this._transformedData.push(transformed);
                            } else {
                                for (let i = 0; i < this._data.length; i++) {
                                    if (this._data[i]._id === before) {
                                        this._data.splice(i, 0, fields);
                                        this._transformedData.splice((options.addFirstEmpty ? i + 1 : i), 0, transformed);
                                        break;
                                    }
                                }
                            }
                            this.dataChanged.next(this._transformedData);
                        }
                    });
                }
            },
            changed: (id: string, fields: any) => {
                options.zone.run(() => {
                    let doc = this._index[id];
                    if (!doc) {
                        if (options.suppressNull) {
                            return;
                        }
                        throw new Error('Invalid id:' + id);
                    }
                    _.assign(doc, fields);
                    let index = -1;
                    for (let i = 0; i < this._data.length; i++) {
                        if (this._data[i]._id === id) {
                            index = i;
                            break;
                        }
                    }
                    if (index === -1) {
                        throw new Error('Internal Error: Item in index but not in array');
                    }
                    let transformedIndex = (options.addFirstEmpty ? index + 1 : index);
                    let originalTransformed = this._transformedData[transformedIndex];
                    let transformed = options.transformer(doc, originalTransformed);
                    if (!options.suppressNull || transformed !== null) {
                        this._transformedData[transformedIndex] = transformed;
                    } else {
                        delete this._index[id];
                        let removedItem = this._data.splice(index, 1)[0];
                        this._transformedData.splice(transformedIndex, 1);
                        if (options.removed) {
                            options.removed(removedItem, originalTransformed, transformedIndex);
                        }
                    }
                    this.dataChanged.next(this._transformedData);
                });
            },
            movedBefore: (id: string, before: string) => {
                options.zone.run(() => {
                    let pickedData: T = null;
                    let pickedTransformed: U = null;
                    let destinationIndex = (before?null:this._data.length);
                    for (let i = 0; i < this._data.length; i++) {
                        let refId = this._data[i]._id;
                        if (refId === id) {
                            pickedData = this._data.splice(i, 1)[0];
                            pickedTransformed = this._transformedData.splice((options.addFirstEmpty?i+1:i), 1)[0];
                            if (destinationIndex === null) {
                                i--;
                            } else {
                                this._data.splice(destinationIndex, 0, pickedData);
                                this._transformedData.splice((options.addFirstEmpty?destinationIndex+1:destinationIndex), 0, pickedTransformed);
                                break;
                            }
                        }
                        if (refId === before) {
                            destinationIndex = i;
                            if (pickedData !== null) {
                                this._data.splice(destinationIndex, 0, pickedData);
                                this._transformedData.splice((options.addFirstEmpty?destinationIndex+1:destinationIndex), 0, pickedTransformed);
                                break;
                            }
                        }
                    }
                    this.dataChanged.next(this._transformedData);
                });
            },
            removed: (id: string) => {
                options.zone.run(() => {
                    let index = -1;
                    for (let i = 0; i < this._data.length; i++) {
                        if (this._data[i]._id === id) {
                            index = i;
                            break;
                        }
                    }
                    if (index === -1) {
                        if (options.suppressNull) {
                            return;
                        }
                        throw new Error('Internal Error: Invalid item id');
                    }
                    let transformedIndex = (options.addFirstEmpty ? index + 1 : index);
                    let originalTransformed = this._transformedData[transformedIndex];

                    delete this._index[id];
                    let removedItem = this._data.splice(index, 1)[0];
                    this._transformedData.splice(transformedIndex, 1);
                    if (options.removed) {
                        options.removed(removedItem, originalTransformed, transformedIndex);
                    }
                    this.dataChanged.next(this._transformedData);
                });
            }
        });
        initialObservation = false;
        this.dataChanged.next(this._transformedData);
    }

    public resetFirst() {
        if (this.options.addFirstEmpty) {
            this._transformedData[0] = this.options.transformer(null, null);
        }
    }

    public newList() {
        this._data = _.map(this._data, (entry) => _.clone(entry));
        this.dataChanged.next(this._transformedData);
    }

    public get data(): U[] {
        return this._transformedData;
    }

    public unsubscribe(): void {
        this.handle.stop();
        this.handle = null;
    }
}
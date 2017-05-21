
import {ObservableCursor} from "meteor-rxjs";
import {NgZone} from "@angular/core";
import {Subject} from "rxjs/Subject";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import * as _ from 'lodash';

export class QueryObserver<T> {
    private _data: T[] = [];
    private _index: {[id: string]: T} = {};
    public readonly dataChanged: Subject<T[]> = new BehaviorSubject<T[]>([]);
    private handle: Meteor.LiveQueryHandle;

    public constructor(private query: ObservableCursor<T>, private zone: NgZone) {
        let initialObservation = true;
        this.handle = query.observeChanges({
            addedBefore: (id: string, fields: T, before: string) => {
                (<any>fields)._id = id;
                if (initialObservation) {
                    this._index[id] = fields;
                    if (!before) {
                        this._data.push(fields);
                    } else {
                        for (let i = 0; i < this._data.length; i++) {
                            if ((<any>this.data[i])._id === before) {
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
                                if ((<any>this.data[i])._id === before) {
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
                    _.assign(doc, fields);
                    this.dataChanged.next(this._data);
                });
            },
            movedBefore: (id: string, before: string) => {
                zone.run(() => {
                    let pickedItem: T = null;
                    let destinationIndex = (before?null:this._data.length);
                    for (let i = 0; i < this._data.length; i++) {
                        let refId = (<any>this._data[i])._id;
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
                        if ((<any>this._data[i])._id === id) {
                            this._data.splice(i, 1);
                        }
                    }
                    this.dataChanged.next(this._data);
                });
            }
        });
        /*this.handle = query.observe({
            addedAt: (document: T, atIndex: number): void => {
                if (initialObservation) {
                    this._data.splice(atIndex, 0, document);
                } else {
                    zone.run(() => {
                        console.log("addedAt", document, atIndex);
                        this._data.splice(atIndex, 0, document);
                        this.dataChanged.next(this._data);
                    });
                }
            },
            changedAt: (newDocument: T, oldDocument: T, atIndex: number): void => {
                zone.run(() => {
                    console.log("changedAt", newDocument, oldDocument, atIndex);
                    this._data[atIndex] = newDocument;
                    this.dataChanged.next(this._data);
                });
            },
            removedAt: (oldDocument: T, atIndex: number): void => {
                zone.run(() => {
                    console.log("removedAt", oldDocument, atIndex);
                    this._data.splice(atIndex, 1, null);
                    this.dataChanged.next(this._data);
                });
            },
            movedTo: (document: T, fromIndex: number, toIndex: number): void => {
                zone.run(() => {
                    console.log("movedTo", document, fromIndex, toIndex);
                    if (fromIndex < toIndex) {
                        this._data.splice(toIndex, 0, document);
                        this._data.splice(fromIndex, 1, null);
                    } else {
                        this._data.splice(fromIndex, 1, null);
                        this._data.splice(toIndex, 0, document);
                    }
                    this.dataChanged.next(this._data);
                });
            }
        });*/
        initialObservation = false;
        this.dataChanged.next(this._data);
    }

    public get data(): T[] {
        return this._data;
    }

    public unsubscribe(): void {
        this.handle.stop();
    }
}
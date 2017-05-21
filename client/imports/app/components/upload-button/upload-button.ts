import {Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild} from "@angular/core";
import template from "./upload-button.html";
import style from "./upload-button.scss";
import * as _ from "lodash";

import 'fileapi';

declare const FileAPI: any;

@Component({
    selector: "upload-button",
    template,
    styles: [ style ]
})
export class UploadButton {
    @ViewChild("input")
    private inputElement: ElementRef;

    @Input() public fileResult: string;

    @Output() public fileDrop: EventEmitter<File|string|ArrayBuffer|URL> = new EventEmitter<File|string|ArrayBuffer|URL>();

    private fileIsOver: boolean = false;

    constructor() {}

    onFileOver(isOver: boolean) {
        this.fileIsOver = isOver;
    }

    onFileDrop(data: any) {
        this.fileDrop.emit(data);
    }

    public clickSelect(event: Event): void {
        this.inputElement.nativeElement.dispatchEvent(new MouseEvent("click", {bubbles: true}));
    }

    public openFiles(event: Event): void {
        let files: FileList = this.inputElement.nativeElement.files;
        for (let i = 0; i < files.length; i++) {
            let file = files.item(i);

            console.log("Opened file", file);

            const strategy = this.pickStrategy();

            if (!strategy) {
                this.fileDrop.emit(file);
            } else {
                const method = `readAs${strategy}`;

                FileAPI[method](file, (event) => {
                    if (event.type === 'load') {
                        this.fileDrop.emit(event.result);
                    } else if (event.type === 'error') {
                        throw new Error(`Couldn't read file '${file.name}'`);
                    }
                });
            }
        }
    }

    private pickStrategy(): string | void {
        if (!this.fileResult) {
            return;
        }

        if (this.hasStrategy(this.fileResult)) {
            return this.fileResult;
        }
    }

    private hasStrategy(type: string): boolean {
        return [
                'DataURL',
                'BinaryString',
                'ArrayBuffer',
                'Text',
            ].indexOf(type) !== -1;
    }
}
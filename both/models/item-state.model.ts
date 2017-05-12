export interface ItemState {
    _id?: string;
    timestamp: Date;
    itemId: string;
    fieldNames: string[];
    fieldValues: string[];

    userId: string;

    comment: string;
}

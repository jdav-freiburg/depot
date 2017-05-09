
export interface GlobalMessage {
    _id?: string;

    timestamp: Date;

    type: string;

    data: object;
}
export interface Item {
    _id?: string;
    externalId: string;
    name: string;

    description: string;

    condition: String,
    conditionComment: String,

    lastService: Date;

    picture: string;

    tags: string[];

    status: string;
}

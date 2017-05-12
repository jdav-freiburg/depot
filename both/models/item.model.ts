export interface Item {
    _id?: string;
    externalId: string;
    name: string;

    description: string;

    condition: string,
    conditionComment: string,

    lastService: Date;

    picture: string;

    tags: string[];

    status: string;
}

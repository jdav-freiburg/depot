
export interface Group {
    _id?: string;

    name: string;

    status: string;

    admins: string[];
    users: string[];
}
import SimpleSchema from 'simpl-schema';

export const TokenSchema = new SimpleSchema({
    token: { type: String, optional: true },
    type: { type: String, optional: true },
    created: { type: Date, optional: true },
    validUntil: { type: Date, optional: true },
});

export interface Token {
    _id?: string;

    token: string;
    type: string;
    created: Date;
    expiresAt: Date;

    userId?: string;
    emailAddress?: string;
}

export interface PasswordToken extends Token {
    userId: string;
}

export interface EmailToken extends Token {
    userId: string;
    emailAddress: string;
}
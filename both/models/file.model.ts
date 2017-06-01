import SimpleSchema from 'simpl-schema';

export const FileSchema = new SimpleSchema({
    _id: { type: String, optional: true },

    name: { type: String, optional: true },
    store: { type: String, optional: true },
    extension: { type: String, optional: true },
    userId: { type: String, optional: true },
    complete: { type: Boolean, optional: true },
    etag: { type: String, optional: true },
    path: { type: String, optional: true },
    type: { type: String, optional: true },
    progress: { type: Number, optional: true },
    size: { type: Number, optional: true },

    token: { type: String, optional: true },

    uploading: { type: Boolean, optional: true },
    uploadedAt: { type: Date, optional: true },

    url: { type: String, optional: true },
    originalId: { type: String, optional: true },
});

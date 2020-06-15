const cloudinary = require('cloudinary');
const config = require('../../config');
const StorageV2 = cloudinary.v2;

StorageV2.config(config.service.storage.cloudinary);


exports.StorageService = class StorageService{
    static async Upload(file){
        const result = await StorageV2.uploader.upload(file);
        return result;
    }

    static async delete(public_id){
        const result = await StorageV2.uploader.destroy(public_id);
        return result;
    }
}
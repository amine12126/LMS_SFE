import os
from cloudinary_storage.storage import MediaCloudinaryStorage

class FlexibleCloudinaryStorage(MediaCloudinaryStorage):
    def _get_resource_type(self, name):
        if not name:
            return 'image'
        # If there is no extension in the stored filename, it is either an old upload
        # or a standard image/PDF. We fall back to 'image' which was the previous default.
        if '.' not in name:
            return 'image'
            
        ext = name.split('.')[-1].lower()
        # Supported video and audio formats on Cloudinary
        if ext in ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp', 'ogg', 'wav', 'mp3']:
            return 'video'
        # Standard image and PDF formats (Cloudinary allows PDFs under 'image' resource type)
        elif ext in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'pdf']:
            return 'image'
        # All other documents (Word, Excel, Zip, etc.) are raw
        return 'raw'

    def _save(self, name, content):
        # We call the parent save to perform the upload and get the public_id
        public_id = super()._save(name, content)
        
        # We get the original extension from the uploaded file name
        ext = name.split('.')[-1].lower() if '.' in name else ''
        
        # If there is an extension and it's not already in the public_id, we append it
        # so that we can detect the resource type during future URL generation.
        if ext and not public_id.lower().endswith('.' + ext):
            return f"{public_id}.{ext}"
        return public_id

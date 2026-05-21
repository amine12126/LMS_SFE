import os
from cloudinary_storage.storage import MediaCloudinaryStorage

class FlexibleCloudinaryStorage(MediaCloudinaryStorage):
    def _get_resource_type(self, name):
        if not name:
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

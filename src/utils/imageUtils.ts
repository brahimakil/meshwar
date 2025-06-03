export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const resizeImage = async (base64Str: string, maxWidth = 800, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      ctx!.drawImage(img, 0, 0, width, height);
      
      // Get the data-URL formatted image
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      resolve(dataUrl);
    };
  });
};

// Helper to estimate base64 size in KB
export const estimateBase64Size = (base64String: string): number => {
  // Remove the data:image/jpeg;base64, part
  const base64WithoutPrefix = base64String.split(',')[1];
  
  // Base64 represents 6 bits per character, so 4 characters = 3 bytes
  const sizeInBytes = (base64WithoutPrefix.length * 3) / 4;
  
  // Convert to KB
  return Math.round(sizeInBytes / 1024);
}; 
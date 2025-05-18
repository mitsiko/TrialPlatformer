// ./js/utils.js

// Modify your loadImage function (or add if missing)
async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error("Failed to load image:", url);
      reject(new Error(`Image load failed: ${url}`));
    };
    img.src = url;
  });
}
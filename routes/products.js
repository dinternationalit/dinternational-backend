const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

const PRODUCT_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'products');
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const ensureUploadDir = async () => {
  await fs.promises.mkdir(PRODUCT_UPLOAD_DIR, { recursive: true });
};

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const parseImagesField = (images) => {
  if (images === undefined) {
    return { hasImagesField: false, images: [] };
  }

  if (Array.isArray(images)) {
    return { hasImagesField: true, images };
  }

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return { hasImagesField: true, images: Array.isArray(parsed) ? parsed : [] };
    } catch (_error) {
      return { hasImagesField: true, images: [] };
    }
  }

  return { hasImagesField: true, images: [] };
};

const normalizeImageObjects = (images) => {
  return toArray(images)
    .map((image) => {
      if (!image) return null;
      if (typeof image === 'string') {
        return { url: image, alt: '' };
      }

      if (typeof image === 'object') {
        return {
          url: image.url || '',
          alt: image.alt || ''
        };
      }

      return null;
    })
    .filter((image) => image && image.url);
};

const getUploadedImageFiles = (req) => {
  if (!req.files) return [];
  return [...toArray(req.files.image), ...toArray(req.files.images)].filter(Boolean);
};

const buildImageUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/products/${filename}`;
};

const uploadProductImages = async (req) => {
  const files = getUploadedImageFiles(req);
  if (!files.length) return [];

  await ensureUploadDir();

  const uploadedImages = [];
  for (const file of files) {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      const error = new Error(`Unsupported image type: ${file.mimetype}`);
      error.status = 400;
      throw error;
    }

    const extension = path.extname(file.name || '').toLowerCase();
    const safeExtension = extension || '.jpg';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    const destinationPath = path.join(PRODUCT_UPLOAD_DIR, uniqueName);

    await file.mv(destinationPath);
    uploadedImages.push({
      url: buildImageUrl(req, uniqueName),
      alt: file.name || ''
    });
  }

  return uploadedImages;
};

const parseProductPayload = (body) => {
  const payload = { ...body };
  delete payload.replaceImages;
  const { hasImagesField, images } = parseImagesField(body.images);

  if (hasImagesField) {
    payload.images = normalizeImageObjects(images);
  }

  return { payload, hasImagesField };
};

// Get all products (Public)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single product (Public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create product (Protected)
router.post('/', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const { payload } = parseProductPayload(req.body);
    const uploadedImages = await uploadProductImages(req);

    payload.images = [...(payload.images || []), ...uploadedImages];

    const product = new Product(payload);
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update product (Protected)
router.put('/:id', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { payload, hasImagesField } = parseProductPayload(req.body);
    const uploadedImages = await uploadProductImages(req);
    const replaceImages = req.body.replaceImages === true || req.body.replaceImages === 'true';

    for (const [key, value] of Object.entries(payload)) {
      if (key !== 'images') {
        product[key] = value;
      }
    }

    if (replaceImages) {
      const replacementImages = hasImagesField ? payload.images : [];
      product.images = [...replacementImages, ...uploadedImages];
    } else {
      if (hasImagesField) {
        product.images = [...product.images, ...payload.images];
      }
      if (uploadedImages.length) {
        product.images = [...product.images, ...uploadedImages];
      }
    }

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Add product images (Protected)
router.post('/:id/images', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const uploadedImages = await uploadProductImages(req);
    if (!uploadedImages.length) {
      return res.status(400).json({ success: false, message: 'No image files uploaded' });
    }

    product.images = [...product.images, ...uploadedImages];
    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
});

// Delete product (Protected)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

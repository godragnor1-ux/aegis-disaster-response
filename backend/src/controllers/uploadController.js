/**
 * @desc    Upload Single Image (Damage, Hazard, Survivor Photo)
 * @route   POST /api/upload/single
 * @access  Public / Protected
 */
export const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image file' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(201).json({
      success: true,
      filename: req.file.filename,
      fileUrl,
      sizeBytes: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('uploadSingleImage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Upload Multiple Images (Dual-Camera, Recon Batch)
 * @route   POST /api/upload/multiple
 * @access  Public / Protected
 */
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'Please upload at least one image file' });
    }

    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      fileUrl: `/uploads/${file.filename}`,
      sizeBytes: file.size,
      mimetype: file.mimetype,
    }));

    res.status(201).json({
      success: true,
      count: uploadedFiles.length,
      files: uploadedFiles,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('uploadMultipleImages error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

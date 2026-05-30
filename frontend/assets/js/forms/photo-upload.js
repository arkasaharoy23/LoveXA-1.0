

(function () {
  'use strict';

  const API_BASE   = '/api';
  const MAX_MEMORY = 10;
  const MAX_KB     = 500;
  const MAX_DIM    = 1200;

  
  const proposalId = window.StorageService
    ? window.StorageService.getProposalId()
    : null;

  if (!proposalId) {
    window.StorageService.redirectToCreate('No proposalId on upload-memories');
    return;
  }

  
  const coupleZone      = document.getElementById('couple-drop-zone');
  const coupleInput     = document.getElementById('couple-file-input');
  const couplePreview   = document.getElementById('couple-preview');
  const coupleImg       = document.getElementById('couple-img');
  const coupleRemoveBtn = document.getElementById('couple-remove');
  const coupleChangeBtn = document.getElementById('couple-change');
  const coupleCropBtn   = document.getElementById('couple-crop');
  const coupleError     = document.getElementById('couple-error');

  
  const memoryZone  = document.getElementById('memory-drop-zone');
  const memoryInput = document.getElementById('memory-file-input');
  const memoryGrid  = document.getElementById('memory-grid');
  const memoryCount = document.getElementById('memory-count');
  const memoryError = document.getElementById('memory-error');

  
  const btnSave = document.getElementById('btn-save-continue');

  
  const cropModal      = document.getElementById('crop-modal');
  const cropImage      = document.getElementById('crop-image');
  const cropRatioLabel = document.getElementById('crop-ratio-label');
  const cropCloseBtn   = document.getElementById('crop-modal-close');
  const cropCancelBtn  = document.getElementById('btn-crop-cancel');
  const cropApplyBtn   = document.getElementById('btn-crop-apply');

  
  let couplePhotoB64  = null;
  let memoryPhotosB64 = [];

  
  let cropperInstance  = null;
  let cropTarget       = null; 
  let cropAspectRatio  = 16 / 9;


  
  function compressImage(file, aspectRatioHint) {
    return new Promise((resolve, reject) => {
      const reader  = new FileReader();
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.onload  = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Could not load image.'));
        img.onload  = () => {
          let { width, height } = img;
          if (width > MAX_DIM || height > MAX_DIM) {
            const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
            width  = Math.round(width  * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width  = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          let quality = 0.85;
          let b64;
          do {
            b64 = canvas.toDataURL('image/jpeg', quality);
            if ((b64.length * 3) / 4 / 1024 <= MAX_KB || quality <= 0.25) break;
            quality -= 0.1;
          } while (true);
          resolve(b64);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function compressBase64(b64, targetWidth, targetHeight) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          const r = Math.min(MAX_DIM / w, MAX_DIM / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        let quality = 0.85;
        let out;
        do {
          out = canvas.toDataURL('image/jpeg', quality);
          if ((out.length * 3) / 4 / 1024 <= MAX_KB || quality <= 0.25) break;
          quality -= 0.1;
        } while (true);
        resolve(out);
      };
      img.src = b64;
    });
  }

  function isValidType(file) {
    return ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.type);
  }


  
  function openCropModal(imageSrc, target, aspectRatio, ratioLabel) {
    cropTarget      = target;
    cropAspectRatio = aspectRatio;

    if (cropRatioLabel) cropRatioLabel.textContent = ratioLabel;
    if (cropImage)      cropImage.src = imageSrc;
    if (cropModal)      cropModal.classList.add('open');
    document.body.style.overflow = 'hidden';

    
    setTimeout(() => {
      if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
      }
      if (!cropImage) return;
      cropperInstance = new Cropper(cropImage, {
        aspectRatio:   cropAspectRatio,
        viewMode:      1,
        dragMode:      'move',
        autoCropArea:  0.85,
        restore:       false,
        guides:        true,
        center:        true,
        highlight:     false,
        cropBoxMovable:   true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
      });
    }, 100);
  }

  function closeCropModal() {
    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }
    if (cropModal)  cropModal.classList.remove('open');
    if (cropImage)  cropImage.src = '';
    document.body.style.overflow = '';
    cropTarget = null;
  }

  async function applyCrop() {
    if (!cropperInstance) return;

    
    const canvas = cropperInstance.getCroppedCanvas({
      maxWidth:  1200,
      maxHeight: 1200,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    const raw = canvas.toDataURL('image/jpeg', 0.92);
    
    const b64 = await compressBase64(raw);

    if (cropTarget === 'couple') {
      
      couplePhotoB64 = b64;
      if (coupleImg) coupleImg.src = b64;
    } else if (typeof cropTarget === 'number') {
      
      memoryPhotosB64[cropTarget] = b64;
      renderMemoryGrid();
    }

    closeCropModal();
    refreshSaveBtn();
  }

  
  if (cropCloseBtn)  cropCloseBtn.addEventListener('click',  closeCropModal);
  if (cropCancelBtn) cropCancelBtn.addEventListener('click', closeCropModal);
  if (cropApplyBtn)  cropApplyBtn.addEventListener('click',  applyCrop);

  
  if (cropModal) {
    cropModal.addEventListener('click', (e) => {
      if (e.target === cropModal) closeCropModal();
    });
  }

  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cropModal && cropModal.classList.contains('open')) {
      closeCropModal();
    }
  });


  
  function showCoupleError(msg) {
    if (coupleError) coupleError.textContent = msg;
  }

  function clearCoupleError() {
    if (coupleError) coupleError.textContent = '';
  }

  function setCouplePhoto(b64) {
    couplePhotoB64 = b64;
    if (coupleImg)     coupleImg.src = b64;
    if (couplePreview) couplePreview.classList.add('visible');
    if (coupleZone)    coupleZone.style.display = 'none';
    refreshSaveBtn();
  }

  function removeCouplePhoto() {
    couplePhotoB64 = null;
    if (coupleImg)     coupleImg.src = '';
    if (couplePreview) couplePreview.classList.remove('visible');
    if (coupleZone)    coupleZone.style.display = '';
    if (coupleInput)   coupleInput.value = '';
    refreshSaveBtn();
  }

  async function handleCoupleFiles(files) {
    clearCoupleError();
    const file = files[0];
    if (!file) return;
    if (!isValidType(file)) {
      showCoupleError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    try {
      const b64 = await compressImage(file);
      setCouplePhoto(b64);
    } catch (err) {
      showCoupleError('Could not process image. Please try another file.');
    }
  }

  
  if (coupleZone) {
    coupleZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      coupleZone.classList.add('drag-over');
    });
    coupleZone.addEventListener('dragleave', () => coupleZone.classList.remove('drag-over'));
    coupleZone.addEventListener('drop', (e) => {
      e.preventDefault();
      coupleZone.classList.remove('drag-over');
      handleCoupleFiles(e.dataTransfer.files);
    });
  }

  if (coupleInput) {
    coupleInput.addEventListener('change', () => handleCoupleFiles(coupleInput.files));
  }

  if (coupleRemoveBtn) coupleRemoveBtn.addEventListener('click', removeCouplePhoto);
  if (coupleChangeBtn) coupleChangeBtn.addEventListener('click', () => coupleInput && coupleInput.click());

  
  if (coupleCropBtn) {
    coupleCropBtn.addEventListener('click', () => {
      if (couplePhotoB64) {
        openCropModal(couplePhotoB64, 'couple', 16 / 9, '16 : 9 ratio');
      }
    });
  }


  
  function showMemoryError(msg) {
    if (memoryError) memoryError.textContent = msg;
    setTimeout(() => { if (memoryError) memoryError.textContent = ''; }, 3500);
  }

  function updateMemoryCounter() {
    if (memoryCount) {
      memoryCount.textContent = `${memoryPhotosB64.length} / ${MAX_MEMORY}`;
    }
    if (memoryZone) {
      memoryZone.classList.toggle('maxed', memoryPhotosB64.length >= MAX_MEMORY);
    }
  }

  function renderMemoryGrid() {
    if (!memoryGrid) return;
    memoryGrid.innerHTML = '';

    memoryPhotosB64.forEach((b64, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'memory-thumb';

      const img = document.createElement('img');
      img.src    = b64;
      img.alt    = `Memory ${index + 1}`;
      img.loading= 'lazy';

      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'memory-thumb__remove';
      removeBtn.innerHTML = '✕';
      removeBtn.setAttribute('aria-label', `Remove memory photo ${index + 1}`);
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        memoryPhotosB64.splice(index, 1);
        renderMemoryGrid();
        updateMemoryCounter();
      });

      
      const cropBtn = document.createElement('button');
      cropBtn.className = 'memory-thumb__crop';
      cropBtn.innerHTML = '✂';
      cropBtn.setAttribute('aria-label', `Crop memory photo ${index + 1}`);
      cropBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCropModal(b64, index, 1, '1 : 1 ratio');
      });

      thumb.appendChild(img);
      thumb.appendChild(removeBtn);
      thumb.appendChild(cropBtn);
      memoryGrid.appendChild(thumb);
    });

    updateMemoryCounter();
  }

  async function handleMemoryFiles(files) {
    const remaining = MAX_MEMORY - memoryPhotosB64.length;
    if (remaining <= 0) {
      showMemoryError('Maximum of 10 memory photos reached.');
      return;
    }

    const toProcess = Array.from(files).slice(0, remaining);
    const invalid   = toProcess.filter(f => !isValidType(f));

    if (invalid.length) {
      showMemoryError('Some files were skipped — only JPEG, PNG, or WebP accepted.');
    }

    for (const file of toProcess.filter(f => isValidType(f))) {
      try {
        const b64 = await compressImage(file);
        memoryPhotosB64.push(b64);
      } catch (err) {
        console.error('[MemoryPhoto]', err);
      }
    }

    renderMemoryGrid();
  }

  if (memoryZone) {
    memoryZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (memoryPhotosB64.length < MAX_MEMORY) memoryZone.classList.add('drag-over');
    });
    memoryZone.addEventListener('dragleave', () => memoryZone.classList.remove('drag-over'));
    memoryZone.addEventListener('drop', (e) => {
      e.preventDefault();
      memoryZone.classList.remove('drag-over');
      handleMemoryFiles(e.dataTransfer.files);
    });
  }

  if (memoryInput) {
    memoryInput.addEventListener('change', () => {
      handleMemoryFiles(memoryInput.files);
      memoryInput.value = '';
    });
  }


  
  function refreshSaveBtn() {
    if (btnSave) btnSave.disabled = !couplePhotoB64;
  }

  async function handleSave() {
    if (!couplePhotoB64) return;
    btnSave.disabled = true;
    btnSave.classList.add('loading');

    try {
      const res = await fetch(`${API_BASE}/proposals/${proposalId}/photos`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          couplePhoto:  couplePhotoB64,
          memoryPhotos: memoryPhotosB64,
        }),
      });

      const data = await res.json();

      if (res.status === 410) {
        throw new Error(data.message || 'This proposal has expired.');
      }

      if (!res.ok || !data.success) throw new Error(data.message || 'Could not save photos.');
      window.location.href = window.StorageService
        ? window.StorageService.withPid('bouquet.html')
        : 'bouquet.html';

    } catch (err) {
      alert('Could not save photos:\n' + err.message);
      btnSave.disabled = false;
      btnSave.classList.remove('loading');
    }
  }

  if (btnSave) btnSave.addEventListener('click', handleSave);

  
  refreshSaveBtn();
  updateMemoryCounter();

})();

/*Copyright (c) 2012 Dirlei Dionisio

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

Usage:

var ImageResize = require('image-resize');

Ti.Media.showCamera or Ti.Media.openPhotoGallery({
	success:function(e) {
		ImageResize.saveImageSizes({
			eventProps: e, // ATTENTION! Do not confuse with e.media
			originalFilename: 'full_image.jpg',
			sizes: [64, 256, 800],
			filenames: ['thumb.jpg', 'small.jpg', 'medium.jpg']
		});
	},
	mediaTypes: Ti.Media.MEDIA_TYPE_PHOTO
});

*/

var isAndroid = Ti.Platform.osname === 'android';

// get height keeping aspect ratio
exports.getNewHeight = function(params) {
	// currentWidth
	// currentHeight
	// newWidth
	var newHeight = (params.newWidth/params.currentWidth) * params.currentHeight;
	return Math.round(newHeight);
};

// get width keeping aspect ratio
exports.getNewWidth = function(params) {
	// currentWidth
	// currentHeight
	// newHeight
	var newWidth = (params.newHeight/params.currentHeight) * params.currentWidth;
	return Math.round(newWidth);
};

exports.saveWithNewResolution = function(params) {
	// source (CameraMediaItemType received from Ti.Media.openPhotoGallery or Ti.Media.showCamera success callback)
	// target (string, path to new image)
	// width (optional if height is defined)
	// height (optional if width is defined)
	var auxImageViewSource,
		targetBlob,
		targetFile,
		attr_del;
	
	if (!params.width && !params.height) {
		throw 'Hey, you need to define with or height.';
	}
	
	if (params.width && params.height) {
		auxImageViewSource = params.source.media;
	
	} else {
		attr_del = params.width ? 'h':'w';
		params.width = params.width || exports.getNewWidth({
			currentWidth: isAndroid ? params.source.cropRect.width : params.source.media.width,
			currentHeight: isAndroid ? params.source.cropRect.height : params.source.media.height,
			newHeight: params.height
		});
		
		params.height = params.height || exports.getNewHeight({
			currentWidth: isAndroid ? params.source.cropRect.width : params.source.media.width,
			currentHeight: isAndroid ? params.source.cropRect.height : params.source.media.height,
			newWidth: params.width
		});
		
		auxImageViewSource = params.source.media;
		
	}
	
	targetBlob = auxImageViewSource.imageAsResized(params.width, params.height);
	
	//wiping the dirt.	when this function is called again, params comes with garbage.
	if(attr_del === 'w') delete params.width;
	if(attr_del === 'h') delete params.height;
	
	targetFile = Ti.Filesystem.getFile(params.target);
	targetFile.write(targetBlob);
	
	targetBlob = null;
	targetFile = null;
};

exports.saveImageSizes = function (params) {
	// eventProps
	// originalFilename (opt)
	// sizes [integer] --> the largest size
	// filenames [string]
	var i, l, props = {
		source: params.eventProps,
	}, w, h;
	
	for (i = 0, l = params.sizes.length; i < l; i += 1) {
		
		if (isAndroid) {
			w = params.eventProps.cropRect.width;
			h = params.eventProps.cropRect.height;
		} else {
			w = params.eventProps.media.width;
			h = params.eventProps.media.height;
		}
		
		if (w > h && w > params.sizes[i]) {
			props.width = params.sizes[i];
		} else if (h > w && h > params.sizes[i]) {
			props.height = params.sizes[i];
		} else {
			props.width = w;
			props.height = h;
		}

		props.target = params.filenames[i];
		exports.saveWithNewResolution(props);
	}
	
	if (params.originalFilename) {
		Ti.Filesystem.getFile(params.originalFilename).write(params.eventProps.media);
	}
};
